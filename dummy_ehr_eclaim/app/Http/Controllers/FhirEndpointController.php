<?php

namespace App\Http\Controllers;

use App\Models\FhirEndpoint;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FhirEndpointController extends Controller
{
    public function index()
    {
        return Inertia::render('FhirSettings/Index', [
            'fhirEndpoints' => FhirEndpoint::all(),
        ]);
    }

    public function create()
    {
        return Inertia::render('FhirSettings/Create');
    }

public function store(Request $request)
{
    $validated = $request->validate([
        'fhir_endpoint_url' => 'required|url',
        'fhir_username' => 'nullable|string|max:255',
        'fhir_password' => 'nullable|string|max:255',
        'practitioner' => 'nullable|string|max:255',
        'provider' => 'nullable|string|max:255',
        'insurance_coverage_uuid' => 'nullable|string|max:255',
        'is_default' => 'boolean',
    ]);

    if ($validated['is_default']) {
        FhirEndpoint::where('is_default', true)->update(['is_default' => false]);
    }

    $fhirEndpoint = FhirEndpoint::create($validated);

    return redirect()->route('fhir-endpoints.create')->with('success', 'FHIR Endpoint created successfully');
}

    public function edit(FhirEndpoint $fhirEndpoint)
    {
        return Inertia::render('FhirSettings/Create', [
            'fhirEndpoint' => $fhirEndpoint,
        ]);
    }

    public function update(Request $request, FhirEndpoint $fhirEndpoint)
    {
        $validated = $request->validate([
            'fhir_endpoint_url' => 'required|url',
            'fhir_username' => 'nullable|string|max:255',
            'fhir_password' => 'nullable|string|max:255',
            'practitioner' => 'nullable|string|max:255',
            'provider' => 'nullable|string|max:255',
            'insurance_coverage_uuid' => 'nullable|string|max:255',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default']) {
            FhirEndpoint::where('is_default', true)->where('id', '!=', $fhirEndpoint->id)->update(['is_default' => false]);
        }

        $fhirEndpoint->update($validated);

        return redirect()->route('fhir-endpoints.create')->with('success', 'FHIR Endpoint updated successfully');
    }
}
