import graphene
from graphene_django import DjangoObjectType

from .apps import InsureeConfig
from .models import Insuree, InsureePhoto, Education, Profession, Gender, IdentificationType, \
    Family, FamilyType, ConfirmationType, Relation, InsureePolicy, FamilyMutation, InsureeMutation, InsureeStatusReason
from location.schema import LocationGQLType
from policy.gql_queries import PolicyGQLType
from core import prefix_filterset, filter_validity, ExtendedConnection
from django.utils.translation import gettext as _
from django.core.exceptions import PermissionDenied

from .services import load_photo_file


class GenderGQLType(DjangoObjectType):
    class Meta:
        model = Gender
        filter_fields = {
            "code": ["exact"]
        }


class PhotoGQLType(DjangoObjectType):
    photo = graphene.String()

    def resolve_photo(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_photo_perms):
            raise PermissionDenied(_("unauthorized"))
        if self.photo:
            return self.photo
        elif InsureeConfig.insuree_photos_root_path and self.folder and self.filename:
            return load_photo_file(self.folder, self.filename)
        return None

    class Meta:
        model = InsureePhoto
        filter_fields = {
            "id": ["exact"]
        }


class IdentificationTypeGQLType(DjangoObjectType):
    class Meta:
        model = IdentificationType
        filter_fields = {
            "code": ["exact"]
        }


class EducationGQLType(DjangoObjectType):
    class Meta:
        model = Education
        filter_fields = {
            "id": ["exact"]
        }

        exclude_fields = ('insurees',)


class ProfessionGQLType(DjangoObjectType):
    class Meta:
        model = Profession
        filter_fields = {
            "id": ["exact"]
        }


class FamilyTypeGQLType(DjangoObjectType):
    class Meta:
        model = FamilyType
        filter_fields = {
            "code": ["exact"]
        }


class ConfirmationTypeGQLType(DjangoObjectType):
    class Meta:
        model = ConfirmationType
        filter_fields = {
            "code": ["exact"]
        }


class RelationGQLType(DjangoObjectType):
    class Meta:
        model = Relation
        filter_fields = {
            "code": ["exact"]
        }


class InsureeStatusReasonGQLType(DjangoObjectType):
    status_type = graphene.String(required=False)

    class Meta:
        model = InsureeStatusReason
        interfaces = (graphene.relay.Node,)
        filter_fields = {
            "code": ["exact"],
            "insuree_status_reason": ["exact", 'icontains', 'istartswith'],
            "status_type": ["exact"]
        }
        connection_class = ExtendedConnection


class InsureeGQLType(DjangoObjectType):
    age = graphene.Int(source='age')
    client_mutation_id = graphene.String()
    photo = PhotoGQLType()

    def resolve_current_village(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_perms):
            raise PermissionDenied(_("unauthorized"))
        if "location_loader" in info.context.dataloaders and self.current_village_id:
            return info.context.dataloaders["location_loader"].load(
                self.current_village_id
            )
        return self.current_village

    def resolve_family(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_perms):
            raise PermissionDenied(_("unauthorized"))
        if "family_loader" in info.context.dataloaders and self.family_id:
            return info.context.dataloaders["family_loader"].load(self.family_id)
        return self.family

    def resolve_health_facility(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_perms):
            raise PermissionDenied(_("unauthorized"))
        if "health_facililty" in info.context.dataloaders and self.health_facility_id:
            return info.context.dataloaders["health_facility"].load(
                self.health_facility_id
            )
        return self.health_facility

    def resolve_photo(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_perms):
            raise PermissionDenied(_("unauthorized"))
        return self.photo

    class Meta:
        model = Insuree
        filter_fields = {
            "uuid": ["exact","iexact"],
            "chf_id": ["exact", "istartswith", "icontains", "iexact"],
            "last_name": ["exact", "istartswith", "icontains", "iexact"],
            "other_names": ["exact", "istartswith", "icontains", "iexact"],
            "email": ["exact", "istartswith", "icontains", "iexact", "isnull"],
            "phone": ["exact", "istartswith", "icontains", "iexact", "isnull"],
            "dob": ["exact", "lt", "lte", "gt", "gte", "isnull"],
            "head": ["exact"],
            "passport": ["exact", "istartswith", "icontains", "iexact", "isnull"],
            "gender__code": ["exact", "isnull"],
            "marital": ["exact", "isnull"],
            "status": ["exact"],
            "validity_from": ["exact", "lt", "lte", "gt", "gte", "isnull"],
            "validity_to": ["exact", "lt", "lte", "gt", "gte", "isnull"],
            **prefix_filterset("photo__", PhotoGQLType._meta.filter_fields),
            "photo": ["isnull"],
            "family": ["isnull"],
            **prefix_filterset("gender__", GenderGQLType._meta.filter_fields)
        }
        interfaces = (graphene.relay.Node,)
        connection_class = ExtendedConnection

    def resolve_client_mutation_id(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_perms):
            raise PermissionDenied(_("unauthorized"))
        insuree_mutation = self.mutations.select_related(
            'mutation').filter(mutation__status=0).first()
        return insuree_mutation.mutation.client_mutation_id if insuree_mutation else None

    @classmethod
    def get_queryset(cls, queryset, info):
        return Insuree.get_queryset(queryset, info)


