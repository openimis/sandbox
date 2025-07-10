<?php

namespace App\Http\Controllers;

use App\Services\FhirAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Claim;
use App\Services\ClaimService;
use Inertia\Inertia;


class FhirInsuranceClaimController extends Controller
{
    protected FhirAuthService $fhirAuthService;
    protected ClaimService $claimService;


    public function __construct(FhirAuthService $fhirAuthService, ClaimService $claimService)
    {
        $this->fhirAuthService = $fhirAuthService;
        $this->claimService = $claimService;
    }

    public function index(Request $request)
    {

        $claims = $this->claimService->getAll($request->all());
        // dd($claims);
        return Inertia::render('PatientBilling/ClaimsPage', [
            'filters' => $request->all(),
            'claims' => $claims,
        ]);
    }

    public function submitClaim(Request $request)
    {
        // Validate only essential fields
        $validated = $request->all();
        // validate([
        //     'patient_fhir_id' => 'required|string', // Dynamic patient UUID
        //     'items' => 'required|array|min:1',
        //     'items.*.service_id' => 'required|string',
        //     'items.*.quantity' => 'required|numeric|min:1',
        //     'items.*.unit_price' => 'required|numeric|min:0',
        //     'items.*.description' => 'nullable|string',
        //     'total_amount' => 'required|numeric|min:0',
        // ]);


        $apiUrl =  env('FHIR_BASE_URL') . '/api/api_fhir_r4/Claim/';
        $apiToken = $this->fhirAuthService->getToken();

        if (empty($apiToken)) {
            Log::error('Failed to obtain FHIR API Authorization Token for claim submission.');
            return response()->json(['message' => 'Service authentication error.'], 503);
        }

        // Static configuration values (move these to config if needed)
        $staticConfig = [
            'activity_definition_uuid' => '488d8bcb-5b88-438c-9077-f177f6f32626',
            'enterer_uuid' => '4a3f1a0a-e13c-451a-9511-a4d0fe35d20b',
            'enterer_display' => 'UPHOS001',
            // 'provider_org_uuid' => '026e088a-fbd5-474e-8d42-069958a34127',
            'provider_org_uuid' => 'e5131cc5-bcd6-460c-b6bb-54da3f2506f2',

            'provider_org_display' => 'UPHOS001',
            'coverage_uuid' => 'f6e989b3-c4d0-4a59-89e9-9f16e8d87f8c'
        ];
        // dd($validated);
        // Construct FHIR Claim payload with dynamic patient UUID
        $claimItems = array_map(function ($item, $index) use ($staticConfig) {
            // dd($item);
            return [
                'extension' => [
                    [
                        'url' => 'https://openimis.github.io/openimis_fhir_r4_ig/StructureDefinition/claim-item-reference',
                        'valueReference' => [
                            'reference' => "ActivityDefinition/{$staticConfig['activity_definition_uuid']}",
                            'type' => 'ActivityDefinition',
                            'identifier' => [
                                'type' => [
                                    'coding' => [
                                        [
                                            'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                            'code' => 'UUID'
                                        ]
                                    ]
                                ],
                                'value' => $staticConfig['activity_definition_uuid']
                            ]
                        ]
                    ]
                ],
                'sequence' => $index + 1,
                'category' => ['text' => 'service'],
                'productOrService' => ['text' =>  'A1'], //$item['description'] ?? 'Unknown Service'],
                'quantity' => ['value' => (float) $item['quantity']],
                'unitPrice' => ['value' => (float) $item['unitPrice']['value']]
            ];
        }, $validated['item'], array_keys($validated['item']));
        // dd($claimItems);
        $diagnosis = [
            [
                "sequence" => 1,
                "diagnosisCodeableConcept" => [
                    "coding" => [
                        [
                            "system" => "https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/diagnosis-ICD10-level1",
                            "code" => "A000 Cholera due to Vibrio cholerae 01, biovar cholerae",
                            "display" => "Cholera due to Vibrio cholerae 01, biovar cholerae"
                        ]
                    ]
                ]
            ]
        ];

        $payload = [
            'resourceType' => 'Claim',
            'identifier' => [
                [
                    'type' => [
                        'coding' => [
                            [
                                'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                'code' => 'Code'
                            ]
                        ]
                    ],
                    'value' => 'PROJ' . time()
                ]
            ],
            'status' => 'active',
            'type' => [
                'coding' => [
                    [
                        'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/claim-visit-type',
                        'code' => 'O',
                        'display' => 'Other'
                    ]
                ]
            ],
            'use' => 'claim',
            'patient' => [
                'reference' => "Patient/{$validated['patient']['identifier']['value']}",
                'type' => 'Patient',
                'identifier' => [
                    'type' => [
                        'coding' => [
                            [
                                'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                'code' => 'UUID'
                            ]
                        ]
                    ],
                    'value' => $validated['patient']['identifier']['value']
                ]
            ],
            'billablePeriod' => [
                'start' => now()->toDateString(),
                'end' => now()->toDateString()
            ],
            'created' => now()->toDateString(),
            'enterer' => [
                'reference' => "Practitioner/{$staticConfig['enterer_uuid']}",
                'type' => 'Practitioner',
                'identifier' => [
                    'type' => [
                        'coding' => [
                            [
                                'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                'code' => 'UUID'
                            ]
                        ]
                    ],
                    'value' => $staticConfig['enterer_uuid']
                ],
                'display' => $staticConfig['enterer_display']
            ],
            'provider' => [
                'reference' => "Organization/{$staticConfig['provider_org_uuid']}",
                'type' => 'Organization',
                'identifier' => [
                    'type' => [
                        'coding' => [
                            [
                                'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                'code' => 'UUID'
                            ]
                        ]
                    ],
                    'value' => $staticConfig['provider_org_uuid']
                ],
                'display' => $staticConfig['provider_org_display']
            ],
            'priority' => [
                'coding' => [
                    [
                        'system' => 'http://terminology.hl7.org/CodeSystem/processpriority',
                        'code' => 'normal',
                        'display' => 'Normal'
                    ]
                ]
            ],
            "diagnosis" => $diagnosis,
            'insurance' => [
                [
                    'sequence' => 1,
                    'focal' => true,
                    'coverage' => [
                        'reference' => "Coverage/{$staticConfig['coverage_uuid']}",
                        'type' => 'Coverage',
                        'identifier' => [
                            'type' => [
                                'coding' => [
                                    [
                                        'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                        'code' => 'UUID'
                                    ]
                                ]
                            ],
                            'value' => $staticConfig['coverage_uuid']
                        ]
                    ]
                ]
            ],
            'item' => $claimItems,
            'total' => [
                'value' => (float) $validated['total']['value'],
                'currency' => '$'
            ]
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => $apiToken,
                'Content-Type' => 'application/json',
            ])->post($apiUrl, $payload);
            // dd($response->body());
            // Handle token expiry and retry
            if ($response->status() === 401 || $response->status() === 403) {
                Log::warning('FHIR API request for claim submission returned 401/403, attempting token refresh.');
                $apiToken = $this->fhirAuthService->refreshToken();
                if ($apiToken) {
                    $response = Http::withHeaders([
                        'Authorization' => $apiToken,
                        'Content-Type' => 'application/json',
                    ])->post($apiUrl, $payload);
                } else {
                    Log::error('Failed to refresh FHIR API token after 401/403 for claim submission.');
                    return response()->json(['message' => 'Service authentication failed after retry.'], 503);
                }
            }
            // dd($response->status());
            if ($response->successful()) {
                $responseJson = $response->json() ?? null;

                //dd($responseJson);
                $claimResponse = $responseJson; // Decode the embedded JSON string

                $claimUuid = $claimResponse['id'] ?? null;

                $claimCode = collect($claimResponse['identifier'] ?? [])
                    ->firstWhere('type.coding.0.code', 'Code')['value'] ?? null;

                $patientUuid = $claimResponse['patient']['identifier']['value'] ?? null;

                $requestorUuid = $claimResponse['requestor']['identifier']['value'] ?? null;

                $totalAmount = optional(collect($claimResponse['total'] ?? [])
                    ->firstWhere('category.coding.0.code', '2'))['amount']['value'] ?? null;

                $created = $claimResponse['created'] ?? null;

                $insurer = $claimResponse['insurer']['reference'] ?? null;

                $outcome = $claimResponse['outcome'] ?? null;

                $items = $claimResponse['item'] ?? [];

                // dd([
                //     'claim_uuid' => $claimUuid,
                //     'claim_code' => $claimCode,
                //     'patient_uuid' => $patientUuid,
                //     'requestor_uuid' => $requestorUuid,
                //     'total_amount' => $totalAmount,
                //     'created' => $created,
                //     'insurer' => $insurer,
                //     'outcome' => $outcome,
                //     'items' => $items,
                //     'full_response' => $claimResponse,
                // ]);

                $claim = Claim::create([
                    'claim_uuid' => $claimUuid,
                    'claim_code' => $claimCode,
                    'status' => $claimResponse['status'] ?? 'unknown',
                    'patient_uuid' => $patientUuid,
                    'created' => $created,
                    'insurer' => $insurer,
                    'requestor_uuid' => $requestorUuid,
                    'outcome' => $outcome,
                    'total_amount' => $totalAmount,
                    'items' => json_encode($items),
                    'full_response' => json_encode($claimResponse),
                ]);


                return response()->json([
                    'message' => 'Claim submitted and saved successfully',
                    'claim_uuid' => $claimUuid,
                    'data' => $response->json(),
                ], 201);

                // return response()->json($response->json(), 201);
            } else {
                Log::error('FHIR API claim submission failed', [
                    'status' => $response->status(),
                    'response_body' => $response->body(),
                ]);
                return response()->json([
                    'message' => 'Failed to submit claim to FHIR service.' . $response->body(),
                    'details' => $response->json()
                ], $response->status());
            }
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('FHIR API HTTP Request Exception during claim submission', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Could not connect to FHIR service.'], 503);
        } catch (\Exception $e) {
            Log::error('General Exception during FHIR API claim submission', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'An unexpected error occurred.' . $response->body()], 500);
        }
    }

    public function submitClaim2(Request $request)
    {
        // Validate the incoming request
        // $validated = $request->validate([
        //     'patient.identifier.value' => 'required|string', // Patient UUID
        //     'item' => 'required|array|min:1',
        //     'item.*.service_id' => 'required|string',
        //     'item.*.quantity' => 'required|numeric|min:1',
        //     'item.*.unit_price' => 'required|numeric|min:0',
        //     'item.*.description' => 'nullable|string',
        //     'item.*.fhir_item_uuid' => 'required|string', // FHIR UUID from service
        //     'item.*.fhir_item_code' => 'required|string', // FHIR code from service
        //     'total.value' => 'required|numeric|min:0',
        //     'guaranteeId' => 'nullable|string',
        //     'supportingInfo' => 'nullable|array',
        //     'supportingInfo.*.sequence' => 'required_with:supportingInfo|integer|min:1',
        //     'supportingInfo.*.category.coding.0.code' => 'required_with:supportingInfo|string|in:guarantee,attachment',
        //     'supportingInfo.*.valueString' => 'required_if:supportingInfo.*.category.coding.0.code,guarantee|string',
        //     'supportingInfo.*.valueAttachment.contentType' => 'required_if:supportingInfo.*.category.coding.0.code,attachment|string|in:image/jpeg,image/png,application/pdf',
        //     'supportingInfo.*.valueAttachment.creation' => 'required_if:supportingInfo.*.category.coding.0.code,attachment|date',
        //     'supportingInfo.*.valueAttachment.data' => 'required_if:supportingInfo.*.category.coding.0.code,attachment|string',
        //     'supportingInfo.*.valueAttachment.title' => 'required_if:supportingInfo.*.category.coding.0.code,attachment|string',
        //     'supportingInfo.*.valueAttachment.hash' => 'nullable|string',
        // ]);
        $validated = $request->all();
        // dd($validated);
        $apiUrl = env('FHIR_BASE_URL') . '/api/api_fhir_r4/Claim/';
        $apiToken = $this->fhirAuthService->getToken();
        // dd($apiToken);
        if (empty($apiToken)) {
            Log::error('Failed to obtain FHIR API Authorization Token for claim submission.');
            return response()->json(['message' => 'Service authentication error.'], 503);
        }

        // Static configuration values
        $staticConfig = [
            'enterer_uuid' => '4a3f1a0a-e13c-451a-9511-a4d0fe35d20b',
            'enterer_display' => 'UPHOS001',
            'provider_org_uuid' => 'e5131cc5-bcd6-460c-b6bb-54da3f2506f2',
            'provider_org_display' => 'UPHOS001',
            'coverage_uuid' => 'f6e989b3-c4d0-4a59-89e9-9f16e8d87f8c',
            'activity_definition_uuid' => '488d8bcb-5b88-438c-9077-f177f6f32626',
        ];

        // Construct claim items
        $claimItems = array_map(function ($item, $index) use ($staticConfig) {
            return [
                'extension' => [
                    [
                        'url' => 'https://openimis.github.io/openimis_fhir_r4_ig/StructureDefinition/claim-item-reference',
                        'valueReference' => [
                            'reference' => "ActivityDefinition/{$staticConfig['activity_definition_uuid']}",
                            'type' => 'ActivityDefinition',
                            'identifier' => [
                                'type' => [
                                    'coding' => [
                                        [
                                            'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                            'code' => 'UUID',
                                        ],
                                    ],
                                ],
                                'value' => $staticConfig['activity_definition_uuid'],
                            ],
                        ],
                    ],
                ],
                'sequence' => $index + 1,
                'category' => ['text' => 'service'],
                'productOrService' => ['text' =>  'A1'], //$item['description'] ?? 'Unknown Service'],
                'quantity' => ['value' => (float) $item['quantity']],
                'unitPrice' => ['value' => (float) $item['unitPrice']['value']]
            ];
        }, $validated['item'], array_keys($validated['item']));

        // Construct diagnosis
        $diagnosis = [
            [
                'sequence' => 1,
                'diagnosisCodeableConcept' => [
                    'coding' => [
                        [
                            'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/diagnosis-ICD10-level1',
                            'code' => 'A000',
                            'display' => 'Cholera due to Vibrio cholerae 01, biovar cholerae',
                        ],
                    ],
                ],
            ],
        ];

        // Construct supportingInfo
        $supportingInfo = [];
        if (!empty($validated['supportingInfo'])) {
            $supportingInfo = array_map(function ($info) {
                if ($info['category']['coding'][0]['code'] === 'guarantee') {
                    return [
                        'sequence' => $info['sequence'],
                        'category' => [
                            'coding' => [
                                [
                                    'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/claim-supporting-info-category',
                                    'code' => 'guarantee',
                                ],
                            ],
                        ],
                        'valueString' => $info['valueString'],
                    ];
                } elseif ($info['category']['coding'][0]['code'] === 'attachment') {
                    return [
                        'sequence' => $info['sequence'],
                        'category' => [
                            'coding' => [
                                [
                                    'code' => 'attachment',
                                    'display' => 'Attachment',
                                ],
                            ],
                            'text' => 'attachment',
                        ],
                        'valueAttachment' => [
                            'contentType' => $info['valueAttachment']['contentType'],
                            'creation' => $info['valueAttachment']['creation'],
                            'data' => $info['valueAttachment']['data'],
                            'hash' => $info['valueAttachment']['hash'] ?? '',
                            'title' => $info['valueAttachment']['title'],
                        ],
                    ];
                }
                Log::warning('Unsupported supportingInfo category', ['category' => $info['category']['coding'][0]['code']]);
                return null;
            }, $validated['supportingInfo']);

            // Filter out null entries
            $supportingInfo = array_filter($supportingInfo);
            $supportingInfo = array_values($supportingInfo); // Reindex array
        }

        // Construct FHIR Claim payload
        $payload = [
            'resourceType' => 'Claim',
            'identifier' => [
                [
                    'type' => [
                        'coding' => [
                            [
                                'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                'code' => 'Code',
                            ],
                        ],
                    ],
                    'value' => 'CLAIM_' . time(),
                ],
            ],
            'status' => 'active',
            'type' => [
                'coding' => [
                    [
                        'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/claim-visit-type',
                        'code' => 'O', // Validate this code
                        'display' => 'Other',
                    ],
                ],
            ],
            'use' => 'claim',
            'patient' => [
                'reference' => "Patient/{$validated['patient']['identifier']['value']}",
                'type' => 'Patient',
                'identifier' => [
                    'type' => [
                        'coding' => [
                            [
                                'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                'code' => 'UUID',
                            ],
                        ],
                    ],
                    'value' => $validated['patient']['identifier']['value'],
                ],
            ],
            'billablePeriod' => [
                'start' => now()->toDateString(),
                'end' => now()->toDateString(),
            ],
            'created' => now()->toDateString(),
            'enterer' => [
                'reference' => "Practitioner/{$staticConfig['enterer_uuid']}",
                'type' => 'Practitioner',
                'identifier' => [
                    'type' => [
                        'coding' => [
                            [
                                'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                'code' => 'UUID',
                            ],
                        ],
                    ],
                    'value' => $staticConfig['enterer_uuid'],
                ],
            ],
            'provider' => [
                'reference' => "Organization/{$staticConfig['provider_org_uuid']}",
                'type' => 'Organization',
                'identifier' => [
                    'type' => [
                        'coding' => [
                            [
                                'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                'code' => 'UUID',
                            ],
                        ],
                    ],
                    'value' => $staticConfig['provider_org_uuid'],

                ],
            ],
            'priority' => [
                'coding' => [
                    [
                        'system' => 'http://terminology.hl7.org/CodeSystem/processpriority',
                        'code' => 'normal',
                        'display' => 'Normal',
                    ],
                ],
            ],
            'diagnosis' => $diagnosis,
            'insurance' => [
                [
                    'sequence' => 1,
                    'focal' => true,
                    'coverage' => [
                        'reference' => "Coverage/{$staticConfig['coverage_uuid']}",
                        'type' => 'Coverage',
                        'identifier' => [
                            'type' => [
                                'coding' => [
                                    [
                                        'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                                        'code' => 'UUID',
                                    ],
                                ],
                            ],
                            'value' => $staticConfig['coverage_uuid'],
                        ],
                    ],
                ],
            ],
            'item' => $claimItems,
            'total' => [
                'value' => (float) $validated['total']['value'],
                'currency' => '$',
            ],
        ];

        // Add supportingInfo if present
        if (!empty($supportingInfo)) {
            $payload['supportingInfo'] = $supportingInfo;
        }
        dd(json_encode(($payload)));
        // dd($request->all());
        try {
            $response = Http::withHeaders([
                'Authorization' => $apiToken,
                'Content-Type' => 'application/json',
            ])->post($apiUrl, $payload);

            // Handle token expiry and retry
            if ($response->status() === 401 || $response->status() === 403) {
                Log::warning('FHIR API request for claim submission returned 401/403, attempting token refresh.');
                $apiToken = $this->fhirAuthService->refreshToken();
                if ($apiToken) {
                    $response = Http::withHeaders([
                        'Authorization' => $apiToken,
                        'Content-Type' => 'application/json',
                    ])->post($apiUrl, $payload);
                } else {
                    Log::error('Failed to refresh FHIR API token after 401/403 for claim submission.');
                    return response()->json(['message' => 'Service authentication failed after retry.'], 503);
                }
            }

            if ($response->successful()) {
                $responseJson = $response->json() ?? [];

                $claimUuid = $responseJson['id'] ?? null;
                $claimCode = collect($responseJson['identifier'] ?? [])
                    ->firstWhere('type.coding.0.code', 'Code')['value'] ?? null;
                $patientUuid = $responseJson['patient']['identifier']['value'] ?? null;
                $requestorUuid = $responseJson['enterer']['identifier']['value'] ?? null;
                $totalAmount = $responseJson['total']['value'] ?? null;
                $created = $responseJson['created'] ?? null;
                $insurer = $responseJson['insurer']['reference'] ?? null;
                $outcome = $responseJson['outcome'] ?? null;
                $items = $responseJson['item'] ?? [];

                $claim = Claim::create([
                    'claim_uuid' => $claimUuid,
                    'claim_code' => $claimCode,
                    'status' => $responseJson['status'] ?? 'unknown',
                    'patient_uuid' => $patientUuid,
                    'created' => $created,
                    'insurer' => $insurer,
                    'requestor_uuid' => $requestorUuid,
                    'outcome' => $outcome,
                    'total_amount' => $totalAmount,
                    'items' => json_encode($items),
                    'full_response' => json_encode($responseJson),
                ]);

                return response()->json([
                    'message' => 'Claim submitted and saved successfully',
                    'claim_uuid' => $claimUuid,
                    'data' => $responseJson,
                ], 201);
            } else {
                Log::error('FHIR API claim submission failed', [
                    'status' => $response->status(),
                    'response_body' => $response->body(),
                ]);
                return response()->json([
                    'message' => 'Failed to submit claim to FHIR service: ' . $response->body(),
                    'details' => $response->json() ?? [],
                ], $response->status());
            }
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('FHIR API HTTP Request Exception during claim submission', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Could not connect to FHIR service: ' . $e->getMessage()], 503);
        } catch (\Exception $e) {
            Log::error('General Exception during FHIR API claim submission', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'An unexpected error occurred: ' . $e->getMessage()], 500);
        }
    }
    public function fetchAndUpdateClaim($claimUuid)
    {
        $fhirUrl = env('FHIR_BASE_URL') . "/api/api_fhir_r4/ClaimResponse/{$claimUuid}";

        try {
            $apiToken = $this->fhirAuthService->getToken();
            // dd($fhirUrl);
            if (!$apiToken) {
                Log::error('Failed to obtain FHIR API token for claim response fetch.');
                return response()->json(['message' => 'Service authentication error.'], 503);
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer $apiToken",
                'Content-Type' => 'application/json',
            ])->get($fhirUrl);

            // Handle token expiry and retry
            if ($response->status() === 401 || $response->status() === 403) {
                Log::warning('FHIR API request for claim response returned 401/403, attempting token refresh.');
                $apiToken = $this->fhirAuthService->refreshToken();
                if ($apiToken) {
                    $response = Http::withHeaders([
                        'Authorization' => "Bearer $apiToken",
                        'Content-Type' => 'application/json',
                    ])->get($fhirUrl);
                } else {
                    Log::error('Failed to refresh FHIR API token after 401/403 for claim response fetch.');
                    return response()->json(['message' => 'Service authentication failed after retry.'], 503);
                }
            }

            if ($response->successful()) {

                $claimResponse = $response->json();

                $claimCode = collect($claimResponse['identifier'] ?? [])
                    ->firstWhere('type.coding.0.code', 'Code')['value'] ?? null;
                $patientUuid = $claimResponse['patient']['identifier']['value'] ?? null;
                $requestorUuid = $claimResponse['requestor']['identifier']['value'] ?? null;
                $totalAmount = null;
                $totalEntry = collect($claimResponse['total'] ?? [])
                    ->firstWhere('category.coding.0.code', '2');
                if ($totalEntry && isset($totalEntry['amount']['value'])) {
                    $totalAmount = $totalEntry['amount']['value'];
                }

                $payload = [
                    'claim_code' => $claimCode,
                    'status' => $claimResponse['status'] ?? 'unknown',
                    'patient_uuid' => $patientUuid,
                    'created' => $claimResponse['created'] ?? now(),
                    'insurer' => $claimResponse['insurer']['reference'] ?? null,
                    'requestor_uuid' => $requestorUuid,
                    'outcome' => $claimResponse['outcome'] ?? 'unknown',
                    'total_amount' => $totalAmount,
                    'items' => json_encode($claimResponse['item'] ?? []),
                    'full_response' => json_encode($claimResponse),
                ];

                $claim = $this->claimService->update($claimUuid, $payload);

                return response()->json([
                    'message' => 'Claim updated successfully from FHIR server',
                    'claim_uuid' => $claimUuid,
                    'data' => $claimResponse,
                ], 200);
            } else {
                Log::error('FHIR API claim response fetch failed', [
                    'status' => $response->status(),
                    'response_body' => $response->body(),
                ]);
                return response()->json([
                    'message' => 'Failed to fetch claim response.',
                    'details' => $response->json() ?? $response->body(),
                ], $response->status());
            }
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('FHIR API HTTP Request Exception during claim response fetch', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Could not connect to FHIR service.'], 503);
        } catch (\Exception $e) {
            Log::error('General Exception during claim response fetch', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }


    public function checkEligibility(Request $request)
    {

        // Validate essential fields of the CoverageEligibilityRequest payload
        // $validated = $request->validate([
        //     'resourceType' => 'required|string|in:CoverageEligibilityRequest',
        //     'status' => 'required|string|in:active,cancelled,draft,entered-in-error',
        //     'purpose' => 'required|array|min:1',
        //     'purpose.*' => 'string|in:validation,benefits,discovery,auth-requirements',
        //     'patient.reference' => 'required|string|regex:/^Patient\/[0-9a-zA-Z-]+$/',
        //     'created' => 'required|date',
        //     'insurance' => 'required|array|min:1',
        //     'insurance.*.focal' => 'required|boolean',
        //     'insurance.*.coverage.reference' => 'required|string|regex:/^Coverage\/[0-9a-zA-Z-]+$/',
        //     'item' => 'sometimes|array',
        //     'item.*.category.coding.*.system' => 'sometimes|string',
        //     'item.*.category.coding.*.code' => 'sometimes|string',
        //     'item.*.category.coding.*.display' => 'sometimes|string',
        //     'item.*.productOrService.coding.*.system' => 'sometimes|string',
        //     'item.*.productOrService.coding.*.code' => 'sometimes|string',
        //     'item.*.productOrService.coding.*.display' => 'sometimes|string',
        //     'item.*.provider.reference' => 'sometimes|string|regex:/^Practitioner\/[0-9a-zA-Z-]+$/',
        //     'item.*.quantity.value' => 'sometimes|integer|min:1',
        //     'item.*.unitPrice.value' => 'sometimes|numeric|min:0',
        //     'item.*.unitPrice.currency' => 'sometimes|string',
        // ]);

        // Construct API URL
        $baseUrl = rtrim(env('FHIR_BASE_URL', 'https://demoimis.tinker.com.np'), '/');
        $apiUrl = "{$baseUrl}/api/api_fhir_r4/CoverageEligibilityRequest/";
        
        // Get authentication token
        $apiToken = $this->fhirAuthService->getToken();

        if (empty($apiToken)) {
            Log::error('Failed to obtain FHIR API Authorization Token for coverage eligibility check.');
            return response()->json(['message' => 'Service authentication error.'], 503);
        }

        try {
            // Forward the validated payload to the FHIR server
            $response = Http::withHeaders([
                'Authorization' => $apiToken,
                'Content-Type' => 'application/json',
            ])->post($apiUrl, $request->all());

            // Handle token expiry and retry
            if ($response->status() === 401 || $response->status() === 403) {
                Log::warning('FHIR API request for coverage eligibility returned 401/403, attempting token refresh.');
                $apiToken = $this->fhirAuthService->refreshToken();
                if ($apiToken) {
                    $response = Http::withHeaders([
                        'Authorization' => $apiToken,
                        'Content-Type' => 'application/json',
                    ])->post($apiUrl, $request->all());
                } else {
                    Log::error('Failed to refresh FHIR API token after 401/403 for coverage eligibility.');
                    return response()->json(['message' => 'Service authentication failed after retry.'], 503);
                }
            }
            if ($response->successful()) {
                return response()->json($response->json(), $response->status());
            } else {
                Log::error('FHIR API coverage eligibility check failed', [
                    'status' => $response->status(),
                    'response_body' => $response->body(),
                ]);
                return response()->json([
                    'message' => 'Failed to process coverage eligibility request.' . $response->body(),
                    'details' => $response->json() ?? $response->body(),
                ], $response->status());
            }
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('FHIR API HTTP Request Exception during coverage eligibility check', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Could not connect to FHIR service.'], 503);
        } catch (\Exception $e) {
            Log::error('General Exception during FHIR API coverage eligibility check', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    protected function generateBenefitItems($validated)
    {
        // Simplified benefit items generation (customize based on actual requirements)
        return [
            [
                'category' => [
                    'coding' => [
                        [
                            'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/coverage-item-category',
                            'code' => 'benefit',
                            'display' => 'Benefit Package'
                        ]
                    ]
                ],
                'name' => 'RX01',
                'description' => 'Regional fixed enrolment',
                'benefit' => [
                    [
                        'type' => [
                            'coding' => [
                                [
                                    'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/coverage-item-benefit-type',
                                    'code' => 'admissions_left',
                                    'display' => 'total_admissions'
                                ]
                            ]
                        ],
                        'allowedUnsignedInt' => 2
                    ],
                    [
                        'type' => [
                            'coding' => [
                                [
                                    'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/coverage-item-benefit-type',
                                    'code' => 'consultations_left',
                                    'display' => 'total_consultations'
                                ]
                            ]
                        ],
                        'allowedUnsignedInt' => 4
                    ],
                    [
                        'type' => [
                            'coding' => [
                                [
                                    'system' => 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/coverage-item-benefit-type',
                                    'code' => 'hospitalization_amount',
                                    'display' => 'hospitalization_amount'
                                ]
                            ]
                        ],
                        'allowedMoney' => [
                            'value' => 25000,
                            'currency' => 'USD'
                        ]
                    ]
                ]
            ]
        ];
    }
}
