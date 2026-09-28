<template>
  <article class="trip-card">
    <div>
      <strong>{{ trip.title }}</strong>
      <p class="muted">{{ trip.destination }} · {{ formatDate(trip.start_date) }} - {{ formatDate(trip.end_date) }}（{{ stats.days }} 天）</p>
    </div>
    <el-tag>{{ tripStatusText[trip.status] }}</el-tag>
    <p>预算 {{ formatCurrency(trip.budget, trip.currency) }} · 同行 {{ trip.members.join('、') || '暂无' }}</p>
    <p class="muted">共安排 {{ stats.spotCount }} 个景点，已花费 {{ formatCurrency(stats.budget.spent, trip.currency) }}</p>
    <div class="toolbar">
      <el-button type="primary" @click="$emit('open', trip.id)">进入详情</el-button>
      <el-button @click="$emit('edit', trip.id)">编辑</el-button>
      <el-button @click="$emit('remove', trip.id)">删除</el-button>
    </div>
  </article>
</template>
<script setup lang="ts">
import type { PropType } from 'vue';
import type { Trip } from '../../models/trip';
import { formatCurrency, formatDate, tripStatusText } from '../../utils/formatters';
import { useTripStats } from '../../hooks/useTripStats';
import { useDayPlanStore } from '../../stores/dayPlanStore';
import { useSpotStore } from '../../stores/spotStore';
const props = defineProps({ trip: { type: Object as PropType<Trip>, required: true } });
defineEmits<{ open: [id: string]; edit: [id: string]; remove: [id: string] }>();
const dayPlanStore = useDayPlanStore();
const spotStore = useSpotStore();
// 列表卡片、详情、编排共用同一份统计口径
const stats = useTripStats(() => props.trip, () => dayPlanStore.dayPlans, () => spotStore.spots);
</script>
<style scoped>
.trip-card { background: #fff; border: 1px solid #dbe7cf; border-radius: 8px; padding: 18px; }
</style>
