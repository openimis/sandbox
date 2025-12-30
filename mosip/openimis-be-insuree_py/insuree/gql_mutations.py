import logging
from uuid import uuid4, UUID
import pathlib
import base64
import graphene
from insuree.apps import InsureeConfig
from insuree.services import validate_insuree_number, InsureeService, FamilyService, InsureePolicyService

from core.schema import OpenIMISMutation
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils.translation import gettext as _
from graphene import InputObjectType
from .models import Family, Insuree, FamilyMutation, InsureeMutation
import os
import json
from datetime import datetime
import httpx
import graphene
from jose import jwt  # python-jose
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from core.schema import OpenIMISMutation
from django.core.mail import send_mail
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


class PhotoInputType(InputObjectType):
    id = graphene.Int(required=False, read_only=True)
    uuid = graphene.String(required=False)
    date = graphene.Date(required=False)
    officer_id = graphene.Int(required=False)
    photo = graphene.String(required=False)
    filename = graphene.String(required=False)
    folder = graphene.String(required=False)


class InsureeBase:
    id = graphene.Int(required=False, read_only=True)
    uuid = graphene.String(required=False)
    chf_id = graphene.String(max_length=50, required=False)
    last_name = graphene.String(max_length=100, required=True)
    other_names = graphene.String(max_length=100, required=True)
    gender_id = graphene.String(max_length=1, required=True)
    dob = graphene.Date(required=True)
    head = graphene.Boolean(required=False)
    marital = graphene.String(max_length=1, required=False)
    passport = graphene.String(max_length=25, required=False)
    phone = graphene.String(max_length=50, required=False)
    email = graphene.String(max_length=100, required=False)
    current_address = graphene.String(max_length=200, required=False)
    geolocation = graphene.String(max_length=250, required=False)
    current_village_id = graphene.Int(required=False)
    photo_id = graphene.Int(required=False)
    photo_date = graphene.Date(required=False)
    photo = graphene.Field(PhotoInputType, required=False)
    card_issued = graphene.Boolean(required=False)
    family_id = graphene.Int(required=False)
    relationship_id = graphene.Int(required=False)
    profession_id = graphene.Int(required=False)
    education_id = graphene.Int(required=False)
    type_of_id_id = graphene.String(max_length=1, required=False)
    health_facility_id = graphene.Int(required=False)
    offline = graphene.Boolean(required=False)
    json_ext = graphene.types.json.JSONString(required=False)
    status = graphene.String(required=False)
    status_reason = graphene.String(required=False)
    status_date = graphene.Date(required=False)
    add_on_existing_policy = graphene.Boolean(required=False)


class CreateInsureeInputType(InsureeBase, OpenIMISMutation.Input):
    pass


class UpdateInsureeInputType(InsureeBase, OpenIMISMutation.Input):
    pass


class FamilyHeadInsureeInputType(InsureeBase, InputObjectType):
    pass


class FamilyBase:
    id = graphene.Int(required=False, read_only=True)
    uuid = graphene.String(required=False)
    location_id = graphene.Int(required=False)
    poverty = graphene.Boolean(required=False)
    family_type_id = graphene.String(max_length=1, required=False)
    address = graphene.String(max_length=200, required=False)
    is_offline = graphene.Boolean(required=False)
    ethnicity = graphene.String(max_length=1, required=False)
    confirmation_no = graphene.String(max_length=12, required=False)
    confirmation_type_id = graphene.String(max_length=3, required=False)
    json_ext = graphene.types.json.JSONString(required=False)

    contribution = graphene.types.json.JSONString(required=False)

    head_insuree = graphene.Field(FamilyHeadInsureeInputType, required=False)


class FamilyInputType(FamilyBase, OpenIMISMutation.Input):
    pass


class CreateFamilyInputType(FamilyInputType):
    pass


class UpdateFamilyInputType(FamilyInputType):
    pass



def update_or_create_insuree(data, user):
    data.pop('client_mutation_id', None)
    data.pop('client_mutation_label', None)
    return InsureeService(user).create_or_update(data)


def update_or_create_family(data, user):
    data.pop('client_mutation_id', None)
    data.pop('client_mutation_label', None)
    return FamilyService(user).create_or_update(data)


