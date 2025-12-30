from django.test import TestCase

from insuree.apps import InsureeConfig
from insuree.services import validate_insuree_number


def fail1(x):
    if x == "fail1":
        return ["fail1"]
    else:
        return []


class InsureeValidationTest(TestCase):
    def test_validator(self):

        InsureeConfig.insuree_number_validator = 'insuree.tests.test_insuree_validation.fail1'
        InsureeConfig.insuree_number_max_length = None
        InsureeConfig.insuree_number_min_length = None
        InsureeConfig.insuree_number_modulo_root = None
        
        self.assertEqual(validate_insuree_number(None), [])
        self.assertEqual(validate_insuree_number("valid"), [])
        self.assertEqual(validate_insuree_number("fail1"), ["fail1"])
        InsureeConfig. insuree_number_validator = None
        InsureeConfig.insuree_number_max_length = None
        InsureeConfig.insuree_number_min_length = None
        InsureeConfig.insuree_number_modulo_root = None
        
        self.assertEqual(validate_insuree_number(None), [])
        self.assertEqual(validate_insuree_number("valid"), [])
        self.assertEqual(validate_insuree_number("fail1"), [])

    def test_len(self):
        InsureeConfig. insuree_number_validator = None
        InsureeConfig.insuree_number_max_length = 5
        InsureeConfig.insuree_number_min_length = 5
        InsureeConfig.insuree_number_modulo_root = None
        
        self.assertEqual(len(validate_insuree_number(None)), 1)
        self.assertEqual(len(validate_insuree_number("")), 1)
        self.assertEqual(len(validate_insuree_number("foo")), 1)
        self.assertEqual(len(validate_insuree_number("12345")), 0)
        self.assertEqual(len(validate_insuree_number("1234567")), 1)
        InsureeConfig. insuree_number_validator = None
        InsureeConfig.insuree_number_max_length = 7
        InsureeConfig.insuree_number_min_length = 7
        InsureeConfig.insuree_number_modulo_root = None
        
        self.assertEqual(len(validate_insuree_number("12345")), 1)
        self.assertEqual(len(validate_insuree_number("1234567")), 0)

    def test_mod(self):
        InsureeConfig. insuree_number_validator = None
        InsureeConfig.insuree_number_max_length = 5
        InsureeConfig.insuree_number_min_length = 5
        InsureeConfig.insuree_number_modulo_root = 7
        
        self.assertEqual(len(validate_insuree_number(None)), 1)
        self.assertEqual(len(validate_insuree_number("12342")), 0)
        self.assertEqual(len(validate_insuree_number("12345")), 1)
        self.assertEqual(len(validate_insuree_number("1234567")), 1)
        InsureeConfig. insuree_number_validator = None
        InsureeConfig.insuree_number_max_length = 7
        InsureeConfig.insuree_number_min_length = 7
        InsureeConfig.insuree_number_modulo_root = 5
        
        self.assertEqual(len(validate_insuree_number("12345")), 1)
        self.assertEqual(len(validate_insuree_number("1234561")), 0)
        self.assertEqual(len(validate_insuree_number("1234560")), 1)
