import base64
import json
import time
import uuid
from dataclasses import dataclass
from django.utils.translation import gettext as _
from core.models import User, filter_validity
from core.models.openimis_graphql_test_case import openIMISGraphQLTestCase, BaseTestContext
from core.test_helpers import create_test_interactive_user
from django.conf import settings
from graphene_django.utils.testing import GraphQLTestCase
from graphql_jwt.shortcuts import get_token
from location.models import Location
from location.test_helpers import create_test_location, assign_user_districts
from rest_framework import status
from insuree.test_helpers import create_test_insuree, generate_random_insuree_number
from location.test_helpers import create_test_location, create_test_health_facility, create_test_village
from insuree.models import Family

from insuree.apps import InsureeConfig
from unittest.mock import patch
from core.test_helpers import create_test_officer

# from openIMIS import schema


@dataclass
class DummyContext:
    """ Just because we need a context to generate. """
    user: User


class InsureeGQLTestCase(openIMISGraphQLTestCase):

    admin_user = None
    ca_user = None
    ca_token = None
    test_village = None
    test_insuree = None
    test_photo = None
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.test_village = create_test_village()
        cls.test_insuree = create_test_insuree(with_family=True, is_head=True, custom_props={'current_village':cls.test_village}, family_custom_props={'location':cls.test_village})
        cls.admin_user = create_test_interactive_user(username="testLocationAdmin")
        cls.admin_token = BaseTestContext(user=cls.admin_user).get_jwt()
        cls.ca_user = create_test_interactive_user(username="testLocationNoRight", roles=[9])
        cls.ca_token = BaseTestContext(user=cls.ca_user).get_jwt()
        cls.admin_dist_user = create_test_interactive_user(username="testLocationDist")
        assign_user_districts(cls.admin_dist_user, ["R1D1", "R2D1", "R2D2", "R2D1", cls.test_village.parent.parent.code])
        cls.admin_dist_token = BaseTestContext(user=cls.admin_dist_user).get_jwt()
        cls.photo_base64 = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEW10NBjBBbqAAAAH0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAvg0hAAABmmDh1QAAAABJRU5ErkJggg=="

        cls.photo_base64_2 = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEW10NBjBBbrAAAAH0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAvg0hAAABmmDh1QAAAABJRU5ErkJggg=="
        cls.eo_user = create_test_interactive_user(username="Positif")
        cls.non_eo_user = create_test_interactive_user(username="NonEo", roles = [7, 2, 3, 4, 5, 6])
        cls.eo_token = get_token(cls.eo_user, DummyContext(user=cls.eo_user))
        cls.non_eo_token = get_token(cls.non_eo_user, DummyContext(user=cls.non_eo_user))
        cls.test_officer = create_test_officer(villages = [cls.test_village], custom_props={'code':"Positif",'last_name':"Positif",'other_names':"Le"})
        cls.eo_user.officer = cls.test_officer
        cls.eo_user.save()

    def test_query_insuree_number_validity(self):
        response = self.query(
            '''
            {
                insureeNumberValidity(insureeNumber:"123456782")
                {
                  isValid
                  errorCode
                  errorMessage
                }
            }
            ''',
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_token}"},
        )

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        content = json.loads(response.content)

        self.assertResponseNoErrors(response)
        




    def test_insuree_query(self):
        
        response = self.query(
            '''
            query {
                
      insurees
      {
        totalCount
        
    pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor}
    edges
    {
      node
      {
        id,uuid,validityFrom,validityTo,chfId,otherNames,lastName,phone,gender{code},dob,marital,status,family{uuid,location{id, uuid, code, name, type, parent{id,uuid,code,name,type,parent{id,uuid,code,name,type,parent{id,uuid,code,name,type}}}}},currentVillage{id, uuid, code, name, type, parent{id,uuid,code,name,type,parent{id,uuid,code,name,type,parent{id,uuid,code,name,type}}}}
      }
    }
      }
    
            }
            ''',
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_dist_user}"},

        )

        content = json.loads(response.content)

        # This validates the status code and if you get errors
        self.assertEqual(content['errors'][0]['message'],_('unauthorized'))



    def test_family_query(self):
        
        response = self.query(
            '''
            query {

      families(first: 10,orderBy: ["-validityFrom"])
      {
        totalCount
        
    pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor}
    edges
    {
      node
      {
        id,uuid,poverty,confirmationNo,validityFrom,validityTo,headInsuree{id,uuid,chfId,lastName,otherNames,email,phone, dob},location{id, uuid, code, name, type, parent{id,uuid,code,name,type,parent{id,uuid,code,name,type,parent{id,uuid,code,name,type}}}}
      }
    }
      }
    }

            ''',
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_dist_user}"},

        )

        content = json.loads(response.content)

        # This validates the status code and if you get errors
        self.assertEqual(content['errors'][0]['message'],_('unauthorized'))



    def test_query_with_variables(self):
        response = self.query(
            '''
    
            query insurees( $first:  Int! ) 
    {
      insurees(first: $first,orderBy: ["chfId"])
      {
        totalCount
        
    pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor}
    edges
    {
      node
      {
        id,uuid,validityFrom,validityTo,chfId,otherNames,lastName,phone,gender{code},dob,marital,status,family{uuid,location{id, uuid, code, name, type, parent{id,uuid,code,name,type,parent{id,uuid,code,name,type,parent{id,uuid,code,name,type}}}}},currentVillage{id, uuid, code, name, type, parent{id,uuid,code,name,type,parent{id,uuid,code,name,type,parent{id,uuid,code,name,type}}}}
      }
    }
      }
    }
            ''',
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_token}"},
            variables={ 'first':10}
        )

        content = json.loads(response.content)

        # This validates the status code and if you get errors
        self.assertResponseNoErrors(response)

    def test_query_ignore_location(self):
        
      response = self.query(
            '''
    query insurees( $chfid:  String!, $ignoreLocation : Boolean! )    
    {
      insurees(chfId:$chfid, ignoreLocation:$ignoreLocation)
      {
        pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor}
        edges
        {
          node
          {
            id,uuid,chfId,lastName,otherNames,dob,age,validityFrom,validityTo,gender{code},status,family{id, uuid, address location{name, parent{name, parent{name}}}},photo{folder,filename,photo},gender{code, gender, altLanguage},healthFacility{id, uuid, code, name, level, servicesPricelist{id, uuid}, itemsPricelist{id, uuid}, contractStartDate, contractEndDate, location{id,uuid,code,name,type, parent{id,uuid,code,name,type}}}
          }
        }
      }
    }
            ''',
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_dist_token}"},
            variables={ 'chfid':self.test_insuree.chf_id, 'ignoreLocation':True}
        )

      content = json.loads(response.content)

    # This validates the status code and if you get errors
      self.assertResponseNoErrors(response)
      
    def test_create_insuree(self):
      muuid = 'ffa465c5-6807-4de0-847e-202b7f42122b'
      response = self.query(f'''
    mutation {{
      createInsuree(
        input: {{
          clientMutationId: "{muuid}"
          clientMutationLabel: "Create insuree "
          
          chfId: "{generate_random_insuree_number()}"
    lastName: "test"
    otherNames: "create insuree"
    genderId: "M"
    dob: "1951-12-05"
    head: false
    marital: "M"
    currentVillageId: {self.test_village.id}
    photo:{{
    officerId: 1
    date: "2023-12-15"
    photo: "{self.photo_base64}"
  }}
    cardIssued:false
    status: "AC"
        }}
      ) {{
        clientMutationId
        internalId
      }}
    }}
    ''',
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_dist_token}"},
        )

      content = json.loads(response.content)

    # This validates the status code and if you get errors
      self.assertResponseNoErrors(response)
      self.get_mutation_result(muuid, self.admin_dist_token )
      
      
    def test_create_family(self):
      hear_number = generate_random_insuree_number()

      muuid='50f8f2c9-7685-4cd5-a7d8-b1fa78d46470'
      fuuid='50f8f2c9-7685-4cd5-a770-b1fa34d46470'
      response = self.query(f'''
    mutation {{
      createFamily(
        input: {{
          clientMutationId: "{muuid}"
          clientMutationLabel: "Create Family - test create family (445566778899)"
          headInsuree: {{
    chfId: "{hear_number}"
    lastName: "test"
    otherNames: "create family"
    genderId: "M"
    uuid: "50f8f2c9-7685-4cd5-a778-b1fa78d46470"
    dob: "1999-12-15"
    head: true
    photo:{{
    officerId: 1
    date: "2023-12-15"
    photo: "{self.photo_base64}"

  }}
    cardIssued:false
    status: "AC"
  }}
    locationId: {self.test_village.id}
    poverty: false
    uuid: "{fuuid}"
    jsonExt: "{{}}"
        }}
      ) {{
        clientMutationId
        internalId
      }}
    }}
      ''',
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_dist_token}"},
        )

      content = json.loads(response.content)

    # This validates the status code and if you get errors
      self.assertResponseNoErrors(response)
      self.get_mutation_result(muuid, self.admin_dist_token )
      mmuid = '50f8f2c9-7685-4cd5-a778-b1fa78d46471'
      # update
      response = self.query(f'''
    mutation {{
      updateFamily(
        input: {{
          clientMutationId: "{muuid}"
          clientMutationLabel: "Update Family - test create family (445566778899)"
          headInsuree: {{
    chfId: "{hear_number}"
    uuid: "50f8f2c9-7685-4cd5-a778-b1fa78d46470"
    lastName: "test"
    otherNames: "create family"
    genderId: "M"
    dob: "1999-12-15"
    head: true
    photo:{{
    officerId: 1
    date: "2023-12-15"
    photo: "{self.photo_base64_2}"

  }}
    cardIssued:false
    status: "AC"
  }}
    locationId: {self.test_village.id}
    poverty: true
    uuid: "{fuuid}"
    jsonExt: "{{}}"
        }}
      ) {{
        clientMutationId
        internalId
      }}
    }}
      ''',
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_dist_token}"},
        )

      content = json.loads(response.content)

    # This validates the status code and if you get errors
      self.assertResponseNoErrors(response)
      content=  self.get_mutation_result(muuid, self.admin_dist_token )
      family = Family.objects.filter(*filter_validity(),uuid= uuid.UUID(fuuid)).first()
      self.assertEqual(family.poverty, True)

      
      
    def test_inquire(self):
      response = self.query("""
query GetInsureeInquire($chfId: String) {
  insurees(chfId: $chfId) {
    __typename
    edges {
      __typename
      node {
        __typename
        chfId
        lastName
        otherNames
        dob
        gender {
          __typename
          gender
        }
        photos {
          __typename
          folder
          filename
          photo
        }
        insureePolicies {
          __typename
          edges {
            __typename
            node {
              __typename
              policy {
                __typename
                product {
                  __typename
                  name
                  code
                  ceiling
                  ceilingIp
                  ceilingOp
                  deductible
                  deductibleIp
                  deductibleOp
                  maxNoAntenatal
                  maxAmountAntenatal
                  maxNoSurgery
                  maxAmountSurgery
                  maxNoConsultation
                  maxAmountConsultation
                  maxNoDelivery
                  maxAmountDelivery
                  maxNoHospitalization
                  maxAmountHospitalization
                  maxMembers
                  maxNoVisits
                  maxInstallments
                  maxCeilingPolicy
                  maxCeilingPolicyIp
                  maxCeilingPolicyOp
                  maxPolicyExtraMember
                  maxPolicyExtraMemberIp
                  maxPolicyExtraMemberOp
                }
                enrollDate
                expiryDate
                status
                value
              }
            }
          }
        }
      }
    }
  }
}
     
      """,
            headers={"HTTP_AUTHORIZATION": f"Bearer {self.ca_token}"},
        )

      content = json.loads(response.content)

    # This validates the status code and if you get errors
      self.assertResponseNoErrors(response)
      
      
    def test_validate_number_unvalidity_with_variables(self):
            InsureeConfig. insuree_number_validator = None
            InsureeConfig.insuree_number_max_length = 9
            InsureeConfig.insuree_number_min_length = 9
            InsureeConfig.insuree_number_modulo_root = None
            
            response = self.query(
                '''
        query ($insuranceNumber: String!) {
          insureeNumberValidity(insureeNumber: $insuranceNumber) {
            isValid
            errorCode
            errorMessage
          }
        }
                ''',
                headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_token}"},
                variables={"insuranceNumber": "07070"}        )

            content = json.loads(response.content)

            # This validates the status code and if you get errors
            self.assertResponseNoErrors(response)
            self.assertFalse(content['data']['insureeNumberValidity']['isValid'])
            

    def test_validate_number_validity_with_variables(self):
            InsureeConfig. insuree_number_validator = None
            InsureeConfig.insuree_number_max_length = 9
            InsureeConfig.insuree_number_min_length = 9
            InsureeConfig.insuree_number_modulo_root = None
            response = self.query(
              '''
              query ($insuranceNumber: String!) {
                insureeNumberValidity(insureeNumber: $insuranceNumber) {
                  isValid
                  errorCode
                  errorMessage
                }
              }
              ''',
              headers={"HTTP_AUTHORIZATION": f"Bearer {self.admin_token}"},
              variables={"insuranceNumber": "070707070"})

            content = json.loads(response.content)

            # This validates the status code and if you get errors
            self.assertResponseNoErrors(response)
            self.assertTrue(content['data']['insureeNumberValidity']['isValid'])

    def test_insuree_officers_query(self):
      # Enable contextual filtering in the configuration
      with patch.object(InsureeConfig, 'use_contextual_enrolment_officer_selection', True):
          # Case 1: EO user, should return only themselves
          response = self.query(
              '''
              query {
                  insureeOfficers {
                      edges {
                          node {
                              id
                              uuid
                              code
                              lastName
                              otherNames
                          }
                      }
                  }
              }
              ''',
              headers={"HTTP_AUTHORIZATION": f"Bearer {self.eo_token}"},
          )
          content = json.loads(response.content)
          self.assertResponseNoErrors(response)
          officers = content['data']['insureeOfficers']['edges']
          self.assertEqual(len(officers), 1, "Expected exactly one officer for EO user")
          self.assertEqual(officers[0]['node']['code'], "Positif", "Expected officer to be the EO user")

          # Case 2: Non-EO user with location_id (village with officer)
          response = self.query(
              '''
              query ($locationId: String!) {
                  insureeOfficers(locationId: $locationId) {
                      edges {
                          node {
                              id
                              uuid
                              code
                              lastName
                              otherNames
                          }
                      }
                  }
              }
              ''',
              headers={"HTTP_AUTHORIZATION": f"Bearer {self.non_eo_token}"},
              variables={"locationId": str(self.test_village.id)},
          )
          content = json.loads(response.content)
          self.assertResponseNoErrors(response)
          officers = content['data']['insureeOfficers']['edges']
          self.assertEqual(len(officers), 1, "Expected one officer associated with the village")
          self.assertEqual(officers[0]['node']['code'], "Positif", "Expected officer associated with the village")

          # Case 3: Non-EO user without location_id or village without officer
          another_village = create_test_village(custom_props={"code": "ANOTHER"})
          response = self.query(
              '''
              query ($locationId: String!) {
                  insureeOfficers(locationId: $locationId) {
                      edges {
                          node {
                              id
                              uuid
                              code
                              lastName
                              otherNames
                          }
                      }
                  }
              }
              ''',
              headers={"HTTP_AUTHORIZATION": f"Bearer {self.non_eo_token}"},
              variables={"locationId": str(another_village.id)},
          )
          content = json.loads(response.content)
          self.assertResponseNoErrors(response)
          officers = content['data']['insureeOfficers']['edges']
          self.assertGreaterEqual(len(officers), 1, "Expected at least one officer (all valid EOs)")
          self.assertTrue(any(o['node']['code'] == "Positif" for o in officers), "Expected test officer in the list")