<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fhir_endpoints', function (Blueprint $table) {
            $table->id();
            $table->string('fhir_endpoint_url')->nullable();
            $table->string('fhir_username')->nullable();
            $table->string('fhir_password')->nullable();
            $table->string('practitioner')->nullable();
            $table->string('provider')->nullable();
            $table->string('insurance_coverage_uuid')->nullable();
            $table->boolean('is_default')->default(false)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fhir_endpoints');
    }
};