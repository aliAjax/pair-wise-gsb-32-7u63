export enum TripStatus {
  PLANNING = 'planning',
  ONGOING = 'ongoing',
  FINISHED = 'finished',
}
export const TRIP_STATUS_OPTIONS = [
  { label: '规划中', value: TripStatus.PLANNING },
  { label: '进行中', value: TripStatus.ONGOING },
  { label: '已结束', value: TripStatus.FINISHED },
];
export const CURRENCY_OPTIONS = [
  { label: '人民币 ¥', value: 'CNY' },
  { label: '美元 $', value: 'USD' },
  { label: '欧元 €', value: 'EUR' },
  { label: '日元 ¥', value: 'JPY' },
] as const;
