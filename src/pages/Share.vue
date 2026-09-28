<template>
  <main class="page">
    <template v-if="trip">
      <TripHeader :trip="trip" />
      <section class="band" style="margin: 16px 0">
        <strong>统计</strong>
        <p class="muted">天数 {{ stats.days }} · 景点 {{ stats.spotCount }} · 预算 {{ formatCurrency(trip.budget, trip.currency) }}（已安排花费 {{ formatCurrency(stats.budget.spent, trip.currency) }}）</p>
      </section>
      <DayTimeline v-for="day in tripDays" :key="day.id" :day="day" :spots="spotStore.spots" />
      <el-button type="primary" @click="copyText">复制行程文本</el-button>
    </template>
    <EmptyState v-else title="旅行不存在" :description="messages.emptyTrips" />
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
import { messages } from '../constants/messages';
import { toast } from '../utils/message';
import { formatCurrency } from '../utils/formatters';

const route = useRoute();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();

const trip = computed(() => {
  const id = route.params.id ? String(route.params.id) : '';
  return tripStore.trips.find((item) => item.id === id) || tripStore.trips[0];
});
const tripDays = computed(() => (trip.value ? dayPlanStore.daysForTrip(trip.value.id) : []));
const stats = useTripStats(trip, () => dayPlanStore.dayPlans, () => spotStore.spots);

function copyText() {
  if (!trip.value) return;
  const lines = tripDays.value.map((day) => `${day.date}：${day.items.map((item) => spotStore.spots.find((spot) => spot.id === item.spot_id)?.name || '未知景点').join('、') || '暂无安排'}`);
  const text = `TripWeaver 行程单：${trip.value.title}（${trip.value.start_date} 至 ${trip.value.end_date}）\n` + lines.join('\n');
  navigator.clipboard?.writeText(text);
  toast.ok('行程文本已复制');
}
</script>
