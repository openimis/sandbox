<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head, useForm } from '@inertiajs/vue3';
import Button from '@/Components/Button.vue';
import { showToast } from '@/Utils/Helper.js';

defineProps({
    fhirEndpoints: {
        type: Array,
        required: true,
    },
});

const deleteForm = useForm({});

const deleteEndpoint = (id) => {
    if (confirm('Are you sure you want to delete this FHIR endpoint?')) {
        deleteForm.delete(route('fhir-endpoints.destroy', { fhir_endpoint: id }), {
            preserveScroll: true,
            onSuccess: () => {
                showToast('FHIR Endpoint deleted successfully');
            },
            onError: () => {
                showToast('Failed to delete FHIR endpoint', 'error');
            },
        });
    }
};
</script>

<template>
    <Head title="FHIR Endpoints" />
    <AuthenticatedLayout>
        <template #breadcrumb>
            FHIR Endpoints
        </template>
        <div class="flex flex-wrap">
            <div class="w-full px-4">
                <div class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
                    <div class="rounded-t mb-3 px-4 py-3 border-0">
                        <div class="flex justify-between items-center">
                            <h4 class="text-2xl">FHIR Endpoints</h4>
                            <Button
                                :href="route('fhir-endpoints.create')"
                                buttonType="primary"
                                class="bg-emerald-600 text-white px-4 py-2 rounded"
                            >
                                Add New Endpoint
                            </Button>
                        </div>
                    </div>
                    <div class="block w-full overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="endpoint in fhirEndpoints" :key="endpoint.id">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ endpoint.fhir_endpoint_url }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ endpoint.fhir_username }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <i :class="endpoint.is_default ? 'fas fa-check text-green-500' : 'fas fa-times text-red-500'"></i>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Button
                                            :href="route('fhir-endpoints.edit', { fhir_endpoint: endpoint.id })"
                                            buttonType="link"
                                            class="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            @click="deleteEndpoint(endpoint.id)"
                                            buttonType="link"
                                            class="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                                <tr v-if="!fhirEndpoints.length">
                                    <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">No FHIR endpoints found.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>