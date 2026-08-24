import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { query, validationResult } from 'express-validator';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取访问统计数据
router.get('/visit-stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // 模拟数据，实际应该从数据库获取
    const visitStats = {
      todayUvCount: 169,
      totalUvCount: 19985,
      uvGrowthRate: -0.57,
      todayPvCount: 1629,
      totalPvCount: 286086,
      pvGrowthRate: -0.65,
      todayIpCount: 169,
      totalIpCount: 19985,
      ipGrowthRate: -0.57
    };

    res.json({
      code: '00000',
      message: '操作成功',
      data: visitStats
    });
  } catch (error) {
    console.error('获取访问统计错误:', error);
    res.status(500).json({
      code: '500',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取访问趋势数据
router.get('/visit-trend', [
  query('startDate').isISO8601().withMessage('开始日期格式不正确'),
  query('endDate').isISO8601().withMessage('结束日期格式不正确')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: '400',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const { startDate, endDate } = req.query;
    
    // 生成日期范围
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const dates: string[] = [];
    const pvList: number[] = [];
    const uvList: number[] = [];
    const ipList: number[] = [];

    // 生成模拟数据
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      pvList.push(Math.floor(Math.random() * 5000) + 1000);
      uvList.push(Math.floor(Math.random() * 1000) + 100);
      ipList.push(Math.floor(Math.random() * 600) + 150);
      current.setDate(current.getDate() + 1);
    }

    const visitTrend = {
      dates,
      pvList,
      uvList,
      ipList
    };

    res.json({
      code: '00000',
      message: '操作成功',
      data: visitTrend
    });
  } catch (error) {
    console.error('获取访问趋势错误:', error);
    res.status(500).json({
      code: '500',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取日志分页列表
router.get('/page', [
  query('current').optional().isInt({ min: 1 }).withMessage('当前页必须是正整数'),
  query('size').optional().isInt({ min: 1, max: 100 }).withMessage('页面大小必须在1-100之间'),
  query('keywords').optional().isString().withMessage('关键字必须是字符串')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: '400',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const current = parseInt(req.query.current as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const keywords = req.query.keywords as string;

    // 模拟日志数据
    const mockLogs = [
      {
        id: '1',
        module: '登录',
        content: '用户登录',
        requestUri: '/api/v1/auth/login',
        method: 'POST',
        ip: '192.168.1.100',
        region: '北京市',
        browser: 'Chrome 120.0.0.0',
        os: 'Windows 10',
        executionTime: 120,
        operator: 'admin',
        createTime: new Date().toISOString()
      },
      {
        id: '2',
        module: '会员管理',
        content: '查看会员列表',
        requestUri: '/api/v1/members',
        method: 'GET',
        ip: '192.168.1.100',
        region: '北京市',
        browser: 'Chrome 120.0.0.0',
        os: 'Windows 10',
        executionTime: 85,
        operator: 'admin',
        createTime: new Date().toISOString()
      }
    ];

    // 简单的关键字过滤
    let filteredLogs = mockLogs;
    if (keywords) {
      filteredLogs = mockLogs.filter(log => 
        log.module.includes(keywords) || 
        log.content.includes(keywords) ||
        log.operator.includes(keywords)
      );
    }

    const total = filteredLogs.length;
    const startIndex = (current - 1) * size;
    const endIndex = startIndex + size;
    const records = filteredLogs.slice(startIndex, endIndex);

    res.json({
      code: '00000',
      message: '操作成功',
      data: {
        records,
        total,
        size,
        current,
        pages: Math.ceil(total / size)
      }
    });
  } catch (error) {
    console.error('获取日志列表错误:', error);
    res.status(500).json({
      code: '500',
      message: '服务器内部错误',
      data: null
    });
  }
});

export default router;