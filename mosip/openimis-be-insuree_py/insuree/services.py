import base64
import logging
import pathlib
import shutil
import uuid
from importlib import import_module
from os import path

from core.apps import CoreConfig
from django.db.models import Q
from django.utils.translation import gettext as _

from core.signals import register_service_signal
from insuree.apps import InsureeConfig
from insuree.models import (InsureePhoto, PolicyRenewalDetail, Insuree, Family, InsureePolicy, InsureeStatus,
                            InsureeStatusReason)
from django.core.exceptions import ValidationError
from core.models import filter_validity, resolved_id_reference

logger = logging.getLogger(__name__)


def create_insuree_renewal_detail(policy_renewal):
    from core import datetime, datetimedelta
    now = datetime.datetime.now()
    adult_birth_date = now - datetimedelta(years=CoreConfig.age_of_majority)
    photo_renewal_date_adult = now - \
        datetimedelta(months=InsureeConfig.renewal_photo_age_adult)  # 60
    photo_renewal_date_child = now - \
        datetimedelta(months=InsureeConfig.renewal_photo_age_child)  # 12
    photos_to_renew = InsureePhoto.objects.filter(insuree__family=policy_renewal.insuree.family) \
        .filter(insuree__validity_to__isnull=True) \
        .filter(Q(insuree__photo_date__isnull=True)
                | Q(insuree__photo_date__lte=photo_renewal_date_adult)
                | (Q(insuree__photo_date__lte=photo_renewal_date_child)
                   & Q(insuree__dob__gt=adult_birth_date)
                   )
                )
    for photo in photos_to_renew:
        detail, detail_created = PolicyRenewalDetail.objects.get_or_create(
            policy_renewal=policy_renewal,
            insuree_id=photo.insuree_id,
            validity_from=now,
            audit_user_id=0,
        )
        logger.debug("Photo due for renewal for insuree %s, renewal detail %s, created an entry ? %s",
                     photo.insuree_id, detail.id, detail_created)


def custom_insuree_number_validation(insuree_number):
    function_string = InsureeConfig.insuree_number_validator
    try:
        mod, name = function_string.rsplit('.', 1)
        module = import_module(mod)
        function = getattr(module, name)
        return function(insuree_number)
    except ImportError:
        return [{"errorCode": InsureeConfig.validation_code_validator_import_error,
                 "message": _("validator_module_import_error")}]

    except AttributeError:
        return [{"errorCode": InsureeConfig.validation_code_validator_function_error,
                 "message": _("validator_function_not_found")}]


def validate_insuree_number(insuree_number, insuree_uuid=None):
    insuree_number = str(insuree_number)

    if InsureeConfig.insuree_number_validator:
        return custom_insuree_number_validation(insuree_number)
    if InsureeConfig.insuree_number_max_length:
        if not insuree_number:
            return [
                {
                    "errorCode": InsureeConfig.validation_code_no_insuree_number,
                    "message": _("Invalid insuree number (empty), should be %s") %
                    (InsureeConfig.insuree_number_max_length,)
                }
            ]
        if len(insuree_number) > InsureeConfig.insuree_number_max_length:
            return [
                {
                    "errorCode": InsureeConfig.validation_code_invalid_insuree_number_len,
                    "message": _("Invalid insuree number length %s, should be maximun %s") %
                    (
                        len(insuree_number),
                        InsureeConfig.insuree_number_max_length
                    )
                }
            ]
    if InsureeConfig.insuree_number_min_length and len(insuree_number) < InsureeConfig.insuree_number_min_length:
            return [
                {
                    "errorCode": InsureeConfig.validation_code_invalid_insuree_number_len,
                    "message": _("Invalid insuree number length %s, should be minimum %s") %
                    (
                        len(insuree_number),
                        InsureeConfig.insuree_number_min_length
                    )
                }
            ]
        
    config_modulo = InsureeConfig.insuree_number_modulo_root
    if config_modulo:
        try:
            if config_modulo == 10:
                if not is_modulo_10_number_valid(insuree_number):
                    return invalid_checksum()
            else:
                base = int(insuree_number[:-1])
                mod = int(insuree_number[-1])
                if base % config_modulo != mod:
                    return invalid_checksum()
        except Exception as exc:
            logger.exception("Failed insuree number validation", exc)
            return [{"errorCode": InsureeConfig.validation_code_invalid_insuree_number_exception,
                     "message": "Insuree number validation failed"}]
    query = Insuree.objects.filter(
        chf_id=insuree_number, validity_to__isnull=True)
    insuree = query.first()
    if insuree_uuid and insuree and uuid.UUID(insuree.uuid) != uuid.UUID(insuree_uuid):
        return [{
            "errorCode": InsureeConfig.validation_code_taken_insuree_number,
            "message": "Insuree number has to be unique, %s exists in system" % insuree_number
        }]

    
    return []


