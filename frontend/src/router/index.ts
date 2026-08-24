import { createRouter, createWebHashHistory } from 'vue-router';
import type { App } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store/modules/user-store';
import { usePermissionStore } from '@/store/modules/permission-store';

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/index.vue'),
    redirect: '/dashboard',
    children: [
      // 按要求排序（通过 meta.sort 控制）
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '首页', icon: 'dashboard', sort: 1 } },
      { path: 'order', name: 'Order', component: () => import('@/views/order/index.vue'), meta: { title: '订单管理', icon: 'order', sort: 2 } },
      { path: 'worker', name: 'Worker', component: () => import('@/views/worker/index.vue'), meta: { title: '打手管理', icon: 'worker', sort: 3 } },
      { path: 'worker-settlement', name: 'WorkerSettlement', component: () => import('@/views/worker-settlement/index.vue'), meta: { title: '打手对账', icon: 'settlement', sort: 4 } },
      { path: 'member', name: 'Member', component: () => import('@/views/member/index.vue'), meta: { title: '会员管理', icon: 'member', sort: 5 } },
      { path: 'recharge', name: 'Recharge', component: () => import('@/views/recharge/index.vue'), meta: { title: '充值管理', icon: 'recharge', sort: 6 } },
      { path: 'commission-rule', name: 'CommissionRule', component: () => import('@/views/commission-rule/index.vue'), meta: { title: '佣金规则', icon: 'commission-rule', sort: 7 } },
      // 数据与财务
      { path: 'report', name: 'Report', component: () => import('@/views/report/index.vue'), meta: { title: '数据报表', icon: 'report', sort: 8 } },
      // 简化：先用充值页面代替财务管理落地页，后续可替换为独立页面
      { path: 'finance', name: 'Finance', component: () => import('@/views/recharge/index.vue'), meta: { title: '财务管理', icon: 'money', sort: 9 } },
      // ⚙️ 系统管理
      {
        path: 'system',
        component: () => import('@/views/system/index.vue'),
        meta: { title: '系统管理', icon: 'system', alwaysShow: true, sort: 100 },
        children: [
          { path: 'user', name: 'SystemUser', component: () => import('@/views/system/user/index.vue'), meta: { title: '用户管理', icon: 'user', sort: 1 } },
          { path: 'role', name: 'SystemRole', component: () => import('@/views/system/role/index.vue'), meta: { title: '角色管理', icon: 'role', sort: 2 } },
        ]
      },
      { path: 'profile', name: 'Profile', component: () => import('@/views/profile/index.vue'), meta: { title: '个人中心', icon: 'profile', sort: 1000 } },
    ]
  },
  { path: '/redirect', component: () => import('@/views/redirect/index.vue'), meta: { title: '重定向', hidden: true } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/error/404.vue'), meta: { title: '404', hidden: true } }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const permissionStore = usePermissionStore();

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 道道管理系统` : '道道管理系统';

  // 检查是否需要登录
  if (to.path === '/login') {
    if (userStore.isLoggedIn()) {
      next('/');
    } else {
      next();
    }
    return;
  }

  // 检查是否已登录
  if (!userStore.isLoggedIn()) {
    next('/login');
    return;
  }

  // 检查是否已获取用户信息
  if (!userStore.userInfo?.userId) {
    try {
      console.log('👤 获取用户信息...');
      await userStore.getUserInfo();
      console.log('👤 用户信息已获取:', userStore.userInfo);
    } catch (error) {
      userStore.logout();
      next('/login');
      return;
    }
  }

  // 检查是否已生成路由
  if (permissionStore.routes.length === 0) {
    try {
      await permissionStore.generateRoutes();
      // 不再动态 addRoute，直接使用 constantRoutes（已在 store 中设置）
      next({ ...to, replace: true });
      return;
    } catch (error) {
      next('/login');
      return;
    }
  }

  next();
});

export default router;

// 供插件安装时调用，统一在 plugins/index.ts 中使用
export function setupRouter(app: App<Element>) {
  app.use(router);
}
