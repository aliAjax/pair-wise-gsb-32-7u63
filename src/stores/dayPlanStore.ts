import { defineStore } from 'pinia';
import type { DayPlan, DayPlanItem } from '../models/dayPlan';
import type { Trip } from '../models/trip';
import { dayPlanApi } from '../api/dayPlanApi';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';
import { buildTripDays, dateOfDay, isInvalidDateRange } from '../utils/tripDates';

export const useDayPlanStore = defineStore('dayPlan', {
  state: () => ({ dayPlans: dayPlanApi.list() as DayPlan[] }),
  actions: {
    findDay(tripId: string, dayIndex: number) {
      return this.dayPlans.find((item) => item.trip_id === tripId && item.day_index === dayIndex);
    },
    /** 按日期取某天行程，不存在则按旅行起始日期补建 */
    ensureDay(tripId: string, dayIndex = 1, startDate?: string) {
      let day = this.findDay(tripId, dayIndex);
      if (!day) {
        const date = startDate ? dateOfDay(startDate, dayIndex) : new Date().toISOString().slice(0, 10);
        day = { id: crypto.randomUUID(), trip_id: tripId, day_index: dayIndex, date, items: [] };
        this.dayPlans.push(day);
      }
      return day;
    },
    addSpot(tripId: string, spotId: string, dayIndex = 1, startDate?: string) {
      const day = this.ensureDay(tripId, dayIndex, startDate);
      const item: DayPlanItem = { spot_id: spotId, start_time: '10:00', end_time: '12:00', note: '现场调整', transport: 'metro' };
      day.items.push(item);
      dayPlanApi.save(this.dayPlans);
      toast.ok(messages.spotAdded);
    },
    removeSpot(tripId: string, dayIndex: number, spotId: string) {
      const day = this.findDay(tripId, dayIndex);
      if (!day) return;
      const index = day.items.findIndex((item) => item.spot_id === spotId);
      if (index >= 0) {
        day.items.splice(index, 1);
        dayPlanApi.save(this.dayPlans);
        toast.ok(messages.spotRemoved);
      }
    },
    reorder(tripId: string, dayIndex: number, from: number, to: number) {
      const day = this.findDay(tripId, dayIndex);
      if (!day) return;
      const [moved] = day.items.splice(from, 1);
      if (moved) day.items.splice(to, 0, moved);
      dayPlanApi.save(this.dayPlans);
    },
    /**
     * 旅行起止日期变化后，已有安排跟着日期一起移动：
     * day_index 不变，date 统一按新的起始日期重新计算；
     * 落在新范围之外的天直接删除（调用方必须先确认这些天没有景点）。
     */
    alignTripDates(tripId: string, startDate: string, endDate: string) {
      const days = buildTripDays(startDate, endDate);
      const keepIndexes = new Set(days.map((day) => day.day_index));
      this.dayPlans = this.dayPlans.filter((day) => day.trip_id !== tripId || keepIndexes.has(day.day_index));
      days.forEach((info) => {
        const plan = this.findDay(tripId, info.day_index);
        if (plan) {
          plan.date = info.date;
        } else {
          // 延长出来的新天按日期预建，保证每天一条行程
          this.dayPlans.push({ id: crypto.randomUUID(), trip_id: tripId, day_index: info.day_index, date: info.date, items: [] });
        }
      });
      dayPlanApi.save(this.dayPlans);
    },
    removeByTrip(tripId: string) {
      this.dayPlans = this.dayPlans.filter((day) => day.trip_id !== tripId);
      dayPlanApi.save(this.dayPlans);
    },
    /**
     * 启动时对本地已有数据做一次对齐：
     * 范围内每天日期按起始日期重算；范围外的空天删除；
     * 范围外但仍有景点的天保留原样，等用户编辑旅行时再提示处理。
     */
    reconcileAllTrips(trips: Trip[]) {
      let changed = false;
      const removeIds = new Set<string>();
      trips.forEach((trip) => {
        if (isInvalidDateRange(trip.start_date, trip.end_date)) return;
        const days = buildTripDays(trip.start_date, trip.end_date);
        const indexes = new Set(days.map((day) => day.day_index));
        this.dayPlans.forEach((plan) => {
          if (plan.trip_id !== trip.id) return;
          if (indexes.has(plan.day_index)) {
            const date = dateOfDay(trip.start_date, plan.day_index);
            if (plan.date !== date) {
              plan.date = date;
              changed = true;
            }
          } else if (plan.items.length === 0) {
            removeIds.add(plan.id);
            changed = true;
          }
        });
      });
      if (removeIds.size) this.dayPlans = this.dayPlans.filter((plan) => !removeIds.has(plan.id));
      if (changed) dayPlanApi.save(this.dayPlans);
    },
  },
});
