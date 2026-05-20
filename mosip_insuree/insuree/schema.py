import re

import graphene
import requests
from datetime import datetime
from claim.apps import ClaimConfig
from core.gql.export_mixin import ExportableQueryMixin
from core.schema import signal_mutation_module_validate
from core.services import wait_for_mutation
from core.utils import filter_validity
from django.db.models import Q
from django.core.exceptions import PermissionDenied
from django.dispatch import Signal
from graphene_django.filter import DjangoFilterConnectionField
import graphene_django_optimizer as gql_optimizer
from location.models import Location, LocationManager

from insuree.apps import InsureeConfig
from insuree.services import validate_insuree_number
from .models import FamilyMutation, InsureeMutation
from django.utils.translation import gettext as _
from location.apps import LocationConfig
from core.schema import OrderedDjangoFilterConnectionField, OfficerGQLType
from core.gql_queries import ValidationMessageGQLType
from policy.models import Policy
from core.models import Officer, Role, UserRole
from location.models import UserDistrict
import os
import uuid
import requests
from datetime import datetime, timezone
# We do need all queries and mutations in the namespace here.
from .gql_queries import *  # lgtm [py/polluting-import]
from .gql_mutations import *  # lgtm [py/polluting-import]
from .signals import signal_before_insuree_policy_query, _read_signal_results, \
    signal_before_family_query, signal_before_insuree_search_query


def family_fk(arg):
    return arg.startswith("members_") or arg.startswith("head_insuree_")


class FamiliesConnectionField(OrderedDjangoFilterConnectionField):
    @classmethod
    def resolve_queryset(
            cls, connection, iterable, info, args, filtering_args, filterset_class
    ):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        qs = super(FamiliesConnectionField, cls).resolve_queryset(
            connection, iterable, info,
            {k: args[k] for k in args.keys() if not k.startswith(
                "members_") and not k.startswith("head_insuree_")},
            filtering_args,
            filterset_class
        )
        head_insuree_filters = {
            k: args[k] for k in args.keys() if k.startswith("head_insuree__")}
        members_filters = {k: args[k]
                           for k in args.keys() if k.startswith("members__")}
        if len(head_insuree_filters) or len(members_filters):
            qs = qs._next_is_sticky()
        if len(head_insuree_filters):
            qs = qs.filter(
                Q(head_insuree__validity_to__isnull=True), **head_insuree_filters)
        if len(members_filters):
            qs = qs.filter(Q(members__validity_to__isnull=True),
                           **members_filters)
        return OrderedDjangoFilterConnectionField.orderBy(qs, args)


