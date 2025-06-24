<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->string('claim_uuid')->unique(); // ClaimResponse id
            $table->string('claim_code')->nullable(); // ClaimResponse identifier with code "Code"
            $table->string('status'); // active, cancelled, etc.
            $table->string('patient_uuid'); // Patient identifier UUID
            $table->date('created'); // ClaimResponse created date
            $table->string('insurer')->nullable(); // Insurer reference
            $table->string('requestor_uuid')->nullable(); // Practitioner UUID
            $table->string('outcome'); // queued, complete, etc.
            $table->decimal('total_amount', 10, 2)->nullable(); // Total amount
            $table->json('items'); // Array of items (sequence, adjudication, etc.)
            $table->json('full_response'); // Full ClaimResponse JSON
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('claims');
    }
};
