<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';
import Button from '@/Components/Button.vue';
import { ref } from 'vue';

// Feature cards data
const features = ref([
    {
        icon: 'fas fa-exchange-alt',
        title: 'Interoperability',
        description: 'Seamlessly integrate FHIR standards for healthcare data exchange.',
    },
    {
        icon: 'fas fa-shield-alt',
        title: 'Insurance Management',
        description: 'Leverage openIMIS for efficient insurance claims and coverage.',
    },
    {
        icon: 'fas fa-cloud',
        title: 'Scalable API',
        description: 'Connect with FHIR endpoints for real-time patient data.',
    },
]);
</script>

<template>


        <div class="flex flex-wrap">
            <div class="w-full px-4">
                <!-- Hero Section with Typing Animation -->
                <div class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
                    <div class="rounded-t mb-0 px-4 py-6">
                        <div class="text-center">
                            <h1 class="text-4xl md:text-5xl font-bold mb-4">
                                Playground for <span class="typing">FHIR openIMIS</span>
                            </h1>
                            <p class="text-lg md:text-xl mb-6">
                                Empower healthcare and insurance with seamless integration.
                            </p>
                            <Button
                                :href="route('fhir-endpoints.index')"
                                buttonType="primary"
                                class="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold animate-bounce"
                            >
                                Explore Settings
                            </Button>
                        </div>
                    </div>
                    <!-- Animated Icons -->
                    <div class="flex justify-center space-x-8 py-6">
                        <div class="animate-pulse">
                            <i class="fas fa-heartbeat text-4xl md:text-6xl"></i>
                            <p class="mt-2 text-sm md:text-base">FHIR</p>
                        </div>
                        <div class="animate-slide-in">
                            <i class="fas fa-file-invoice text-4xl md:text-6xl"></i>
                            <p class="mt-2 text-sm md:text-base">openIMIS</p>
                        </div>
                    </div>
                </div>

                <!-- Feature Cards with Fade-In Animation -->
                <div class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    <TransitionGroup name="fade" tag="div" class="w-full">
                        <div
                            v-for="(feature, index) in features"
                            :key="index"
                            class="relative flex flex-col min-w-0 break-words bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                        >
                            <div class="px-6 py-4">
                                <div class="flex items-center justify-center h-12 w-12 rounded-md bg-emerald-600 text-white mb-4">
                                    <i :class="feature.icon"></i>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900">{{ feature.title }}</h3>
                                <p class="mt-2 text-sm text-gray-600">{{ feature.description }}</p>
                            </div>
                        </div>
                    </TransitionGroup>
                </div>
            </div>
        </div>

</template>

<style scoped>
/* Typing Animation */
.typing {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    animation: typing 3s steps(20, end) infinite, blink-caret 0.75s step-end infinite;
}

@keyframes typing {
    0% {
        width: 0;
    }
    50% {
        width: 100%;
    }
    100% {
        width: 100%;
    }
}

@keyframes blink-caret {
    from,
    to {
        border-right: 2px solid transparent;
    }
    50% {
        border-right: 2px solid white;
    }
}

/* Pulse Animation for FHIR Icon */
.animate-pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.7;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* Slide-In Animation for openIMIS Icon */
.animate-slide-in {
    animation: slide-in 1.5s ease-out;
}

@keyframes slide-in {
    0% {
        transform: translateX(100px);
        opacity: 0;
    }
    100% {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Fade Transition for Feature Cards */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* Bounce Animation for Button */
.animate-bounce {
    animation: bounce 2s infinite;
}

@keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}
</style>