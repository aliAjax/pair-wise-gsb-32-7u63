<template>
  <main class="page" v-if="trip">
    <TripHeader :trip="trip" />
    <div class="toolbar">
      <el-button type="primary" @click="router.push('/spots?trip=' + trip.id)">添加景点</el-button>
      <el-button @click="openEdit">编辑旅行</el-button>
      <el-button @click="router.push('/share/' + trip.id)">分享预览</el-button>
    </div>
    <section class="grid">
      <BudgetChart :spent="stats.budget.spent" :remaining="stats.budget.remaining" />
      <div class="band">
        <strong>统计</strong>
        <p>天数 {{ stats.days }} · 景点 {{ stats.spotCount }}</p>
        <p>同行 {{ trip.members.join('、') || '暂无' }} · 预算 {{ formatCurrency(trip.budget, trip.currency) }}</p>
        <p v-if="stats.budget.warning" class="danger">{{ stats.budget.warning }}</p>
      </div>
    </section>

    <div class="day-summary">
      <el-tag v-for="(count, index) in stats.daySpotCounts" :key="index" class="day-tag" :type="count ? 'success' : 'info'">
        第 {{ index + 1 }} 天 {{ count }} 个景点
      </el-tag>
    </div>

    <DayTimeline
      v-for="day in tripDays"
      :key="day.id"
      :day="day"
      :spots="spotStore.spots"
      :manageable="true"
      :day-options="dayOptions"
      @move="(itemId, dayIndex) => trip && dayPlanStore.moveSpot(trip.id, itemId, dayIndex)"
      @remove-item="(itemId) => trip && dayPlanStore.removeItem(trip.id, itemId)"
    />

    <div class="toolbar">
      <el-button v-for="option in dayOptions" :key="option.day_index" @click="router.push('/planner/' + trip.id + '/' + option.day_index)">
        编排{{ dayLabel(option.day_index, option.date) }}
      </el-button>
    </div>

    <TripFormDialog v-model="dialogVisible" :trip="trip" />
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" :description="messages.emptyTripDays" /></main>
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
import { messages } from '../constants/messages';
import { buildDateRange, dayLabel } from '../utils/tripDates';
import { formatCurrency } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();

const trip = computed(() => tripStore.trips.find((item) => item.id === route.params.id));
const dialogVisible = ref(false);

// 旅行的完整日期范围：起止日期决定每天一条行程
const dayOptions = computed(() => (trip.value ? buildDateRange(trip.value.start_date, trip.value.end_date) : []));
const tripDays = computed(() => (trip.value ? dayPlanStore.daysForTrip(trip.value.id) : []));
const stats = useTripStats(trip, () => dayPlanStore.dayPlans, () => spotStore.spots);

function openEdit() {
  dialogVisible.value = true;
}
</script>
<style scoped>
.day-summary { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
.day-tag { margin: 0; }
.danger { color: #c45656; }
</style>
