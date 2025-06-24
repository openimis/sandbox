<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm } from '@inertiajs/vue3';
import CardTable from '@/Components/Cards/CardTable.vue';
import TableData from '@/Components/TableData.vue';
import Button from '@/Components/Button.vue';
import Modal from '@/Components/Modal.vue';
import { ref, watch } from 'vue';
import { numberFormat, showToast, truncateString } from '@/Utils/Helper.js';
import axios from 'axios';

defineProps({
    filters: {
        type: Object,
        default: () => ({}),
    },
    claims: {
        type: Object,
        default: () => ({ data: [], total: 0, current_page: 1, per_page: 10 }),
    },
});

const selectedClaim = ref(null);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const tableHeads = ref(['#', 'Claim Code', 'Patient UUID', 'Total Amount', 'Status', 'Outcome', 'Claim Status', 'Created', 'Insurer', 'Actions']);

const form = useForm({});

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

// Helper function to get status color
const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'active':
            return { color: 'emerald', text: 'Active' };
        case 'cancelled':
            return { color: 'red', text: 'Cancelled' };
        case 'draft':
            return { color: 'amber', text: 'Draft' };
        case 'entered-in-error':
            return { color: 'red', text: 'Error' };
        default:
            return { color: 'gray', text: 'Unknown' };
    }
};

// Helper function to get outcome color
const getOutcomeColor = (outcome) => {
    switch (outcome?.toLowerCase()) {
        case 'queued':
            return { color: 'blue', text: 'Queued' };
        case 'complete':
            return { color: 'emerald', text: 'Completed' };
        case 'error':
            return { color: 'red', text: 'Error' };
        default:
            return { color: 'gray', text: outcome || '-' };
    }
};

// Safely parse JSON for full_response
const getParsedFullResponse = (fullResponse) => {
    try {
        return fullResponse ? JSON.parse(fullResponse) : {};
    } catch (e) {
        console.error('Failed to parse full_response:', e);
        return { error: 'Invalid JSON data' };
    }
};

const getRejectionReason = (claim) => {
    try {
        // Parse the items field
        const items = JSON.parse(claim.items);
        // Navigate to the adjudication
        const adjudication = items[0]?.adjudication[0];
        // Get the rejection status (e.g., "rejected") and reason (e.g., "NO PRODUCT FOUND")
        const status = adjudication?.category?.coding[0]?.display || 'Unknown';
        const reason = adjudication?.reason?.coding[0]?.display || 'No reason provided';
        // Concatenate status and reason
        return `${status} - ${reason}`;
    } catch (e) {
        console.error('Failed to parse items for rejection reason:', e);
        return 'Error retrieving rejection reason';
    }
};
const viewClaimModal = (claim, event) => {
    event.preventDefault();
    event.stopPropagation();
    selectedClaim.value = claim;
    showViewModal.value = true;
    console.log('Opened view modal for claim:', claim.id);
};

const deleteClaimModal = (claim, event) => {
    event.preventDefault();
    event.stopPropagation();
    selectedClaim.value = claim;
    showDeleteModal.value = true;
};

const deleteClaim = () => {
    form.delete(route('claim.destroy', selectedClaim.value.id), {
        preserveScroll: true,
        onSuccess: () => {
            closeModal();
            showToast('success', 'Claim deleted successfully');
        },
        onError: () => {
            showToast('error', 'Failed to delete claim');
        },
    });
};

const refreshClaim = async (claim, event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
        const response = await axios.get(`/api/fhir/claim/update/${claim.claim_uuid}`);
        showToast('success', 'Claim updated successfully');
        // Optionally reload the page or update the claims prop
        window.location.reload();
    } catch (error) {
        console.error('Failed to refresh claim:', error);
        showToast('error', `Failed to update claim: ${error.response?.data?.message || 'Unknown error'}`);
    }
};

const closeModal = () => {
    console.log('Closing modal');
    showViewModal.value = false;
    showDeleteModal.value = false;
    selectedClaim.value = null;
    form.reset();
};

