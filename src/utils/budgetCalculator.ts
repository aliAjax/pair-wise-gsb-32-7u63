import type { DayPlan } from '../models/dayPlan';
import type { Spot } from '../models/spot';
import type { Trip } from '../models/trip';
import { messages } from '../constants/messages';
import { buildTripDays } from './tripDates';

export function calcTripCost(dayPlans: DayPlan[], spots: Spot[]) {
  const spotMap = new Map(spots.map((spot) => [spot.id, spot]));
  return dayPlans.reduce((sum, day) => {
    return sum + day.items.reduce((inner, item) => inner + (spotMap.get(item.spot_id)?.price || 0), 0);
  }, 0);
}

export function budgetStatus(trip: Trip, dayPlans: DayPlan[], spots: Spot[]) {
  const spent = calcTripCost(dayPlans, spots);
  return { spent, remaining: trip.budget - spent, warning: spent > trip.budget ? messages.budgetExceeded : '' };
}

export interface DaySummary {
  day_index: number;
  date: string;
  spotCount: number;
  cost: number;
}

export interface TripSummary {
  days: number;
  spotCount: number;
  perDaySpotCount: Record<number, number>;
  daySummaries: DaySummary[];
  spent: number;
  remaining: number;
  warning: string;
}

/**
 * 旅行数据的统一汇总口径：
 * 天数由起止日期决定（每天一条），每天景点数、总景点数、已花预算都来自 DayPlan + Spot。
 * 列表页、详情页、编排页必须消费这里的结果，保证看到的数据一致。
 */
export function summarizeTrip(trip: Trip, dayPlans: DayPlan[], spots: Spot[]): TripSummary {
  const spotMap = new Map(spots.map((spot) => [spot.id, spot]));
  const tripPlans = dayPlans.filter((day) => day.trip_id === trip.id);
  const daySummaries: DaySummary[] = buildTripDays(trip.start_date, trip.end_date).map((info) => {
    const plan = tripPlans.find((item) => item.day_index === info.day_index);
    const items = plan?.items ?? [];
    return {
      day_index: info.day_index,
      date: info.date,
      spotCount: items.length,
      cost: items.reduce((sum, item) => sum + (spotMap.get(item.spot_id)?.price || 0), 0),
    };
  });
  const perDaySpotCount: Record<number, number> = {};
  daySummaries.forEach((day) => { perDaySpotCount[day.day_index] = day.spotCount; });
  const budget = budgetStatus(trip, tripPlans, spots);
  return {
    days: daySummaries.length,
    spotCount: daySummaries.reduce((sum, day) => sum + day.spotCount, 0),
    perDaySpotCount,
    daySummaries,
    ...budget,
  };
}
