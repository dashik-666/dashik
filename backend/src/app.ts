import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sequelize, { initializeModels } from './models';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// 路由导入
import memberRoutes from './routes/members';
import rechargeRoutes from './routes/recharges';
import orderRoutes from './routes/orders';
import workerRoutes from './routes/workers';
import reportRoutes from './routes/reports';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import logRoutes from './routes/logs';
import commissionRuleRoutes from './routes/commission-rules';
import workerSettlementRoutes from './routes/worker-settlements';
import storefrontRoutes from './routes/storefront';

// 加载环境变量
dotenv.config();

const app: express.Application = express();
const PORT = process.env.PORT || 10000;

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// 进程级错误监控，便于定位崩溃/异常
process.on('unhandledRejection', (reason: any, promise) => {
  console.error('💥 未处理的Promise拒绝:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason?.stack,
    timestamp: new Date().toISOString()
  });
});

process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 数据库健康检查
app.get('/health/db', async (req, res) => {
  const startedAt = Date.now();
  try {
    await sequelize.authenticate();
    const duration = Date.now() - startedAt;
    res.json({
      status: 'OK',
      durationMs: duration,
      db: {
        host: sequelize.config.host,
        port: sequelize.config.port,
        database: sequelize.config.database,
        username: sequelize.config.username,
        dialect: 'mysql'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const duration = Date.now() - startedAt;
    console.error('❌ DB 健康检查失败:', error);
    res.status(500).json({
      status: 'ERROR',
      durationMs: duration,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// 就绪探针：当前仅检测数据库可用性
app.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'READY', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'NOT_READY', reason: 'db_unavailable', timestamp: new Date().toISOString() });
  }
});

// 列出已注册路由，便于排查路径问题
app.get('/health/routes', (req, res) => {
  const routes: Array<{ method: string; path: string }> = [];
  // @ts-ignore 私有属性，仅用于诊断
  app._router.stack.forEach((layer: any) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods)
        .filter((m) => layer.route.methods[m])
        .map((m) => m.toUpperCase());
      methods.forEach((m) => routes.push({ method: m, path: layer.route.path }));
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      layer.handle.stack.forEach((sub: any) => {
        if (sub.route && sub.route.path) {
          const methods = Object.keys(sub.route.methods)
            .filter((m) => sub.route.methods[m])
            .map((m) => m.toUpperCase());
          const path = (layer.regexp && layer.regexp.fast_star) ? '*' : (layer.regexp && layer.regexp.toString()) || '';
          methods.forEach((m) => routes.push({ method: m, path: sub.route.path }));
        }
      });
    }
  });
  res.json({ count: routes.length, routes });
});

// API路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/recharges', rechargeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/commission-rules', commissionRuleRoutes);
app.use('/api/v1/worker-settlements', workerSettlementRoutes);
app.use('/api/v1/store', storefrontRoutes);

// ---------- 托管玩家端前端（storefront 静态构建） ----------
const storefrontDir = path.join(process.cwd(), 'storefront');
if (fs.existsSync(storefrontDir)) {
  app.use(express.static(storefrontDir));
  // SPA 回退：非 /api 的 GET 请求都返回 index.html
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(storefrontDir, 'index.html'));
  });
  console.log('🖥️ 已托管玩家端前端目录:', storefrontDir);
}

// 404处理
app.use('*', (req, res) => {
  console.log('❌ 404 - API端点未找到:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  
  res.status(404).json({ 
    message: 'API endpoint not found',
    details: {
      method: req.method,
      url: req.url,
      path: req.path,
      timestamp: new Date().toISOString(),
      availableEndpoints: [
        '/health',
        '/api/v1/auth',
        '/api/v1/users',
        '/api/v1/members',
        '/api/v1/recharges',
        '/api/v1/orders',
        '/api/v1/workers',
        '/api/v1/reports',
        '/api/v1/logs',
        '/api/v1/commission-rules'
      ]
    }
  });
});

// 错误处理中间件
app.use(errorHandler);

// 数据库连接和服务器启动
async function startServer() {
  try {
    // 测试数据库连接
    console.log('🔌 开始测试数据库连接...');
    console.log('📊 数据库配置:', {
      host: sequelize.config.host,
      port: sequelize.config.port,
      database: sequelize.config.database,
      username: sequelize.config.username,
      dialect: 'mysql'
    });
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步数据库模型
    console.log('🔄 开始同步数据库模型...');
    await initializeModels(); // 使用 initializeModels 函数
    console.log('✅ 数据库模型同步成功');
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log('🚀 服务器启动成功');
      console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 服务器地址: http://localhost:${PORT}`);
      console.log(`🔗 API基础地址: http://localhost:${PORT}/api/v1`);
      console.log('📋 可用端点:');
      console.log('   - /health (健康检查)');
      console.log('   - /health/db (数据库健康检查)');
      console.log('   - /health/routes (路由列表)');
      console.log('   - /ready (就绪检查)');
      console.log('   - /api/v1/auth (用户认证)');
      console.log('   - /api/v1/users (用户管理)');
      console.log('   - /api/v1/members (会员管理)');
      console.log('   - /api/v1/recharges (充值管理)');
      console.log('   - /api/v1/orders (订单管理)');
      console.log('   - /api/v1/workers (打手管理)');
      console.log('   - /api/v1/reports (报表管理)');
      console.log('   - /api/v1/logs (日志管理)');
      console.log('   - /api/v1/commission-rules (分成规则)');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      errorType: (error as Error).constructor.name,
      timestamp: new Date().toISOString()
    });
    
    if ((error as Error).message.includes('ECONNREFUSED')) {
      console.error('🔌 数据库连接被拒绝，请检查:');
      console.error('   1. MySQL服务是否正在运行');
      console.error('   2. 数据库地址 192.168.50.17:3306 是否正确');
      console.error('   3. 防火墙是否阻止了连接');
    } else if ((error as Error).message.includes('ER_ACCESS_DENIED_ERROR')) {
      console.error('🔐 数据库访问被拒绝，请检查:');
      console.error('   1. 用户名 root 是否正确');
      console.error('   2. 密码 123456 是否正确');
      console.error('   3. 用户是否有访问 payboard 数据库的权限');
    } else if ((error as Error).message.includes('ER_BAD_DB_ERROR')) {
      console.error('🗄️ 数据库不存在，请检查:');
      console.error('   1. payboard 数据库是否已创建');
      console.error('   2. 是否需要先导入 payboard.sql');
    }
    
    console.error('💡 建议的解决步骤:');
    console.error('   1. 检查MySQL服务状态');
    console.error('   2. 验证数据库连接信息');
    console.error('   3. 确认数据库和表是否存在');
    console.error('   4. 检查网络连接');
    
    process.exit(1);
  }
}

startServer();

export default app;