def is_modulo_10_number_valid(insuree_number: str) -> bool:
    """
    This function checks whether an insuree number is valid, according to the modulo 10 technique.
    Contrarily to its name, this technique does not simply check if number % 10 == 0.
    This function uses Luhn's algorithm (https://en.wikipedia.org/wiki/Luhn_algorithm).
    """
    return (sum(
        (element + (index % 2 == 0) * (element - 9 * (element > 4))
         for index, element in enumerate(map(int, insuree_number[:-1])))
    ) + int(insuree_number[-1])) % 10 == 0


def invalid_checksum():
    return [{"errorCode": InsureeConfig.validation_code_invalid_insuree_number_checksum,
             "message": "Invalid checksum"}]


def reset_insuree_before_update(insuree):
    insuree.family = None
    insuree.chf_id = None
    insuree.last_name = None
    insuree.other_names = None
    insuree.gender = None
    insuree.dob = None
    insuree.head = None
    insuree.marital = None
    insuree.passport = None
    insuree.phone = None
    insuree.email = None
    insuree.current_address = None
    insuree.geolocation = None
    insuree.current_village = None
    insuree.card_issued = None
    insuree.relationship = None
    insuree.profession = None
    insuree.education = None
    insuree.type_of_id = None
    insuree.health_facility = None
    insuree.offline = None
    insuree.json_ext = None


def reset_family_before_update(family):
    family.location = None
    family.poverty = None
    family.family_type = None
    family.address = None
    family.is_offline = None
    family.ethnicity = None
    family.confirmation_no = None
    family.confirmation_type = None
    family.json_ext = None


def handle_insuree_photo(user, now, insuree, data):
    existing_insuree_photo = insuree.photo
    insuree_photo = None
    if not photo_changed(existing_insuree_photo, data):
        return None
    data['audit_user_id'] = user.id_for_audit
    data['validity_from'] = now
    data['insuree_id'] = insuree.id
    photo_bin = data.get('photo', None)
    # no photo changes
    if (
        'uuid' in data and existing_insuree_photo and
        uuid.UUID(data['uuid']) == uuid.UUID(existing_insuree_photo.uuid)
    ):
        existing_insuree_photo_bin = load_photo_file(
            existing_insuree_photo.folder,
            existing_insuree_photo.filename
        )
        if photo_bin == existing_insuree_photo_bin: 
            return existing_insuree_photo
        else:
            # we ignore the uuid, FE must have messup
            data['uuid'] = str(uuid.uuid4())
    if 'uuid' not in data:
        data['uuid'] = str(uuid.uuid4())
    
    
    if photo_bin and InsureeConfig.insuree_photos_root_path \
            and (existing_insuree_photo is None or existing_insuree_photo.photo != photo_bin):
        (file_dir, file_name) = create_file(now, insuree.id, photo_bin, data['uuid'])
        data['folder'] = file_dir
        data['filename'] = file_name
        insuree_photo = InsureePhoto(**data)

    if existing_insuree_photo and insuree_photo:
        existing_insuree_photo.save_history()
        insuree_photo.id = existing_insuree_photo.id
        insuree_photo.date = None
        insuree_photo.officer_id = None
        insuree_photo.folder = None
        insuree_photo.filename = None
        insuree_photo.photo = None
        [setattr(insuree_photo, key, data[key]) for key in data if key != 'id']
    if insuree_photo:
        insuree_photo.save()
    return insuree_photo


