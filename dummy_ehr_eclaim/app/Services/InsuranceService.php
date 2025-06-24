<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class FhirClaimService
{
    protected $baseUrl =  env('FHIR_BASE_URL') . '/api/api_fhir_r4';//'https://demoimis.tinker.com.np/api/api_fhir_r4';
    protected $token;

    /**
     * Login to the FHIR API and store the bearer token
     *
     * @throws RequestException
     */
    public function login()
    {
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post("{$this->baseUrl}/login/", [
            'username' => 'abcd',
            'password' => 'abcd',
        ]);

        if ($response->successful()) {
            $this->token = $response->json()['token'] ?? null;
            if (!$this->token) {
                throw new \Exception('Failed to obtain bearer token');
            }
        } else {
            throw new RequestException($response);
        }

        return $this;
    }

    /**
     * Submit a FHIR Claim
     *
     * @param array $claimData
     * @return array
     * @throws RequestException
     */
    public function submitClaim(array $claimData)
    {
        if (!$this->token) {
            $this->login();
        }

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Authorization' => "Bearer {$this->token}",
        ])->post("{$this->baseUrl}/Claim/", $claimData);

        if ($response->failed()) {
            throw new RequestException($response);
        }

        return $response->json();
    }
}