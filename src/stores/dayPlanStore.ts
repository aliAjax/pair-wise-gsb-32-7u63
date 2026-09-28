import { defineStore } from 'pinia';
import type { DayPlan, DayPlanItem } from '../models/dayPlan';
import type { Trip, DateConflict } from '../models/trip';
import { dayPlanApi } from '../api/dayPlanApi';
import { tripApi } from '../api/tripApi';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';
import { buildDateRange, tripDayCount } from '../utils/tripDates';

/** 新建行程项的默认停留时间与交通方式 */
function createDayPlanItem(spotId: string): DayPlanItem {
  return { id: crypto.randomUUID(), spot_id: spotId, start_time: '10:00', end_time: '12:00', note: '现场调整', transport: 'metro' };
}

export const useDayPlanStore = defineStore('dayPlan', {
  state: () => {
    const dayPlans = dayPlanApi.list() as DayPlan[];
    // 兼容旧数据：历史行程项没有 id，补上以支持稳定的 key / 移动 / 删除
    let migrated = false;
    dayPlans.forEach((day) => {
      day.items.forEach((item) => {
        if (!item.id) {
          item.id = crypto.randomUUID();
          migrated = true;
        }
      });
    });
    if (migrated) dayPlanApi.save(dayPlans);
    return { dayPlans };
  },
  getters: {
    /** 某趟旅行的行程按天排序（组件统一通过该 getter 取数，避免各处自行 filter） */
    daysForTrip: (state) => (tripId: string) =>
      state.dayPlans.filter((day) => day.trip_id === tripId).sort((a, b) => a.day_index - b.day_index),
  },
  actions: {
    persist() {
      dayPlanApi.save(this.dayPlans);
    },

    /** 从已保存的旅行数据中取旅行，避免与 tripStore 初始化顺序耦合 */
    findTrip(tripId: string): Trip | undefined {
      return tripApi.list().find((trip) => trip.id === tripId);
    },

    /** 按旅行的起止日期取某天的日期 */
    dateOfDay(trip: Trip, dayIndex: number) {
      return buildDateRange(trip.start_date, trip.end_date).find((item) => item.day_index === dayIndex)?.date || trip.start_date;
    },

    /**
     * 应用启动时为所有已存在的旅行补齐 DayPlan：
     * 天数完全由起止日期决定，每天一条行程。
     */
    syncAllTrips() {
      let changed = false;
      tripApi.list().forEach((trip) => {
        if (this.syncForTrip(trip, { silent: true })) changed = true;
      });
      if (changed) this.persist();
    },

    /**
     * 按旅行的起止日期同步行程：
     * - 已有天更新 day_index / date，日期调整后安排跟着日期一起移动；
     * - 范围内缺失的天新建空行程；
     * - 范围外的天仅在没有安排时删除（有安排时由编辑流程先拦截）。
     * 返回是否发生了数据变化。
     */
    syncForTrip(trip: Trip, options: { silent?: boolean } = {}) {
      const range = buildDateRange(trip.start_date, trip.end_date);
      const existing = this.dayPlans.filter((day) => day.trip_id === trip.id);
      let changed = false;

      range.forEach(({ day_index, date }) => {
        const day = existing.find((item) => item.day_index === day_index);
        if (day) {
          if (day.date !== date) {
            day.date = date;
            changed = true;
          }
        } else {
          this.dayPlans.push({ id: crypto.randomUUID(), trip_id: trip.id, day_index, date, items: [] });
          changed = true;
        }
      });

      const validIds = new Set(range.map((item) => item.day_index));
      const removable = existing.filter((day) => !validIds.has(day.day_index) && day.items.length === 0);
      if (removable.length) {
        const removeIds = new Set(removable.map((day) => day.id));
        this.dayPlans = this.dayPlans.filter((day) => !removeIds.has(day.id));
        changed = true;
      }

      if (changed && !options.silent) this.persist();
      return changed;
    },

    /**
     * 缩短日期前的冲突预览：返回缩短后会被丢掉、且仍有景点的天。
     * 只检查“天数变少”的情况；平移/延后/延长不会丢安排。
     */
    previewDateConflicts(trip: Trip, nextEndDate: string): DateConflict[] {
      const nextCount = tripDayCount(trip.start_date, nextEndDate);
      return this.daysForTrip(trip.id)
        .filter((day) => day.day_index > nextCount && day.items.length > 0)
        .map((day) => ({ dayIndex: day.day_index, date: day.date, spotCount: day.items.length }));
    },

    /** 删除整趟旅行时清理其全部行程 */
    removeForTrip(tripId: string) {
      this.dayPlans = this.dayPlans.filter((day) => day.trip_id !== tripId);
      this.persist();
    },

    /** 取某天；不存在时按旅行起止日期补建（仅限范围内的天） */
    ensureDay(tripId: string, dayIndex: number) {
      let day = this.dayPlans.find((item) => item.trip_id === tripId && item.day_index === dayIndex);
      if (!day) {
        const trip = this.findTrip(tripId);
        const date = trip ? this.dateOfDay(trip, dayIndex) : new Date().toISOString().slice(0, 10);
        day = { id: crypto.randomUUID(), trip_id: tripId, day_index: dayIndex, date, items: [] };
        this.dayPlans.push(day);
      }
      return day;
    },

    /** 添加景点到指定天（日期由起止日期决定），超范围直接拒绝 */
    addSpot(tripId: string, spotId: string, dayIndex: number) {
      const trip = this.findTrip(tripId);
      if (!trip) {
        toast.fail(messages.noTripForSpot);
        return;
      }
      const total = tripDayCount(trip.start_date, trip.end_date);
      if (dayIndex < 1 || dayIndex > total) {
        toast.fail(messages.dayOutOfRange);
        return;
      }
      const day = this.ensureDay(tripId, dayIndex);
      day.items.push(createDayPlanItem(spotId));
      this.persist();
      toast.ok(messages.spotAdded);
    },

    /** 把某个行程项移动到另一天，日期调整后安排跟着走 */
    moveSpot(tripId: string, itemId: string, targetDayIndex: number) {
      const trip = this.findTrip(tripId);
      if (!trip) return;
      const total = tripDayCount(trip.start_date, trip.end_date);
      if (targetDayIndex < 1 || targetDayIndex > total) {
        toast.fail(messages.dayOutOfRange);
        return;
      }
      const source = this.dayPlans.find((day) => day.trip_id === tripId && day.items.some((item) => item.id === itemId));
      const itemIndex = source?.items.findIndex((item) => item.id === itemId) ?? -1;
      if (!source || itemIndex < 0) return;
      const target = this.ensureDay(tripId, targetDayIndex);
      if (source.id === target.id) return;
      const [moved] = source.items.splice(itemIndex, 1);
      target.items.push(moved);
      this.persist();
      toast.ok(messages.spotMoved);
    },

    /** 删除某天的某个安排（缩短日期前的处理入口之一） */
    removeItem(tripId: string, itemId: string) {
      const day = this.dayPlans.find((item) => item.trip_id === tripId && item.items.some((plan) => plan.id === itemId));
      if (!day) return;
      day.items = day.items.filter((item) => item.id !== itemId);
      this.persist();
      toast.ok(messages.spotRemoved);
    },

    reorder(tripId: string, dayIndex: number, from: number, to: number) {
      const day = this.ensureDay(tripId, dayIndex);
      const [moved] = day.items.splice(from, 1);
      if (moved) day.items.splice(to, 0, moved);
      this.persist();
    },
  },
});
