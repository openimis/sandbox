<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';
import InputError from "@/Components/InputError.vue";
import { useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import Button from "@/Components/Button.vue";
import SubmitButton from "@/Components/SubmitButton.vue";
import { showToast } from "@/Utils/Helper.js";

const { fhirEndpoint = null } = defineProps({
    fhirEndpoint: {
        type: Object,
        default: null,
    },
});

const form = useForm({
    fhir_endpoint_url: fhirEndpoint?.fhir_endpoint_url || null,
    fhir_username: fhirEndpoint?.fhir_username || null,
    fhir_password: fhirEndpoint?.fhir_password || null,
    practitioner: fhirEndpoint?.practitioner || null,
    provider: fhirEndpoint?.provider || null,
    insurance_coverage_uuid: fhirEndpoint?.insurance_coverage_uuid || null,
    is_default: fhirEndpoint?.is_default || false,
});

const urlInput = ref(null);
const showPassword = ref(false);

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};

const submit = () => {
    const method = fhirEndpoint ? 'patch' : 'post';
    const routeName = fhirEndpoint ? 'fhir-endpoints.update' : 'fhir-endpoints.store';
    const routeParams = fhirEndpoint ? { fhir_endpoint: fhirEndpoint.id } : {};

    form[method](route(routeName, routeParams), {
        preserveScroll: true,
        onSuccess: () => {
            showToast(fhirEndpoint ? 'FHIR Endpoint updated successfully' : 'FHIR Endpoint created successfully');
        },
        onError: () => urlInput.value.focus(),
    });
};
</script>

<template>
    <Head :title="fhirEndpoint ? 'Edit FHIR Endpoint' : 'Create FHIR Endpoint'" />

    <AuthenticatedLayout>
        <template #breadcrumb>
            FHIR Endpoints > {{ fhirEndpoint ? 'Edit' : 'Create' }}
        </template>

        <div class="flex flex-wrap">
            <div class="w-full px-4">
                <div class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
                    <div class="rounded-t mb-3 px-4 py-3 border-0">
                        <div class="flex flex-wrap items-center">
                            <div class="relative w-full px-4 max-w-full flex-grow flex-1">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-2xl">{{ fhirEndpoint ? 'Edit FHIR Endpoint' : 'Create FHIR Endpoint' }}</h4>
                                    <Button
                                        :href="route('fhir-endpoints.index')"
                                        buttonType="link"
                                    >
                                        Go Back
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="block w-full overflow-x-auto px-8 py-4">
                        <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                            <div class="flex flex-col">
                                <label for="fhir_endpoint_url" class="text-stone-600 text-sm font-medium">FHIR Endpoint URL</label>
                                <input
                                    id="fhir_endpoint_url"
                                    ref="urlInput"
                                    v-model="form.fhir_endpoint_url"
                                    @keyup.enter="submit"
                                    type="url"
                                    placeholder="Enter FHIR endpoint URL"
                                    class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                    required
                                />
                                <InputError :message="form.errors.fhir_endpoint_url" />
                            </div>
                            <div class="flex flex-col">
                                <label for="fhir_username" class="text-stone-600 text-sm font-medium">FHIR Username</label>
                                <input
                                    id="fhir_username"
                                    v-model="form.fhir_username"
                                    @keyup.enter="submit"
                                    type="text"
                                    placeholder="Enter FHIR username"
                                    class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                />
                                <InputError :message="form.errors.fhir_username" />
                            </div>
                            <div class="flex flex-col relative">
                                <label for="fhir_password" class="text-stone-600 text-sm font-medium">FHIR Password</label>
                                <div class="relative">
                                    <input
                                        id="fhir_password"
                                        v-model="form.fhir_password"
                                        @keyup.enter="submit"
                                        :type="showPassword ? 'text' : 'password'"
                                        placeholder="Enter FHIR password"
                                        class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 pr-10 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                    />
                                    <button
                                        type="button"
                                        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                                        @click="togglePasswordVisibility"
                                    >
                                        <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                    </button>
                                </div>
                                <InputError :message="form.errors.fhir_password" />
                            </div>
                            <div class="flex flex-col">
                                <label for="practitioner" class="text-stone-600 text-sm font-medium">Practitioner</label>
                                <input
                                    id="practitioner"
                                    v-model="form.practitioner"
                                    @keyup.enter="submit"
                                    type="text"
                                    placeholder="Enter practitioner"
                                    class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                />
                                <InputError :message="form.errors.practitioner" />
                            </div>
                            <div class="flex flex-col">
                                <label for="provider" class="text-stone-600 text-sm font-medium">Provider</label>
                                <input
                                    id="provider"
                                    v-model="form.provider"
                                    @keyup.enter="submit"
                                    type="text"
                                    placeholder="Enter provider"
                                    class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                />
                                <InputError :message="form.errors.provider" />
                            </div>
                            <div class="flex flex-col">
                                <label for="insurance_coverage_uuid" class="text-stone-600 text-sm font-medium">Insurance Coverage UUID</label>
                                <input
                                    id="insurance_coverage_uuid"
                                    v-model="form.insurance_coverage_uuid"
                                    @keyup.enter="submit"
                                    type="text"
                                    placeholder="Enter insurance coverage UUID"
                                    class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                />
                                <InputError :message="form.errors.insurance_coverage_uuid" />
                            </div>
                            <div class="flex flex-col">
                                <label for="is_default" class="text-stone-600 text-sm font-medium">Set as Default</label>
                                <input
                                    id="is_default"
                                    v-model="form.is_default"
                                    type="checkbox"
                                    class="mt-2 h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <InputError :message="form.errors.is_default" />
                            </div>
                        </div>
                        <div class="my-6 flex justify-end">
                            <SubmitButton
                                :processing="form.processing"
                                @click="submit"
                                class="text-white bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                            >
                                {{ fhirEndpoint ? 'Update' : 'Create' }}
                            </SubmitButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>