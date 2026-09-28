<template>
  <main class="page" v-if="trip">
    <h1>行程编排 · {{ trip.title }}</h1>
    <p class="muted">
      {{ trip.start_date }} 至 {{ trip.end_date }} · 共 {{ stats.days }} 天 · {{ stats.spotCount }} 个景点
      · 预算 {{ formatCurrency(trip.budget, trip.currency) }} / 已计划 {{ formatCurrency(stats.spent, trip.currency) }}
    </p>

    <div class="toolbar">
      <el-button
        v-for="summary in stats.daySummaries"
        :key="summary.day_index"
        :type="summary.day_index === dayIndex ? 'primary' : 'default'"
        @click="goDay(summary.day_index)"
      >
        第 {{ summary.day_index }} 天（{{ summary.spotCount }}）
      </el-button>
    </div>

    <section class="band">
      <p class="muted">拖拽排序由 SortableJS 接管；预算计算会同步影响列表与详情页。</p>
      <div ref="listEl">
        <SpotMiniCard v-for="spot in daySpots" :key="spot.id" :spot="spot" />
      </div>
      <p v-if="day && !day.items.length" class="muted">这一天还没有安排，可前往景点探索添加。</p>
    </section>

    <DayTimeline
      v-if="day"
      :day="day"
      :spots="spotStore.spots"
      editable
      @remove-spot="handleRemoveSpot"
    />

    <div class="toolbar">
      <el-button @click="router.push('/trip/' + trip.id)">返回详情</el-button>
      <el-button type="primary" @click="router.push('/spots?trip=' + trip.id)">添加景点</el-button>
    </div>
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" /></main>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sortable, { type SortableEvent } from 'sortablejs';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useTripStore } from '../stores/tripStore';
import { useTripStats } from '../hooks/useTripStats';
import SpotMiniCard from '../components/common/SpotMiniCard.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { formatCurrency } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const tripStore = useTripStore();
const listEl = ref<HTMLElement>();
let sortable: Sortable | null = null;
const tripId = computed(() => String(route.params.tripId));
const dayIndex = computed(() => Number(route.params.dayIndex || 1));
const trip = computed(() => tripStore.getById(tripId.value));
const stats = useTripStats(() => trip.value);
const dayValid = computed(() => stats.value.daySummaries.some((item) => item.day_index === dayIndex.value));
const day = computed(() =>
  trip.value && dayValid.value ? dayPlanStore.ensureDay(tripId.value, dayIndex.value, trip.value.start_date) : undefined,
);
const daySpots = computed(() =>
  (day.value?.items ?? [])
    .map((item) => spotStore.spots.find((spot) => spot.id === item.spot_id))
    .filter(Boolean) as NonNullable<ReturnType<typeof spotStore.spots.find>>[],
);

function initSortable() {
  sortable?.destroy();
  sortable = null;
  if (!listEl.value) return;
  sortable = new Sortable(listEl.value, {
    animation: 150,
    onEnd: (evt: SortableEvent) => dayPlanStore.reorder(tripId.value, dayIndex.value, evt.oldIndex || 0, evt.newIndex || 0),
  });
}
onMounted(initSortable);
watch(dayIndex, () => {
  // 切换天后重建排序实例，避免重复绑定
  requestAnimationFrame(initSortable);
});

function goDay(index: number) {
  router.push('/planner/' + tripId.value + '/' + index);
}
function handleRemoveSpot(payload: { dayIndex: number; spotId: string }) {
  dayPlanStore.removeSpot(tripId.value, payload.dayIndex, payload.spotId);
}
</script>
