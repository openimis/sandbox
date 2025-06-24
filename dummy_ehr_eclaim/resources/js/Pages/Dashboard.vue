<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import {Head, useForm} from '@inertiajs/vue3';
import CardLineChart from "@/Components/Cards/CardLineChart.vue";
import CardBarChart from "@/Components/Cards/CardBarChart.vue";
import HeaderStats from "@/Components/Headers/HeaderStats.vue";
// import Datepicker from "@vuepic/vue-datepicker";
// import '@vuepic/vue-datepicker/dist/main.css';
import {watch} from "vue";
import Intro from './Intro.vue';

const props = defineProps({
    date: String,
    total_orders: Object,
    total_profit: Object,
    total_loss: Object,
    total_expense: Object,
    profit_line_chart: Object,
    orders_bar_chart: Object,
});

const form = useForm({
    date: props.date,
});

watch(() => form.date, async (newDateRange, oldDateRange) => {
    form.get(route('dashboard'), {
        preserveScroll: true,
    });
})
</script>

<template>
    <Head title="Dashboard" />

    <AuthenticatedLayout>

        <Intro />
       
    </AuthenticatedLayout>
    
</template>
