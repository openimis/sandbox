# fhir_claim_mediator/views.py

import requests, os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from typing import Optional


# Constants
OPENIMIS_LOGIN_URL = "https://openimis.s2.openimis.org/api/api_fhir_r4/login/"
CLAIM_URL = "https://openimis.s2.openimis.org/api/api_fhir_r4/Claim/"

# Replace with env vars if needed
OPENIMIS_USERNAME = "Admin"
OPENIMIS_PASSWORD = "admin123"

def authenticate_with_openimis() -> Optional[str]:
    print("🔐 Attempting login to OpenIMIS...")
    try:
        form_data = {
            "username": OPENIMIS_USERNAME,
            "password": OPENIMIS_PASSWORD,
        }

        response = requests.post(OPENIMIS_LOGIN_URL, data=form_data, timeout=10)

        if response.status_code == 200:
            token = response.json().get("token")
            if token:
                print(f"✅ Login successful. Token: {token[:12]}... (truncated)")
                return token
            else:
                print("❌ Login response did not contain token.")
        else:
            print(f"❌ Login failed with status: {response.status_code}")
            print(f"🧾 Response: {response.text}")
    except requests.RequestException as e:
        print(f"🧨 Login request failed: {e}")
    
    return None


@api_view(['POST'])
@permission_classes([AllowAny])
def fhir_claim_mediator_view(request: Request) -> Response:
    print("📥 [FHIR Mediator] Received a new POST request to /api/v1/fhir/claim")

    # Print incoming payload
    print(f"📦 Incoming request body: {request.data}")

    # 1️⃣ Authenticate with OpenIMIS
    token = authenticate_with_openimis()
    if not token:
        return Response(
            {"error": "Authentication to OpenIMIS failed"},
            status=status.HTTP_502_BAD_GATEWAY
        )

    # 2️⃣ Prepare headers with Bearer token
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }

    print(f"🚀 Forwarding claim to: {CLAIM_URL}")

    # 3️⃣ Forward the request to OpenIMIS Claim endpoint
    try:
        claim_response = requests.post(
            CLAIM_URL,
            json=request.data,
            headers=headers,
            timeout=30
        )
        print("✅ Successfully forwarded request to OpenIMIS")
        print(f"🛬 Backend response status: {claim_response.status_code}")
        print(f"📨 Backend response body: {claim_response.text}")

        return Response(claim_response.json(), status=claim_response.status_code)

    except requests.RequestException as e:
        print("❌ Failed to forward claim to OpenIMIS")
        print(f"🧨 Error details: {str(e)}")
        return Response(
            {"error": "Could not forward claim to backend.", "details": str(e)},
            status=status.HTTP_502_BAD_GATEWAY
        )