class Query(ExportableQueryMixin, graphene.ObjectType):
    exportable_fields = ['insurees']

    sync_search = graphene.Field(CRVSQueryResult, identifier_value=graphene.String())
    social_registry_search = graphene.Field(
        SocialRegistryQueryResult,
        identifier_value=graphene.String()
    )

    # --- Move these to the top of your file ---

    # ------------------------------------------

    import uuid
    import requests
    from datetime import datetime, timezone

    def resolve_social_registry_search(self, info, identifier_value):
        # ── 1. Set Correct Endpoint ───────────────────────────────────────────────
        url = "https://partner-nsr.play.openg2p.org/dci/registry/sync/search"
        headers = {
            "accept": "application/json",
            "Content-Type": "application/json",
        }

        current_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # ── 2. Construct Payload (with Strict Swagger $ref Validation) ────────────
        payload = {
            "signature": "Signature-not-impl",
            "header": {
                "version": "1.0.0",
                "message_id": str(uuid.uuid4()),
                "message_ts": current_time,
                "action": "search",
                "sender_id": "spmis.example.org",
                "sender_uri": "https://spmis.example.org/consumer-namespace/callback/on-search",
                "receiver_id": "farmer.example.org",
                "total_count": 0,
                "is_msg_encrypted": False,
                "meta": {},
            },
            "message": {
                "transaction_id": str(uuid.uuid4()),
                "search_request": [
                    {
                        "reference_id": str(uuid.uuid4()),
                        "timestamp": current_time,
                        "search_criteria": {
                            "version": "1.0.0",
                            "reg_type": "Individual",
                            "reg_record_type": "Individual",
                            "query_type": "expression",
                            "query": {
                                "type": "ns:org:QueryType:expression",
                                "value": {
                                    "expression": {
                                        "query": {
                                            "search_text": {
                                                "$eq": identifier_value
                                            }
                                        }
                                    }
                                },
                            },
                            "pagination": {"page_size": 100, "page_number": 1},
                            "consent": {
                                "@context": "https://schema.spdci.org/common/v1/api-schemas/Consent.jsonld",
                                "@type": "Consent",
                                "ts": {
                                    "$ref": "#/components/schemas/MsgHeader_V1.0.0/properties/message_ts"
                                },
                                "purpose": {
                                    "text": {"type": "string"},
                                    "code": {"type": "string", "description": "From a fixed set, documented at refUri"},
                                    "ref_uri": {"type": "string", "format": "uri", "description": "Uri to provide more info on consent codes"},
                                },
                            },
                            "authorize": {
                                "@context": "https://schema.spdci.org/common/v1/api-schemas/Authorize.jsonld",
                                "@type": "Authorize",
                                "ts": {
                                    "$ref": "#/components/schemas/MsgHeader_V1.0.0/properties/message_ts"
                                },
                                "purpose": {
                                    "text": {"type": "string"},
                                    "code": {"type": "string", "description": "From a fixed set, documented at refUri"},
                                    "ref_uri": {"type": "string", "format": "uri", "description": "Uri to provide more info on authorize codes"},
                                },
                            },
                        },
                        "locale": "eng",
                    }
                ],
            },
        }

        # ── 3. Execute Request ────────────────────────────────────────────────────
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            print(f"[SocialRegistry] Status: {response.status_code} | Body: {response.text}")
            
            if not response.ok:
                print(f"[SocialRegistry] API Error {response.status_code}: {response.text}")
                return None
                
            data = response.json()
            
        except Exception as e:
            print(f"[SocialRegistry] Request failed: {e}")
            return None

        # ── 4. Parse Flat Data into Graphene Schema ───────────────────────────────
        msg = data.get("message", {})
        results = []

        for res in msg.get("search_response", []):
            data_block = res.get("data", {})
            records = []

            for rec in data_block.get("reg_records", []):

                # -- Personal Details ----------------------------------------------
                pd = rec  # Data is flat on the root record in the API
                demo = pd.get("demographic_info", {})
                raw_name = demo.get("name", {})

                # Safely handle email list-to-string conversion for Graphene
                raw_email = demo.get("email", [])
                email_val = raw_email[0] if isinstance(raw_email, list) and len(raw_email) > 0 else raw_email if isinstance(raw_email, str) else None

                # Safely cast integer 0/1 to boolean for Graphene
                raw_disability = pd.get("self_id_disability")
                disability_val = bool(raw_disability) if raw_disability is not None else None

                personal = SRPersonalDetailsType(
                    member_identifier=[
                        SRIdentifierType(
                            identifier_type=i.get("identifier_type"),
                            identifier_value=i.get("identifier_value"),
                        )
                        for i in pd.get("member_identifier", [])
                    ],
                    demographic_info=SRDemographicInfoType(
                        name=SRNameType(
                            given_name=raw_name.get("given_name"),
                            second_name=raw_name.get("second_name"),
                            surname=raw_name.get("surname"),
                            prefix=raw_name.get("prefix"),
                            suffix=raw_name.get("suffix"),
                        ),
                        sex=demo.get("sex"),
                        birth_date=demo.get("birth_date"),
                        phone_number=demo.get("phone_number", []),
                        email=email_val,
                        registration_date=demo.get("registration_date"),
                        last_updated=demo.get("last_updated"),
                    ),
                    self_id_disability=disability_val,
                    marital_status=pd.get("marital_status"),
                    language_code=pd.get("language_code", []),
                    education_level=pd.get("education_level"),
                    registration_date=pd.get("registration_date"),
                    last_updated=pd.get("last_updated"),
                )

                # -- Household Details ---------------------------------------------
                hh = rec.get("family_details", {}) or rec.get("household_details", {})
                hh_place = hh.get("place", {})
                hh_geo   = hh_place.get("geo", {})

                # Extract household ID from additional_attributes array
                additional_attrs = rec.get("additional_attributes", [{}])
                hh_id = additional_attrs[0].get("household_identifier") if additional_attrs else None
                
                group_identifiers = [
                    SRIdentifierType(
                        identifier_type=i.get("identifier_type"),
                        identifier_value=i.get("identifier_value"),
                    ) for i in hh.get("group_identifier", [])
                ]
                
                if hh_id and not group_identifiers:
                    group_identifiers.append(SRIdentifierType(identifier_type="HouseholdID", identifier_value=hh_id))

                members = []
                for m in hh.get("member_list", []):
                    m_demo = m.get("demographic_info", {})
                    m_name = m_demo.get("name", {})
                    
                    m_raw_disability = m.get("self_id_disability")
                    m_disability_val = bool(m_raw_disability) if m_raw_disability is not None else None

                    members.append(SRHouseholdMemberType(
                        member_identifier=[
                            SRIdentifierType(
                                identifier_type=i.get("identifier_type"),
                                identifier_value=i.get("identifier_value"),
                            )
                            for i in m.get("member_identifier", [])
                        ],
                        demographic_info=SRDemographicInfoType(
                            name=SRNameType(
                                given_name=m_name.get("given_name"),
                                second_name=m_name.get("second_name"),
                                surname=m_name.get("surname"),
                                prefix=m_name.get("prefix"),
                            ),
                            sex=m_demo.get("sex"),
                            birth_date=m_demo.get("birth_date"),
                            registration_date=m_demo.get("registration_date"),
                            last_updated=m_demo.get("last_updated"),
                        ),
                        self_id_disability=m_disability_val,
                        marital_status=m.get("marital_status"),
                        registration_date=m.get("registration_date"),
                        last_updated=m.get("last_updated"),
                    ))

                household = SRHouseholdDetailsType(
                    group_identifier=group_identifiers,
                    group_type=hh.get("group_type"),
                    place=SRPlaceType(
                        name=hh_place.get("name"),
                        geo=SRGeoLocationType(
                            latitude=hh_geo.get("latitude"),
                            longitude=hh_geo.get("longitude"),
                        ) if hh_geo else None,
                    ) if hh_place else None,
                    poverty_score=hh.get("poverty_score"),
                    poverty_score_type=hh.get("poverty_score_type"),
                    group_size=hh.get("group_size"),
                    member_list=members,
                    registration_date=hh.get("registration_date"),
                    last_updated=hh.get("last_updated"),
                )

                # -- Economic Details ----------------------------------------------
                # Fallback to the flat root record to find things like 'income_level'
                eco = rec.get("economic_details", rec)
                
                economic = SREconomicDetailsType(
                    income_level=eco.get("income_level"),
                    income_source=eco.get("income_source", []),
                    asset_ownership=eco.get("asset_ownership", []),
                    housing_type=eco.get("housing_type"),
                    has_electricity=eco.get("has_electricity"),
                    has_clean_water=eco.get("has_clean_water"),
                    registration_date=eco.get("registration_date"),
                    last_updated=eco.get("last_updated"),
                )

                # -- Benefits ------------------------------------------------------
                benefits = [
                    SRBenefitType(
                        program_name=b.get("program_name"),
                        program_code=b.get("program_code"),
                        benefit_type=b.get("benefit_type"),
                        enrollment_date=b.get("enrollment_date"),
                        expiry_date=b.get("expiry_date"),
                        status=b.get("status"),
                        amount=b.get("amount"),
                        currency=b.get("currency"),
                    )
                    for b in rec.get("benefits", [])
                ]

                records.append(SRIndividualRecordType(
                    personal_details=personal,
                    household_details=household,
                    economic_details=economic,
                    benefits=benefits,
                    registration_date=rec.get("registration_date"),
                    last_updated=rec.get("last_updated"),
                ))

            pag = res.get("pagination", {})
            results.append(SRSearchResponseType(
                reference_id=res.get("reference_id"),
                status=res.get("status"),
                status_reason_code=res.get("status_reason_code"),
                status_reason_message=res.get("status_reason_message"),
                reg_records=records,
                pagination=SRPaginationType(
                    page_size=pag.get("page_size"),
                    page_number=pag.get("page_number"),
                    total_count=pag.get("total_count"),
                ),
                locale=res.get("locale"),
            ))

        return SocialRegistryQueryResult(
            transaction_id=msg.get("transaction_id"),
            correlation_id=msg.get("correlation_id"),
            search_response=results,
        )

    def resolve_sync_search(self, info, identifier_value):
        import uuid, requests
        from datetime import datetime, timezone

        url = "https://partner-registry.play.openg2p.org/dci/registry/sync/search"
        headers = {"accept": "application/json", "Content-Type": "application/json"}

        current_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S") + "Z"
        payload = {
            "signature": "signature",
            "header": {
                "version": "1.0.0", "message_id": str(uuid.uuid4()),
                "message_ts": current_time, "action": "search",
                "sender_id": "spmis.example.org",
                "sender_uri": "https://spmis.example.org/consumer-namespace/callback/on-search",
                "receiver_id": "farmer.example.org",
                "total_count": 0, "is_msg_encrypted": False, "meta": {}
            },
            "message": {
                "transaction_id": str(uuid.uuid4()),
                "search_request": [{
                    "reference_id": str(uuid.uuid4()),
                    "timestamp": current_time,
                    "search_criteria": {
                        "version": "1.0.0", "reg_type": "Farmer",
                        "reg_record_type": "Farmer", "query_type": "expression",
                        "query": {
                            "type": "ns:org:QueryType:expression",
                            "value": {"expression": {"query": {"search_text": {"$eq": identifier_value}}}}
                        },
                        "pagination": {"page_size": 100, "page_number": 1},
                        "consent": {
                            "@context": "https://schema.spdci.org/common/v1/api-schemas/Consent.jsonld",
                            "@type": "Consent",
                            "ts": {"$ref": "#/components/schemas/MsgHeader_V1.0.0/properties/message_ts"},
                            "purpose": {"text": {"type": "string"}, "code": {"type": "string"}, "ref_uri": {"type": "string", "format": "uri"}}
                        },
                        "authorize": {
                            "@context": "https://schema.spdci.org/common/v1/api-schemas/Authorize.jsonld",
                            "@type": "Authorize",
                            "ts": {"$ref": "#/components/schemas/MsgHeader_V1.0.0/properties/message_ts"},
                            "purpose": {"text": {"type": "string"}, "code": {"type": "string"}, "ref_uri": {"type": "string", "format": "uri"}}
                        }
                    },
                    "locale": "eng"
                }]
            }
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            print(f"Status: {response.status_code} | Body: {response.text}")
            if not response.ok:
                print(f"API Error {response.status_code}: {response.text}")
                return None
            data = response.json()
        except Exception as e:
            print(f"Request failed: {e}")
            return None

        msg = data.get("message", {})
        results = []

        for res in msg.get("search_response", []):
            data_block = res.get("data", {})
            records = []

            for rec in data_block.get("reg_records", []):

                # --- Personal Details ---
                pd = rec.get("farmer_personal_details", {})  # fixed key
                demo = pd.get("demographic_info", {})
                raw_name = demo.get("name", {})

                personal = FarmerPersonalDetailsType(
                    member_identifier=[
                        IdentifierType(
                            identifier_type=i.get("identifier_type"),
                            identifier_value=i.get("identifier_value")
                        ) for i in pd.get("member_identifier", [])
                    ],
                    demographic_info=DemographicInfoType(
                        name=NameType(
                            given_name=raw_name.get("given_name"),
                            second_name=raw_name.get("second_name"),
                            surname=raw_name.get("surname"),
                            prefix=raw_name.get("prefix"),
                            suffix=raw_name.get("suffix"),
                        ),
                        sex=demo.get("sex"),
                        birth_date=demo.get("birth_date"),
                        phone_number=demo.get("phone_number", []),
                        registration_date=demo.get("registration_date"),
                        last_updated=demo.get("last_updated"),
                    ),
                    self_id_disability=pd.get("self_id_disability"),
                    marital_status=pd.get("marital_status"),
                    language_code=pd.get("language_code", []),
                    education_level=pd.get("education_level"),
                    registration_date=pd.get("registration_date"),
                    last_updated=pd.get("last_updated"),
                )

                # --- Family Details ---
                fam = rec.get("family_details", {})
                fam_place = fam.get("place", {})
                fam_geo = fam_place.get("geo", {})

                members = []
                for m in fam.get("member_list", []):
                    m_demo = m.get("demographic_info", {})
                    m_name = m_demo.get("name", {})
                    members.append(FamilyMemberType(
                        member_identifier=[
                            IdentifierType(identifier_type=i.get("identifier_type"), identifier_value=i.get("identifier_value"))
                            for i in m.get("member_identifier", [])
                        ],
                        demographic_info=DemographicInfoType(
                            name=NameType(
                                given_name=m_name.get("given_name"),
                                second_name=m_name.get("second_name"),
                                surname=m_name.get("surname"),
                                prefix=m_name.get("prefix"),
                            ),
                            sex=m_demo.get("sex"),
                            birth_date=m_demo.get("birth_date"),
                            registration_date=m_demo.get("registration_date"),
                            last_updated=m_demo.get("last_updated"),
                        ),
                        self_id_disability=m.get("self_id_disability"),
                        marital_status=m.get("marital_status"),
                        registration_date=m.get("registration_date"),
                        last_updated=m.get("last_updated"),
                    ))

                family = FamilyDetailsType(
                    group_identifier=[
                        IdentifierType(identifier_type=i.get("identifier_type"), identifier_value=i.get("identifier_value"))
                        for i in fam.get("group_identifier", [])
                    ],
                    group_type=fam.get("group_type"),
                    place=PlaceType(
                        name=fam_place.get("name"),
                        geo=GeoLocationType(latitude=fam_geo.get("latitude"), longitude=fam_geo.get("longitude"))
                    ),
                    poverty_score=fam.get("poverty_score"),
                    poverty_score_type=fam.get("poverty_score_type"),
                    group_size=fam.get("group_size"),
                    member_list=members,
                    registration_date=fam.get("registration_date"),
                    last_updated=fam.get("last_updated"),
                )

                # --- Farm Details ---
                farms = []
                for f in rec.get("farm_details", []):
                    f_place = f.get("place", {})
                    f_geo = f_place.get("geo", {})
                    activities = []
                    for act in f.get("farming_activities", []):
                        crops = [
                            CropProductionType(
                                crop_type=c.get("crop_type"),
                                variety=c.get("variety"),
                                season=c.get("season"),
                                irrigation=c.get("irrigation"),
                                irrigation_water=c.get("irrigation_water", []),
                                end_use=c.get("end_use", []),
                            ) for c in act.get("crop_production", [])
                        ]
                        animals = [
                            AnimalProductionType(
                                type=a.get("type"),
                                count=a.get("count"),
                                livestock_system=a.get("livestock_system"),
                            ) for a in act.get("animal_production", [])
                        ]
                        activities.append(FarmingActivityType(
                            crop_production=crops,
                            animal_production=animals,
                            mixed_farming=act.get("mixed_farming"),
                            agri_support_activities=act.get("agri_support_activities", []),
                        ))
                    farms.append(FarmDetailsType(
                        farm_type=f.get("farm_type"),
                        place=PlaceType(
                            name=f_place.get("name"),
                            geo=GeoLocationType(latitude=f_geo.get("latitude"), longitude=f_geo.get("longitude"))
                        ),
                        land_tenure=f.get("land_tenure"),
                        land_size=f.get("land_size"),
                        measurement=f.get("measurement"),
                        farming_activities=activities,
                        registration_date=f.get("registration_date"),
                        last_updated=f.get("last_updated"),
                    ))

                records.append(FarmerRecordType(
                    farmer_personal_details=personal,
                    family_details=family,
                    farm_details=farms,
                    registration_date=rec.get("registration_date"),
                    last_updated=rec.get("last_updated"),
                ))

            pag = res.get("pagination", {})
            results.append(SearchResponseType(
                reference_id=res.get("reference_id"),
                status=res.get("status"),
                status_reason_code=res.get("status_reason_code"),
                status_reason_message=res.get("status_reason_message"),
                reg_records=records,
                pagination=PaginationType(
                    page_size=pag.get("page_size"),
                    page_number=pag.get("page_number"),
                    total_count=pag.get("total_count"),
                ),
                locale=res.get("locale"),
            ))

        return CRVSQueryResult(
            transaction_id=msg.get("transaction_id"),
            correlation_id=msg.get("correlation_id"),
            search_response=results,
        )
    can_add_insuree = graphene.Field(
        graphene.List(graphene.String),
        family_id=graphene.Int(required=True),
        description="Checks that the specified family id is allowed to add more insurees (like a Policy limitation)"
    )
    insuree_genders = graphene.List(GenderGQLType)
    insurees = OrderedDjangoFilterConnectionField(
        InsureeGQLType,
        show_history=graphene.Boolean(),
        parent_location=graphene.String(),
        parent_location_level=graphene.Int(),
        client_mutation_id=graphene.String(),
        ignore_location=graphene.Boolean(),
        orderBy=graphene.List(of_type=graphene.String),
        additional_filters=graphene.JSONString()
    )
    identification_types = graphene.List(IdentificationTypeGQLType)
    educations = graphene.List(EducationGQLType)
    professions = graphene.List(ProfessionGQLType)
    family_types = graphene.List(FamilyTypeGQLType)
    confirmation_types = graphene.List(ConfirmationTypeGQLType)
    relations = graphene.List(RelationGQLType)
    insuree_status_reasons = DjangoFilterConnectionField(
        InsureeStatusReasonGQLType,
        str=graphene.String()
    )
    families = FamiliesConnectionField(
        FamilyGQLType,
        null_as_false_poverty=graphene.Boolean(),
        show_history=graphene.Boolean(),
        parent_location=graphene.String(),
        parent_location_level=graphene.Int(),
        client_mutation_id=graphene.String(),
        orderBy=graphene.List(of_type=graphene.String),
        additional_filter=graphene.JSONString(),
        officer=graphene.String()
    )
    family_members = OrderedDjangoFilterConnectionField(
        InsureeGQLType,
        family_uuid=graphene.String(required=True),
        orderBy=graphene.List(of_type=graphene.String),
    )
    insuree_officers = DjangoFilterConnectionField(
        OfficerGQLType,
        location_id=graphene.String()
    )
    insuree_policy = OrderedDjangoFilterConnectionField(
        InsureePolicyGQLType,
        parent_location=graphene.String(),
        parent_location_level=graphene.Int(),
        orderBy=graphene.List(of_type=graphene.String),
        additional_filter=graphene.JSONString(),
    )
    insuree_number_validity = graphene.Field(
        ValidationMessageGQLType,
        insuree_number=graphene.String(required=True),
        description="Checks that the specified insuree number is valid"
    )

    def resolve_insuree_number_validity(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insurees_perms):
            raise PermissionDenied(_("unauthorized"))
        errors = validate_insuree_number(kwargs['insuree_number'])
        if errors:
            return ValidationMessageGQLType(False, errors[0]['errorCode'], errors[0]['message'])
        else:
            return ValidationMessageGQLType(True, 0, "")

    def resolve_can_add_insuree(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_perms):
            raise PermissionDenied(_("unauthorized"))
        family = Family.objects.get(id=kwargs.get('family_id'))
        warnings = []
        policies = family.policies\
            .filter(validity_to__isnull=True)\
            .exclude(status__in=[Policy.STATUS_EXPIRED, Policy.STATUS_SUSPENDED])
        for policy in policies:
            if not policy.can_add_insuree():
                warnings.append(
                    _("insuree.validation.policy_above_max_members")
                    % {
                        "product_code": policy.product.code,
                        "start_date": policy.start_date,
                        "max": policy.product.max_members,
                        "count": family.members.filter(
                            validity_to__isnull=True
                        ).count(),
                    }
                )
        return warnings

    def resolve_insuree_genders(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_perms):
            raise PermissionDenied(_("unauthorized"))
        return Gender.objects.order_by('sort_order').all()

    def resolve_insurees(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insurees_perms):
            raise PermissionDenied(_("unauthorized"))
        filters = []
        additional_filter = kwargs.get('additional_filters', None)
        chf_id = kwargs.get('chf_id')
        
        if chf_id is not None:
            errors = validate_insuree_number(chf_id)
            if errors:
                return ValidationMessageGQLType(False, errors[0]['errorCode'], errors[0]['message'])
            filters.append(Q(chf_id=chf_id))
        if additional_filter:
            filters_from_signal = _insuree_insuree_additional_filters(
                sender=self, additional_filter=additional_filter, user=info.context.user
            )
            filters.extend(filters_from_signal)
        show_history = kwargs.get('show_history', False)
        if not show_history and not kwargs.get('uuid', None):
            filters += filter_validity(**kwargs)
        client_mutation_id = kwargs.get("client_mutation_id", None)
        if client_mutation_id:
            wait_for_mutation(client_mutation_id)
            filters.append(
                Q(mutations__mutation__client_mutation_id=client_mutation_id))
        parent_location = kwargs.get('parent_location')
        if parent_location is not None:
            parent_location_level = kwargs.get('parent_location_level')
            if parent_location_level is None:
                raise ValueError(
                    "Missing parentLocationLevel argument when filtering on parentLocation")
            f = "uuid"
            for i in range(len(LocationConfig.location_types) - parent_location_level - 1):
                f = "parent__" + f
            current_village = "current_village__" + f
            family_location = "family__location__" + f
            filters += [(Q(current_village__isnull=False) & Q(**{current_village: parent_location})) |
                        (Q(current_village__isnull=True) & Q(**{family_location: parent_location}))]

        if not info.context.user._u.is_imis_admin and (kwargs.get('ignore_location') == False or kwargs.get('ignore_location') is None) and not LocationConfig.no_location_check:
            # Limit the list by the logged in user location mapping
            filters += [Q(LocationManager().build_user_location_filter_query(info.context.user._u, prefix='current_village__parent__parent', loc_types=['D']) |
                        LocationManager().build_user_location_filter_query(info.context.user._u, prefix='family__location__parent__parent', loc_types=['D']))]

        return gql_optimizer.query(Insuree.objects.filter(*filters).all(), info)

    def resolve_family_members(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_family_members):
            raise PermissionDenied(_("unauthorized"))
        family = Family.objects.get(Q(uuid=(kwargs.get('family_uuid'))))
        return Insuree.objects.filter(
            Q(family=family),
            *filter_validity(**kwargs)
        ).order_by('-head', 'dob')

    def resolve_educations(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        return Education.objects.order_by('sort_order').all()

    def resolve_professions(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        return Profession.objects.order_by('sort_order').all()

    def resolve_identification_types(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        return IdentificationType.objects.order_by('sort_order').all()

    def resolve_confirmation_types(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        return ConfirmationType.objects.order_by('sort_order').all()

    def resolve_relations(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        return Relation.objects.order_by('sort_order').all()

    def resolve_family_types(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))
        return FamilyType.objects.order_by('sort_order').all()

    def resolve_families(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_families_perms):
            raise PermissionDenied(_("unauthorized"))

        filters = []
        additional_filter = kwargs.get('additional_filter', None)
        if additional_filter:
            filters_from_signal = _family_additional_filters(
                sender=self, additional_filter=additional_filter, user=info.context.user
            )
            filters.extend(filters_from_signal)

        officer = kwargs.get('officer', None)
        if officer:
            officer_policies_families = Policy.objects.filter(
                officer__uuid=(officer)).values_list('family', flat=True)
            filters.append(Q(id__in=officer_policies_families))

        null_as_false_poverty = kwargs.get('null_as_false_poverty')
        if null_as_false_poverty is not None:
            filters += [Q(poverty=True)] if null_as_false_poverty else [
                Q(poverty=False) | Q(poverty__isnull=True)]
        show_history = kwargs.get('show_history', False)
        if not show_history:
            filters += filter_validity(**kwargs)
        client_mutation_id = kwargs.get("client_mutation_id", None)
        if client_mutation_id:
            wait_for_mutation(client_mutation_id)
            filters.append(
                Q(mutations__mutation__client_mutation_id=client_mutation_id))
        parent_location = kwargs.get('parent_location')
        if parent_location is not None:
            parent_location_level = kwargs.get('parent_location_level')
            if parent_location_level is None:
                raise NotImplementedError(
                    "Missing parentLocationLevel argument when filtering on parentLocation")
            f = "uuid"
            for i in range(len(LocationConfig.location_types) - parent_location_level - 1):
                f = "parent__" + f
            f = "location__" + f
            filters += [Q(**{f: parent_location})]

        # Limit the list by the logged in user location mapping
        if not info.context.user._u.is_imis_admin and not LocationConfig.no_location_check:
            filters += [LocationManager().build_user_location_filter_query(info.context.user._u,
                                                                           prefix='location__parent__parent', loc_types=['D'])]

        # Duplicates cannot be removed with distinct, as TEXT field is not comparable
        ids = Family.objects.filter(*filters).values_list('id')
        dinstinct_queryset = Family.objects.filter(id__in=ids)
        return gql_optimizer.query(dinstinct_queryset.all(), info)

    def resolve_insuree_officers(self, info, location_id=None, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_officers_perms):
            raise PermissionDenied(_("unauthorized"))
        
        if InsureeConfig.use_contextual_enrolment_officer_selection:
            return _get_contextual_insuree_officers(info, location_id=location_id, **kwargs)

    def resolve_insuree_policy(self, info, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_policy_perms):
            raise PermissionDenied(_("unauthorized"))
        filters = []
        additional_filter = kwargs.get('additional_filter', None)
        # go to process additional filter only when this arg of filter was passed into query
        if additional_filter:
            filters_from_signal = _insuree_additional_filters(
                sender=self, additional_filter=additional_filter, user=info.context.user
            )
            # check if there is filter from signal (perms will be checked in the signals)
            if len(filters_from_signal) == 0:
                raise PermissionDenied(_("unauthorized"))
            filters.extend(filters_from_signal)
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_policy_perms):
            raise PermissionDenied(_("unauthorized"))
        parent_location = kwargs.get('parent_location')
        if parent_location is not None:
            parent_location_level = kwargs.get('parent_location_level')
            if parent_location_level is None:
                raise NotImplementedError(
                    "Missing parentLocationLevel argument when filtering on parentLocation")
            f = "uuid"
            for i in range(len(LocationConfig.location_types) - parent_location_level - 1):
                f = "parent__" + f
            current_village = "insuree__current_village__" + f
            family_location = "insuree__family__location__" + f
            filters += [(Q(insuree__current_village__isnull=False) & Q(**{current_village: parent_location})) |
                        (Q(insuree__current_village__isnull=True) & Q(**{family_location: parent_location}))]
        return gql_optimizer.query(InsureePolicy.objects.filter(*filters).all(), info)


class Mutation(graphene.ObjectType):
    create_family = CreateFamilyMutation.Field()
    update_family = UpdateFamilyMutation.Field()
    delete_families = DeleteFamiliesMutation.Field()
    create_insuree = CreateInsureeMutation.Field()
    update_insuree = UpdateInsureeMutation.Field()
    delete_insurees = DeleteInsureesMutation.Field()
    remove_insurees = RemoveInsureesMutation.Field()
    set_family_head = SetFamilyHeadMutation.Field()
    change_insuree_family = ChangeInsureeFamilyMutation.Field()


def on_family_mutation(kwargs, k='uuid'):
    family_uuid = kwargs['data'].get('uuid', None)
    if not family_uuid:
        return []
    impacted_family = Family.objects.filter(Q(uuid=(family_uuid))).first()
    if impacted_family is None:
        return []
    FamilyMutation.objects.create(
        family=impacted_family, mutation_id=kwargs['mutation_log_id'])
    return []


def on_families_mutation(kwargs):
    uuids = kwargs['data'].get('uuids', [])
    if not uuids:
        uuid = kwargs['data'].get('uuid', None)
        uuids = [uuid] if uuid else []
    if not uuids:
        return []
    impacted_families = Family.objects.filter(uuid__in=uuids).all()
    for family in impacted_families:
        FamilyMutation.objects.create(
            family=family, mutation_id=kwargs['mutation_log_id'])
    return []


def on_insuree_mutation(kwargs, k='uuid'):
    insuree_uuid = kwargs['data'].get('uuid', None)
    if not insuree_uuid:
        return []
    impacted_insuree = Insuree.objects.filter(Q(uuid=(insuree_uuid))).first()
    if impacted_insuree is None:
        return []
    InsureeMutation.objects.create(
        insuree=impacted_insuree, mutation_id=kwargs['mutation_log_id'])
    return []


def on_insurees_mutation(kwargs):
    uuids = kwargs['data'].get('uuids', [])
    if not uuids:
        uuid = kwargs['data'].get('uuid', None)
        uuids = [uuid] if uuid else []
    if not uuids:
        return []
    impacted_insurees = Insuree.objects.filter(uuid__in=uuids).all()
    for insuree in impacted_insurees:
        InsureeMutation.objects.create(
            insuree=insuree, mutation_id=kwargs['mutation_log_id'])
    return []


def on_family_and_insurees_mutation(kwargs):
    family = on_family_mutation(kwargs)
    insurees = on_insurees_mutation(kwargs)
    return family + insurees


def on_family_and_insuree_mutation(kwargs):
    family = on_family_mutation(kwargs, 'family_uuid')
    insuree = on_insuree_mutation(kwargs, 'insuree_uuid')
    return family + insuree


def on_mutation(sender, **kwargs):
    return {
        CreateFamilyMutation._mutation_class: on_family_mutation,
        UpdateFamilyMutation._mutation_class: on_family_mutation,
        DeleteFamiliesMutation._mutation_class: on_families_mutation,
        CreateInsureeMutation._mutation_class: on_insurees_mutation,
        UpdateInsureeMutation._mutation_class: on_insurees_mutation,
        DeleteInsureesMutation._mutation_class: on_family_and_insurees_mutation,
        RemoveInsureesMutation._mutation_class: on_family_and_insurees_mutation,
        SetFamilyHeadMutation._mutation_class: on_family_mutation,
        ChangeInsureeFamilyMutation._mutation_class: on_family_and_insuree_mutation,
    }.get(sender._mutation_class, lambda x: [])(kwargs)


def bind_signals():
    signal_mutation_module_validate["insuree"].connect(on_mutation)


def _insuree_additional_filters(sender, additional_filter, user):
    return _get_additional_filter(sender or Insuree, additional_filter, user, signal_before_insuree_policy_query)


def _insuree_insuree_additional_filters(sender, additional_filter, user):
    return _get_additional_filter(sender or InsureePolicy, additional_filter, user, signal_before_insuree_search_query)


def _family_additional_filters(sender, additional_filter, user):
    return _get_additional_filter(sender or Family, additional_filter, user, signal_before_family_query)


def _get_additional_filter(sender, additional_filter, user, signal: Signal):
    # function to retrieve additional filters from signal
    filters_from_signal = []

    if sender is None:
        raise Exception("Missing sender")

    if additional_filter:
        # send signal to append additional filter
        results_signal = signal.send(
            sender=sender, additional_filter=additional_filter, user=user,
        )
        filters_from_signal = _read_signal_results(results_signal)
    return filters_from_signal

def _get_contextual_insuree_officers(info, location_id=None, **kwargs):
        if not info.context.user.has_perms(InsureeConfig.gql_query_insuree_officers_perms):
            raise PermissionDenied(_("unauthorized"))

        user = info.context.user
        i_user = getattr(user, '_u', None)
        
        if i_user:
            user_roles = UserRole.objects.filter(user_id=i_user.id, validity_to__isnull=True)
            roles = list(
                Role.objects.filter(
                    id__in=user_roles.values_list("role_id", flat=True),
                    validity_to__isnull=True
                ).values_list("name", flat=True)
            )
            # If the user is an Enrolment Officer (EO)
            if "Enrolment Officer" in roles:
                return Officer.objects.filter(id=user.officer.id, validity_to__isnull=True)
            
            # Non-EO user
            if location_id:
                officers = Officer.objects.filter(officer_villages__location__id=location_id, validity_to__isnull=True)

                if officers.exists():
                    return officers

        # No officers found → return all valid EOs
        return Officer.objects.filter(validity_to__isnull=True)
    
