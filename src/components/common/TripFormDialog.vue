<template>
  <el-dialog
    :model-value="modelValue"
    :title="trip ? messages.editTripTitle : messages.createTripTitle"
    width="520px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
    @closed="handleClosed"
  >
    <el-form ref="formRef" :model="form" label-width="88px">
      <el-form-item label="标题" :error="errors.title">
        <el-input v-model="form.title" placeholder="例如：杭州周末慢旅行" />
      </el-form-item>
      <el-form-item label="目的地" :error="errors.destination">
        <el-input v-model="form.destination" placeholder="例如：杭州" />
      </el-form-item>
      <el-form-item label="起止日期" :error="errors.start_date || errors.end_date">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="天数">
        <el-tag type="success">{{ dayCount }} 天（起止日期每天一条行程）</el-tag>
      </el-form-item>
      <el-form-item label="预算" :error="errors.budget">
        <el-input-number v-model="form.budget" :min="0" :step="100" style="width: 100%" />
        <el-select v-model="form.currency" style="width: 130px; margin-top: 8px">
          <el-option v-for="item in CURRENCY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="同行人">
        <el-select
          v-model="form.members"
          multiple
          filterable
          allow-create
          default-first-option
          :reserve-keyword="false"
          :placeholder="messages.membersPlaceholder"
          style="width: 100%"
        >
          <el-option v-for="name in knownMembers" :key="name" :label="name" :value="name" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="trip" label="状态">
        <el-select v-model="form.status" style="width: 100%">
          <el-option v-for="item in TRIP_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="conflicts.length"
      type="error"
      :closable="false"
      show-icon
      :title="messages.daysConflictTitle"
      style="margin-bottom: 12px"
    >
      <p>{{ messages.daysConflictTip }}</p>
      <div v-for="conflict in conflicts" :key="conflict.day_index" class="conflict-line">
        <strong>{{ messages.dayLabel(conflict.day_index, conflict.spotCount) }}</strong>
        <span class="muted">{{ conflict.spotNames.join('、') }}</span>
      </div>
    </el-alert>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInstance } from 'element-plus';
import type { Trip } from '../../models/trip';
import type { DayConflict, TripFormInput } from '../../types';
import { CURRENCY_OPTIONS, TRIP_STATUS_OPTIONS, TripStatus } from '../../constants/trip';
import { messages } from '../../constants/messages';
import { isInvalidDateRange, tripDayCount } from '../../utils/tripDates';
import { validateTripForm } from '../../utils/validators';

const props = defineProps<{
  modelValue: boolean;
  trip?: Trip;
  /** 提交校验：返回缩短日期会丢失的冲突天；空数组表示可以保存 */
  onSubmit: (form: TripFormInput) => DayConflict[];
  /** 其他旅行里已有的同行人，方便复用 */
  knownMembers?: string[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const formRef = ref<FormInstance>();
const dateRange = ref<[string, string] | null>(null);
const conflicts = ref<DayConflict[]>([]);

function blankForm(): TripFormInput {
  return {
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget: 0,
    currency: 'CNY',
    members: [],
    status: TripStatus.PLANNING,
  };
}
const form = reactive<TripFormInput>(blankForm());
const errors = reactive<Partial<Record<keyof TripFormInput, string>>>({});

watch(dateRange, (value) => {
  form.start_date = value?.[0] || '';
  form.end_date = value?.[1] || '';
  errors.start_date = '';
  errors.end_date = '';
  conflicts.value = [];
});

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    conflicts.value = [];
    Object.assign(form, blankForm());
    if (props.trip) {
      form.title = props.trip.title;
      form.destination = props.trip.destination;
      form.start_date = props.trip.start_date;
      form.end_date = props.trip.end_date;
      form.budget = props.trip.budget;
      form.currency = props.trip.currency as TripFormInput['currency'];
      form.members = [...props.trip.members];
      form.status = props.trip.status;
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const end = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
      form.start_date = today;
      form.end_date = end;
    }
    dateRange.value = form.start_date && form.end_date ? [form.start_date, form.end_date] : null;
    Object.keys(errors).forEach((key) => delete errors[key as keyof TripFormInput]);
  },
);

const dayCount = computed(() => {
  if (isInvalidDateRange(form.start_date, form.end_date)) return 0;
  return tripDayCount(form.start_date, form.end_date);
});
const knownMembers = computed(() => Array.from(new Set(props.knownMembers ?? [])));

function submit() {
  Object.keys(errors).forEach((key) => delete errors[key as keyof TripFormInput]);
  Object.assign(errors, validateTripForm(form));
  if (Object.values(errors).some(Boolean)) return;
  conflicts.value = props.onSubmit({ ...form, members: [...form.members] });
  if (!conflicts.value.length) emit('update:modelValue', false);
}

function handleClosed() {
  conflicts.value = [];
  dateRange.value = null;
  Object.assign(form, blankForm());
}
</script>
<style scoped>
.conflict-line { display: flex; justify-content: space-between; gap: 12px; margin: 4px 0; }
</style>
