import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import type { Trip } from '../models/trip';
import type { DayPlan } from '../models/dayPlan';
import type { Spot } from '../models/spot';
import { budgetStatus } from '../utils/budgetCalculator';
import { buildDateRange, tripDayCount } from '../utils/tripDates';

/**
 * 旅行统计：天数由起止日期决定（与列表卡片、详情、编排页保持一致），
 * 景点数按同步后的 DayPlan 汇总，预算由 budgetCalculator 统一计算。
 * 参数支持 ref / getter，组件中无需再包一层 computed。
 */
export function useTripStats(
  tripSource: MaybeRefOrGetter<Trip | undefined>,
  dayPlansSource: MaybeRefOrGetter<DayPlan[]>,
  spotsSource: MaybeRefOrGetter<Spot[]>,
) {
  return computed(() => {
    const trip = toValue(tripSource);
    const allDayPlans = toValue(dayPlansSource);
    const spots = toValue(spotsSource);
    if (!trip) return { days: 0, spotCount: 0, daySpotCounts: [] as number[], budget: { spent: 0, remaining: 0, warning: '' } };

    const tripDays = allDayPlans.filter((day) => day.trip_id === trip.id);
    const range = buildDateRange(trip.start_date, trip.end_date);
    const daySpotCounts = range.map(({ day_index }) => tripDays.find((day) => day.day_index === day_index)?.items.length || 0);

    return {
      days: tripDayCount(trip.start_date, trip.end_date),
      spotCount: daySpotCounts.reduce((sum, count) => sum + count, 0),
      daySpotCounts,
      budget: budgetStatus(trip, tripDays, spots),
    };
  });
}
