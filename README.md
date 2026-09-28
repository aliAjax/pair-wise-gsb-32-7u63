# TripWeaver 旅游行程规划助手

## 快速启动

```bash
pnpm install
pnpm dev
```

访问地址：http://localhost:18417

TripWeaver 是一款纯前端旅行规划应用，支持创建旅行、探索景点、编排每日行程、预算统计和分享预览。

## 主要功能

- 我的旅行：通过表单新建/编辑旅行（标题、目的地、起止日期、预算、同行人），按状态筛选、删除。
- 日期驱动行程：起止日期决定每天一条行程；调整日期后已有安排随日期一起移动；缩短日期会丢掉已有景点时先阻止保存并提示用户到详情页移动或移除这些安排。
- 行程详情：按日期查看每日行程、处理单个安排、预算图表和每天景点数统计。
- 景点探索：按 SpotCategory 搜索和筛选，收藏并选择加入某趟旅行的具体某一天。
- 行程编排：在日期范围内按天切换，SortableJS 拖拽排序，实时影响预算计算。
- 分享预览：生成可复制的行程文本。
- 列表、详情、编排、分享页的预算、同行人和每天景点数统一由 `useTripStats` / `budgetCalculator` 计算，数据保存在浏览器本机。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript |
| 构建 | Vite |
| UI | Element Plus + ECharts |
| 状态 | Pinia |
| 路由 | Vue Router 4 |
| 持久化 | localStorage + Dexie.js |
| 交互 | sortablejs |

## 目录结构

```
src/
├── api/
├── stores/
├── models/
├── types/
├── components/common/
├── hooks/
├── pages/
├── router/
├── utils/
├── config/
└── constants/
```

## 数据持久化

本地数据通过 `utils/storage.ts` 统一写入 localStorage，并保留 Dexie 数据库对象用于后续 IndexedDB 扩展。版本键来自 `constants/storageVersion.ts`。

## 环境变量

`VITE_AMAP_KEY`：高德地图 key。未配置时使用 demo-key，地图主题配置同时出现在 `config/map.ts`、`SpotCard`、`DayTimeline`、`Planner` 相关逻辑中。

## 枚举出现位置清单

SpotCategory：
- `src/constants/spot.ts`
- `src/models/spot.ts`
- `src/stores/spotStore.ts`
- `src/components/common/CategoryFilter.vue`
- `src/components/common/SpotCard.vue`
- `src/pages/Spots.vue`
- `src/pages/TripDetail.vue`
- `src/utils/formatters.ts`
- `src/router/guards.ts`

TripStatus：
- `src/constants/trip.ts`
- `src/models/trip.ts`
- `src/stores/tripStore.ts`
- `src/components/common/TripCard.vue`
- `src/pages/Trips.vue`
- `src/utils/formatters.ts`
- `src/router/guards.ts`

## License

MIT

