# fhir_claim_mediator/views.py
import requests, os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

# Load backend configuration from environment variables
BACKEND_URL = f"{os.getenv('BACKEND_API_HOST')}:{os.getenv('BACKEND_API_PORT')}/api/api_fhir_r4"
LOGIN_URL = f"{BACKEND_URL}/login/"
CLAIM_URL = f"{BACKEND_URL}/Claim/"

@api_view(['POST'])
@permission_classes([AllowAny])
def fhir_claim_mediator_view(request: Request) -> Response:
    print("Received request to FHIR Claim Mediator")
    # 1. Authenticate with the backend
    auth_header = request.META.get('HTTP_AUTHORIZATION')

    # Build headers to forward
    forward_headers = {
        'Content-Type': 'application/json',
    }
    if auth_header:
        forward_headers['Authorization'] = auth_header   
  
    try:
        # forward_headers = {'Authorization': f'Bearer {auth_token}'}
        claim_response = requests.post(
            CLAIM_URL,
            json=request.data,
            headers=forward_headers,
            timeout=30
        )
        print(f"Request Passed to openIMIS")

        # Return the backend's response body and status code directly
        return Response(claim_response.json(), status=claim_response.status_code)
    except requests.exceptions.RequestException as e:
        return Response({"error": "Could not forward claim to backend.", "details": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
