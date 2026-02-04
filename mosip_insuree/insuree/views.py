# Create your views here.
import logging
from django.views import View
from django.http import JsonResponse, HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Import local modules
from .esignet_services import ESignetService


logger = logging.getLogger(__name__)


class HtmlRenderer:
    @staticmethod
    def render_redirect(session_id: str, auth_url: str) -> HttpResponse:
        html = f"""
        <html>
        <head><title>Redirecting...</title></head>
        <body style="font-family: Arial; text-align: center; padding-top: 100px;">
            <h2>Redirecting to eSignet...</h2>
            <p>Please wait while we redirect you to the authentication page.</p>
            <script>
                try {{ localStorage.setItem('esignet_session_id', '{session_id}'); }} catch (e) {{}}
                setTimeout(function() {{ window.location.href = '{auth_url}'; }}, 1000);
            </script>
        </body>
        </html>
        """
        return HttpResponse(html)

    @staticmethod
    def render_error(error_code: str, description: str) -> HttpResponse:
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authentication Failed</title>
            <style>
                body {{ font-family: Arial, sans-serif; background: #f4f4f4; display: flex; justify-content: center; height: 100vh; align-items: center; }}
                .container {{ background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }}
                h1 {{ color: #d32f2f; }}
                button {{ margin-top: 20px; padding: 10px 20px; cursor: pointer; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Authentication Failed</h1>
                <p><strong>Error:</strong> {error_code}</p>
                <p>{description}</p>
                <button onclick="window.close()">Close</button>
            </div>
            <script>setTimeout(() => window.close(), 5000);</script>
        </body>
        </html>
        """
        return HttpResponse(html, status=400)

    @staticmethod
    def render_success(user_info: dict, session_id: str) -> HttpResponse:
        name = user_info.get('name', 'N/A')
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Success</title>
            <style>
                body {{ font-family: Arial, sans-serif; background: #e8f5e9; display: flex; justify-content: center; height: 100vh; align-items: center; }}
                .container {{ background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; width: 400px; border-top: 5px solid #2e7d32; }}
                h1 {{ color: #2e7d32; }}
                .info {{ text-align: left; background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Authentication Successful</h1>
                <p>Welcome, <strong>{name}</strong></p>
                <div class="info">
                    <p>Identity verified by eSignet.</p>
                </div>
                <button onclick="window.close()">Return to Dashboard</button>
            </div>
            <script>
                try {{
                    window.opener.postMessage({{ type: 'ESIGNET_AUTH_SUCCESS', sessionId: '{session_id}' }}, '*');
                }} catch(e) {{}}
                setTimeout(() => window.close(), 3000);
            </script>
        </body>
        </html>
        """
        return HttpResponse(html)

@method_decorator(csrf_exempt, name='dispatch')
class ESignetLoginView(View):
    """
    Initiates the OIDC login flow.
    Generates a session and redirects the user to the eSignet Provider.
    """
    def get(self, request):
        try:
            auth_url, session_id = ESignetService.initiate_login_session()
            logger.info(f"[eSignet] Login initiated. Session: {session_id}")
            return HtmlRenderer.render_redirect(session_id, auth_url)
        except Exception as e:
            logger.exception("[eSignet] Login initiation failed")
            return HttpResponse(f"System Error: {str(e)}", status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ESignetCallbackView(View):
    """
    Handles the redirect back from eSignet.
    Exchanges the Authorization Code for an Access Token and User Info.
    """
    def get(self, request):
        try:
            session_id, user_info = ESignetService.handle_callback(request.GET)
            logger.info(f"[eSignet] Callback successful for session: {session_id}")
            return HtmlRenderer.render_success(user_info, session_id)
        except ValueError as ve:
            logger.warning(f"[eSignet] Callback validation error: {ve}")
            return HtmlRenderer.render_error("Validation Error", str(ve))
        except Exception as e:
            logger.exception("[eSignet] Callback system error")
            return HtmlRenderer.render_error("System Error", "An unexpected error occurred.")


@method_decorator(csrf_exempt, name='dispatch')
class ESignetPollView(View):
    """
    API endpoint for the frontend to poll the status of the login session.
    """
    def get(self, request):
        session_id = request.GET.get('session_id')
        
        if not session_id:
            return JsonResponse({
                'status': 'error', 
                'error': 'missing_param', 
                'message': 'Session ID is required'
            }, status=400)

        try:
            status_response = ESignetService.get_session_status(session_id)
            return JsonResponse(status_response)
        except Exception as e:
            logger.exception(f"[eSignet] Polling failed for {session_id}")
            return JsonResponse({
                'status': 'error',
                'error': 'internal_error',
                'message': str(e)
            }, status=500)