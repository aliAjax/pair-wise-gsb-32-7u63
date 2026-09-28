import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './style.css';
import App from './App.vue';
import router from './router';
import { useDayPlanStore } from './stores/dayPlanStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia).use(router).use(ElementPlus);

// 启动时按各旅行的起止日期补齐每天一条行程（兼容历史数据）
useDayPlanStore(pinia).syncAllTrips();

app.mount('#app');

