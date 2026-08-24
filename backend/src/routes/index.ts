import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import memberRoutes from './members';
import rechargeRoutes from './recharges';
import workerRoutes from './workers';
import orderRoutes from './orders';
import reportRoutes from './reports';
import commissionRuleRoutes from './commission-rules';

const router = Router();

// API版本前缀
const API_PREFIX = '/api/v1';

// 注册各模块路由
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/members`, memberRoutes);
router.use(`${API_PREFIX}/recharges`, rechargeRoutes);
router.use(`${API_PREFIX}/workers`, workerRoutes);
router.use(`${API_PREFIX}/orders`, orderRoutes);
router.use(`${API_PREFIX}/reports`, reportRoutes);
router.use(`${API_PREFIX}/commission-rules`, commissionRuleRoutes);

// 健康检查接口
router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'PayBoard API服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// API文档说明
router.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    code: 200,
    message: 'PayBoard API v1.0',
    data: {
      description: '网吧代练管理系统API接口',
      version: '1.0.0',
      endpoints: {
        auth: {
          description: '用户认证相关接口',
          routes: [
            'POST /auth/login - 用户登录',
            'GET /auth/me - 获取当前用户信息',
            'PUT /auth/password - 修改密码',
            'POST /auth/logout - 用户登出',
            'POST /auth/refresh - 刷新token'
          ]
        },
        members: {
          description: '会员管理相关接口',
          routes: [
            'GET /members - 获取会员列表',
            'GET /members/:id - 获取会员详情',
            'POST /members - 创建会员',
            'PUT /members/:id - 更新会员',

            'GET /members/:id/recharges - 获取会员充值记录',
            'GET /members/:id/orders - 获取会员订单记录'
          ]
        },
        recharges: {
          description: '充值管理相关接口',
          routes: [
            'GET /recharges - 获取充值记录列表',
            'GET /recharges/:id - 获取充值记录详情',
            'POST /recharges - 创建充值记录',
            'PUT /recharges/:id - 更新充值记录',
            'DELETE /recharges/:id - 删除充值记录',
            'GET /recharges/stats/summary - 获取充值统计信息'
          ]
        },
        workers: {
          description: '打手管理相关接口',
          routes: [
            'GET /workers - 获取打手列表',
            'GET /workers/:id - 获取打手详情',
            'POST /workers - 创建打手',
            'PUT /workers/:id - 更新打手',
            'DELETE /workers/:id - 删除打手',
            'GET /workers/available - 获取可用打手列表',
            'GET /workers/:id/orders - 获取打手订单记录'
          ]
        },
        orders: {
          description: '订单管理相关接口',
          routes: [
            'GET /orders - 获取订单列表',
            'GET /orders/:id - 获取订单详情',
            'POST /orders - 创建订单',
            'PUT /orders/:id - 更新订单',
            'DELETE /orders/:id - 删除订单',
            'POST /orders/calculate-price - 计算订单价格',
            'GET /orders/stats/summary - 获取订单统计信息'
          ]
        },
        reports: {
          description: '报表统计相关接口',
          routes: [
            'GET /reports/today-overview - 今日概览',
            'GET /reports/trends - 趋势图表数据',
            'GET /reports/member-ranking - 会员排行榜',
            'GET /reports/worker-ranking - 打手排行榜',
            'GET /reports/payment-stats - 支付方式统计',
            'GET /reports/comprehensive - 综合统计报表'
          ]
        }
      },
      authentication: {
        type: 'Bearer Token (JWT)',
        header: 'Authorization: Bearer <token>',
        note: '除登录接口外，所有接口都需要认证'
      },
      response_format: {
        success: {
          code: 200,
          message: '操作成功',
          data: '响应数据'
        },
        error: {
          code: '错误码',
          message: '错误信息',
          data: null,
          errors: '详细错误信息（可选）'
        }
      }
    }
  });
});

// 404处理
router.use('*', (req, res) => {
  res.status(404).json({
    code: 'B0001',
    message: 'API接口不存在',
    data: null
  });
});

export default router;