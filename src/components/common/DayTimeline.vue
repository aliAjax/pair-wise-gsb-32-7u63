<template>
  <section class="band">
    <h3>第 {{ day.day_index }} 天 · {{ day.date }} <el-tag size="small" type="success">{{ day.items.length }} 个景点</el-tag></h3>
    <ol>
      <li v-for="(item, index) in day.items" :key="item.spot_id + item.start_time + index">
        <strong>{{ spotName(item.spot_id) }}</strong>
        <span class="muted">{{ item.start_time }}-{{ item.end_time }} · {{ transportText[item.transport] }} · {{ item.note }}</span>
        <el-button v-if="editable" link type="danger" size="small" @click="$emit('remove-spot', { dayIndex: day.day_index, spotId: item.spot_id })">移除</el-button>
      </li>
    </ol>
    <p v-if="!day.items.length" class="muted">这一天还没有安排。</p>
  </section>
</template>
<script setup lang="ts">
import type { DayPlan } from '../../models/dayPlan';
import type { Spot } from '../../models/spot';
import { transportText } from '../../utils/formatters';
const props = defineProps<{ day: DayPlan; spots: Spot[]; editable?: boolean }>();
defineEmits<{ 'remove-spot': [payload: { dayIndex: number; spotId: string }] }>();
const spotName = (id: string) => props.spots.find((spot) => spot.id === id)?.name || '未知景点';
</script>
