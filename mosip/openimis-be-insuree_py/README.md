# openIMIS Backend Insuree reference module
This repository holds the files of the openIMIS Backend Insuree reference module.
It is dedicated to be deployed as a module of [openimis-be_py](https://github.com/openimis/openimis-be_py).

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## Code climate (develop branch)

[![Maintainability](https://img.shields.io/codeclimate/maintainability/openimis/openimis-be-insuree_py.svg)](https://codeclimate.com/github/openimis/openimis-be-insuree_py/maintainability)
[![Test Coverage](https://img.shields.io/codeclimate/coverage/openimis/openimis-be-insuree_py.svg)](https://codeclimate.com/github/openimis/openimis-be-insuree_py)

## ORM mapping:
* tblGender > Gender (including alt_language)
* tblPhotos > InsureePhoto
* tblFamilyTypes > FamilyType
* tblFamilies > Family
* tblInsuree > Insuree
* tblInsureePolicy > InsureePolicy
* tblConfirmationTypes > ConfirmationType
* tblProfessions > Profession
* tblEducations > Education
* tblIdentificationTypes > IdentificationType
* tblRelations > Relation
* insuree_InsureeMutation > InsureeMutation
* insuree_FamilyMutation > FamilyMutation
* tblPolicyRenewalDetails > PolicyRenewalDetail

## Listened Django Signals
None

## Services
* create_insuree_renewal_detail: the renewal details are
  insuree-specific data to be renewed. Generally the picture.

## Reports (template can be overloaded via report.ReportDefinition)
None

## GraphQL Queries
* insuree_genders
* insurees
* identification_types
* educations
* professions
* family_types
* confirmation_types
* relations
* families
* family_members
* insuree_officers

## GraphQL Mutations - each mutation emits default signals and return standard error lists (cfr. openimis-be-core_py)
* create_family
* update_family
* delete_families
* create_insuree
* update_insuree
* delete_insurees
* remove_insurees
* set_family_head
* change_insuree_family

## Configuration options (can be changed via core.ModuleConfiguration)
Rights required:
* gql_query_insurees_perms": (default: `["101101"]`)
* gql_query_insuree_perms": (default: `["101101"]`)
* gql_query_insuree_officers_perms": (default: `[]`),
* gql_insuree_family_members": (default: `["101101"]`),
* gql_query_families_perms": (default: `["101001"]`),
* gql_mutation_create_families_perms": (default: `["101002"]`),
* gql_mutation_update_families_perms": (default: `["101003"]`),
* gql_mutation_delete_families_perms": (default: `["101004"]`),
* gql_mutation_create_insurees_perms": (default: `["101102"]`),
* gql_mutation_update_insurees_perms": (default: `["101103"]`),
* gql_mutation_delete_insurees_perms": (default: `["101104"]`),
* insuree_photos_root_path": None,
* excluded_insuree_chfids": fake insurees (and bound families) used, for
  example, in 'funding' (default: `['999999999']`)
* renewal_photo_age_adult": age (in months) of a picture due for renewal
  for adults (default: `60`)
* renewal_photo_age_child": age (in months) of a picture due for renewal
  for children (default: `12`)
* use_contextual_enrolment_officer_selection": Enables automatic assignment of 
  the current user as the enrolment officer when uploading an insuree photo. If 'True', 
  the officer is inferred from session; if 'False', manual selection remains available. (default: 'False)
* [DEPRECATED] no_location_check (default: False) - since 25.10 - uses the same configuration in be-location module

## openIMIS Modules Dependencies
* location.models.HealthFacility
