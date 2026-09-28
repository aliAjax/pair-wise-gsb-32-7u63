import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './style.css';
import App from './App.vue';
import router from './router';
import { useTripStore } from './stores/tripStore';
import { useDayPlanStore } from './stores/dayPlanStore';

const pinia = createPinia();
const app = createApp(App);
app.use(pinia).use(router).use(ElementPlus);

// 兼容本地历史数据：已有安排按旅行起止日期重新对齐
useDayPlanStore(pinia).reconcileAllTrips(useTripStore(pinia).trips);

app.mount('#app');
