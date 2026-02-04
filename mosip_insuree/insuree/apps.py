import os

from django.apps import AppConfig
from django.conf import settings


MODULE_NAME = "insuree"

DEFAULT_CFG = {
    "gql_query_insurees_perms": ["101101"],
    "gql_query_insuree_perms": ["101101"],
    "gql_query_insuree_photo_perms": ["101101"],
    "gql_query_insuree_officers_perms": [],
    "gql_query_insuree_family_members": ["101101"],
    "gql_query_families_perms": ["101001"],
    "gql_query_insuree_policy_perms": ["101500"],
    "gql_query_insuree_inquire_perms": ["101105"],
    "gql_mutation_create_families_perms": ["101002"],
    "gql_mutation_update_families_perms": ["101003"],
    "gql_mutation_delete_families_perms": ["101004"],
    "gql_mutation_create_insurees_perms": ["101102"],
    "gql_mutation_update_insurees_perms": ["101103"],
    "gql_mutation_delete_insurees_perms": ["101104"],
    "insuree_photos_root_path": os.path.abspath("./images/insurees"),
    "excluded_insuree_chfids": ['999999999'],  # fake insurees (and bound families) used, for example, in 'funding'
    "renewal_photo_age_adult": 60,  # age (in months) of a picture due for renewal for adults
    "renewal_photo_age_child": 12,  # age (in months) of a picture due for renewal for children
    "insuree_number_validator": None,  # Insuree number *function* that validates the insuree number for example
                                       # 'msystems.utils.is_valid_resident_identifier'
    "insuree_number_max_length": None,  # Insuree number length to validate
    "insuree_number_min_length": None,  # Insuree number length to validate
    "insuree_number_modulo_root": None,  # modulo base for checksum on last digit, requires length to be set too
    "validation_code_taken_insuree_number": 1,
    "validation_code_no_insuree_number": 2,
    "validation_code_invalid_insuree_number_len": 3,
    "validation_code_invalid_insuree_number_checksum": 4,
    "validation_code_invalid_insuree_number_exception": 5,
    "validation_code_validator_import_error": 6,
    "validation_code_validator_function_error": 7,
    "insuree_fsp_mandatory": False,
    "insuree_as_worker": False,
    "is_insuree_photo_required": False,
    "use_contextual_enrolment_officer_selection": False
}


class InsureeConfig(AppConfig):
    name = MODULE_NAME

    gql_query_insurees_perms = []
    gql_query_insuree_perms = []

    gql_query_insuree_family_members = []
    gql_query_families_perms = []
    gql_query_insuree_officers_perms = []
    gql_query_insuree_policy_perms = []
    gql_query_insuree_photo_perms = []
    gql_mutation_create_families_perms = []
    gql_mutation_update_families_perms = []
    gql_mutation_delete_families_perms = []
    gql_mutation_create_insurees_perms = []
    gql_mutation_update_insurees_perms = []
    gql_mutation_delete_insurees_perms = []
    validation_code_taken_insuree_number = None
    validation_code_no_insuree_number = None
    validation_code_invalid_insuree_number_len = None
    validation_code_invalid_insuree_number_checksum = None
    validation_code_invalid_insuree_number_exception = None
    validation_code_validator_import_error = None
    validation_code_validator_function_error = None
    insuree_photos_root_path = None
    excluded_insuree_chfids = []
    renewal_photo_age_adult = None
    renewal_photo_age_child = None
    insuree_number_validator = None
    insuree_number_max_length = None
    insuree_number_min_length = None
    insuree_number_modulo_root = None
    insuree_fsp_mandatory = None
    insuree_as_worker = None
    is_insuree_photo_required = None
    use_contextual_enrolment_officer_selection = None

    def __load_config(self, cfg):
        for field in cfg:
            if hasattr(InsureeConfig, field):
                setattr(InsureeConfig, field, cfg[field])


    def ready(self):
        from core.models import ModuleConfiguration
        cfg = ModuleConfiguration.get_or_default(MODULE_NAME, DEFAULT_CFG)
        self.__load_config(cfg)
        self._configure_photo_root(cfg)

    def set_dataloaders(self, dataloaders):
        from .dataloaders import InsureeLoader, FamilyLoader

        dataloaders["insuree_loader"] = InsureeLoader()
        dataloaders["family_loader"] = FamilyLoader()

    @classmethod
    def __get_from_settings_or_default(cls, attribute_name, default=None):
        if hasattr(settings, attribute_name):
            value = getattr(settings, attribute_name) or default
        else:
            value = default
        return value

    def _configure_photo_root(self, cfg):
        # TODO: To be confirmed. I left loading from config for integrity reasons
        #  but it could be based on env variable only.
        #  Also we could determine global file root for all stored files across modules.
        if from_config := cfg.get("insuree_photos_root_path", None):
            InsureeConfig.insuree_photos_root_path = from_config
        elif from_env := os.getenv("PHOTO_ROOT_PATH", None):
            InsureeConfig.insuree_photos_root_path = from_env
