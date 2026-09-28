<template>
  <article class="trip-card">
    <div>
      <strong>{{ trip.title }}</strong>
      <p class="muted">{{ trip.destination || '未设置目的地' }} · {{ formatDate(trip.start_date) }} - {{ formatDate(trip.end_date) }}</p>
    </div>
    <el-tag>{{ tripStatusText[trip.status] }}</el-tag>
    <p>预算 {{ formatCurrency(trip.budget, trip.currency) }} · 已计划 {{ formatCurrency(stats.spent, trip.currency) }} · 同行 {{ trip.members.length }} 人</p>
    <p class="muted">{{ trip.members.length ? trip.members.join('、') : '还没有同行人' }}</p>
    <p class="muted">共 {{ stats.days }} 天 · {{ stats.spotCount }} 个景点（{{ perDayText }}）</p>
    <div class="toolbar">
      <el-button type="primary" @click="$emit('open', trip.id)">进入详情</el-button>
      <el-button @click="$emit('edit', trip.id)">编辑</el-button>
      <el-button @click="$emit('remove', trip.id)">删除</el-button>
    </div>
  </article>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { Trip } from '../../models/trip';
import { useTripStats } from '../../hooks/useTripStats';
import { formatCurrency, formatDate, tripStatusText } from '../../utils/formatters';
const props = defineProps<{ trip: Trip }>();
defineEmits<{ open: [id: string]; edit: [id: string]; remove: [id: string] }>();
const stats = useTripStats(() => props.trip);
const perDayText = computed(() => stats.value.daySummaries.map((day) => `D${day.day_index}:${day.spotCount}`).join(' / '));
</script>
<style scoped>
.trip-card { background: #fff; border: 1px solid #dbe7cf; border-radius: 8px; padding: 18px; }
</style>
