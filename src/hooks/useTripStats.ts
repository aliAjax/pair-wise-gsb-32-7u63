import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import type { Trip } from '../models/trip';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { summarizeTrip } from '../utils/budgetCalculator';

/**
 * 旅行统计（天数、每天景点数、总景点数、预算）统一入口。
 * 内部直接订阅 dayPlan / spot store，保证任何页面拿到的数据随时与本地数据一致。
 */
export function useTripStats(tripRef: () => Trip | undefined) {
  const spotStore = useSpotStore();
  const dayPlanStore = useDayPlanStore();
  const { spots } = storeToRefs(spotStore);
  const { dayPlans } = storeToRefs(dayPlanStore);

  return computed(() => {
    const trip = tripRef();
    if (!trip) {
      return { days: 0, spotCount: 0, perDaySpotCount: {}, daySummaries: [], spent: 0, remaining: 0, warning: '' };
    }
    return summarizeTrip(trip, dayPlans.value, spots.value);
  });
}
