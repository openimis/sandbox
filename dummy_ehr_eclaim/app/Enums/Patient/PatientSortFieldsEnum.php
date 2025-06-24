<?php

namespace App\Enums\Patient;

use App\Enums\BaseEnumInterface;
use App\Enums\BaseEnumTrait;

enum PatientSortFieldsEnum: string implements BaseEnumInterface
{
    use BaseEnumTrait;

    case ID                      = 'id';
    case CUSTOMER_ID             = 'customer_id';
    case DATE_OF_BIRTH           = 'date_of_birth';
    case GENDER                  = 'gender';
    case BLOOD_GROUP             = 'blood_group';
    case ALLERGIES               = 'allergies'; // nullable
    case CHRONIC_DISEASES        = 'chronic_diseases'; // nullable
    case EMERGENCY_CONTACT_NAME  = 'emergency_contact_name'; // nullable
    case EMERGENCY_CONTACT_PHONE = 'emergency_contact_phone'; // nullable
    case INSURANCE_PROVIDER      = 'insurance_provider'; // nullable
    case INSURANCE_POLICY_NUMBER = 'insurance_policy_number'; // nullable
    case CREATED_AT              = 'created_at';
    case UPDATED_AT              = 'updated_at';
    case NAME                    =  'name';
    


    public static function labels(): array
    {
        return [
            self::ID->value                      => "ID",
            self::CUSTOMER_ID->value             => "Customer ID",
            self::DATE_OF_BIRTH->value           => "Date of Birth",
            self::GENDER->value                  => "Gender",
            self::BLOOD_GROUP->value             => "Blood Group",
            self::ALLERGIES->value               => "Allergies",
            self::CHRONIC_DISEASES->value        => "Chronic Diseases",
            self::EMERGENCY_CONTACT_NAME->value  => "Emergency Contact Name",
            self::EMERGENCY_CONTACT_PHONE->value => "Emergency Contact Phone",
            self::INSURANCE_PROVIDER->value      => "Insurance Provider",
            self::INSURANCE_POLICY_NUMBER->value => "Insurance Policy Number",
            self::CREATED_AT->value              => "Created At",
            self::UPDATED_AT->value              => "Updated At",
            self::NAME->value => 'Customer Name',

        ];
    }
}

