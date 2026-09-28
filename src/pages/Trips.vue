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

    <TripFormDialog
      v-model="dialogVisible"
      :trip="editingTrip"
      :known-members="knownMembers"
      :on-submit="handleSubmit"
    />
  </main>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import TripCard from '../components/common/TripCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import TripFormDialog from '../components/common/TripFormDialog.vue';
import { useTripStore } from '../stores/tripStore';
import { TRIP_STATUS_OPTIONS } from '../constants/trip';
import { messages } from '../constants/messages';
import type { DayConflict, TripFormInput } from '../types';

const router = useRouter();
const tripStore = useTripStore();
const dialogVisible = ref(false);
const editingId = ref<string | null>(null);
const editingTrip = computed(() => (editingId.value ? tripStore.getById(editingId.value) : undefined));
const knownMembers = computed(() => Array.from(new Set(tripStore.trips.flatMap((trip) => trip.members))));

function openCreate() {
  editingId.value = null;
  dialogVisible.value = true;
}
function openEdit(id: string) {
  editingId.value = id;
  dialogVisible.value = true;
}
function open(id: string) {
  router.push('/trip/' + id);
}
function handleSubmit(form: TripFormInput): DayConflict[] {
  if (editingId.value) {
    const result = tripStore.updateTrip(editingId.value, form);
    return result.conflicts ?? (result.ok ? [] : []);
  }
  const id = tripStore.createTrip(form);
  router.push('/trip/' + id);
  return [];
}
</script>
