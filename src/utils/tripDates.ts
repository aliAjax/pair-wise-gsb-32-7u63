import dayjs from 'dayjs';

/** 本机存储使用的日期格式：YYYY-MM-DD */
export const DATE_PATTERN = 'YYYY-MM-DD';

export function today() {
  return dayjs().format(DATE_PATTERN);
}

/** 旅行包含的天数（含起止当天），起止日期非法时按 1 天兜底 */
export function tripDayCount(startDate: string, endDate: string) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) return 1;
  return end.diff(start, 'day') + 1;
}

/** 按起止日期生成每一天：day_index 从 1 开始，date 为该天的实际日期 */
export function buildDateRange(startDate: string, endDate: string) {
  const start = dayjs(startDate);
  const total = tripDayCount(startDate, endDate);
  return Array.from({ length: total }, (_, index) => ({
    day_index: index + 1,
    date: start.add(index, 'day').format(DATE_PATTERN),
  }));
}

/** “第 N 天 · 日期”标签，供详情页 / 编排页 / 选择器共用 */
export function dayLabel(dayIndex: number, date: string) {
  return `第 ${dayIndex} 天 · ${date}`;
}
