import uuid
from unittest import mock
from unittest.mock import PropertyMock

from django.test import TestCase
from core.forms import User
import time
from graphene import Schema
from graphene.test import Client
from insuree.apps import InsureeConfig
from insuree import schema as insuree_schema
from insuree.models import Insuree
from insuree.test_helpers import create_test_insuree
from location.models import UserDistrict
from core.services import create_or_update_interactive_user, create_or_update_core_user
from core.models.openimis_graphql_test_case import openIMISGraphQLTestCase, BaseTestContext
from insuree.services import validate_insuree_number
from unittest.mock import ANY
from django.conf import settings
from graphql_jwt.shortcuts import get_token


class InsureePhotoTest(openIMISGraphQLTestCase):

    test_user = None
    _TEST_USER_NAME = None
    test_user_PASSWORD = None
    _TEST_DATA_USER = None
    schema = Schema(
            query=insuree_schema.Query,
    )

    photo_base64 = None
    test_photo_path, test_photo_uuid = None, None

    @classmethod
    def setUpTestData(cls):
        cls._TEST_USER_NAME = "TestUserTest2"
        cls.test_user_PASSWORD = "TestPasswordTest2"
        cls._TEST_DATA_USER = {
            "username": cls._TEST_USER_NAME,
            "last_name": cls._TEST_USER_NAME,
            "password": cls.test_user_PASSWORD,
            "other_names": cls._TEST_USER_NAME,
            "user_types": "INTERACTIVE",
            "language": "en",
            "roles": [4],
        }
        cls.test_photo_path = InsureeConfig.insuree_photos_root_path
        cls.test_photo_uuid = str(uuid.uuid4())
        cls.photo_base64 = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEW10NBjBBbqAAAAH0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAvg0hAAABmmDh1QAAAABJRU5ErkJggg=="
        cls.photo_base64_2 = "iVBORw03GgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEW10NBjBBbqAAAAH0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAvg0hAAABmmDh1QAAAABJRU5ErkJggg=="
        cls.test_user = cls.__create_user_interactive_core()
        cls.insuree = create_test_insuree()
        cls.test_user_token = BaseTestContext(user=cls.test_user).get_jwt()

        #Add the disctict on the user
        UserDistrict.objects.create(
            user=cls.test_user.i_user,
            location=cls.insuree.family.location.parent.parent,
            audit_user_id=-1
        )
        cls.test_user.i_user
        cls.row_sec = settings.ROW_SECURITY
        #settings.ROW_SECURITY = False

    #def tearDown(self) -> None:
        #settings.ROW_SECURITY = self.row_sec

    @classmethod
    def setUpClass(cls):
        # Signals are not automatically bound in unit tests
        super(InsureePhotoTest, cls).setUpClass()
        cls.schema = Schema(
            query=insuree_schema.Query,
            mutation=insuree_schema.Mutation
        )
        cls.insuree_client = Client(cls.schema)

        ##insuree_schema.bind_signals()

    def test_add_photo_save_db(self):
        result = self.__call_photo_mutation(photo_uuid=self.test_photo_uuid)
        self.assertEqual(self.insuree.photo.photo, self.photo_base64)
        result = self.__call_photo_mutation(self.photo_base64_2, photo_uuid=self.test_photo_uuid)
        
        
    def test_pull_photo_db(self):
        self.__call_photo_mutation()
        query_result = self.__call_photo_query()
        try:
            gql_photo = query_result['data']['insurees']['edges'][0]['node']['photo']
            self.assertEqual(gql_photo['photo'], self.photo_base64)
        except Exception as e:
            raise e


    def test_add_photo_save_files(self):
        uuid_photo = uuid.uuid4()
        self.__call_photo_mutation(photo_uuid=uuid_photo)
        self.assertEqual(self.insuree.photo.filename,
                         str(uuid_photo))


    def test_pull_photo_file_path(self):
        self.__call_photo_mutation()
        query_result = self.__call_photo_query()
        gql_photo = query_result['data']['insurees']['edges'][0]['node']['photo']
        self.assertEqual(gql_photo['photo'], self.photo_base64)
        

    def __call_photo_mutation(self, photo=None, photo_uuid=None):
        if not photo:
            photo = self.photo_base64
        mutation = self.__update_photo_mutation(photo, photo_uuid=photo_uuid)
        context = BaseTestContext(self.test_user, data=mutation)
        
        result = self.send_mutation_raw(mutation, self.test_user_token, variables_param=None, follow=True)
        
        self.insuree = Insuree.objects.get(pk=self.insuree.pk)
        return result

    def __call_photo_query(self):
        query = self.__get_insuree_query()
        context = BaseTestContext(self.test_user, data=query).get_request()
        return self.insuree_client.execute(query, context=context)

    def __update_photo_mutation(self, photo, photo_uuid=None):
        if photo_uuid:
            uuid_insert = f'uuid: "{photo_uuid}"'
        else:
            uuid_insert = ''
        return f'''mutation
            {{
                updateInsuree(input: {{
                        clientMutationId: "{str(uuid.uuid4()).lower()}"          
                        clientMutationLabel: "Update insuree - {self.insuree.chf_id}"
                        uuid: "{str(self.insuree.uuid).lower()}" 
                        chfId: "{self.insuree.chf_id}"
                        lastName: "{self.insuree.last_name}"
                        otherNames: "{self.insuree.other_names}"
                        genderId: "M"
                        dob: "1950-07-12"
                        head: true
                        marital: "M"
                        status: "AC"
                        photo:{{
                            {uuid_insert}
                            officerId: {self.test_user.i_user_id}
                            date: "2022-06-21"
                            photo: "{photo}"
                            }}
                        cardIssued:false
                        familyId: {self.insuree.family.id}
                        }})  
                {{
                    clientMutationId
                    internalId
                }}
            }}
        '''
    @classmethod
    def _get_or_create_user_api(cls):
        try:
            return User.objects.filter(username=cls._TEST_USER_NAME).get()
        except User.DoesNotExist:
            return cls.__create_user_interactive_core()
    @classmethod
    def __create_user_interactive_core(cls):
        data = cls._TEST_DATA_USER

        i_user, i_user_created = create_or_update_interactive_user(
            user_id=None, data=data, audit_user_id=999, connected=False
        )
        create_or_update_core_user(
            user_uuid=None, username=cls._TEST_USER_NAME, i_user=i_user)
        
        return User.objects.filter(username=cls._TEST_USER_NAME).get()

    def __get_insuree_query(self):
        return f'''
{{
    insurees(uuid:"{str(self.insuree.uuid).lower()}") {{
        pageInfo {{
            hasNextPage,
            hasPreviousPage,
            startCursor,
            endCursor
        }}
        edges {{
            node {{
                uuid,
                chfId,
                photo {{
                    id,
                    uuid,
                    date,
                    folder,
                    filename,
                    officerId,
                    photo
                }}
            }}
        }}
    }}
}}
'''
