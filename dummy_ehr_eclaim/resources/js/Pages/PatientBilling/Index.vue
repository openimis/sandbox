<script setup>
import { ref, computed } from 'vue';
import { Head, useForm } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import Button from '@/Components/Button.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import TextInput from '@/Components/TextInput.vue';
import SubmitButton from '@/Components/SubmitButton.vue';
import Modal from '@/Components/Modal.vue';
import AsyncVueSelect from '@/Components/AsyncVueSelect.vue';
import { showToast, numberFormat } from '@/Utils/Helper.js';
import axios from 'axios';

const eligibilityForm = useForm({
    insurance_no: '',
});

const patientFhirData = ref(null);
const eligibilityCheckError = ref('');
const isLoadingEligibility = ref(false);
const showEligibilityModal = ref(false);
const eligibilityModalMessage = ref('');

const coverageData = ref(null);
const isLoadingCoverage = ref(false);
const showCoverageModal = ref(false);
const coverageModalMessage = ref('');

// NEW: Attachment-related variables
const showAttachmentModal = ref(false);
const attachments = ref([]);
const fileInput = ref(null);
const guaranteeId = ref('');
const attachmentErrors = ref('');

const checkEligibility = async () => {
    if (!eligibilityForm.insurance_no) {
        eligibilityCheckError.value = 'Insurance number is required.';
        eligibilityModalMessage.value = 'Insurance number is required.';
        showEligibilityModal.value = true;
        return;
    }
    isLoadingEligibility.value = true;
    eligibilityCheckError.value = '';
    patientFhirData.value = null;
    resetBillingForm();

    try {
        const response = await axios.post(route('fhir.patient.checkEligibility'), {
            identifier: eligibilityForm.insurance_no,
        });
        patientFhirData.value = response.data;
        if (patientFhirData.value && patientFhirData.value.id) {
            billingForm.patient_fhir_id = patientFhirData.value.id;
        }
    } catch (error) {
        console.error('Eligibility check failed:', error);
        eligibilityCheckError.value = error.response?.data?.message || 'An unexpected error occurred during eligibility check.';
        eligibilityModalMessage.value = eligibilityCheckError.value;
        patientFhirData.value = null;
        showEligibilityModal.value = true;
    } finally {
        isLoadingEligibility.value = false;
    }
};

const closeEligibilityModal = () => {
    showEligibilityModal.value = false;
    eligibilityModalMessage.value = '';
};