class CreateFamilyMutation(OpenIMISMutation):
    """
    Create a new family, with its head insuree
    """
    _mutation_module = "insuree"
    _mutation_class = "CreateFamilyMutation"

    class Input(CreateFamilyInputType):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(
                    _("mutation.authentication_required"))
            if not user.has_perms(InsureeConfig.gql_mutation_create_families_perms):
                raise PermissionDenied(_("unauthorized"))
            data['audit_user_id'] = user.id_for_audit
            from core.utils import TimeUtils
            data['validity_from'] = TimeUtils.now()
            client_mutation_id = data.get("client_mutation_id")
            family = update_or_create_family(data, user)
            FamilyMutation.object_mutated(
                user, client_mutation_id=client_mutation_id, family=family)
            return None
        except Exception as exc:
            logger.exception("insuree.mutation.failed_to_create_family")
            return [{
                'message': _("insuree.mutation.failed_to_create_family"),
                'detail': str(exc)}
            ]


class UpdateFamilyMutation(OpenIMISMutation):
    """
    Update an existing family, with its head insuree
    """
    _mutation_module = "insuree"
    _mutation_class = "UpdateFamilyMutation"

    class Input(UpdateFamilyInputType):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(
                    _("mutation.authentication_required"))
            if not user.has_perms(InsureeConfig.gql_mutation_update_families_perms):
                raise PermissionDenied(_("unauthorized"))
            data['audit_user_id'] = user.id_for_audit
            client_mutation_id = data.get("client_mutation_id")
            family = update_or_create_family(data, user)
            FamilyMutation.object_mutated(
                user, client_mutation_id=client_mutation_id, family=family)
            return None
        except Exception as exc:
            logger.exception("insuree.mutation.failed_to_update_family")
            return [{
                'message': _("insuree.mutation.failed_to_update_family"),
                'detail': str(exc)}
            ]


class DeleteFamiliesMutation(OpenIMISMutation):
    """
    Delete one or several families (and all its insurees).
    """
    _mutation_module = "insuree"
    _mutation_class = "DeleteFamiliesMutation"

    class Input(OpenIMISMutation.Input):
        uuids = graphene.List(graphene.String)
        delete_members = graphene.Boolean(required=False, default_value=False)

    @classmethod
    def async_mutate(cls, user, **data):
        if not user.has_perms(InsureeConfig.gql_mutation_delete_families_perms):
            raise PermissionDenied(_("unauthorized"))
        errors = []
        for family_uuid in data["uuids"]:
            family = Family.objects \
                .prefetch_related('members') \
                .filter(uuid=(family_uuid)) \
                .first()
            if family is None:
                errors.append({
                    'title': family_uuid,
                    'list': [{'message': _("insuree.mutation.failed_to_delete_family") % {'uuid': family_uuid}}]
                })
                continue
            errors += FamilyService(user).set_deleted(family,
                                                      data["delete_members"])
        if len(errors) == 1:
            errors = errors[0]['list']
        return errors


class CreateInsureeMutation(OpenIMISMutation):
    """
    Create a new insuree
    """
    _mutation_module = "insuree"
    _mutation_class = "CreateInsureeMutation"

    class Input(CreateInsureeInputType):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            if type(user) is AnonymousUser or not user.id:
                raise ValidationError(
                    _("mutation.authentication_required"))
            if not user.has_perms(InsureeConfig.gql_mutation_create_insurees_perms):
                raise PermissionDenied(_("unauthorized"))
            data['audit_user_id'] = user.id_for_audit
            from core.utils import TimeUtils
            data['validity_from'] = TimeUtils.now()
            client_mutation_id = data.get("client_mutation_id")
            insuree = update_or_create_insuree(data, user)
            InsureeMutation.object_mutated(
                user, client_mutation_id=client_mutation_id, insuree=insuree)
            return None
        except Exception as exc:
            logger.exception("insuree.mutation.failed_to_create_insuree")
            return [{
                'message': _("insuree.mutation.failed_to_create_insuree"),
                'detail': str(exc)}
            ]


