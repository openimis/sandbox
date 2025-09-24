<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InsuranceClaim extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'patient_id',
        'medical_visit_id',
        'claim_number',
        'claim_date',
        'claim_amount',
        'approved_amount',
        'status',
        'rejection_reason',
        'approval_date',
        'payment_date',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'claim_date' => 'date',
        'claim_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'approval_date' => 'date',
        'payment_date' => 'date',
    ];

    /**
     * Get the patient that owns the insurance claim.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the medical visit that owns the insurance claim.
     */
    public function medicalVisit(): BelongsTo
    {
        return $this->belongsTo(MedicalVisit::class);
    }
}
