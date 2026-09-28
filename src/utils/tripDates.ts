import dayjs from 'dayjs';
import type { DayPlan } from '../models/dayPlan';

/** 旅行起止日期决定的每一天（day_index 从 1 开始，date 为 YYYY-MM-DD） */
export interface TripDayInfo {
  day_index: number;
  date: string;
}

export const DATE_FORMAT = 'YYYY-MM-DD';

export function toDate(value: string) {
  return dayjs(value, DATE_FORMAT);
}

export function formatDateValue(value: dayjs.Dayjs | string) {
  return typeof value === 'string' ? dayjs(value).format(DATE_FORMAT) : value.format(DATE_FORMAT);
}

/** 由起止日期生成完整的天数序列：起、止各算一天 */
export function buildTripDays(startDate: string, endDate: string): TripDayInfo[] {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const total = Math.max(1, end.diff(start, 'day') + 1);
  return Array.from({ length: total }, (_, index) => ({
    day_index: index + 1,
    date: start.add(index, 'day').format(DATE_FORMAT),
  }));
}

/** 旅行总天数（起止日期至少一天） */
export function tripDayCount(startDate: string, endDate: string) {
  return buildTripDays(startDate, endDate).length;
}

/** 某一天的日期 */
export function dateOfDay(startDate: string, dayIndex: number) {
  return toDate(startDate).add(dayIndex - 1, 'day').format(DATE_FORMAT);
}

/** 结束日期是否早于起始日期 */
export function isInvalidDateRange(startDate: string, endDate: string) {
  return !startDate || !endDate || toDate(endDate).isBefore(toDate(startDate), 'day');
}

/** 某天是否落在旅行起止日期之内 */
export function isDayInRange(dayIndex: number, startDate: string, endDate: string) {
  return dayIndex >= 1 && dayIndex <= tripDayCount(startDate, endDate);
}

/** 缩短日期后，落在新范围之外且已有安排的天（会丢失的景点） */
export function findDroppedDays(
  dayPlans: DayPlan[],
  tripId: string,
  startDate: string,
  endDate: string,
) {
  const total = tripDayCount(startDate, endDate);
  return dayPlans
    .filter((day) => day.trip_id === tripId && (day.day_index > total || day.day_index < 1))
    .filter((day) => day.items.length > 0)
    .map((day) => day.day_index)
    .sort((a, b) => a - b);
}
