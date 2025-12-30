from core.test_helpers import create_test_interactive_user
from rest_framework import status
from rest_framework.test import APITestCase
from dataclasses import dataclass
from graphql_jwt.shortcuts import get_token
from core.models import User
from django.conf import settings
from django.db import connection
from core.models.openimis_graphql_test_case import BaseTestContext

from unittest.mock import patch, PropertyMock




class ReportAPITests( APITestCase):

    admin_user = None
    admin_token = None
    EFO_URL = f'/{settings.SITE_ROOT()}report/enrolled_families/pdf/?locationId=34&dateFrom=2019-04-01&dateTo=2019-04-30'
    IFO_URL = f'/{settings.SITE_ROOT()}report/insuree_family_overview/pdf/?dateFrom=2023-11-01&dateTo=2023-12-31'
    IMP_URL = f'/{settings.SITE_ROOT()}report/insuree_missing_photo/pdf/'
    IME_URL = f'/{settings.SITE_ROOT()}report/insurees_pending_enrollment/pdf/?dateFrom=2019-04-01&dateTo=2019-04-30&officerId=1&locationId=20'
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.admin_user = create_test_interactive_user(username="testLocationAdmin")
        cls.admin_token = BaseTestContext(user=cls.admin_user).get_jwt()
        
    def test_single_enrolled_families_report(self):
        headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_token}"}
        response = self.client.get(self.EFO_URL, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_single_insuree_family_overview_report(self):
        with patch('core.models.InteractiveUser.is_imis_admin', new_callable=PropertyMock) as mock_is_imis_admin:
            mock_is_imis_admin.return_value = False
            with self.settings(ROW_SECURITY=True):
                headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_token}"}
                response = self.client.get(self.IFO_URL, format='json', **headers)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_single_insuree_missing_photo_report(self):
        if not connection.vendor == 'postgresql':
            self.skipTest("This test can only be executed for PSQL database")
        headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_token}"}
        response = self.client.get(self.IMP_URL, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_single_insurees_pending_enrollment_report(self):
        if not connection.vendor == 'postgresql':
            self.skipTest("This test can only be executed for PSQL database")
        headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_token}"}
        response = self.client.get(self.IME_URL, format='json', **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
