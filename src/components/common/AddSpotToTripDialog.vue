<template>
  <el-dialog
    :model-value="modelValue"
    :title="messages.pickTripAndDay"
    width="460px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form label-width="72px">
      <el-form-item label="旅行">
        <el-select v-model="tripId" style="width: 100%" placeholder="选择旅行">
          <el-option
            v-for="trip in tripStore.trips"
            :key="trip.id"
            :label="`${trip.title}（${trip.start_date} 至 ${trip.end_date}）`"
            :value="trip.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="days.length" label="日期">
        <el-select v-model="dayIndex" style="width: 100%">
          <el-option
            v-for="day in days"
            :key="day.day_index"
            :label="`第 ${day.day_index} 天 · ${day.date}（${messages.perDayCount(stats.perDaySpotCount[day.day_index] ?? 0)}）`"
            :value="day.day_index"
          />
        </el-select>
      </el-form-item>
      <p v-else-if="tripId" class="muted">该旅行还没有有效的起止日期，请先编辑旅行。</p>
      <template v-else>
        <p class="muted">{{ messages.noTripForSpot }}</p>
        <el-button type="primary" @click="goCreateTrip">去新建旅行</el-button>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!tripId || !dayIndex" @click="confirm">确定加入</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTripStore } from '../../stores/tripStore';
import { useDayPlanStore } from '../../stores/dayPlanStore';
import { useTripStats } from '../../hooks/useTripStats';
import { buildTripDays, isInvalidDateRange } from '../../utils/tripDates';
import { messages } from '../../constants/messages';

const props = defineProps<{
  modelValue: boolean;
  spotId: string;
  /** 从某个旅行详情页进入时预选该旅行 */
  preferredTripId?: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const router = useRouter();
const tripStore = useTripStore();
const dayPlanStore = useDayPlanStore();
const tripId = ref('');
const dayIndex = ref(1);

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    tripId.value = props.preferredTripId && tripStore.getById(props.preferredTripId)
      ? props.preferredTripId
      : tripStore.trips[0]?.id || '';
    dayIndex.value = 1;
  },
);

const trip = computed(() => tripStore.getById(tripId.value));
const stats = useTripStats(() => trip.value);
const days = computed(() => {
  const current = trip.value;
  if (!current || isInvalidDateRange(current.start_date, current.end_date)) return [];
  return buildTripDays(current.start_date, current.end_date);
});
watch(days, (list) => {
  if (list.length && !list.some((day) => day.day_index === dayIndex.value)) dayIndex.value = 1;
});

function confirm() {
  const current = trip.value;
  if (!current) return;
  dayPlanStore.addSpot(current.id, props.spotId, dayIndex.value, current.start_date);
  emit('update:modelValue', false);
}
function goCreateTrip() {
  emit('update:modelValue', false);
  router.push('/trips');
}
</script>
