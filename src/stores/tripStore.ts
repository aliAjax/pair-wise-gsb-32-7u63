import { defineStore } from 'pinia';
import { TripStatus } from '../constants/trip';
import type { Trip } from '../models/trip';
import type { Spot } from '../models/spot';
import type { DayConflict, TripFormInput, TripUpdateResult } from '../types';
import { tripApi } from '../api/tripApi';
import { spotApi } from '../api/spotApi';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';
import { isInvalidDateRange, tripDayCount } from '../utils/tripDates';
import { useDayPlanStore } from './dayPlanStore';

function defaultStart() {
  return new Date().toISOString().slice(0, 10);
}
function defaultEnd() {
  return new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
}

export const useTripStore = defineStore('trip', {
  state: () => ({ trips: tripApi.list() as Trip[], statusFilter: 'all' as TripStatus | 'all' }),
  getters: {
    filteredTrips: (state) => state.statusFilter === 'all' ? state.trips : state.trips.filter((trip) => trip.status === state.statusFilter),
    getById: (state) => (id: string) => state.trips.find((trip) => trip.id === id),
  },
  actions: {
    createTrip(form?: Partial<TripFormInput>) {
      const trip: Trip = {
        id: crypto.randomUUID(),
        title: form?.title?.trim() || '未命名旅行',
        destination: form?.destination?.trim() || '',
        start_date: form?.start_date || defaultStart(),
        end_date: form?.end_date || defaultEnd(),
        budget: form?.budget ?? 0,
        currency: form?.currency || 'CNY',
        members: form?.members ? [...form.members] : [],
        status: form?.status || TripStatus.PLANNING,
        created_at: new Date().toISOString(),
      };
      this.trips.unshift(trip);
      tripApi.save(this.trips);
      // 按起止日期把每天一条行程建好
      useDayPlanStore().alignTripDates(trip.id, trip.start_date, trip.end_date);
      toast.ok(messages.tripCreated);
      return trip.id;
    },
    /**
     * 编辑旅行。若新的日期范围会让已有景点落在范围之外，则先停下，
     * 不写入任何数据，把冲突天返回给 UI 提示用户处理。
     */
    updateTrip(id: string, form: TripFormInput): TripUpdateResult {
      const trip = this.trips.find((item) => item.id === id);
      if (!trip) return { ok: false };
      if (isInvalidDateRange(form.start_date, form.end_date)) {
        return { ok: false, conflicts: [] };
      }
      const dayPlanStore = useDayPlanStore();
      const spotList = spotApi.list();
      const nameOf = (spotId: string) => spotList.find((spot: Spot) => spot.id === spotId)?.name || '未知景点';
      const conflicts: DayConflict[] = dayPlanStore.dayPlans
        .filter((day) => day.trip_id === id && day.day_index > tripDayCount(form.start_date, form.end_date))
        .filter((day) => day.items.length > 0)
        .map((day) => ({
          day_index: day.day_index,
          spotCount: day.items.length,
          spotNames: day.items.map((item) => nameOf(item.spot_id)),
        }));
      if (conflicts.length) {
        toast.fail(messages.daysConflictTitle);
        return { ok: false, conflicts };
      }
      trip.title = form.title.trim();
      trip.destination = form.destination.trim();
      trip.start_date = form.start_date;
      trip.end_date = form.end_date;
      trip.budget = form.budget;
      trip.currency = form.currency;
      trip.members = [...form.members];
      trip.status = form.status;
      tripApi.save(this.trips);
      // 已有安排随日期一起移动，多出的天补建，缩短且无安排的天删除
      dayPlanStore.alignTripDates(id, trip.start_date, trip.end_date);
      toast.ok(messages.tripUpdated);
      return { ok: true };
    },
    removeTrip(id: string) {
      this.trips = this.trips.filter((trip) => trip.id !== id);
      tripApi.save(this.trips);
      useDayPlanStore().removeByTrip(id);
      toast.ok(messages.tripDeleted);
    },
  },
});
