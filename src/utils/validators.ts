import { tripDayCount } from './tripDates';
import type { TripDraft } from '../models/trip';

export function required(value: string, field: string) {
  if (!value.trim()) throw new Error(field + '不能为空');
  return value.trim();
}

/** 校验新建/编辑旅行表单：标题、目的地、起止日期、预算、同行人均在此处统一处理 */
export function validateTripDraft(draft: TripDraft) {
  if (!draft.title.trim()) return '标题不能为空';
  if (!draft.destination.trim()) return '目的地不能为空';
  if (!draft.start_date || !draft.end_date) return '请选择起止日期';
  if (draft.end_date < draft.start_date) return '结束日期不能早于开始日期';
  if (!Number.isFinite(draft.budget) || draft.budget < 0) return '预算不能为负数';
  if (draft.members.some((name) => !name.trim())) return '同行人不能为空';
  return '';
}

/** 表单预览天数，起止日期未选时返回 0 */
export function draftDayCount(draft: TripDraft) {
  if (!draft.start_date || !draft.end_date || draft.end_date < draft.start_date) return 0;
  return tripDayCount(draft.start_date, draft.end_date);
}
