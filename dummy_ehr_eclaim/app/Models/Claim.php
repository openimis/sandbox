<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Claim extends Model
{
    protected $table="claims";
    protected $fillable = [
        'claim_uuid',
        'claim_code',
        'status',
        'patient_uuid',
        'created',
        'insurer',
        'requestor_uuid',
        'outcome',
        'total_amount',
        'items',
        'full_response',
    ];

    protected $casts = [
        'created' => 'date',
        'items' => 'array',
        'full_response' => 'array',
    ];
}