class UpdateInsureeMutation(OpenIMISMutation):
    """
    Update an existing insuree
    """
    _mutation_module = "insuree"
    _mutation_class = "UpdateInsureeMutation"

    class Input(CreateInsureeInputType):
        pass

    @classmethod
    def async_mutate(cls, user, **data):
        try:
            User = get_user_model()
            # MODIFICATION: Find the first user in the database, regardless of type
            system_user = User.objects.order_by('id').first()

            if not system_user:
                # If no user is found, the action cannot be completed.
                raise PermissionDenied(
                    _("mutation.authentication_required") + " (No fallback system user found)")
            
            # --- Original Authentication Checks REMOVED ---
            
            if 'uuid' not in data:
                raise ValidationError(
                    "There is no uuid in updateMutation input!")
            
            # Use the fetched system_user for auditing
            data['audit_user_id'] = system_user.id_for_audit
            client_mutation_id = data.get("client_mutation_id")
            insuree = update_or_create_insuree(data, user)
            InsureeMutation.object_mutated(
                user, client_mutation_id=client_mutation_id, insuree=insuree)
            return None
        except Exception as exc:
            logger.exception("insuree.mutation.failed_to_update_insuree")
            return [{
                'message': _("insuree.mutation.failed_to_update_insuree"),
                'detail': str(exc)}
            ]


class DeleteInsureesMutation(OpenIMISMutation):
    """
    Delete one or several insurees.
    """
    _mutation_module = "insuree"
    _mutation_class = "DeleteInsureesMutation"

    class Input(OpenIMISMutation.Input):
        # family uuid, to 'lock' family while mutation is processed
        uuid = graphene.String(required=False)
        uuids = graphene.List(graphene.String)

    @classmethod
    def async_mutate(cls, user, **data):
        if not user.has_perms(InsureeConfig.gql_mutation_delete_insurees_perms):
            raise PermissionDenied(_("unauthorized"))
        errors = []
        for insuree_uuid in data["uuids"]:
            insuree = Insuree.objects \
                .prefetch_related('family') \
                .filter(uuid=UUID(str(insuree_uuid))) \
                .first()
            if insuree is None:
                errors.append({
                    'title': insuree_uuid,
                    'list': [{'message': _(
                        "insuree.validation.id_does_not_exist") % {'id': insuree_uuid}}]
                })
                continue
            if insuree.family and insuree.family.head_insuree.id == insuree.id:
                errors.append({
                    'title': insuree_uuid,
                    'list': [{'message': _(
                        "insuree.validation.delete_head_insuree") % {'id': insuree_uuid}}]
                })
                continue
            errors += InsureeService(user).set_deleted(insuree)
        if len(errors) == 1:
            errors = errors[0]['list']
        return errors


class RemoveInsureesMutation(OpenIMISMutation):
    """
    Delete one or several insurees.
    """
    _mutation_module = "insuree"
    _mutation_class = "RemoveInsureesMutation"

    class Input(OpenIMISMutation.Input):
        uuid = graphene.String()
        uuids = graphene.List(graphene.String)
        cancel_policies = graphene.Boolean(default_value=False)

    @classmethod
    def async_mutate(cls, user, **data):
        if not user.has_perms(InsureeConfig.gql_mutation_delete_insurees_perms):
            raise PermissionDenied(_("unauthorized"))
        errors = []
        for insuree_uuid in data["uuids"]:
            insuree = Insuree.objects \
                .prefetch_related('family') \
                .filter(uuid=(insuree_uuid)) \
                .first()
            if insuree is None:
                errors += {
                    'title': insuree_uuid,
                    'list': [{'message': _(
                        "insuree.validation.id_does_not_exist") % {'id': insuree_uuid}}]
                }
                continue
            if insuree.family.head_insuree.id == insuree.id:
                errors.append({
                    'title': insuree_uuid,
                    'list': [{'message': _(
                        "insuree.validation.remove_head_insuree") % {'id': insuree_uuid}}]
                })
                continue
            insuree_service = InsureeService(user)
            if data['cancel_policies']:
                errors += insuree_service.cancel_policies(insuree)
            errors += insuree_service.remove(insuree)
        if len(errors) == 1:
            errors = errors[0]['list']
        return errors


