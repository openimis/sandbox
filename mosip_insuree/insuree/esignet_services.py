import os
import time
import uuid
import base64
import hashlib
import secrets
import logging
import urllib.parse
import requests
import jwt
from typing import Dict, Optional, Any, Tuple

from django.conf import settings
from django.core.cache import cache
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa

logger = logging.getLogger(__name__)

class ESignetConfig:
    """Configuration handler for ESignet variables."""
    CLIENT_ID = os.environ.get('ESIGNET_CLIENT_ID', '')
    REDIRECT_URI = os.environ.get('ESIGNET_REDIRECT_URI', 'http://localhost:80/callback')
    WELL_KNOWN_URL = os.environ.get('ESIGNET_WELL_KNOWN_URL', 'https://esignet-mosipid.collab.mosip.net/.well-known/openid-configuration')
    PRIVATE_KEY_PATH = os.path.join(settings.BASE_DIR, 'private_key.pem')

class ESignetService:
    """
    Service class to handle OpenID Connect interactions with ESignet.
    """

    CACHE_TIMEOUT = 600  # 10 minutes

    @staticmethod
    def _get_private_key() -> bytes:
        """
        Reads the private key from the parent directory of BASE_DIR.
        """
        file_path = os.path.abspath(os.path.join(settings.BASE_DIR, '..', 'private_key.pem'))

        if not os.path.exists(file_path):
            file_path = os.path.join(settings.BASE_DIR, 'private_key.pem')
            
            if not os.path.exists(file_path):
                logger.error(f"CRITICAL: Private Key not found. Tried paths:\n1. {os.path.abspath(os.path.join(settings.BASE_DIR, '..', 'private_key.pem'))}\n2. {file_path}")
                raise FileNotFoundError(f"Could not find private_key.pem. See logs for paths checked.")

        try:
            with open(file_path, 'rb') as f:
                return f.read()
        except IOError as e:
            logger.error(f"Permission denied or error reading private key: {e}")
            raise ValueError("Failed to read private key file.")

    @staticmethod
    def _get_oidc_config() -> Dict:
        """Fetches OIDC configuration from the well-known URL."""
        try:
            response = requests.get(ESignetConfig.WELL_KNOWN_URL, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch OIDC config: {e}")
            raise ValueError("Could not connect to ESignet provider.")

    @classmethod
    def initiate_login_session(cls) -> Tuple[str, str]:
        """
        Prepares the login session and returns the Auth URL and Session ID.
        
        Returns:
            Tuple[str, str]: (Authorization URL, Session ID)
        """
        config = cls._get_oidc_config()
        session_id = str(uuid.uuid4())
        state = str(uuid.uuid4())
        nonce = str(uuid.uuid4())

        # PKCE Generation
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        code_challenge = base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')

        # Store session context
        cache_data = {
            'state': state,
            'nonce': nonce,
            'code_verifier': code_verifier,
            'status': 'pending',
            'created_at': time.time()
        }
        cache.set(f"esignet_session_{session_id}", cache_data, timeout=cls.CACHE_TIMEOUT)

        # Build URL
        params = {
            'client_id': ESignetConfig.CLIENT_ID,
            'response_type': 'code',
            'scope': 'openid profile email',
            'redirect_uri': ESignetConfig.REDIRECT_URI,
            'acr_values': 'mosip:idp:acr:generated-code',
            'state': f"{session_id}:{state}",
            'nonce': nonce,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256'
        }
        
        auth_url = f"{config['authorization_endpoint']}?{urllib.parse.urlencode(params)}"
        return auth_url, session_id

    @classmethod
    def handle_callback(cls, query_params: Dict) -> Tuple[str, Optional[Dict]]:
        """
        Processes the callback from ESignet.
        
        Returns:
            Tuple[str, Dict]: (Session ID, User Info Dictionary)
        """
        if 'error' in query_params:
            cls._handle_provider_error(query_params)

        code = query_params.get('code')
        full_state = query_params.get('state', '')
        
        if not code or ':' not in full_state:
            raise ValueError("Invalid callback parameters received.")

        session_id, received_state = full_state.split(':', 1)
        session_key = f"esignet_session_{session_id}"
        session_data = cache.get(session_key)

        if not session_data:
            raise ValueError("Session expired or invalid.")
        
        if session_data.get('state') != received_state:
            raise ValueError("State mismatch. Possible CSRF attempt.")

        try:
            config = cls._get_oidc_config()
            token_response = cls._exchange_code_for_token(code, session_data['code_verifier'], config)
            user_info = cls._fetch_and_decode_user_info(token_response['access_token'], config)
            cache.set(session_key, {
                'status': 'success',
                'userData': user_info,
                'timestamp': time.time()
            }, timeout=cls.CACHE_TIMEOUT)

            return session_id, user_info

        except Exception as e:
            cache.set(session_key, {
                'status': 'error',
                'error': 'processing_failed',
                'error_description': str(e),
                'timestamp': time.time()
            }, timeout=cls.CACHE_TIMEOUT)
            raise e

    @classmethod
    def get_session_status(cls, session_id: str) -> Dict:
        """Retrieves the current status of a session for polling."""
        data = cache.get(f"esignet_session_{session_id}")
        
        if not data:
            return {'status': 'pending', 'message': 'Session not found or expired'}
            
        status = data.get('status', 'pending')
        
        response = {'status': status, 'timestamp': data.get('timestamp')}
        
        if status == 'success':
            response['userData'] = data.get('userData')
            cache.delete(f"esignet_session_{session_id}") # Cleanup
        elif status == 'error':
            response.update({
                'error': data.get('error'),
                'error_description': data.get('error_description')
            })
            cache.delete(f"esignet_session_{session_id}") # Cleanup
            
        return response

    # --- Internal Helpers ---

    @classmethod
    def _create_client_assertion(cls, token_endpoint: str) -> str:
        """Creates a signed JWT for client authentication."""
        now = int(time.time())
        payload = {
            "iss": ESignetConfig.CLIENT_ID,
            "sub": ESignetConfig.CLIENT_ID,
            "aud": token_endpoint,
            "jti": str(uuid.uuid4()),
            "iat": now,
            "nbf": now,
            "exp": now + 120  # 2 minutes
        }
        
        return jwt.encode(
            payload,
            cls._get_private_key(),
            algorithm='RS256',
            headers={"alg": "RS256", "typ": "JWT"}
        )

    @classmethod
    def _exchange_code_for_token(cls, code: str, verifier: str, config: Dict) -> Dict:
        token_endpoint = config['token_endpoint']
        
        payload = {
            'grant_type': 'authorization_code',
            'client_id': ESignetConfig.CLIENT_ID,
            'code': code,
            'redirect_uri': ESignetConfig.REDIRECT_URI,
            'client_assertion_type': 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            'client_assertion': cls._create_client_assertion(token_endpoint),
            'code_verifier': verifier
        }
        
        response = requests.post(token_endpoint, data=payload, headers={'Accept': 'application/json'})
        
        if response.status_code != 200:
            raise ValueError(f"Token exchange failed: {response.text}")
            
        return response.json()

    @classmethod
    def _fetch_and_decode_user_info(cls, access_token: str, config: Dict) -> Dict:
        # Fetch
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(config['userinfo_endpoint'], headers=headers)
        
        if response.status_code != 200:
            raise ValueError("Failed to fetch user info")
        try:
            return jwt.decode(response.text, options={"verify_signature": False})
        except Exception:
            try:
                return response.json()
            except:
                raise ValueError("Invalid format for User Info")

    @staticmethod
    def _handle_provider_error(params: Dict):
        error = params.get('error')
        desc = params.get('error_description', 'No description')
        
        state = params.get('state', '')
        if ':' in state:
            session_id = state.split(':')[0]
            cache.set(f"esignet_session_{session_id}", {
                'status': 'error',
                'error': error,
                'error_description': desc,
                'timestamp': time.time()
            }, timeout=600)
            
        raise ValueError(f"Provider Error: {error} - {desc}")