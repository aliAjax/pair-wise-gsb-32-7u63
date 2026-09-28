export interface DayPlanItem {
  /** 行程项自身 id，移动日期、拖拽排序时作为稳定 key */
  id: string;
  spot_id: string;
  start_time: string;
  end_time: string;
  note: string;
  transport: 'walk' | 'metro' | 'taxi' | 'train';
}

export interface DayPlan {
  id: string;
  trip_id: string;
  day_index: number;
  date: string;
  items: DayPlanItem[];
}
