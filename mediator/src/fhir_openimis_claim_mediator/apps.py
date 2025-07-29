from django.apps import AppConfig
import os

class FhirClaimMediatorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fhir_openimis_claim_mediator'

    def ready(self):
        # if os.environ.get('RUN_MAIN', None) != 'true': return
        from .openhim import OpenHIMMediator
        if os.getenv('OPENHIM_VERIFY_CERT', 'true').lower() == 'false':
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        try:
            mediator = OpenHIMMediator()
            if mediator.register():
                mediator.start_heartbeat_loop()
        except (ValueError, FileNotFoundError) as e:
            print(f"Could not initialize OpenHIM Mediator: {e}")
