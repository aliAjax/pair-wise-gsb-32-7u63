<template>
  <main class="page" v-if="trip">
    <h1>行程编排 · {{ trip.title }}</h1>
    <section class="band">
      <p class="muted">
        {{ trip.destination }} · {{ trip.start_date }} 至 {{ trip.end_date }}（{{ stats.days }} 天） ·
        预算 {{ formatCurrency(trip.budget, trip.currency) }} · 同行 {{ trip.members.join('、') || '暂无' }}
      </p>
      <p class="muted" v-if="stats.budget.warning">{{ stats.budget.warning }}</p>
    </section>

    <div class="toolbar">
      <el-button
        v-for="option in dayOptions"
        :key="option.day_index"
        :type="option.day_index === dayIndex ? 'primary' : 'default'"
        @click="goDay(option.day_index)"
      >
        {{ dayLabel(option.day_index, option.date) }}（{{ daySpotCount(option.day_index) }} 个景点）
      </el-button>
    </div>

    <section class="band">
      <p class="muted">拖拽排序由 SortableJS 接管；预算计算会同步影响详情页与列表。</p>
      <div ref="listEl">
        <SpotMiniCard v-for="spot in daySpots" :key="spot.id" :spot="spot" />
      </div>
      <EmptyState v-if="!daySpots.length" title="这一天还没有安排" :description="messages.emptyTripDays" />
    </section>
    <DayTimeline v-if="day" :day="day" :spots="spotStore.spots" />
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" /></main>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sortable, { type SortableEvent } from 'sortablejs';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useTripStats } from '../hooks/useTripStats';
import SpotMiniCard from '../components/common/SpotMiniCard.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { messages } from '../constants/messages';
import { buildDateRange, dayLabel } from '../utils/tripDates';
import { formatCurrency } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const listEl = ref<HTMLElement>();

const tripId = computed(() => String(route.params.tripId));
const dayIndex = computed(() => Number(route.params.dayIndex || 1));
const trip = computed(() => tripStore.trips.find((item) => item.id === tripId.value));
const dayOptions = computed(() => (trip.value ? buildDateRange(trip.value.start_date, trip.value.end_date) : []));
const stats = useTripStats(trip, () => dayPlanStore.dayPlans, () => spotStore.spots);

const day = computed(() => {
  if (!trip.value) return undefined;
  // 只能编排起止日期范围内的天，保证与详情、列表口径一致
  if (dayIndex.value < 1 || dayIndex.value > dayOptions.value.length) return undefined;
  return dayPlanStore.ensureDay(tripId.value, dayIndex.value);
});
const daySpots = computed(() =>
  (day.value?.items || [])
    .map((item) => spotStore.spots.find((spot) => spot.id === item.spot_id))
    .filter(Boolean) as typeof spotStore.spots,
);

function daySpotCount(index: number) {
  return dayPlanStore.daysForTrip(tripId.value).find((item) => item.day_index === index)?.items.length || 0;
}
function goDay(index: number) {
  router.push('/planner/' + tripId.value + '/' + index);
}

let sortable: Sortable | null = null;
function mountSortable() {
  if (!listEl.value) return;
  sortable?.destroy();
  sortable = new Sortable(listEl.value, {
    animation: 150,
    onEnd: (evt: SortableEvent) => dayPlanStore.reorder(tripId.value, dayIndex.value, evt.oldIndex || 0, evt.newIndex || 0),
  });
}
onMounted(mountSortable);
// 切换天后列表内容重建，重新挂载 Sortable
watch(dayIndex, () => setTimeout(mountSortable, 0));
</script>