def photo_changed(insuree_photo, data):
    return (not insuree_photo and data) or \
        (data and insuree_photo and insuree_photo.date != data.get('date', None)) or \
        (data and insuree_photo and insuree_photo.officer_id != data.get('officer_id', None)) or \
        (data and insuree_photo and insuree_photo.folder != data.get('folder', None)) or \
        (data and insuree_photo and insuree_photo.filename != data.get('filename', None)) or \
        (data and insuree_photo and insuree_photo.photo != data.get('photo', None))


def _photo_dir(file_dir, file_name):
    root = InsureeConfig.insuree_photos_root_path
    return path.join(root, file_dir, file_name)


def _create_dir(file_dir):
    root = InsureeConfig.insuree_photos_root_path
    pathlib.Path(path.join(root, file_dir)) \
        .mkdir(parents=True, exist_ok=True)


def create_file(date, insuree_id, photo_bin, file_name):
    file_dir = path.join(str(date.year), str(date.month),
                         str(date.day), str(insuree_id))
    _create_dir(file_dir)
    with open(_photo_dir(file_dir, file_name), "xb") as f:
        f.write(base64.b64decode(photo_bin))
        f.close()
    return file_dir, file_name


def copy_file(date, insuree_id, original_file):
    file_dir = path.join(str(date.year), str(date.month),
                         str(date.day), str(insuree_id))
    file_name = str(uuid.uuid4())

    _create_dir(file_dir)
    shutil.copy2(original_file, _photo_dir(file_dir, file_name))
    return file_dir, file_name


