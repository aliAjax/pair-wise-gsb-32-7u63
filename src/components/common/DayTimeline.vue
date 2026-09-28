<template>
  <section class="band">
    <h3>
      {{ dayLabel(day.day_index, day.date) }}
      <el-tag size="small" type="info" class="count-tag">{{ day.items.length }} 个景点</el-tag>
    </h3>
    <ol>
      <li v-for="item in day.items" :key="item.id">
        <strong>{{ spotName(item.spot_id) }}</strong>
        <span class="muted">{{ item.start_time }}-{{ item.end_time }} · {{ transportText[item.transport] }} · {{ item.note }}</span>
        <template v-if="manageable && (dayOptions || []).length > 1">
          <el-select
            :model-value="day.day_index"
            size="small"
            class="move-select"
            @change="(value: string | number) => emit('move', item.id, Number(value))"
          >
            <el-option v-for="option in dayOptions || []" :key="option.day_index" :label="`移动到 ${dayLabel(option.day_index, option.date)}`" :value="option.day_index" />
          </el-select>
          <el-button size="small" type="danger" plain @click="emit('remove-item', item.id)">移除安排</el-button>
        </template>
      </li>
    </ol>
    <p v-if="!day.items.length" class="muted">这一天还没有安排。</p>
  </section>
</template>
<script setup lang="ts">
import type { DayPlan } from '../../models/dayPlan';
import type { Spot } from '../../models/spot';
import { transportText } from '../../utils/formatters';
import { dayLabel } from '../../utils/tripDates';

const props = defineProps<{
  day: DayPlan;
  spots: Spot[];
  /** 详情页处理安排时允许移动/移除单个行程项 */
  manageable?: boolean;
  /** 可移动的目标天（旅行完整日期范围），由父级按起止日期生成 */
  dayOptions?: { day_index: number; date: string }[];
}>();
const emit = defineEmits<{ move: [itemId: string, dayIndex: number]; 'remove-item': [itemId: string] }>();

function spotName(id: string) {
  return props.spots.find((spot) => spot.id === id)?.name || '未知景点';
}
</script>
<style scoped>
.count-tag { margin-left: 8px; }
.move-select { width: 190px; margin-left: 10px; }
li { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 6px; }
</style>
