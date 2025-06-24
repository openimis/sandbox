<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FhirEndpoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'fhir_endpoint_url',
        'practitioner',
        'provider',
        'insurance_coverage_uuid',
        'fhir_username',
        'fhir_password'
    ];
}