class FamilyGQLType(DjangoObjectType):
    client_mutation_id = graphene.String()

    def resolve_location(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        if "location_loader" in info.context.dataloaders:
            return info.context.dataloaders["location_loader"].load(self.location_id)

    def resolve_head_insuree(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        if "insuree_loader" in info.context.dataloaders:
            return info.context.dataloaders["insuree_loader"].load(self.head_insuree_id)

    class Meta:
        model = Family
        filter_fields = {
            "uuid": ["exact","iexact"],
            "poverty": ["exact", "isnull"],
            "confirmation_no": ["exact", "istartswith", "icontains", "iexact"],
            "confirmation_type": ["exact"],
            "family_type": ["exact"],
            "address": ["exact", "istartswith", "icontains", "iexact"],
            "ethnicity": ["exact"],
            "is_offline": ["exact"],
            **prefix_filterset("location__", LocationGQLType._meta.filter_fields),
            **prefix_filterset("head_insuree__", InsureeGQLType._meta.filter_fields),
            **prefix_filterset("members__", InsureeGQLType._meta.filter_fields)
        }
        interfaces = (graphene.relay.Node,)
        connection_class = ExtendedConnection

    def resolve_client_mutation_id(self, info):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        family_mutation = self.mutations.select_related(
            'mutation').filter(mutation__status=0).first()
        return family_mutation.mutation.client_mutation_id if family_mutation else None

    @classmethod
    def get_queryset(cls, queryset, info):
        return Family.get_queryset(queryset, info)


class InsureePolicyGQLType(DjangoObjectType):
    class Meta:
        model = InsureePolicy
        filter_fields = {
            "enrollment_date": ["exact", "lt", "lte", "gt", "gte"],
            "start_date": ["exact", "lt", "lte", "gt", "gte"],
            "effective_date": ["exact", "lt", "lte", "gt", "gte"],
            "expiry_date": ["exact", "lt", "lte", "gt", "gte"],
            **prefix_filterset("insuree__", InsureeGQLType._meta.filter_fields),
            **prefix_filterset("policy__", PolicyGQLType._meta.filter_fields),
        }
        interfaces = (graphene.relay.Node,)
        connection_class = ExtendedConnection

    @classmethod
    def get_queryset(cls, queryset, info):
        return InsureePolicy.get_queryset(queryset, info)


class FamilyMutationGQLType(DjangoObjectType):
    class Meta:
        model = FamilyMutation


class InsureeMutationGQLType(DjangoObjectType):
    class Meta:
        model = InsureeMutation



import graphene

# --- Shared Base Types ---
class IdentifierType(graphene.ObjectType):
    identifier_type = graphene.String()
    identifier_value = graphene.String()

class NameType(graphene.ObjectType):
    given_name = graphene.String()
    second_name = graphene.String()
    surname = graphene.String()
    prefix = graphene.String()
    suffix = graphene.String()

class GeoLocationType(graphene.ObjectType):
    latitude = graphene.Float()
    longitude = graphene.Float()

class PlaceType(graphene.ObjectType):
    name = graphene.String()
    geo = graphene.Field(GeoLocationType)

# --- Demographic ---
class DemographicInfoType(graphene.ObjectType):
    name = graphene.Field(NameType)
    sex = graphene.String()
    birth_date = graphene.String()
    phone_number = graphene.List(graphene.String)
    registration_date = graphene.String()
    last_updated = graphene.String()

# --- Farmer Personal ---
class FarmerPersonalDetailsType(graphene.ObjectType):
    member_identifier = graphene.List(IdentifierType)
    demographic_info = graphene.Field(DemographicInfoType)
    self_id_disability = graphene.Boolean()
    marital_status = graphene.String()
    language_code = graphene.List(graphene.String)
    education_level = graphene.String()
    registration_date = graphene.String()
    last_updated = graphene.String()

# --- Family ---
class FamilyMemberType(graphene.ObjectType):
    member_identifier = graphene.List(IdentifierType)
    demographic_info = graphene.Field(DemographicInfoType)
    self_id_disability = graphene.Boolean()
    marital_status = graphene.String()
    registration_date = graphene.String()
    last_updated = graphene.String()

class FamilyDetailsType(graphene.ObjectType):
    group_identifier = graphene.List(IdentifierType)
    group_type = graphene.String()
    place = graphene.Field(PlaceType)
    poverty_score = graphene.Float()
    poverty_score_type = graphene.String()
    group_size = graphene.Int()
    member_list = graphene.List(FamilyMemberType)
    registration_date = graphene.String()
    last_updated = graphene.String()

# --- Farm & Activities ---
class CropProductionType(graphene.ObjectType):
    crop_type = graphene.String()
    variety = graphene.String()
    season = graphene.String()
    irrigation = graphene.Boolean()
    irrigation_water = graphene.List(graphene.String)
    end_use = graphene.List(graphene.String)

class AnimalProductionType(graphene.ObjectType):
    type = graphene.String()
    count = graphene.Int()
    livestock_system = graphene.String()

class FarmingActivityType(graphene.ObjectType):
    crop_production = graphene.List(CropProductionType)
    animal_production = graphene.List(AnimalProductionType)
    mixed_farming = graphene.Boolean()
    agri_support_activities = graphene.List(graphene.String)

class FarmDetailsType(graphene.ObjectType):
    farm_type = graphene.String()
    place = graphene.Field(PlaceType)
    land_tenure = graphene.String()
    land_size = graphene.Float()
    measurement = graphene.String()
    farming_activities = graphene.List(FarmingActivityType)
    registration_date = graphene.String()
    last_updated = graphene.String()

# --- Record ---
class FarmerRecordType(graphene.ObjectType):
    farmer_personal_details = graphene.Field(FarmerPersonalDetailsType)  # fixed spelling
    family_details = graphene.Field(FamilyDetailsType)
    farm_details = graphene.List(FarmDetailsType)
    registration_date = graphene.String()
    last_updated = graphene.String()

# --- Wrappers ---
class PaginationType(graphene.ObjectType):
    page_size = graphene.Int()
    page_number = graphene.Int()
    total_count = graphene.Int()

class SearchResponseType(graphene.ObjectType):
    reference_id = graphene.String()
    status = graphene.String()
    status_reason_code = graphene.String()
    status_reason_message = graphene.String()
    reg_records = graphene.List(FarmerRecordType)
    pagination = graphene.Field(PaginationType)
    locale = graphene.String()

class CRVSQueryResult(graphene.ObjectType):
    transaction_id = graphene.String()
    correlation_id = graphene.String()
    search_response = graphene.List(SearchResponseType)



class SRIdentifierType(graphene.ObjectType):
    identifier_type  = graphene.String()
    identifier_value = graphene.String()
 
class SRNameType(graphene.ObjectType):
    given_name  = graphene.String()
    second_name = graphene.String()
    surname     = graphene.String()
    prefix      = graphene.String()
    suffix      = graphene.String()
 
class SRGeoLocationType(graphene.ObjectType):
    latitude  = graphene.Float()
    longitude = graphene.Float()
 
class SRPlaceType(graphene.ObjectType):
    name = graphene.String()
    geo  = graphene.Field(SRGeoLocationType)
 
# ─────────────────────────────────────────────
# INDIVIDUAL PERSONAL DETAILS
# ─────────────────────────────────────────────
 
class SRDemographicInfoType(graphene.ObjectType):
    name              = graphene.Field(SRNameType)
    sex               = graphene.String()
    birth_date        = graphene.String()
    phone_number      = graphene.List(graphene.String)
    email             = graphene.String()
    registration_date = graphene.String()
    last_updated      = graphene.String()
 
class SRPersonalDetailsType(graphene.ObjectType):
    member_identifier  = graphene.List(SRIdentifierType)
    demographic_info   = graphene.Field(SRDemographicInfoType)
    self_id_disability = graphene.Boolean()
    marital_status     = graphene.String()
    language_code      = graphene.List(graphene.String)
    education_level    = graphene.String()
    registration_date  = graphene.String()
    last_updated       = graphene.String()
 
# ─────────────────────────────────────────────
# HOUSEHOLD / FAMILY DETAILS
# ─────────────────────────────────────────────
 
class SRHouseholdMemberType(graphene.ObjectType):
    member_identifier  = graphene.List(SRIdentifierType)
    demographic_info   = graphene.Field(SRDemographicInfoType)
    self_id_disability = graphene.Boolean()
    marital_status     = graphene.String()
    registration_date  = graphene.String()
    last_updated       = graphene.String()
 
class SRHouseholdDetailsType(graphene.ObjectType):
    group_identifier   = graphene.List(SRIdentifierType)
    group_type         = graphene.String()
    place              = graphene.Field(SRPlaceType)
    poverty_score      = graphene.Float()
    poverty_score_type = graphene.String()
    group_size         = graphene.Int()
    member_list        = graphene.List(SRHouseholdMemberType)
    registration_date  = graphene.String()
    last_updated       = graphene.String()
 
# ─────────────────────────────────────────────
# PROGRAM / BENEFIT DETAILS
# (social registry specific — not in farmer registry)
# ─────────────────────────────────────────────
 
class SRBenefitType(graphene.ObjectType):
    program_name      = graphene.String()
    program_code      = graphene.String()
    benefit_type      = graphene.String()
    enrollment_date   = graphene.String()
    expiry_date       = graphene.String()
    status            = graphene.String()
    amount            = graphene.Float()
    currency          = graphene.String()
 
class SREconomicDetailsType(graphene.ObjectType):
    income_level      = graphene.String()
    income_source     = graphene.List(graphene.String)
    asset_ownership   = graphene.List(graphene.String)
    housing_type      = graphene.String()
    has_electricity   = graphene.Boolean()
    has_clean_water   = graphene.Boolean()
    registration_date = graphene.String()
    last_updated      = graphene.String()
 
# ─────────────────────────────────────────────
# RECORD WRAPPER
# ─────────────────────────────────────────────
 
class SRIndividualRecordType(graphene.ObjectType):
    personal_details   = graphene.Field(SRPersonalDetailsType)
    household_details  = graphene.Field(SRHouseholdDetailsType)
    economic_details   = graphene.Field(SREconomicDetailsType)
    benefits           = graphene.List(SRBenefitType)
    registration_date  = graphene.String()
    last_updated       = graphene.String()
 
# ─────────────────────────────────────────────
# PAGINATION & RESPONSE WRAPPERS
# ─────────────────────────────────────────────
 
class SRPaginationType(graphene.ObjectType):
    page_size   = graphene.Int()
    page_number = graphene.Int()
    total_count = graphene.Int()
 
class SRSearchResponseType(graphene.ObjectType):
    reference_id          = graphene.String()
    status                = graphene.String()
    status_reason_code    = graphene.String()
    status_reason_message = graphene.String()
    reg_records           = graphene.List(SRIndividualRecordType)
    pagination            = graphene.Field(SRPaginationType)
    locale                = graphene.String()
 
class SocialRegistryQueryResult(graphene.ObjectType):
    transaction_id  = graphene.String()
    correlation_id  = graphene.String()
    search_response = graphene.List(SRSearchResponseType)