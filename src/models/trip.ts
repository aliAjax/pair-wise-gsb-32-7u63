import { TripStatus } from '../constants/trip';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  members: string[];
  status: TripStatus;
  created_at: string;
}

/** 新建/编辑旅行对话框使用的表单结构 */
export type TripDraft = Omit<Trip, 'id' | 'status' | 'created_at' | 'currency'>;

/** 缩短日期后会丢失的某一天安排（用于编辑前提示用户处理） */
export interface DateConflict {
  dayIndex: number;
  date: string;
  spotCount: number;
}
