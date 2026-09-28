<template>
  <header class="trip-header">
    <p class="muted">TripWeaver Share</p>
    <h1>{{ trip.title }}</h1>
    <p>{{ trip.destination }} · {{ formatDate(trip.start_date) }} 至 {{ formatDate(trip.end_date) }}（共 {{ dayCount }} 天）</p>
    <p class="muted">预算 {{ formatCurrency(trip.budget, trip.currency) }} · 同行 {{ trip.members.join('、') || '暂无' }}</p>
  </header>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { Trip } from '../../models/trip';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { tripDayCount } from '../../utils/tripDates';
const props = defineProps<{ trip: Trip }>();
const dayCount = computed(() => tripDayCount(props.trip.start_date, props.trip.end_date));
</script>
<style scoped>.trip-header { padding: 28px 0; border-bottom: 2px solid #2d7a46; }</style>
