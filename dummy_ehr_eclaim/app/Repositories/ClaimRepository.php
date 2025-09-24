<?php

namespace App\Repositories;

use App\Enums\Claim\ClaimFieldsEnum;
use App\Enums\Claim\ClaimFiltersEnum;
use App\Exceptions\DBCommitException;
use App\Models\Claim;
use Carbon\Carbon;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ClaimRepository
{
    const MAX_RETRY = 5;

    /**
     * Get all claims with pagination, filtering, sorting, and field selection.
     *
     * @param int $page
     * @param int $perPage
     * @param array $filters
     * @param array $fields
     * @param array $expand
     * @param string $sortBy
     * @param string $sortOrder
     * @return LengthAwarePaginator
     */
    public function getAll(
        int $page,
        int $perPage,
        array $filters = [],
        array $fields = [],
        array $expand = [],
        string $sortBy = "created",
        string $sortOrder = "desc"
    ): LengthAwarePaginator
    {
        $query = $this->getQuery($filters)
            ->orderBy($sortBy, $sortOrder)
            ->with($expand);

        if (count($fields) > 0) {
            $query = $query->select($fields);
        }

        return $query->paginate(
            perPage: $perPage,
            page: $page
        )->withQueryString();
    }

    /**
     * Check if a claim exists with the given filters.
     *
     * @param array $filters
     * @return bool
     */
    public function exists(array $filters = []): bool
    {
        return $this->getQuery($filters)->exists();
    }

    /**
     * Find a claim by filters.
     *
     * @param array $filters
     * @param array $expand
     * @return Claim|null
     */
    public function find(array $filters = [], array $expand = []): ?Claim
    {
        return $this->getQuery($filters)
            ->with($expand)
            ->first();
    }

    /**
     * Create a new claim.
     *
     * @param array $payload
     * @return Claim
     * @throws DBCommitException
     */
    public function create(array $payload): Claim
    {
        try {
            DB::beginTransaction();
            $claim = Claim::create($payload);
            DB::commit();
            return $claim;
        } catch (Exception $exception) {
            DB::rollBack();
            throw new DBCommitException($exception);
        }
    }

    /**
     * Update an existing claim.
     *
     * @param Claim $claim
     * @param array $changes
     * @return Claim
     * @throws Exception
     */
    public function update(Claim $claim, array $changes): Claim
    {
        $attempt = 1;
        do {
            $updated = $claim->update($changes);
            $attempt++;
        } while (!$updated && $attempt <= self::MAX_RETRY);

        if (!$updated && $attempt > self::MAX_RETRY) {
            throw new Exception("Max retry exceeded during claim update");
        }

        return $claim->refresh();
    }

    /**
     * Delete a claim.
     *
     * @param Claim $claim
     * @return bool|null
     */
    public function delete(Claim $claim): ?bool
    {
        return $claim->delete();
    }

    /**
     * Build a query with the given filters.
     *
     * @param array $filters
     * @return Builder
     */
    private function getQuery(array $filters): Builder
    {
        return Claim::query();
            // ->when(isset($filters[ClaimFiltersEnum::KEYWORD->value]), function ($query) use ($filters) {
            //     $query->where(ClaimFieldsEnum::CLAIM_CODE->value, 'like', "%{$filters[ClaimFiltersEnum::KEYWORD->value]}%")
            //         ->orWhere(ClaimFieldsEnum::PATIENT_UUID->value, 'like', "%{$filters[ClaimFiltersEnum::KEYWORD->value]}%")
            //         ->orWhere(ClaimFieldsEnum::INSURER->value, 'like', "%{$filters[ClaimFiltersEnum::KEYWORD->value]}%");
            // })
            // ->when(isset($filters[ClaimFiltersEnum::ID->value]), function ($query) use ($filters) {
            //     $query->where(ClaimFieldsEnum::ID->value, $filters[ClaimFiltersEnum::ID->value]);
            // })
            // ->when(isset($filters[ClaimFiltersEnum::CLAIM_CODE->value]), function ($query) use ($filters) {
            //     $query->where(ClaimFieldsEnum::CLAIM_CODE->value, 'like', "%{$filters[ClaimFiltersEnum::CLAIM_CODE->value]}%");
            // })
            // ->when(isset($filters[ClaimFiltersEnum::PATIENT_UUID->value]), function ($query) use ($filters) {
            //     $query->where(ClaimFieldsEnum::PATIENT_UUID->value, 'like', "%{$filters[ClaimFiltersEnum::PATIENT_UUID->value]}%");
            // })
            // ->when(isset($filters[ClaimFiltersEnum::STATUS->value]), function ($query) use ($filters) {
            //     $query->where(ClaimFieldsEnum::STATUS->value, $filters[ClaimFiltersEnum::STATUS->value]);
            // })
            // ->when(isset($filters[ClaimFiltersEnum::OUTCOME->value]), function ($query) use ($filters) {
            //     $query->where(ClaimFieldsEnum::OUTCOME->value, $filters[ClaimFiltersEnum::OUTCOME->value]);
            // })
            // ->when(isset($filters[ClaimFiltersEnum::INSURER->value]), function ($query) use ($filters) {
            //     $query->where(ClaimFieldsEnum::INSURER->value, 'like', "%{$filters[ClaimFiltersEnum::INSURER->value]}%");
            // })
            // ->when(isset($filters[ClaimFiltersEnum::TOTAL_AMOUNT->value]), function ($query) use ($filters) {
            //     $query->whereBetween(ClaimFieldsEnum::TOTAL_AMOUNT->value, $filters[ClaimFiltersEnum::TOTAL_AMOUNT->value]);
            // })
            // ->when(isset($filters[ClaimFiltersEnum::CREATED->value]), function ($query) use ($filters) {
            //     $query->whereBetween(ClaimFieldsEnum::CREATED->value, [
            //         $filters[ClaimFiltersEnum::CREATED->value][0],
            //         $filters[ClaimFiltersEnum::CREATED->value][1] ?? Carbon::parse($filters[ClaimFiltersEnum::CREATED->value][0])->endOfDay()->format("Y-m-d H:i:s")
            //     ]);
            // });
    }
}