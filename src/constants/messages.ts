export const messages = {
  tripCreated: '旅行计划已创建',
  tripUpdated: '旅行信息已更新，行程日期已同步',
  tripDeleted: '旅行计划已删除',
  spotAdded: '景点已加入当天行程',
  spotMoved: '景点已移动到新的一天',
  spotRemoved: '景点已从当天安排中移除',
  emptyTrips: '还没有旅行计划，先创建一次出发。',
  emptySpots: '没有符合条件的景点。',
  emptyTripDays: '这段日期还没有任何一天安排。',
  noTripForSpot: '请先创建旅行，再把景点加入行程',
  dayOutOfRange: '所选日期不在旅行起止范围内',
  budgetExceeded: '预算可能超支，请调整景点或交通方式',
  storageRecovered: '本地数据已恢复',
  formInvalid: '请先修正旅行信息',
  tripFields: {
    title: '标题',
    destination: '目的地',
    dates: '起止日期',
    budget: '预算',
    members: '同行人',
  },
};

/** 缩短日期时给出的阻断提示，{days} 由调用方替换为具体天信息 */
export const dateConflictMessage = (days: string) =>
  `缩短日期后，以下已有安排会丢失，请先在行程详情中把这些景点移到保留的日期或删除：${days}`;
