import requests, os
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

# Setup logger
logger = logging.getLogger(__name__)

# Load backend configuration from environment variables
BACKEND_API_HOST = os.getenv('BACKEND_API_HOST')
BACKEND_URL = f"{BACKEND_API_HOST}/api/api_fhir_r4"
LOGIN_URL = f"{BACKEND_URL}/login/"
CLAIM_URL = f"{BACKEND_URL}/Claim/"

@api_view(['POST'])
@permission_classes([AllowAny])
def fhir_claim_mediator_view(request: Request) -> Response:
    logger.info("🔁 Received request to FHIR Claim Mediator")

    # Auth header from incoming request
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    logger.debug(f"🔐 Incoming Authorization header: {auth_header}")

    # Log environment vars
    logger.debug(f"🌍 BACKEND_API_HOST: {BACKEND_API_HOST}")
    logger.debug(f"🔗 CLAIM_URL: {CLAIM_URL}")

    # Log request data
    # logger.debug(f"📦 Incoming request data: {request.data}")

    # Prepare headers for forwarding
    forward_headers = {
        'Content-Type': 'application/json',
    }
    if auth_header:
        forward_headers['Authorization'] = auth_header

    logger.debug(f"📤 Forward headers to backend: {forward_headers}")

    try:
        claim_response = requests.post(
            CLAIM_URL,
            json=request.data,
            headers=forward_headers,
            timeout=30
        )
        logger.info("✅ Request successfully forwarded to openIMIS")

        # Log response from backend
        logger.debug(f"📥 Response status code: {claim_response.status_code}")
        logger.debug(f"📥 Response body: {claim_response.text}")

        return Response(claim_response.json(), status=claim_response.status_code)

    except requests.exceptions.RequestException as e:
        logger.error("❌ Error forwarding request to openIMIS", exc_info=True)
        return Response(
            {
                "error": "Could not forward claim to backend.",
                "details": str(e),
            },
            status=status.HTTP_502_BAD_GATEWAY
        )
