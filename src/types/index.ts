export type CurrencyCode = 'CNY' | 'USD' | 'EUR' | 'JPY';
export interface PersistedPayload<T> { version: string; data: T; updatedAt: string }

/** 新建/编辑旅行表单值 */
export interface TripFormInput {
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: CurrencyCode;
  members: string[];
  status: import('../constants/trip').TripStatus;
}

/** 缩短日期会丢掉的已有安排（天序号 + 当天景点） */
export interface DayConflict {
  day_index: number;
  spotCount: number;
  spotNames: string[];
}

/** 更新旅行的结果：失败时把需要用户处理的冲突天带回 UI */
export interface TripUpdateResult {
  ok: boolean;
  conflicts?: DayConflict[];
}
