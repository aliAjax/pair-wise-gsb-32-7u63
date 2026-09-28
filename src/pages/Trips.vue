<template>
  <main class="page">
    <h1>我的旅行</h1>
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新建旅行</el-button>
      <el-select v-model="tripStore.statusFilter" style="width: 160px">
        <el-option label="全部状态" value="all" />
        <el-option v-for="item in TRIP_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <EmptyState v-if="!tripStore.filteredTrips.length" title="还没有旅行计划" :description="messages.emptyTrips" />
    <section class="grid">
      <TripCard
        v-for="trip in tripStore.filteredTrips"
        :key="trip.id"
        :trip="trip"
        @open="open"
        @edit="openEdit"
        @remove="tripStore.removeTrip"
      />
    </section>

    <TripFormDialog v-model="dialogVisible" :trip="editingTrip" @saved="onSaved" />
  </main>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import TripCard from '../components/common/TripCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import TripFormDialog from '../components/common/TripFormDialog.vue';
import { useTripStore } from '../stores/tripStore';
import { TRIP_STATUS_OPTIONS } from '../constants/trip';
import { messages } from '../constants/messages';
import type { Trip } from '../models/trip';

const router = useRouter();
const tripStore = useTripStore();

const dialogVisible = ref(false);
const editingTrip = ref<Trip | null>(null);

function openCreate() {
  editingTrip.value = null;
  dialogVisible.value = true;
}
function openEdit(id: string) {
  editingTrip.value = tripStore.trips.find((trip) => trip.id === id) || null;
  dialogVisible.value = true;
}
/** 新建保存后直接进入详情；编辑保存后留在列表（详情页内也有编辑入口） */
function onSaved(id: string) {
  if (!editingTrip.value) router.push('/trip/' + id);
}
function open(id: string) {
  router.push('/trip/' + id);
}
</script>
