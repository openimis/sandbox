# fhir_claim_mediator/views.py

import requests, os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

# Load backend configuration from environment variables
BACKEND_API_HOST = os.getenv('BACKEND_API_HOST')
BACKEND_URL = f"{BACKEND_API_HOST}/api/api_fhir_r4"
LOGIN_URL = f"{BACKEND_URL}/login/"
CLAIM_URL = f"{BACKEND_URL}/Claim/"

@api_view(['POST'])
@permission_classes([AllowAny])
def fhir_claim_mediator_view(request: Request) -> Response:
    print("📥 [FHIR Mediator] Received a new POST request to /api/v1/fhir/claim")
    
    # Show env variables (be cautious in production)
    print(f"🌐 BACKEND_API_HOST: {BACKEND_API_HOST}")
    print(f"🔗 Final CLAIM_URL to forward to: {CLAIM_URL}")
    
    # Log incoming Authorization header (if any)
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if auth_header:
        print(f"🔐 Incoming Authorization header: {auth_header}")
    else:
        print("⚠️ No Authorization header found in incoming request")

    # Print incoming payload
    print(f"📦 Incoming request body: {request.data}")

    # Prepare headers to forward
    forward_headers = {
        'Content-Type': 'application/json',
    }
    if auth_header:
        forward_headers['Authorization'] = auth_header

    print(f"📤 Forwarding headers: {forward_headers}")

    # Forward the request to the backend
    try:
        print(f"🚀 Forwarding request to openIMIS at: {CLAIM_URL}")
        claim_response = requests.post(
            CLAIM_URL,
            json=request.data,
            headers=forward_headers,
            timeout=30
        )
        print("✅ Successfully forwarded request to openIMIS")

        print(f"🛬 Backend response status: {claim_response.status_code}")
        print(f"📨 Backend response body: {claim_response.text}")

        return Response(claim_response.json(), status=claim_response.status_code)

    except requests.exceptions.RequestException as e:
        print("❌ Failed to forward request to openIMIS")
        print(f"🧨 Error details: {str(e)}")

        return Response(
            {"error": "Could not forward claim to backend.", "details": str(e)},
            status=status.HTTP_502_BAD_GATEWAY
        )