const checkCoverage = async () => {
    if (!patientFhirData.value?.id) {
        coverageModalMessage.value = 'Patient FHIR ID not found. Please check patient eligibility first.';
        showCoverageModal.value = true;
        return;
    }

    isLoadingCoverage.value = true;
    coverageData.value = null;
    coverageModalMessage.value = '';

    try {
        const response = await axios.post(route('fhir.coverage.checkEligibility'), {
            resourceType: "CoverageEligibilityRequest",
            status: "active",
            priority: {
                coding: [{
                    system: "http://terminology.hl7.org/CodeSystem/processpriority",
                    code: "normal"
                }]
            },
            purpose: ["validation", "benefits"],
            patient: {
                reference: `Patient/${patientFhirData.value.id}`
            },
            created: new Date().toISOString().split('T')[0],
            enterer: {
                reference: "Practitioner/123"
            },
            provider: {
                reference: "Organization/456"
            },
            insurance: [{
                focal: true,
                coverage: {
                    reference: "Coverage/9ad6e81d-ce42-43ba-aa2e-4ec3978352e8"
                }
            }],
            item: [{
                category: {
                    coding: [{
                        system: "http://terminology.hl7.org/CodeSystem/ex-benefitcategory",
                        code: "30",
                        display: "General Coverage"
                    }]
                },
                productOrService: {
                    coding: [{
                        system: "http://example.org/codes",
                        code: "exam",
                        display: "General Examination"
                    }]
                },
                provider: {
                    reference: "Practitioner/123"
                },
                quantity: {
                    value: 1
                },
                unitPrice: {
                    value: 150,
                    currency: "USD"
                }
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('fhir_token')}`
            }
        });

        coverageData.value = response.data;
        showCoverageModal.value = true;
    } catch (error) {
        console.error('Coverage eligibility check failed:', error);
        coverageModalMessage.value = error.response?.data?.message || 'An unexpected error occurred during coverage eligibility check.';
        showCoverageModal.value = true;
    } finally {
        isLoadingCoverage.value = false;
    }
};

const closeCoverageModal = () => {
    showCoverageModal.value = false;
    coverageModalMessage.value = '';
};

// NEW: Attachment modal methods
const openAttachmentModal = () => {
    showAttachmentModal.value = true;
    attachmentErrors.value = '';
};

const closeAttachmentModal = () => {
    showAttachmentModal.value = false;
    attachmentErrors.value = '';
    fileInput.value = null;
};

const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    attachmentErrors.value = '';

    files.forEach((file) => {
        if (!allowedTypes.includes(file.type)) {
            attachmentErrors.value = `File ${file.name} is not a supported type (JPEG, PNG, PDF).`;
            return;
        }
        if (file.size > maxSize) {
            attachmentErrors.value = `File ${file.name} exceeds 5MB limit.`;
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result.split(',')[1]; // Remove data URI prefix
            attachments.value.push({
                name: file.name,
                type: file.type,
                base64: base64Data,
                creation: new Date().toISOString(),
            });
        };
        reader.onerror = () => {
            attachmentErrors.value = `Failed to read file ${file.name}.`;
        };
        reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInput.value) {
        fileInput.value.value = '';
    }
};

const removeAttachment = (index) => {
    attachments.value.splice(index, 1);
};

const confirmAttachments = () => {
    if (attachmentErrors.value) return;
    closeAttachmentModal();
    showToast('success', 'Attachments added successfully.');
};

// Patient details computed properties
const patientDisplayName = computed(() => {
    if (!patientFhirData.value?.name?.[0]) return 'N/A';
    const nameInfo = patientFhirData.value.name.find(n => n.use === 'usual') || patientFhirData.value.name[0];
    const given = nameInfo.given ? nameInfo.given.join(' ') : '';
    const family = nameInfo.family || '';
    return `${given} ${family}`.trim() || 'N/A';
});

const patientBirthDate = computed(() => patientFhirData.value?.birthDate || 'N/A');
const patientGender = computed(() => {
    if (!patientFhirData.value?.gender) return 'N/A';
    return patientFhirData.value.gender.charAt(0).toUpperCase() + patientFhirData.value.gender.slice(1);
});

const patientAddress = computed(() => {
    if (!patientFhirData.value?.address?.[0]) return 'N/A';
    const addr = patientFhirData.value.address[0];
    return [
        addr.text,
        addr.city ? `${addr.city}` : '',
        addr.district ? `${addr.district}` : '',
        addr.state ? `${addr.state}` : ''
    ].filter(Boolean).join(', ');
});

const patientMaritalStatus = computed(() => {
    if (!patientFhirData.value?.maritalStatus?.coding?.[0]) return 'N/A';
    return patientFhirData.value.maritalStatus.coding[0].display;
});

const patientIsHead = computed(() => {
    const ext = patientFhirData.value?.extension?.find(e =>
        e.url === 'https://openimis.github.io/openimis_fhir_r4_ig/StructureDefinition/patient-is-head'
    );
    return ext?.valueBoolean ? 'Yes' : 'No';
});

const patientCardIssued = computed(() => {
    const ext = patientFhirData.value?.extension?.find(e =>
        e.url === 'https://openimis.github.io/openimis_fhir_r4_ig/StructureDefinition/patient-card-issued'
    );
    return ext?.valueBoolean ? 'Yes' : 'No';
});

const patientGroupReference = computed(() => {
    const ext = patientFhirData.value?.extension?.find(e =>
        e.url === 'https://openimis.github.io/openimis_fhir_r4_ig/StructureDefinition/patient-group-reference'
    );
    return ext?.valueReference?.identifier?.value || 'N/A';
});

const patientUUID = computed(() => {
    const uuidId = patientFhirData.value?.identifier?.find(id =>
        id.type?.coding?.[0]?.code === 'UUID'
    );
    return uuidId?.value || 'N/A';
});

const patientCode = computed(() => {
    const uuidId = patientFhirData.value?.identifier?.find(id =>
        id.type?.coding?.[0]?.code === 'Code'
    );
    return uuidId?.value || 'N/A';
});

const patientContact = computed(() => {
    if (!patientFhirData.value?.contact?.[0]) return 'N/A';
    const contact = patientFhirData.value.contact[0];
    const name = contact.name;
    const relationship = contact.relationship?.[0]?.coding?.[0]?.display || 'Unknown relationship';
    return `${name.given?.join(' ') || ''} ${name.family || ''} (${relationship})`.trim();
});

// Billing section
const billingForm = useForm({
    patient_fhir_id: '',
    items: [],
    guaranteeId: '',
    supportingInfo: [],
});

const availableServices = ref([
    { id: 'CONSULT01', name: 'General Consultation', price: 400.00, fhir_code: 'A1', fhir_uuid: '488d8bcb-5b88-438c-9077-f177f6f32626' },
    { id: 'XRAY01', name: 'BLOOD SUGAR-RANDOM OR FASTING', price: 1250.00, fhir_code: 'I113', fhir_uuid: 'some-other-fhir-uuid-for-xray' },
    { id: 'LABTEST01', name: 'SICKLING TEST', price: 950.00, fhir_code: 'I24', fhir_uuid: 'another-fhir-uuid' },
]);

const addNewBillingItem = (e) => {
    if (e) e.preventDefault();
    billingForm.items.push({
        id: Date.now(),
        service_id: null,
        quantity: 1,
        unit_price: 0,
        description: '',
        fhir_item_code: '',
        fhir_item_uuid: '',
    });
};

const removeBillingItem = (index) => {
    billingForm.items.splice(index, 1);
};

const updateItemDetails = (item) => {
    const selectedService = availableServices.value.find(s => s.id === item.service_id);
    if (selectedService) {
        item.unit_price = selectedService.price;
        item.fhir_item_code = selectedService.fhir_code;
        item.fhir_item_uuid = selectedService.fhir_uuid;
        item.description = selectedService.name;
    } else {
        item.unit_price = 0;
        item.fhir_item_code = '';
        item.fhir_item_uuid = '';
        item.description = '';
    }
};

const totalBillAmount = computed(() => {
    return billingForm.items.reduce((total, item) => {
        return total + (item.quantity * item.unit_price);
    }, 0).toFixed(2);
});

const resetBillingForm = () => {
    billingForm.reset('items', 'patient_fhir_id', 'guaranteeId', 'supportingInfo');
    billingForm.items = [];
    guaranteeId.value = '';
    attachments.value = [];
};

// Update supportingInfo based on guaranteeId and attachments
const updateSupportingInfo = () => {
    const supportingInfo = [];

    // Add guarantee entry if provided
    if (guaranteeId.value) {
        supportingInfo.push({
            sequence: 1,
            category: {
                coding: [
                    {
                        system: 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/claim-supporting-info-category',
                        code: 'guarantee',
                    },
                ],
            },
            valueString: guaranteeId.value,
        });
    }

    // Add attachment entries
    attachments.value.forEach((attachment, index) => {
        supportingInfo.push({
            sequence: supportingInfo.length + 1,
            category: {
                coding: [
                    {
                        code: 'attachment',
                        display: 'Attachment',
                    },
                ],
                text: 'attachment',
            },
            valueAttachment: {
                contentType: attachment.type,
                creation: attachment.creation,
                data: attachment.base64,
                hash: '', // Empty as per example
                title: attachment.name,
            },
        });
    });

    billingForm.supportingInfo = supportingInfo;
};

const submitBill = async () => {
    if (!patientFhirData.value) {
        eligibilityModalMessage.value = 'Please check patient eligibility and ensure a patient is found first.';
        showEligibilityModal.value = true;
        return;
    }
    if (billingForm.items.length === 0) {
        eligibilityModalMessage.value = 'Please add at least one billable item.';
        showEligibilityModal.value = true;
        return;
    }

    // Update supportingInfo before submission
    updateSupportingInfo();

    const patientUUID = patientFhirData.value.identifier?.find(id =>
        id.type?.coding?.[0]?.code === 'UUID'
    )?.value;

    if (!patientUUID) {
        eligibilityModalMessage.value = 'Patient UUID not found.';
        showEligibilityModal.value = true;
        return;
    }

    const claimItemsForSubmission = billingForm.items.map((item, index) => {
        const serviceInfo = availableServices.value.find(s => s.id === item.service_id);
        return {
            extension: [
                {
                    url: 'https://openimis.github.io/openimis_fhir_r4_ig/StructureDefinition/claim-item-reference',
                    valueReference: {
                        reference: `ActivityDefinition/${serviceInfo?.fhir_uuid || 'UNKNOWN_UUID'}`,
                        type: 'ActivityDefinition',
                        identifier: {
                            type: { coding: [{ system: 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers', code: 'UUID' }] },
                            value: serviceInfo?.fhir_uuid || 'UNKNOWN_UUID'
                        }
                    }
                }
            ],
            sequence: index + 1,
            category: { text: 'service' },
            productOrService: { text: serviceInfo?.name || item.description || 'Unknown Service' },
            quantity: { value: parseFloat(item.quantity) },
            unitPrice: { value: parseFloat(item.unit_price), currency: '$' }
        };
    });

    const payloadForClaim = {
        resourceType: 'Claim',
        status: 'active',
        type: { coding: [{ system: 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/claim-visit-type', code: 'O', display: 'Other' }] },
        use: 'claim',
        patient: {
            reference: `Patient/${patientUUID}`,
            type: 'Patient',
            identifier: {
                type: {
                    coding: [{
                        system: 'https://openimis.github.io/openimis_fhir_r4_ig/CodeSystem/openimis-identifiers',
                        code: 'UUID'
                    }]
                },
                value: patientUUID
            }
        },
        created: new Date().toISOString().split('T')[0],
        insurance: [{
            sequence: 1,
            focal: true,
            coverage: { reference: 'Coverage/9ad6e81d-ce42-43ba-aa2e-4ec3978352e8' } // Match checkCoverage
        }],
        item: claimItemsForSubmission,
        total: { value: parseFloat(totalBillAmount.value), currency: '$' },
        supportingInfo: billingForm.supportingInfo,
    };

    try {
        const response = await axios.post(route('fhir.claim.submit'), payloadForClaim, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('fhir_token')
            }
        });

        if (response.status === 201 || response.status === 200) {
            showToast('success', 'Bill submitted successfully');
            resetBillingForm();
        } else {
            eligibilityModalMessage.value = 'Failed to submit bill. Unexpected response from server.';
            showEligibilityModal.value = true;
        }
    } catch (error) {
        console.error('Claim submission failed:', error);
        let errorMessage = 'An unexpected error occurred during claim submission.';
        if (error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
                try {
                    const refreshResponse = await axios.post(route('fhir.token.refresh'));
                    const newToken = refreshResponse.data.access_token;
                    localStorage.setItem('fhir_token', newToken);

                    const retryResponse = await axios.post(route('fhir.claim.submit'), payloadForClaim, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + newToken
                        }
                    });

                    if (retryResponse.status === 201 || retryResponse.status === 200) {
                        showToast('success', 'Bill submitted successfully after retry');
                        resetBillingForm();
                        return;
                    }
                } catch (refreshError) {
                    errorMessage = 'Authentication failed. Please log in again.';
                }
            } else if (error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else {
                errorMessage = 'Failed to submit bill. Server returned an error.';
            }
        } else if (error.request) {
            errorMessage = 'No response from server. Check network or API status.';
        }
        eligibilityModalMessage.value = errorMessage;
        showEligibilityModal.value = true;
    }
};
</script>

<template>
    <Head title="Patient Billing" />

    <AuthenticatedLayout>
        <template #breadcrumb>
            Clinic > Patient Billing
        </template>

        <div class="flex flex-wrap">
            <div class="w-full px-4">
                <!-- Eligibility Check Section -->
                <div class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
                    <div class="rounded-t mb-3 px-4 py-3 border-0">
                        <div class="flex flex-wrap items-center">
                            <div class="relative w-full px-4 max-w-full flex-grow flex-1">
                                <h4 class="text-2xl">Check Patient Eligibility</h4>
                            </div>
                        </div>
                    </div>
                    <div class="block w-full overflow-x-auto px-8 py-4">
                        <form @submit.prevent="checkEligibility">
                            <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
                                <div class="flex flex-col">
                                    <InputLabel for="insurance_no" value="Insurance No. / Patient Identifier"
                                        class="text-stone-600 text-sm font-medium" />
                                    <TextInput id="insurance_no" type="text" v-model="eligibilityForm.insurance_no"
                                        class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                        required autofocus />
                                    <InputError
                                        :message="eligibilityCheckError || eligibilityForm.errors.insurance_no" />
                                </div>
                                <div class="flex items-end">
                                    <SubmitButton :processing="isLoadingEligibility" @click="checkEligibility"
                                        class="text-white bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 ease-linear transition-all duration-150">
                                        {{ isLoadingEligibility ? 'Checking...' : 'Patient Inquiry' }}
                                    </SubmitButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Patient Details Section -->
                <div v-if="patientFhirData"
                    class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
                    <div class="rounded-t mb-3 px-4 py-3 border-0">
                        <div class="flex flex-wrap items-center">
                            <div class="relative w-full px-4 max-w-full flex-grow flex-1">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-2xl">Patient Details</h4>
                                    <Button @click="checkCoverage" :disabled="isLoadingCoverage" class="text-white bg-blue-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 ease-linear transition-all duration-150">
                                        {{ isLoadingCoverage ? 'Checking...' : 'Show Coverage' }}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="block w-full overflow-x-auto px-8 py-4">
                        <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
                            <div class="space-y-4">
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Full Name</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientDisplayName }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Gender</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientGender }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Date of Birth</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientBirthDate }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Marital Status</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientMaritalStatus }}</div>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Patient UUID</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientUUID }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Patient Code</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientCode }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Is Head of Household</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientIsHead }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Insurance Card Issued</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientCardIssued }}</div>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Address</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientAddress }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Group Reference</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientGroupReference }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Primary Contact</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">{{ patientContact }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Billing Section -->
                <div v-if="patientFhirData"
                    class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
                    <div class="rounded-t mb-3 px-4 py-3 border-0">
                        <div class="flex flex-wrap items-center">
                            <div class="relative w-full px-4 max-w-full flex-grow flex-1">
                                <div class="flex justify-between items-center">
                                    <h4 class="text-2xl">Create Bill for {{ patientDisplayName }}</h4>
                                    <Button @click="addNewBillingItem" type="button">Add Item</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="block w-full overflow-x-auto px-8 py-4">
                        <!-- NEW: Guarantee ID and Attachments -->
                        <div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 mb-6">
                            <div class="flex flex-col">
                                <InputLabel for="guarantee_id" value="Guarantee ID (Optional)"
                                    class="text-stone-600 text-sm font-medium" />
                                <TextInput id="guarantee_id" type="text" v-model="guaranteeId"
                                    class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                    @input="updateSupportingInfo" />
                                <InputError :message="billingForm.errors.guaranteeId" />
                            </div>
                            <div class="flex flex-col">
                                <InputLabel value="Attachments" class="text-stone-600 text-sm font-medium" />
                                <Button @click="openAttachmentModal" type="button" class="mt-2 flex items-center">
                                    <i class="fa fa-paperclip mr-2"></i> Add Attachment
                                </Button>
                                <div v-if="attachments.length" class="mt-2 space-y-2">
                                    <div v-for="(attachment, index) in attachments" :key="index"
                                        class="flex items-center justify-between p-2 border rounded">
                                        <span>{{ attachment.name }}</span>
                                        <Button @click="removeAttachment(index)" buttonType="danger">
                                            <i class="fa fa-trash-alt"></i>
                                        </Button>
                                    </div>
                                </div>
                                <InputError :message="billingForm.errors.supportingInfo" />
                            </div>
                        </div>

                        <div v-if="billingForm.items.length === 0" class="text-center text-gray-500 py-4">
                            No items added to the bill yet.
                        </div>
                        <div v-else class="space-y-4">
                            <div v-for="(item, index) in billingForm.items" :key="item.id"
                                class="grid gap-4 sm:grid-cols-1 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 items-end">
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Service</label>
                                    <select v-model="item.service_id" @change="updateItemDetails(item)"
                                        class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                        required>
                                        <option :value="null" disabled>Select a service</option>
                                        <option v-for="service in availableServices" :key="service.id"
                                            :value="service.id">
                                            {{ service.name }}
                                        </option>
                                    </select>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Quantity</label>
                                    <TextInput type="number" v-model.number="item.quantity" min="1"
                                        class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                        required />
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Unit Price</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">${{ numberFormat(item.unit_price) }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Total</label>
                                    <div class="mt-2 p-2 bg-gray-50 rounded">${{ numberFormat(item.quantity *
                                        item.unit_price) }}</div>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-stone-600 text-sm font-medium">Description</label>
                                    <TextInput type="text" v-model="item.description"
                                        class="mt-2 block w-full rounded-md border border-gray-200 px-2 py-2 shadow-sm outline-none focus:outline-none focus:shadow-outline"
                                        placeholder="Optional" />
                                </div>
                                <div class="flex flex-col">
                                    <Button @click="removeBillingItem(index)" buttonType="danger" class="mt-2">
                                        Remove
                                    </Button>
                                </div>
                            </div>

                            <div
                                class="grid gap-4 sm:grid-cols-1 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 items-end mt-6">
                                <div class="col-span-4 text-right font-semibold">
                                    <label class="text-stone-600 text-sm font-medium">Total Bill:</label>
                                </div>
                                <div class="flex flex-col">
                                    <div class="mt-2 p-2 bg-gray-50 rounded font-semibold">${{
                                        numberFormat(totalBillAmount) }}</div>
                                </div>
                                <div class="flex flex-col"></div>
                            </div>
                        </div>

                        <div class="my-6 flex justify-end gap-4">
                            <Button @click="resetBillingForm" buttonType="secondary"
                                class="text-gray-700 bg-gray-200 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 ease-linear transition-all duration-150">
                                Clear Bill
                            </Button>
                            <SubmitButton @click="submitBill" :processing="billingForm.processing"
                                class="text-white bg-emerald-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                                :disabled="billingForm.items.length === 0">
                                {{ billingForm.processing ? 'Submitting...' : 'Submit Bill' }}
                            </SubmitButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Eligibility Error Modal -->
        <Modal title="Eligibility Check" :show="showEligibilityModal" :formProcessing="false"
            @close="closeEligibilityModal" maxWidth="lg">
            {{ eligibilityModalMessage }}
        </Modal>

        <!-- Coverage Eligibility Modal -->
        <Modal title="Coverage Eligibility Details" :show="showCoverageModal" :formProcessing="false"
            @close="closeCoverageModal" maxWidth="lg">
            <div v-if="coverageModalMessage" class="text-red-600">
                {{ coverageModalMessage }}
            </div>
            <div v-else-if="coverageData" class="space-y-4">
                <h3 class="text-lg font-semibold">Coverage Eligibility Response</h3>
                <p><strong>Status:</strong> {{ coverageData.status }}</p>
                <p><strong>Created:</strong> {{ coverageData.created }}</p>
                <div v-for="(insurance, index) in coverageData.insurance" :key="index" class="mt-4">
                    <h4 class="text-md font-medium">Insurance Coverage</h4>
                    <p><strong>Period:</strong> {{ insurance.benefitPeriod.start }} to {{ insurance.benefitPeriod.end }}</p>
                    <div v-for="(item, itemIndex) in insurance.item" :key="itemIndex" class="mt-2">
                        <h5 class="font-medium">{{ item.name }} - {{ item.description }}</h5>
                        <div v-for="(benefit, benefitIndex) in item.benefit" :key="benefitIndex" class="ml-4">
                            <p>
                                <strong>{{ benefit.type.coding[0].display }}:</strong>
                                {{ benefit.allowedUnsignedInt || benefit.allowedMoney?.value }}
                                {{ benefit.allowedMoney?.currency ? ` ${benefit.allowedMoney.currency}` : '' }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>

        <!-- NEW: Attachment Modal -->
        <Modal title="Add Attachments" :show="showAttachmentModal" :formProcessing="false"
            @close="closeAttachmentModal" maxWidth="lg" submitButtonText="Confirm" @submitAction="confirmAttachments">
            <div class="space-y-4">
                <div>
                    <InputLabel value="Select Files (JPEG, PNG, PDF)" class="text-stone-600 text-sm font-medium" />
                    <input
                        ref="fileInput"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,application/pdf"
                        class="mt-2 block w-full"
                        @change="handleFileUpload"
                    />
                    <InputError :message="attachmentErrors" />
                </div>
                <div v-if="attachments.length" class="space-y-2">
                    <h4 class="text-sm font-medium">Selected Files</h4>
                    <div v-for="(attachment, index) in attachments" :key="index"
                        class="flex items-center justify-between p-2 border rounded">
                        <div class="flex items-center">
                            <img v-if="attachment.type.startsWith('image/')"
                                :src="`data:${attachment.type};base64,${attachment.base64}`"
                                class="w-16 h-16 object-cover rounded mr-2" />
                            <span>{{ attachment.name }}</span>
                        </div>
                        <Button @click="removeAttachment(index)" buttonType="danger">
                            <i class="fa fa-trash-alt"></i>
                        </Button>
                    </div>
                </div>
                <p v-else class="text-gray-500">No files selected.</p>
            </div>
        </Modal>
    </AuthenticatedLayout>
</template>