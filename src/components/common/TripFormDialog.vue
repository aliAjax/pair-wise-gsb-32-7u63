<template>
  <el-dialog
    :model-value="modelValue"
    :title="trip ? '编辑旅行' : '新建旅行'"
    width="min(560px, 92vw)"
    @close="emit('update:modelValue', false)"
  >
    <el-form label-width="84px" class="trip-form" @submit.prevent>
      <el-form-item label="标题">
        <el-input v-model="form.title" placeholder="例如：云南五日慢游" maxlength="30" />
      </el-form-item>
      <el-form-item label="目的地">
        <el-input v-model="form.destination" placeholder="例如：大理" maxlength="20" />
      </el-form-item>
      <el-form-item label="起止日期">
        <div class="date-range">
          <el-date-picker v-model="form.start_date" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" :clearable="false" />
          <span class="muted">至</span>
          <el-date-picker v-model="form.end_date" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" :clearable="false" :disabled-date="disableBeforeStart" />
        </div>
      </el-form-item>
      <el-form-item label="行程天数">
        <el-tag type="success" size="large">共 {{ dayCount }} 天（每天一条行程）</el-tag>
      </el-form-item>
      <el-form-item label="预算">
        <el-input-number v-model="form.budget" :min="0" :step="100" :precision="0" controls-position="right" />
        <span class="muted unit">元（{{ trip?.currency || 'CNY' }}）</span>
      </el-form-item>
      <el-form-item label="同行人">
        <div class="members">
          <el-input
            v-for="(member, index) in form.members"
            :key="index"
            v-model="form.members[index]"
            placeholder="同行人姓名"
            maxlength="12"
            class="member-input"
          >
            <template #append>
              <el-button :disabled="form.members.length <= 1" @click="removeMember(index)">移除</el-button>
            </template>
          </el-input>
          <el-button plain @click="addMember">添加同行人</el-button>
        </div>
      </el-form-item>
    </el-form>

    <!-- 缩短日期会丢掉已有安排时，先停下提示用户处理 -->
    <el-alert
      v-if="conflicts.length"
      type="error"
      :closable="false"
      show-icon
      title="以下已有安排会因缩短日期丢失，请先在行程详情中把这些景点移到保留的日期或删除"
      class="conflict-alert"
    >
      <ul class="conflict-list">
        <li v-for="item in conflicts" :key="item.dayIndex">
          {{ dayLabel(item.dayIndex, item.date) }}：{{ item.spotCount }} 个景点
        </li>
      </ul>
    </el-alert>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!!conflicts.length" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import type { Trip, TripDraft, DateConflict } from '../../models/trip';
import { useTripStore } from '../../stores/tripStore';
import { useDayPlanStore } from '../../stores/dayPlanStore';
import { draftDayCount, validateTripDraft } from '../../utils/validators';
import { dayLabel, today } from '../../utils/tripDates';
import { toast } from '../../utils/message';

const props = defineProps<{ modelValue: boolean; trip?: Trip | null }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [id: string] }>();

const tripStore = useTripStore();
const dayPlanStore = useDayPlanStore();

function emptyDraft(): TripDraft {
  return {
    title: '',
    destination: '',
    start_date: today(),
    end_date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    budget: 3000,
    members: ['我'],
  };
}

const form = reactive<TripDraft>(emptyDraft());
const conflicts = ref<DateConflict[]>([]);
const dayCount = computed(() => draftDayCount(form));

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    const draft: TripDraft = props.trip
      ? { title: props.trip.title, destination: props.trip.destination, start_date: props.trip.start_date, end_date: props.trip.end_date, budget: props.trip.budget, members: [...props.trip.members] }
      : emptyDraft();
    Object.assign(form, draft);
    conflicts.value = [];
  },
);

// 实时预览缩短日期导致的冲突（只针对天数变少）
watch(
  () => [form.start_date, form.end_date],
  () => {
    if (!props.trip) {
      conflicts.value = [];
      return;
    }
    const nextCount = draftDayCount(form);
    conflicts.value = dayPlanStore
      .daysForTrip(props.trip.id)
      .filter((day) => day.day_index > nextCount && day.items.length > 0)
      .map((day) => ({ dayIndex: day.day_index, date: day.date, spotCount: day.items.length }));
  },
);

function disableBeforeStart(date: Date) {
  return form.start_date ? dayjs(date).isBefore(dayjs(form.start_date), 'day') : false;
}

function addMember() {
  form.members.push('');
}
function removeMember(index: number) {
  form.members.splice(index, 1);
}

function submit() {
  const invalid = validateTripDraft(form);
  if (invalid) {
    toast.fail(invalid);
    return;
  }
  if (props.trip) {
    const result = tripStore.updateTrip(props.trip.id, { ...form, members: [...form.members] });
    if (!result.ok) {
      conflicts.value = result.conflicts;
      return;
    }
    emit('saved', props.trip.id);
  } else {
    const id = tripStore.createTrip({ ...form, members: [...form.members] });
    if (!id) return;
    // 新建后立刻按起止日期生成每天一条行程
    const created = tripStore.trips.find((item) => item.id === id);
    if (created) dayPlanStore.syncForTrip(created);
    emit('saved', id);
  }
  emit('update:modelValue', false);
}
</script>

<style scoped>
.date-range { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.unit { margin-left: 8px; }
.members { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.member-input { width: 100%; }
.conflict-alert { margin-top: 8px; }
.conflict-list { margin: 6px 0 0; padding-left: 18px; }
</style>