// Debug modal state changes
watch(showViewModal, (newValue) => {
    console.log('showViewModal changed:', newValue);
});
</script>

<template>
    <Head title="Claims" />

    <AuthenticatedLayout>
        <template #breadcrumb>
            Claims
        </template>

        <div class="flex flex-wrap">
            <div class="w-full px-4">
                <CardTable
                    indexRoute="claim.index"
                    :paginatedData="claims"
                    :filters="filters"
                    :tableHeads="tableHeads"
                >
                    <template #cardHeader>
                        <div class="flex justify-between items-center">
                            <h4 class="text-2xl">Claims ({{ claims?.total ?? 0 }})</h4>
                            <Button
                                :href="route('patient.billing.index')"
                                buttonType="link"
                            >
                                Submit New Claim
                            </Button>
                        </div>
                    </template>

                    <tr v-for="(claim, index) in claims?.data ?? []" :key="claim.id">
                        <TableData>
                            {{ (claims.current_page * claims.per_page) - (claims.per_page - (index + 1)) }}
                        </TableData>
                        <TableData :title="claim.claim_code">
                            {{ truncateString(claim.claim_code || '-', 15) }}
                        </TableData>
                        <TableData :title="claim.patient_uuid">
                            {{ truncateString(claim.patient_uuid || '-', 15) }}
                        </TableData>
                        <TableData>
                            {{ numberFormat(claim.total_amount ?? 0) }} USD
                        </TableData>
                        <TableData>
                            <span
                                :class="`text-xs font-semibold inline-block py-1 px-2 rounded text-${getStatusColor(claim.status).color}-600 bg-${getStatusColor(claim.status).color}-200`"
                            >
                                {{ getStatusColor(claim.status).text }}
                            </span>
                        </TableData>
                        <TableData>
                            <span
                                :class="`text-xs font-semibold inline-block py-1 px-2 rounded text-${getOutcomeColor(claim.outcome).color}-600 bg-${getOutcomeColor(claim.outcome).color}-200`"
                            >
                                {{ getOutcomeColor(claim.outcome).text }}
                            </span>
                        </TableData>
                        <TableData>
        {{ getRejectionReason(claim) }}
    </TableData>
                        <TableData>
                            {{ formatDate(claim.created) }}
                        </TableData>
                        <TableData :title="claim.insurer">
                            {{ truncateString(claim.insurer || '-', 15) }}
                        </TableData>
                        <TableData>
                            <Button
                                @click="viewClaimModal(claim, $event)"
                                buttonType="button"
                                class="mr-2"
                            >
                                <i class="fa fa-eye"></i>
                            </Button>
                            <Button
                                @click="refreshClaim(claim, $event)"
                                buttonType="button"
                                
                            >
                                <i class="fa fa-retweet"></i>
                            </Button>
                            <Button
                                @click="deleteClaimModal(claim, $event)"
                                type="red"
                            >
                                <i class="fa fa-trash-alt"></i>
                            </Button>
                        </TableData>
                    </tr>
                </CardTable>
            </div>
        </div>

        <!-- View Claim Modal -->
        <Modal
            title="Claim Details"
            :show="showViewModal"
            :formProcessing="false"
            @close="closeModal"
            maxWidth="lg"
            submitButtonText="Close"
            @submitAction="closeModal"
        >
            <pre v-if="selectedClaim" class="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {{ JSON.stringify(getParsedFullResponse(selectedClaim.full_response), null, 2) }}
            </pre>
            <p v-else>No claim selected.</p>
        </Modal>

        <!-- Delete Claim Modal -->
        <Modal
            title="Delete Claim"
            :show="showDeleteModal"
            :formProcessing="form.processing"
            @close="closeModal"
            @submitAction="deleteClaim"
            maxWidth="sm"
            submitButtonText="Yes, delete it!"
        >
            Are you sure you want to delete this claim ({{ selectedClaim?.claim_code || '' }})?
        </Modal>
    </AuthenticatedLayout>
</template>
