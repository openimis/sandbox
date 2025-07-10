<?php

namespace App\Http\Controllers;

use App\Models\FhirEndpoint;
use App\Services\FhirAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class FhirPatientController extends Controller
{
    protected FhirAuthService $fhirAuthService;

    public function __construct(FhirAuthService $fhirAuthService)
    {
        $this->fhirAuthService = $fhirAuthService;
    }

    public function checkPatientEligibility(Request $request)
    {
        $validated = $request->validate([
            'identifier' => 'required|string|max:255',
            'fhir_endpoint_id' => 'sometimes|nullable|exists:fhir_endpoints,id',
        ]);

        $patientIdentifier = $validated['identifier'];
        $fhirEndpoint = isset($validated['fhir_endpoint_id'])
            ? FhirEndpoint::findOrFail($validated['fhir_endpoint_id'])
            : FhirEndpoint::first();

        if (!$fhirEndpoint || !$fhirEndpoint->fhir_endpoint_url) {
            Log::error('No FHIR endpoint URL configured in settings.');
            return response()->json(['message' => 'FHIR endpoint URL not configured.'], 503);
        }

        $apiUrl = rtrim($fhirEndpoint->fhir_endpoint_url, '/') . '/api/api_fhir_r4/Patient/';

        $apiToken = $this->fhirAuthService->getToken();

        if (empty($apiToken)) {
            Log::error('Failed to obtain FHIR API Authorization Token.');
            return response()->json(['message' => 'Service authentication error.'], 503);
        }

        try {
            $fullUrl = $apiUrl . '?' . http_build_query([
                'identifier' => $patientIdentifier,
            ]);

            $response = Http::withHeaders([
                'Authorization' => $apiToken,
            ])->get($fullUrl);

            if ($response->status() === 401 || $response->status() === 403) {
                Log::warning('FHIR API request returned 401/403, attempting token refresh.', ['identifier' => $patientIdentifier]);
                $apiToken = $this->fhirAuthService->refreshToken();
                if ($apiToken) {
                    $response = Http::withHeaders([
                        'Authorization' => $apiToken,
                    ])->get($fullUrl);
                } else {
                    Log::error('Failed to refresh FHIR API token after 401/403.', ['identifier' => $patientIdentifier]);
                    return response()->json(['message' => 'Service authentication failed after retry.'], 503);
                }
            }

            if ($response->successful()) {
                $responseData = $response->json();
                if (isset($responseData['resourceType']) && $responseData['resourceType'] === 'Bundle') {
                    if (!empty($responseData['entry']) && isset($responseData['entry'][0]['resource'])) {
                        return response()->json($responseData['entry'][0]['resource']);
                    } else {
                        return response()->json(['message' => 'Patient not found in bundle.'], 404);
                    }
                } elseif (isset($responseData['resourceType']) && $responseData['resourceType'] === 'Patient') {
                    return response()->json($responseData);
                } elseif (isset($responseData['resourceType']) && $responseData['resourceType'] === 'OperationOutcome') {
                    $errorMessage = 'Error from FHIR server.';
                    if (!empty($responseData['issue'][0]['diagnostics'])) {
                        $errorMessage = $responseData['issue'][0]['diagnostics'];
                    }
                    Log::warning('FHIR OperationOutcome received', ['identifier' => $patientIdentifier, 'response' => $responseData]);
                    return response()->json(['message' => $errorMessage], 404);
                } else {
                    Log::warning('Unexpected FHIR API response structure', ['identifier' => $patientIdentifier, 'response' => $responseData]);
                    return response()->json(['message' => 'Patient not found or unexpected API response.'], 404);
                }
            } else {
                Log::error('FHIR API request failed', [
                    'status' => $response->status(),
                    'identifier' => $patientIdentifier,
                    'response_body' => $response->body(),
                ]);
                return response()->json([
                    'message' => 'Failed to fetch patient data from FHIR service.',
                    'details' => $response->json()
                ], $response->status());
            }
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('FHIR API HTTP Request Exception', ['message' => $e->getMessage(), 'identifier' => $patientIdentifier]);
            return response()->json(['message' => 'Could not connect to FHIR service.'], 503);
        } catch (\Exception $e) {
            Log::error('General Exception during FHIR API call', ['message' => $e->getMessage(), 'identifier' => $patientIdentifier]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}