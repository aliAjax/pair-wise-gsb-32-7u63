<template>
  <main class="page">
    <template v-if="trip">
      <TripHeader :trip="trip" />
      <DayTimeline v-for="day in tripDays" :key="day.id" :day="day" :spots="spotStore.spots" />
      <el-button type="primary" @click="copyText">复制行程文本</el-button>
    </template>
    <EmptyState v-else title="旅行不存在" description="请从旅行详情页进入分享预览。" />
  </main>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useTripStats } from '../hooks/useTripStats';
import TripHeader from '../components/common/TripHeader.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import EmptyState from '../components/common/EmptyState.vue';
import type { DayPlan } from '../models/dayPlan';

const route = useRoute();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const tripId = typeof route.query.trip === 'string' ? route.query.trip : tripStore.trips[0]?.id;
const trip = computed(() => (tripId ? tripStore.getById(tripId) : undefined));
const stats = useTripStats(() => trip.value);
const tripDays = computed<DayPlan[]>(() =>
  stats.value.daySummaries.map((summary) => {
    const plan = trip.value ? dayPlanStore.findDay(trip.value.id, summary.day_index) : undefined;
    return plan ?? {
      id: `virtual-${trip.value?.id}-${summary.day_index}`,
      trip_id: trip.value?.id ?? '',
      day_index: summary.day_index,
      date: summary.date,
      items: [],
    };
  }),
);
function copyText() {
  navigator.clipboard?.writeText('TripWeaver 行程单：' + (trip.value?.title || '未命名'));
}
</script>
