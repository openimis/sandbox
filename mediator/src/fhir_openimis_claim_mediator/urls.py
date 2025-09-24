# src/fhir_openimis_claim_mediator/urls.py
from django.urls import path
from .views import fhir_claim_mediator_view

urlpatterns = [
    path('claim/', fhir_claim_mediator_view, name='claim_mediator'),
]
