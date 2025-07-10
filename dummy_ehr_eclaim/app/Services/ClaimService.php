<?php
namespace App\Services;

use App\Enums\Claim\ClaimFieldsEnum;
use App\Enums\Claim\ClaimFiltersEnum;
use App\Enums\Core\SortOrderEnum;
use App\Exceptions\ClaimNotFoundException;
use App\Helpers\ArrayHelper;
use App\Helpers\BaseHelper;
use App\Models\Claim;
use App\Repositories\ClaimRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClaimService
{
    public function __construct(
        private readonly ClaimRepository $repository
    ) {
    }

    /**
     * Get all claims with pagination, filtering, sorting, and field selection.
     *
     * @param array $queryParameters
     * @return LengthAwarePaginator
     */
    public function getAll(array $queryParameters): LengthAwarePaginator
    {
        $page = $queryParameters['page'] ?? 1;
        $perPage = BaseHelper::perPage($queryParameters['per_page'] ?? null);

        return $this->repository->getAll(
            page: $page,
            perPage: $perPage,
            // filters: ArrayHelper::getFiltersValues($queryParameters, ClaimFiltersEnum::values()),
            // fields: $queryParameters['fields'] ?? [],
            // expand: $queryParameters['expand'] ?? [],
            // sortBy: $queryParameters['sort_by'] ?? ClaimFieldsEnum::CREATED->value,
            // sortOrder: $queryParameters['sort_order'] ?? SortOrderEnum::DESC->value,
        );
    }

    /**
     * Find a claim by ID.
     *
     * @param int $id
     * @param array $expands
     * @return Claim|null
     * @throws ClaimNotFoundException
     */
    public function findByIdOrFail(int $id, array $expands = []): ?Claim
    {
        $claim = $this->repository->find([
            // ClaimFiltersEnum::ID->value => $id
        ], $expands);

        if (!$claim) {
            //throw new ClaimNotFoundException('Claim not found by the given ID.');
        }

        return $claim;
    }

    /**
     * Create a new claim (placeholder).
     *
     * @param array $payload
     * @return Claim
     * @throws DBCommitException
     */
    public function create(array $payload): Claim
    {
        // Claims are typically created via FHIR API, but this is a placeholder
        return $this->repository->create($payload);
    }

    /**
     * Update an existing claim (placeholder).
     *
     * @param int $id
     * @param array $payload
     * @return Claim
     * @throws ClaimNotFoundException
     * @throws Exception
     */
    public function update(int $id, array $payload): Claim
    {
        $claim = $this->findByIdOrFail($id);
        return $this->repository->update($claim, $payload);
    }

    /**
     * Delete a claim.
     *
     * @param int $id
     * @return bool|null
     * @throws ClaimNotFoundException
     */
    public function delete(int $id): ?bool
    {
        $claim = $this->findByIdOrFail($id);
        return $this->repository->delete($claim);
    }
}
