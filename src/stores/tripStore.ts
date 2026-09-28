import { defineStore } from 'pinia';
import { TripStatus } from '../constants/trip';
import type { Trip, TripDraft, DateConflict } from '../models/trip';
import { tripApi } from '../api/tripApi';
import { messages, dateConflictMessage } from '../constants/messages';
import { toast } from '../utils/message';
import { validateTripDraft } from '../utils/validators';
import { dayLabel } from '../utils/tripDates';
import { useDayPlanStore } from './dayPlanStore';

export const useTripStore = defineStore('trip', {
  state: () => ({ trips: tripApi.list() as Trip[], statusFilter: 'all' as TripStatus | 'all' }),
  getters: {
    filteredTrips: (state) => state.statusFilter === 'all' ? state.trips : state.trips.filter((trip) => trip.status === state.statusFilter),
  },
  actions: {
    /** 新建旅行：标题、日期、预算、同行人均来自表单 */
    createTrip(draft: TripDraft) {
      const invalid = validateTripDraft(draft);
      if (invalid) {
        toast.fail(invalid);
        return '';
      }
      const trip: Trip = {
        ...draft,
        title: draft.title.trim(),
        destination: draft.destination.trim(),
        members: draft.members.map((name) => name.trim()).filter(Boolean),
        id: crypto.randomUUID(),
        currency: 'CNY',
        status: TripStatus.PLANNING,
        created_at: new Date().toISOString(),
      };
      this.trips.unshift(trip);
      tripApi.save(this.trips);
      toast.ok(messages.tripCreated);
      return trip.id;
    },

    /** 编辑旅行：若缩短日期会丢掉已有景点，返回冲突并阻止保存 */
    updateTrip(id: string, draft: TripDraft): { ok: boolean; conflicts: DateConflict[] } {
      const current = this.trips.find((trip) => trip.id === id);
      if (!current) return { ok: false, conflicts: [] };
      const invalid = validateTripDraft(draft);
      if (invalid) {
        toast.fail(invalid);
        return { ok: false, conflicts: [] };
      }

      const conflicts = useDayPlanStore().previewDateConflicts(current, draft.end_date);
      if (conflicts.length) {
        toast.fail(dateConflictMessage(conflicts.map((item) => dayLabel(item.dayIndex, item.date) + `（${item.spotCount} 个景点）`).join('、')));
        return { ok: false, conflicts };
      }

      Object.assign(current, {
        title: draft.title.trim(),
        destination: draft.destination.trim(),
        start_date: draft.start_date,
        end_date: draft.end_date,
        budget: draft.budget,
        members: draft.members.map((name) => name.trim()).filter(Boolean),
      });
      tripApi.save(this.trips);
      this.syncDayPlans(current);
      toast.ok(messages.tripUpdated);
      return { ok: true, conflicts: [] };
    },

    /** 编辑前的冲突预览（供对话框/Store 外部使用，内部实际逻辑在 dayPlanStore） */
    previewDateConflicts(trip: Trip, nextEndDate: string): DateConflict[] {
      return useDayPlanStore().previewDateConflicts(trip, nextEndDate);
    },

    /** 保存旅行后让每天一条行程随日期同步 */
    syncDayPlans(trip: Trip) {
      const dayPlanStore = useDayPlanStore();
      dayPlanStore.syncForTrip(trip);
    },

    removeTrip(id: string) {
      this.trips = this.trips.filter((trip) => trip.id !== id);
      tripApi.save(this.trips);
      // 同时删除该旅行下的每日行程，避免残留数据
      useDayPlanStore().removeForTrip(id);
      toast.ok(messages.tripDeleted);
    },
  },
});
