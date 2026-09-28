<template>
  <main class="page">
    <h1>景点探索</h1>
    <div class="toolbar">
      <el-input v-model="spotStore.keyword" placeholder="搜索景点、标签" style="max-width: 260px" />
      <CategoryFilter v-model="spotStore.category" />
    </div>
    <EmptyState v-if="!spotStore.filteredSpots.length" title="没有景点" :description="messages.emptySpots" />
    <section class="grid">
      <SpotCard v-for="spot in spotStore.filteredSpots" :key="spot.id" :spot="spot" @favorite="spotStore.toggleFavorite" @add="openAdd" />
    </section>

    <AddSpotToTripDialog v-model="dialogVisible" :spot-id="pendingSpotId" :preferred-trip-id="preferredTripId" />
  </main>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSpotStore } from '../stores/spotStore';
import CategoryFilter from '../components/common/CategoryFilter.vue';
import SpotCard from '../components/common/SpotCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import AddSpotToTripDialog from '../components/common/AddSpotToTripDialog.vue';
import { messages } from '../constants/messages';

const route = useRoute();
const spotStore = useSpotStore();
const dialogVisible = ref(false);
const pendingSpotId = ref('');
const preferredTripId = typeof route.query.trip === 'string' ? route.query.trip : undefined;

function openAdd(id: string) {
  pendingSpotId.value = id;
  dialogVisible.value = true;
}
</script>
