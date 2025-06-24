<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FhirAuthService
{
    protected string $loginUrl;
    protected string $username;
    protected string $password;
    protected string $cacheKey = 'fhir_api_auth_token';
    protected int $tokenLifetimeMinutes = 1400; // Approx 23 hours, just under the typical 24hr expiry

    public function __construct()
    {
        $this->loginUrl = env('FHIR_BASE_URL') . '/api/api_fhir_r4/login/';
        $this->username = env('FHIR_API_USERNAME');
        $this->password = env('FHIR_API_PASSWORD');

        if (empty($this->loginUrl) || empty($this->username) || empty($this->password)) {
            Log::critical('FHIR Authentication credentials or URL are not configured.');
            // Consider throwing an exception here if critical for application startup
        }
    }

    /**
     * Get the API token, fetching a new one if necessary.
     *
     * @return string|null The Bearer token or null on failure.
     */
    public function getToken(): ?string
    {
        if (Cache::has($this->cacheKey)) {
            return Cache::get($this->cacheKey);
        }

        return $this->fetchAndCacheToken();
    }

    /**
     * Force refresh the token.
     *
     * @return string|null The new Bearer token or null on failure.
     */
    public function refreshToken(): ?string
    {
        return $this->fetchAndCacheToken();
    }

    /**
     * Fetch a new token from the FHIR login API and cache it.
     *
     * @return string|null
     */
    protected function fetchAndCacheToken(): ?string
    {
        if (empty($this->loginUrl) || empty($this->username) || empty($this->password)) {
            Log::error('Cannot fetch FHIR token: Credentials or URL missing.');
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($this->loginUrl, [
                'username' => $this->username,
                'password' => $this->password,
            ]);

            if ($response->successful() && isset($response->json()['token'])) {
                $tokenData = $response->json();
                $bearerToken = 'Bearer ' . $tokenData['token'];

                // Calculate lifetime: exp is a UNIX timestamp (seconds)
                $expiresInSeconds = isset($tokenData['exp']) ? ($tokenData['exp'] - time()) : ($this->tokenLifetimeMinutes * 60);
                $cacheDuration =  60; //$expiresInSeconds > 60 ? $expiresInSeconds - 30 : 30; // buffer time

                Cache::put($this->cacheKey, $bearerToken, $cacheDuration);
                Log::info('Successfully fetched and cached new FHIR API token.');
                return $bearerToken;
            } else {
                Log::error('Failed to fetch FHIR API token.', [
                    'status' => $response->status(),
                    'response_body' => $response->body(),
                ]);
                Cache::forget($this->cacheKey);
                return null;
            }
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('FHIR API Login HTTP Request Exception', ['message' => $e->getMessage()]);
            return null;
        } catch (\Exception $e) {
            Log::error('General Exception during FHIR API login', ['message' => $e->getMessage()]);
            return null;
        }
    }
}