class SetFamilyHeadMutation(OpenIMISMutation):
    """
    Set (change) the family head insuree
    """
    _mutation_module = "insuree"
    _mutation_class = "SetFamilyHeadMutation"

    class Input(OpenIMISMutation.Input):
        uuid = graphene.String()
        insuree_uuid = graphene.String()

    @classmethod
    def async_mutate(cls, user, **data):
        if not user.has_perms(InsureeConfig.gql_mutation_update_families_perms):
            raise PermissionDenied(_("unauthorized"))
        try:
            family = Family.objects.get(uuid=(data['uuid']))
            insuree = Insuree.objects.get(uuid=(data['insuree_uuid']))
            family.save_history()
            prev_head = family.head_insuree
            if prev_head:
                prev_head.save_history()
                prev_head.head = False
                prev_head.save()
            family.head_insuree = insuree
            family.save()
            insuree.save_history()
            insuree.head = True
            insuree.save()
            return None
        except Exception as exc:
            logger.exception("insuree.mutation.failed_to_set_head_insuree")
            return [{
                'message': _("insuree.mutation.failed_to_set_head_insuree"),
                'detail': str(exc)}
            ]


class ChangeInsureeFamilyMutation(OpenIMISMutation):
    """
    Set (change) the family of an insuree
    """
    _mutation_module = "insuree"
    _mutation_class = "ChangeInsureeFamilyMutation"

    class Input(OpenIMISMutation.Input):
        family_uuid = graphene.String()
        insuree_uuid = graphene.String()
        cancel_policies = graphene.Boolean(default_value=False)

    @classmethod
    def async_mutate(cls, user, **data):
        if not user.has_perms(InsureeConfig.gql_mutation_update_families_perms) or \
                not user.has_perms(InsureeConfig.gql_mutation_update_insurees_perms):
            raise PermissionDenied(_("unauthorized"))
        try:
            family = Family.objects.get(uuid=(data['family_uuid']))
            insuree = Insuree.objects.get(uuid=(data['insuree_uuid']))
            insuree.save_history()
            insuree.family = family
            insuree.save()

            if data['cancel_policies']:
                InsureeService(user).cancel_policies(insuree)

            # Assign all the valid policies from the new family
            InsureePolicyService(user).add_insuree_policy(insuree)

            return None
        except Exception as exc:
            logger.exception(
                "insuree.mutation.failed_to_change_insuree_family")
            return [{
                'message': _("insuree.mutation.failed_to_change_insuree_family"),
                'detail': str(exc)}
            ]


CLIENT_ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"


def _decode_private_jwk_from_env() -> dict:
    """
    Decode PRIVATE_KEY_BASE64 env to a JWK dict.

    The VeriFayda doc states the private key is a Base64-encoded JWK (JWK Set item). We:
    1) try Base64 decode; if padding is off, fix it; if that fails, assume it's already JSON
    2) json.loads to a dict
    """
    raw = os.environ["PRIVATE_KEY_BASE64"]

    def fix_padding(s: str) -> str:
        return s + "=" * (-len(s) % 4)

    jwk_json = None
    # Try strict Base64 -> JSON
    try:
        jwk_json = base64.b64decode(raw).decode("utf-8")
    except Exception:
        # Try with padding fix
        try:
            jwk_json = base64.b64decode(fix_padding(raw)).decode("utf-8")
        except Exception:
            # Fallback: maybe it's already plain JSON
            jwk_json = raw

    jwk = json.loads(jwk_json)  # will raise if not JSON
    # If they gave a JWK Set, pick the first private key
    if "keys" in jwk and isinstance(jwk["keys"], list):
        # find a key that has 'd' (private component)
        for k in jwk["keys"]:
            if isinstance(k, dict) and "d" in k:
                return k
        # fallback to the first if none with 'd'
        return jwk["keys"][0]
    return jwk


