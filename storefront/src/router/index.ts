import { createRouter, createWebHistory } from 'vue-router';
import { TOKEN_KEY } from '@/api';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
    { path: '/workers', name: 'workers', component: () => import('@/views/Workers.vue'), meta: { title: '陪玩广场' } },
    { path: '/workers/:id', name: 'worker-detail', component: () => import('@/views/WorkerDetail.vue'), meta: { title: '陪玩详情' } },
    { path: '/order', name: 'order', component: () => import('@/views/Checkout.vue'), meta: { title: '下单', auth: true } },
    { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
    { path: '/register', name: 'register', component: () => import('@/views/Register.vue'), meta: { title: '注册' } },
    { path: '/orders', name: 'orders', component: () => import('@/views/Orders.vue'), meta: { title: '我的订单', auth: true } },
    { path: '/profile', name: 'profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人中心', auth: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to, _from, next) => {
  if (to.meta.auth && !localStorage.getItem(TOKEN_KEY)) {
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