def load_photo_file(file_dir, file_name):
    photo_path = _photo_dir(file_dir, file_name)
    try:
        with open(photo_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except FileNotFoundError:
        logger.error(f"{photo_path} not found")


def validate_insuree_data(insuree):
    if not insuree.dob:
        raise ValidationError(_("insuree.validation.insuree_requires_dob"))
    if not insuree.gender:
        raise ValidationError(_("insuree.validation.insuree_requires_gender"))
    if not insuree.status:
        raise ValidationError(_("insuree.validation.insuree_requires_status"))



def validate_worker_data(insuree):
    if not insuree.other_names:
        raise ValidationError(_("worker_requires_other_names"))
    if not insuree.last_name:
        raise ValidationError(_("worker_requires_last_name"))


def validate_insuree(insuree):
    """
    This function checks if the CHF ID is valid for the insuree or worker and
    then performs additional validation based on the type of insuree.

    Note:
        - If InsureeConfig.insuree_as_worker is True, the function performs worker data validation.
        - If InsureeConfig.insuree_as_worker is False, the function performs insuree data validation.
    """
    errors = validate_insuree_number(insuree.chf_id, insuree.uuid)
    if errors:
        raise ValidationError("invalid_insuree_number")

    if InsureeConfig.insuree_as_worker:
        validate_worker_data(insuree)
    else:
        validate_insuree_data(insuree)


class InsureeService:
    def __init__(self, user):
        self.user = user

    @register_service_signal('insuree_service.create_or_update')
    def create_or_update(self, data, create_only=False):
        photo_data = data.pop('photo', None)
        from core import datetime
        now = datetime.datetime.now()
        data['audit_user_id'] = self.user.id_for_audit
        data['validity_from'] = now
        status = data.get('status', InsureeStatus.ACTIVE)
        if status not in [choice[0] for choice in InsureeStatus.choices]:
            raise ValidationError(_("mutation.insuree.wrong_status"))
        if InsureeConfig.is_insuree_photo_required and photo_data is None:
            raise ValidationError(_("mutation.insuree.no_required_photo"))
        insuree = None
        if "uuid" in data:
            insuree = Insuree.objects.filter(uuid=data["uuid"]).first()
        elif 'chf_id' in data and not create_only:
            insuree = Insuree.objects.filter(chf_id=data["chf_id"], *filter_validity()).first()
        if status in [InsureeStatus.INACTIVE, InsureeStatus.DEAD]:
            status_reason = InsureeStatusReason.objects.get(code=data.get('status_reason', None),
                                                            validity_to__isnull=True)
            if status_reason is None or status_reason.status_type != status:
                raise ValidationError(_("mutation.insuree.wrong_status"))
            data['status_reason'] = status_reason
            if insuree:
                self.disable_policies_of_insuree(insuree=insuree, status_date=data['status_date'])
        if InsureeConfig.insuree_fsp_mandatory and 'health_facility_id' not in data:
            raise ValidationError("mutation.insuree.fsp_required")
        if not insuree:
            insuree = Insuree(**data)
        else:
            self._update(insuree, data)

        return self._create_or_update(
            insuree, photo_data,
            add_on_existing_policy=data.get('add_on_existing_policy', False)
        )

    def disable_policies_of_insuree(self, insuree, status_date):
        policies_to_cancel = InsureePolicy.objects.filter(insuree=insuree.id, validity_to__isnull=True).all()
        for policy in policies_to_cancel:
            policy.expiry_date = status_date
            policy.save()

    def activate_policies_of_insuree(self, insuree):
        from core import datetime
        now = datetime.date.today()
        from policy.models import Policy
        policies_to_activate = Policy.objects.filter(family=insuree.family, validity_to__isnull=True)
        for policy in policies_to_activate:
            if policy.expiry_date >= now:
                current_policy_dict = {"effective_date": now, "expiry_date": policy.expiry_date,
                                       "audit_user_id": self.user.audit_user_id, "offline": policy.offline,
                                       "start_date": policy.start_date, "policy": policy, "insuree": insuree,
                                       "enrollment_date": policy.enroll_date}
                current_policy = InsureePolicy(**current_policy_dict)
                current_policy.save()


    def _create_or_update(self, insuree, photo_data=None, add_on_existing_policy=False):
        validate_insuree(insuree)
        if insuree.id:
            filters = Q(id=insuree.id)
            # remove it from now3 to avoid id at creation
            insuree.id = None
        elif insuree.uuid:
            filters = Q(uuid=(insuree.uuid))
        else:
            filters = None
        existing_insuree = Insuree.objects.filter(filters).prefetch_related(
            "photo").first() if filters else None
        if existing_insuree:
            existing_insuree.save_history()
            insuree.id = existing_insuree.id

        if photo_data:
            photo = handle_insuree_photo(self.user, insuree.validity_from, insuree, photo_data)
            if photo:
                insuree.photo = photo
                insuree.photo_date = photo.date
        insuree.save()
        if insuree and add_on_existing_policy:
            self.activate_policies_of_insuree(insuree=insuree)
        return insuree

    def remove(self, insuree):
        try:
            insuree.save_history()
            insuree.family = None
            insuree.save()
            return []
        except Exception as exc:
            logger.exception("insuree.mutation.failed_to_remove_insuree")
            return {
                'title': insuree.chf_id,
                'list': [{
                    'message': _("insuree.mutation.failed_to_remove_insuree") % {'chfid': insuree.chfid},
                    'detail': insuree.uuid}]
            }
            
    def change_family(self, insuree, family, user_audit_id=None):
        if insuree.family != family:
            if (
                insuree.family and
                insuree.family.head_insuree == insuree
            ):
                raise ValueError(F"Insuree {insuree} already assigned as head to a family")
            if user_audit_id:
                insuree.save_history()
            insuree.family = family
            if user_audit_id:
                insuree.user_audit_id = user_audit_id
                insuree.save()
            return True
        return False
        
        
    @register_service_signal('insuree_service.delete')
    def set_deleted(self, insuree):
        try:
            insuree.delete_history()
            [ip.delete_history()
             for ip in insuree.insuree_policies.filter(validity_to__isnull=True)]
            return []
        except Exception as exc:
            logger.exception("insuree.mutation.failed_to_delete_insuree")
            return {
                'title': insuree.chf_id,
                'list': [{
                    'message': _("insuree.mutation.failed_to_delete_insuree") % {'chfid': insuree.chf_id},
                    'detail': insuree.uuid}]
            }

    def cancel_policies(self, insuree):
        try:
            from core import datetime
            now = datetime.datetime.now()
            ips = insuree.insuree_policies.filter(
                Q(expiry_date__isnull=True) | Q(expiry_date__gt=now))
            for ip in ips:
                ip.expiry_date = now
            InsureePolicy.objects.bulk_update(ips, ['expiry_date'])
            return []
        except Exception as exc:
            logger.exception(
                "insuree.mutation.failed_to_cancel_insuree_policies")
            return {
                'title': insuree.chf_id,
                'list': [{
                    'message': _("insuree.mutation.failed_to_cancel_insuree_policies") % {'chfid': insuree.chfid},
                    'detail': insuree.uuid}]
            }

    def _update(self, insuree, data):
        insuree.save_history()
        # reset the non required fields
        # (each update is 'complete', necessary to be able to set 'null')
        reset_insuree_before_update(insuree)
        [setattr(insuree, key, data[key]) for key in data]


class InsureePolicyService:
    def __init__(self, user):
        self.user = user

    def add_insuree_policy(self, insuree):
        from policy.models import Policy
        policies = Policy.objects.filter(family_id=insuree.family_id)
        for policy in policies:
            if policy.can_add_insuree():
                ip = InsureePolicy(
                    insuree=insuree,
                    policy=policy,
                    enrollment_date=policy.enroll_date,
                    start_date=policy.start_date,
                    effective_date=policy.effective_date,
                    expiry_date=policy.expiry_date,
                    offline=False,
                    audit_user_id=self.user.i_user.id
                )
                print(ip.__dict__)
                ip.save()


class FamilyService:
    def __init__(self, user):
        self.user = user

    def create_or_update(self, data):
        head_insuree_data = data.pop('head_insuree', None)
        
        if head_insuree_data:
            head_insuree_data["head"] = True
            head_insuree = InsureeService(
                self.user).create_or_update(head_insuree_data)
            data["head_insuree_id"] = head_insuree.id
        
        elif 'head_insuree_id' not in data:
            raise Exception(f'no head insuree found')
        from core import datetime

        now = datetime.datetime.now()

        data['audit_user_id'] = self.user.id_for_audit
        data['validity_from'] = now
        family = Family(**data)
        return self._create_or_update(family)

    def _create_or_update(self, family):
        if family.id:
            filters = Q(id=family.id)
            # remove it from now3 to avoid id at creation
            family.id = None
        elif family.uuid:
            filters = Q(uuid=(family.uuid))
        else:
            filters = None
        existing_family = Family.objects.filter(*filter_validity(), filters).first() if filters else None
        if existing_family:
            return self._update(existing_family, family)
        else:
            return self._create(family)

    def _create(self, family):
        family.save()
        family.head_insuree.family = family
        family.head_insuree.save()
        return family

    def _update(self, existing_family, family):
        existing_family.save_history()
        family.id = existing_family.id
        family.save()
        if family.head_insuree.family != family:
            family.head_insuree.family = family
            family.head_insuree.save()
        return family

    def set_deleted(self, family, delete_members):
        try:
            [self.handle_member_on_family_delete(member, delete_members)
             for member in family.members.filter(validity_to__isnull=True).all()]
            family.delete_history()
            return []
        except Exception as exc:
            logger.exception("insuree.mutation.failed_to_delete_family")
            return {
                'title': family.uuid,
                'list': [{
                    'message': _("insuree.mutation.failed_to_delete_family") % {'chfid': family.chfid},
                    'detail': family.uuid}]
            }

    def handle_member_on_family_delete(self, member, delete_members):
        insuree_service = InsureeService(self.user)
        if delete_members:
            insuree_service.set_deleted(member)
        else:
            insuree_service.remove(member)
