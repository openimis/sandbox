<template>
    <div class="min-h-screen bg-gray-50">
        <div class="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            <div class="max-w-7xl mx-auto">
                <div class="text-center">
                    <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                        <span class="block">Welcome to</span>
                        <span class="block text-blue-600">FHIR Simulation for openIMIS Sandbox</span>
                    </h1>
                    <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Experience healthcare interoperability with our FHIR-based sandbox environment designed for
                        openIMIS implementations.
                    </p>
                    <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                        <div class="rounded-md shadow">
                            <Link :href="$page.props.auth.user ? route('dashboard') : route('login')"
                                class="mt-4 bg-white text-blueGray-700 active:bg-blueGray-50 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150"
                                type="button">
                            Explore Sandbox
                            <i class="fas fa-arrow-alt-circle-right"></i>
                            </Link>
                        </div>
                    </div>
                </div>

                <div class="mt-16 flex justify-center">
                    <img src="https://www.hl7.org/assets/hl7-fhir-logo.svg" alt="FHIR Logo"
                        class="h-40 object-contain" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Link } from '@inertiajs/vue3';
</script>