import type { RouteVO } from '@/api/system/menu-api';

// 模拟路由数据 - 用于开发阶段
export const mockRoutes: RouteVO[] = [
  {
    path: '/member',
    name: 'Member',
    component: 'Layout',
    redirect: '/member/index',
    meta: {
      title: '会员管理',
      icon: 'user',
      alwaysShow: false,
      hidden: false,
      keepAlive: true
    },
    children: [
      {
        path: 'index',
        name: 'MemberIndex',
        component: 'member/index',
        meta: {
          title: '会员列表',
          icon: 'user',
          hidden: false,
          keepAlive: true
        },
        children: []
      }
    ]
  },
  {
    path: '/finance',
    name: 'Finance',
    component: 'Layout',
    redirect: '/finance/recharge',
    meta: {
      title: '财务管理',
      icon: 'money',
      alwaysShow: false,
      hidden: false,
      keepAlive: true
    },
    children: [
      {
        path: 'recharge',
        name: 'RechargeIndex',
        component: 'recharge/index',
        meta: {
          title: '充值记录',
          icon: 'money',
          hidden: false,
          keepAlive: true
        },
        children: []
      },
      {
        path: 'commission',
        name: 'CommissionRuleIndex',
        component: 'commission-rule/index',
        meta: {
          title: '分成设置',
          icon: 'setting',
          hidden: false,
          keepAlive: true
        },
        children: []
      }
    ]
  },
  {
    path: '/order',
    name: 'Order',
    component: 'Layout',
    redirect: '/order/index',
    meta: {
      title: '订单管理',
      icon: 'shopping-cart',
      alwaysShow: false,
      hidden: false,
      keepAlive: true
    },
    children: [
      {
        path: 'index',
        name: 'OrderIndex',
        component: 'order/index',
        meta: {
          title: '订单列表',
          icon: 'shopping-cart',
          hidden: false,
          keepAlive: true
        },
        children: []
      }
    ]
  },
  {
    path: '/worker',
    name: 'Worker',
    component: 'Layout',
    redirect: '/worker/index',
    meta: {
      title: '打手管理',
      icon: 'user-solid',
      alwaysShow: false,
      hidden: false,
      keepAlive: true
    },
    children: [
      {
        path: 'index',
        name: 'WorkerIndex',
        component: 'worker/index',
        meta: {
          title: '打手列表',
          icon: 'user-solid',
          hidden: false,
          keepAlive: true
        },
        children: []
      }
    ]
  },
  {
    path: '/report',
    name: 'Report',
    component: 'Layout',
    redirect: '/report/index',
    meta: {
      title: '报表中心',
      icon: 'data-analysis',
      alwaysShow: false,
      hidden: false,
      keepAlive: true
    },
    children: [
      {
        path: 'index',
        name: 'ReportIndex',
        component: 'report/index',
        meta: {
          title: '数据报表',
          icon: 'data-analysis',
          hidden: false,
          keepAlive: true
        },
        children: []
      }
    ]
  },
  {
    path: '/system',
    name: 'System',
    component: 'Layout',
    redirect: '/system/user',
    meta: {
      title: '系统管理',
      icon: 'system',
      alwaysShow: true,
      hidden: false,
      keepAlive: true
    },
    children: [
      {
        path: 'user',
        name: 'User',
        component: 'system/user/index',
        meta: {
          title: '用户管理',
          icon: 'user',
          hidden: false,
          keepAlive: true
        },
        children: []
      },
      {
        path: 'role',
        name: 'Role',
        component: 'system/role/index',
        meta: {
          title: '角色管理',
          icon: 'role',
          hidden: false,
          keepAlive: true
        },
        children: []
      },
      {
        path: 'menu',
        name: 'Menu',
        component: 'system/menu/index',
        meta: {
          title: '菜单管理',
          icon: 'menu',
          hidden: false,
          keepAlive: true
        },
        children: []
      }
    ]
  }
];