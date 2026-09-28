<template>
  <header class="trip-header">
    <p class="muted">TripWeaver Share</p>
    <h1>{{ trip.title }}</h1>
    <p>{{ trip.destination || '未设置目的地' }} · {{ trip.start_date }} 至 {{ trip.end_date }} · 共 {{ stats.days }} 天</p>
    <p>预算 {{ formatCurrency(trip.budget, trip.currency) }} · 已计划 {{ formatCurrency(stats.spent, trip.currency) }} · 同行 {{ trip.members.length }} 人（{{ membersText }}）</p>
    <p class="muted">{{ stats.spotCount }} 个景点（{{ perDayText }}）</p>
    <div v-if="$slots.actions" class="toolbar"><slot name="actions" /></div>
  </header>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { Trip } from '../../models/trip';
import { useTripStats } from '../../hooks/useTripStats';
import { formatCurrency } from '../../utils/formatters';
const props = defineProps<{ trip: Trip }>();
const stats = useTripStats(() => props.trip);
const membersText = computed(() => props.trip.members.length ? props.trip.members.join('、') : '暂未添加');
const perDayText = computed(() => stats.value.daySummaries.map((day) => `D${day.day_index}:${day.spotCount}`).join(' / '));
</script>
<style scoped>.trip-header { padding: 28px 0; border-bottom: 2px solid #2d7a46; }</style>