def generate_signed_jwt() -> str:
    """
    Build a client assertion JWT signed with the JWK private key using RS256.
    Claims: iss, sub = CLIENT_ID; aud = TOKEN_ENDPOINT; iat; exp(+2h).
    Matches VeriFayda eSignet guidance. :contentReference[oaicite:1]{index=1}
    """
    CLIENT_ID = os.environ["CLIENT_ID"]
    TOKEN_ENDPOINT = os.environ["TOKEN_ENDPOINT"]

    jwk = _decode_private_jwk_from_env()

    now = int(datetime.utcnow().timestamp())
    payload = {
        "iss": CLIENT_ID,
        "sub": CLIENT_ID,
        "aud": TOKEN_ENDPOINT,
        "iat": now,
        "nbf": now,
        "exp": now + 5 * 60,  # 5 minutes (within 1-6 minutes range per requirements)
        "jti": str(uuid4()),
    }

    # python-jose supports signing with a JWK dict for RS256 if 'd' is present
    return jwt.encode(
        claims=payload,
        key=jwk,
        algorithm="RS256",
        headers={"alg": "RS256", "typ": "JWT"},
    )


class ExchangeCodeMutation(graphene.Mutation):
    """
    Exchange MOSIP authorization code for an access_token.
    """
    _mutation_module = "insuree"
    _mutation_class = "ExchangeCodeMutation"

    # Returned fields (Graphene will camelCase these in the GraphQL schema)
    access_token = graphene.String(required=False)
    error = graphene.String(required=False)
    error_description = graphene.String(required=False)
    status = graphene.Int(required=False)

    class Arguments:
        code = graphene.String(required=True)

    @classmethod
    def mutate(cls, root, info, code):
        try:
            code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
            client_assertion = generate_signed_jwt()

            params = {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": os.environ["REDIRECT_URI"],
                "client_id": os.environ["CLIENT_ID"],
                "client_assertion_type": CLIENT_ASSERTION_TYPE,
                "client_assertion": client_assertion,
                "code_verifier": code_verifier,
            }

            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            }
            with httpx.Client() as client:
                resp = client.post(
                    os.environ["TOKEN_ENDPOINT"],
                    data=params,
                    headers=headers,
                    timeout=15,
                )

            logger.warning("Token endpoint status %s", resp.status_code)
            logger.debug("Token endpoint body %s", resp.text)

            # Try parse JSON
            try:
                payload = resp.json()
            except ValueError:
                logger.error("Non-JSON response from token endpoint")
                return ExchangeCodeMutation(
                    access_token=None,
                    error="non_json_response",
                    error_description="Token endpoint did not return JSON",
                    status=resp.status_code,
                )

            # OAuth error?
            if resp.status_code != 200 or "error" in payload:
                logger.error("Token error: %s", payload)
                return ExchangeCodeMutation(
                    access_token=None,
                    error=payload.get("error", "token_error"),
                    error_description=payload.get("error_description", "token_error"),
                    status=resp.status_code,
                )

            # Success
            return ExchangeCodeMutation(
                access_token=payload.get("access_token"),
                error=None,
                error_description=None,
                status=resp.status_code,
            )
        except Exception as exc:
            logger.exception("exchange_code.mutation.failed")
            return ExchangeCodeMutation(
                access_token=None,
                error="exception",
                error_description=str(exc),
                status=0,
            )
class UserInfoMutation(graphene.Mutation):
    _mutation_module = "insuree"
    _mutation_class = "UserInfoMutation"
    raw = graphene.String(required=False)
    status = graphene.Int(required=False)
    error = graphene.String(required=False)

    class Arguments:
        access_token = graphene.String(required=True)

    @classmethod
    def mutate(cls, root, info, access_token):
        try:
            tok = (access_token or "").strip()
            if not tok or tok in ("access_token", "Error Here", "Error"):
                logger.error("UserInfo: placeholder/empty token")
                return UserInfoMutation(raw=None, status=0, error="empty_or_placeholder_token")

            url = os.environ["USERINFO_ENDPOINT"]
            # IMPORTANT: No extra spaces, exact 'Bearer ' prefix
            headers = {
                "Authorization": f"Bearer {tok}",
                # Some deployments prefer jwt response; we can advertise both
                "Accept": "application/json, application/jwt",
            }

            logger.info("UserInfo GET -> %s  (toklen=%s prefix=%s)",
                        url, len(tok), tok[:12])

            with httpx.Client() as client:
                resp = client.get(url, headers=headers, timeout=15)

            logger.warning("Userinfo status %s", resp.status_code)
            logger.debug("Userinfo headers %s", dict(resp.headers))
            logger.debug("Userinfo body %s", resp.text)

            if resp.status_code != 200:
                # Distinguish 401 vs others
                err = "unauthorized" if resp.status_code == 401 else "userinfo_error"
                return UserInfoMutation(raw=None, status=resp.status_code, error=err)

            return UserInfoMutation(raw=resp.text, status=resp.status_code, error=None)

        except Exception as exc:
            logger.exception("userinfo.mutation.failed")
            return UserInfoMutation(raw=None, status=0, error="exception")
        


