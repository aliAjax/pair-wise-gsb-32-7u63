<template>
  <main class="page">
    <h1>景点探索</h1>
    <div class="toolbar">
      <el-input v-model="spotStore.keyword" placeholder="搜索景点、标签" style="max-width: 260px" />
      <CategoryFilter v-model="spotStore.category" />
    </div>
    <EmptyState v-if="!spotStore.filteredSpots.length" title="没有景点" :description="messages.emptySpots" />
    <section class="grid">
      <SpotCard v-for="spot in spotStore.filteredSpots" :key="spot.id" :spot="spot" @favorite="spotStore.toggleFavorite" @add="openAddDialog" />
    </section>

    <el-dialog v-model="addDialogVisible" title="加入行程" width="min(440px, 92vw)">
      <el-form label-width="84px" @submit.prevent>
        <el-form-item label="选择旅行">
          <el-select v-model="selectedTripId" placeholder="请选择旅行" style="width: 100%">
            <el-option v-for="trip in tripStore.trips" :key="trip.id" :label="`${trip.title}（${trip.start_date} 至 ${trip.end_date}）`" :value="trip.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="放到哪天">
          <el-select v-if="dayOptions.length" v-model="selectedDayIndex" style="width: 100%">
            <el-option v-for="option in dayOptions" :key="option.day_index" :label="dayLabel(option.day_index, option.date)" :value="option.day_index" />
          </el-select>
          <span v-else class="muted">{{ messages.emptyTrips }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedTripId || !selectedDayIndex" @click="confirmAdd">加入当天</el-button>
      </template>
    </el-dialog>
  </main>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import CategoryFilter from '../components/common/CategoryFilter.vue';
import SpotCard from '../components/common/SpotCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';
import { buildDateRange, dayLabel } from '../utils/tripDates';

const route = useRoute();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();

const addDialogVisible = ref(false);
const pendingSpotId = ref('');
const selectedTripId = ref('');
const selectedDayIndex = ref(1);

const selectedTrip = computed(() => tripStore.trips.find((trip) => trip.id === selectedTripId.value));
const dayOptions = computed(() => (selectedTrip.value ? buildDateRange(selectedTrip.value.start_date, selectedTrip.value.end_date) : []));

watch(selectedTripId, () => {
  selectedDayIndex.value = 1;
});

function openAddDialog(spotId: string) {
  if (!tripStore.trips.length) {
    toast.fail(messages.noTripForSpot);
    return;
  }
  pendingSpotId.value = spotId;
  // 从详情页“添加景点”跳转过来时带上 trip 参数，默认选中该旅行
  const fromTrip = typeof route.query.trip === 'string' ? route.query.trip : '';
  selectedTripId.value = tripStore.trips.some((trip) => trip.id === fromTrip) ? fromTrip : tripStore.trips[0]?.id || '';
  selectedDayIndex.value = 1;
  addDialogVisible.value = true;
}

function confirmAdd() {
  if (!selectedTripId.value) return;
  dayPlanStore.addSpot(selectedTripId.value, pendingSpotId.value, selectedDayIndex.value);
  addDialogVisible.value = false;
}
</script>
