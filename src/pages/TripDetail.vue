<template>
  <main class="page" v-if="trip">
    <TripHeader :trip="trip">
      <template #actions>
        <el-button type="primary" @click="goAddSpots">添加景点</el-button>
        <el-button @click="openEdit">编辑旅行</el-button>
        <el-button @click="router.push('/share?trip=' + trip.id)">分享预览</el-button>
      </template>
    </TripHeader>

    <section class="grid">
      <BudgetChart :spent="stats.spent" :remaining="stats.remaining" />
      <div class="band">
        <strong>统计</strong>
        <p>天数 {{ stats.days }} · 景点 {{ stats.spotCount }}（{{ perDayText }}）</p>
        <p>预算 {{ formatCurrency(trip.budget, trip.currency) }} · 已计划 {{ formatCurrency(stats.spent, trip.currency) }}</p>
        <p class="muted">{{ stats.warning }}</p>
      </div>
    </section>

    <div class="toolbar">
      <el-button
        v-for="day in stats.daySummaries"
        :key="day.day_index"
        @click="router.push('/planner/' + trip.id + '/' + day.day_index)"
      >
        编排第 {{ day.day_index }} 天（{{ day.spotCount }}）
      </el-button>
    </div>

    <DayTimeline
      v-for="day in tripDays"
      :key="day.id"
      :day="day"
      :spots="spotStore.spots"
      editable
      @remove-spot="handleRemoveSpot"
    />

    <TripFormDialog v-model="editVisible" :trip="trip" :known-members="knownMembers" :on-submit="handleEditSubmit" />
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" /></main>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useTripStats } from '../hooks/useTripStats';
import TripHeader from '../components/common/TripHeader.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import BudgetChart from '../components/common/BudgetChart.vue';
import EmptyState from '../components/common/EmptyState.vue';
import TripFormDialog from '../components/common/TripFormDialog.vue';
import { formatCurrency } from '../utils/formatters';
import type { DayPlan } from '../models/dayPlan';
import type { DayConflict, TripFormInput } from '../types';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const tripId = String(route.params.id);
const trip = computed(() => tripStore.getById(tripId));
const stats = useTripStats(() => trip.value);
const perDayText = computed(() => stats.value.daySummaries.map((day) => `D${day.day_index}:${day.spotCount}`).join(' / '));
const knownMembers = computed(() => Array.from(new Set(tripStore.trips.flatMap((item) => item.members))));

/** 按起止日期每天一条；尚未持久化的新天用只读视图占位，加入景点时自动落库 */
const tripDays = computed<DayPlan[]>(() =>
  stats.value.daySummaries.map((summary) => {
    const plan = dayPlanStore.findDay(tripId, summary.day_index);
    return plan ?? {
      id: `virtual-${tripId}-${summary.day_index}`,
      trip_id: tripId,
      day_index: summary.day_index,
      date: summary.date,
      items: [],
    };
  }),
);

const editVisible = ref(false);
function openEdit() {
  editVisible.value = true;
}
function handleEditSubmit(form: TripFormInput): DayConflict[] {
  const result = tripStore.updateTrip(tripId, form);
  return result.conflicts ?? [];
}
function goAddSpots() {
  router.push('/spots?trip=' + tripId);
}
function handleRemoveSpot(payload: { dayIndex: number; spotId: string }) {
  dayPlanStore.removeSpot(tripId, payload.dayIndex, payload.spotId);
}
</script>
