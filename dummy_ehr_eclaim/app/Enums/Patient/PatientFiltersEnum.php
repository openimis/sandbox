<?php

namespace App\Enums\Patient;

use App\Enums\BaseEnumInterface;
use App\Enums\BaseEnumTrait;

enum PatientFiltersEnum: string implements BaseEnumInterface
{
    use BaseEnumTrait;

    case NAME               = 'name';
    case GENDER             = 'gender';
    case BLOOD_GROUP        = 'blood_group';
    case INSURANCE_PROVIDER = 'insurance_provider';
    case CREATED_AT         = 'created_at';

    public function label(): string
    {
        $labels = static::labels();
        return $labels[$this->value] ?? ucfirst(str_replace('_', ' ', $this->value));
    }

    public static function labels(): array
    {
        return [
            self::NAME->value               => 'Customer Name', // Updated to reflect relation to customers table
            self::GENDER->value             => 'Gender',
            self::BLOOD_GROUP->value        => 'Blood Group',
            self::INSURANCE_PROVIDER->value => 'Insurance Provider',
            self::CREATED_AT->value         => 'Created At',
        ];
    }

    public static function choices(): array
    {
        return array_keys(self::labels());
    }
}