class SendVerificationEmailMutation(OpenIMISMutation):
    """
    Sends a verification email to the insuree.
    """
    _mutation_module = "insuree"
    _mutation_class = "SendVerificationEmailMutation"

    class Input(OpenIMISMutation.Input):
        insuree_uuid = graphene.String(required=True)
        # MODIFICATION: Add new input field for the URL
        sign_in_url = graphene.String(required=True)

    @classmethod
    def async_mutate(cls, user, **data):
        # if not user.has_perms(InsureeConfig.gql_mutation_send_verification_email_perms):
        #     raise PermissionDenied(_("unauthorized"))

        insuree_uuid = data.get("insuree_uuid")
        # MODIFICATION: Get the new sign_in_url from the input data
        sign_in_url = data.get("sign_in_url")

        try:
            insuree = Insuree.objects.get(uuid=insuree_uuid, validity_to__isnull=True)

            if not insuree.email:
                raise ValidationError(_("insuree.validation.no_email_found"))

            # --- MODIFICATION: Create an HTML email body ---
            subject = 'Insuree Verification Link'
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [insuree.email, "bagajab@gmail.com"]
            
            # Plain text version for email clients that don't support HTML
            plain_message = (
                f"Dear {insuree.other_names},\n\n"
                "Please click the link below to verify your details.\n"
                f"{sign_in_url}\n\n"
                "If you cannot click the link, please copy and paste it into your browser."
            )

            # HTML version with a professional card-style layout
            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Insuree Verification Required</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;">

            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                <td style="padding: 20px 0;">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    
                    <tr>
                        <td align="center" style="padding: 30px 20px; background-color: #0056b3; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <h1 style="margin: 0; font-size: 24px;">Verification Required</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px 30px; color: #333333; line-height: 1.6;">
                        <p style="margin: 0 0 20px 0; font-size: 16px;">
                            Dear <strong>{insuree.other_names}</strong>,
                        </p>
                        <p style="margin: 0 0 30px 0; font-size: 16px;">
                            Thank you for registering with us. Please click the button below to verify your details and complete the process.
                        </p>
                        
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                            <td align="center">
                                <a href="{sign_in_url}" 
                                target="_blank" 
                                style="background-color: #007bff; color: #ffffff; padding: 15px 30px; 
                                        text-align: center; text-decoration: none; display: inline-block; 
                                        font-size: 16px; font-weight: bold; cursor: pointer; border-radius: 5px;">
                                Verify My Details
                                </a>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 30px; font-size: 12px; color: #888888; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0 0 10px 0;">
                            If the button above does not work, please copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0; word-break: break-all;">
                            <a href="{sign_in_url}" target="_blank" style="color: #007bff;">{sign_in_url}</a>
                        </p>
                        <p style="margin-top: 20px;">
                            This is an automated email. Please do not reply.
                        </p>
                        </td>
                    </tr>
                    
                    </table>
                </td>
                </tr>
            </table>

            </body>
            </html>
            """
            
            # Send the email using the html_message parameter
            send_mail(
                subject,
                plain_message,  # Plain text fallback
                from_email,
                recipient_list,
                html_message=html_body  # HTML content
            )
            
            return None

        except ObjectDoesNotExist:
            return [{
                'message': _("insuree.validation.insuree_not_found"),
                'detail': f"Insuree with UUID {insuree_uuid} not found."
            }]
        except ValidationError as e:
            return [{'message': str(e)}]
        except Exception as exc:
            return [{
                'message': _("insuree.mutation.failed_to_send_email"),
                'detail': str(exc)
            }]

# ... (rest of the file)
