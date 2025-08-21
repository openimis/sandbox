# fhir_claim_mediator/openhim.py
import requests, json, os, threading, time, logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class OpenHIMMediator:
    def __init__(self, config_path='mediator.json'):
        from dotenv import load_dotenv
        load_dotenv()
        self.api_url = os.getenv('OPENHIM_API_URL')
        self.username = os.getenv('OPENHIM_USERNAME')
        self.password = os.getenv('OPENHIM_PASSWORD')
        self.verify_cert = os.getenv('OPENHIM_VERIFY_CERT', 'true').lower() == 'true'
        if not all([self.api_url, self.username, self.password]):
            raise ValueError("OpenHIM environment variables are not fully set.")
        with open(config_path) as f:
            self.mediator_config = json.load(f)
        self.urn = self.mediator_config.get('urn')
        if not self.urn:
            raise ValueError("Mediator URN is not defined in the config file.")
        self.session = requests.Session()
        self.session.auth = (self.username, self.password)
        self.session.verify = self.verify_cert

    def register(self):
        url = f"{self.api_url}/mediators"
        logging.info(f"Registering mediator with URN: {self.urn} at {url}")
        try:
            response = self.session.post(url, json=self.mediator_config)
            response.raise_for_status()
            logging.info("Mediator successfully registered/updated with OpenHIM-Core.")
            return True
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to register mediator: {e} - {e.response.text if e.response else 'No Response'}")
            return False

    def send_heartbeat(self):
        url = f"{self.api_url}/heartbeats"
        try:
            response = self.session.post(url, json={"urn": self.urn})
            response.raise_for_status()
            logging.info("Heartbeat sent successfully.")
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to send heartbeat: {e}")

    def start_heartbeat_loop(self, interval_seconds=10):
        logging.info(f"Starting heartbeat loop with an interval of {interval_seconds} seconds.")
        thread = threading.Thread(target=lambda: (
            (self.send_heartbeat(), time.sleep(interval_seconds)) for _ in iter(int, 1)
        ), daemon=True)
        thread.start()
