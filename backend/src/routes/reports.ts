import { Router, Request, Response } from 'express';
import { Order, Member, Recharge, Worker, PayMethod, RechargeMethod } from '../models';
import { authenticateToken } from '../middleware/auth';
import { query, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 今日概览
router.get('/today-overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // 今日订单统计
    const todayOrders = await Order.findOne({
      where: {
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('price_final')), 'amount'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'duration']
      ],
      raw: true
    });

    // 今日充值统计
    const todayRecharges = await Recharge.findOne({
      where: {
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
      ],
      raw: true
    });

    // 今日新增会员
    const todayNewMembers = await Member.count({
      where: {
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    // 活跃打手数量（今日有订单的打手）
    const activeWorkers = await Order.findAll({
      where: {
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('worker_id'))), 'count']
      ],
      raw: true
    });

    // 总会员数
    const totalMembers = await Member.count();

    // 总打手数
    const totalWorkers = await Worker.count();

    // 添加调试日志
    console.log('📊 今日概览数据:', {
      todayOrders: parseInt((todayOrders as any)?.count || '0'),
      todayRecharge: parseInt((todayRecharges as any)?.count || '0'),
      todayMembers: todayNewMembers,
      todayWorkers: parseInt((activeWorkers[0] as any)?.count || '0'),
      todayIncome: parseFloat((todayOrders as any)?.amount || '0')
    });

    // 强制发送200状态码，避免304
    res.status(200).json({
      code: '00000',
      message: '获取今日概览成功',
      data: {
        todayOrders: parseInt((todayOrders as any)?.count || '0'),
        todayRecharge: parseInt((todayRecharges as any)?.count || '0'),
        todayMembers: todayNewMembers,
        todayWorkers: parseInt((activeWorkers[0] as any)?.count || '0'),
        todayIncome: parseFloat((todayOrders as any)?.amount || '0'),
        platformBalance: 0 // 暂时设为0，后续可以添加平台余额计算
      }
    });
  } catch (error) {
    console.error('获取今日概览错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 趋势图表数据
router.get('/trends', [
  query('type').isIn(['order', 'recharge']).withMessage('类型必须是order或recharge'),
  query('period').isIn(['7d', '30d', '90d']).withMessage('周期必须是7d、30d或90d'),
  query('start_date').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('end_date').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const type = req.query.type as string;
    const period = req.query.period as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    let start: Date;
    let end: Date = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      start = new Date();
      start.setDate(start.getDate() - days);
    }

    const amountField = type === 'order' ? 'price_final' : 'amount';

    // 按日期分组统计
    let trends: any[];
    if (type === 'order') {
      trends = await Order.findAll({
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col(amountField)), 'amount']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        raw: true
      });
    } else {
      trends = await Recharge.findAll({
        where: {
          created_at: {
            [Op.between]: [start, end]
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col(amountField)), 'amount']
        ],
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        raw: true
      });
    }

    // 添加调试日志
    console.log('📊 趋势数据查询结果:', {
      type,
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      trendsCount: trends.length,
      trends: trends.slice(0, 3) // 只显示前3条
    });

    // 强制发送200状态码，避免304
    res.status(200).json({
      code: '00000',
      message: '获取趋势数据成功',
      data: trends.map((trend: any) => ({
        date: trend.date,
        orderCount: type === 'order' ? parseInt(trend.count) : 0,
        orderAmount: type === 'order' ? parseFloat(trend.amount) || 0 : 0,
        rechargeCount: type === 'recharge' ? parseInt(trend.count) : 0,
        rechargeAmount: type === 'recharge' ? parseFloat(trend.amount) || 0 : 0
      }))
    });
  } catch (error) {
    console.error('获取趋势数据错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 会员排行榜
router.get('/member-ranking', [
  query('type').isIn(['consume', 'recharge']).withMessage('类型必须是consume或recharge'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
  query('start_date').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('end_date').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const where: any = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.created_at = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.created_at = {
        [Op.lte]: new Date(endDate)
      };
    }

    let ranking: any[];

    if (type === 'consume') {
      // 消费排行榜
      ranking = await Order.findAll({
        where,
        attributes: [
          'member_id',
          [sequelize.fn('COUNT', sequelize.col('Order.id')), 'order_count'],
          [sequelize.fn('SUM', sequelize.col('price_final')), 'total_amount'],
          [sequelize.fn('SUM', sequelize.col('duration')), 'total_duration']
        ],
        include: [{
          model: Member,
          as: 'member',
          attributes: ['id', 'nickname', 'phone', 'username']
        }],
        group: ['member_id', 'member.id', 'member.nickname', 'member.phone', 'member.username'],
        order: [[sequelize.fn('SUM', sequelize.col('price_final')), 'DESC']],
        limit,
        raw: false
      });
    } else {
      // 充值排行榜
      ranking = await Recharge.findAll({
        where,
        attributes: [
          'member_id',
          [sequelize.fn('COUNT', sequelize.col('Recharge.id')), 'recharge_count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
        ],
        include: [{
          model: Member,
          as: 'member',
          attributes: ['id', 'nickname', 'phone', 'username']
        }],
        group: ['member_id', 'member.id', 'member.nickname', 'member.phone', 'member.username'],
        order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
        limit,
        raw: false
      });
    }

    const formattedRanking = ranking.map((item: any, index: number) => {
      const data = item.toJSON ? item.toJSON() : item;
      return {
        rank: index + 1,
        member: data.member,
        ...(type === 'consume' ? {
          order_count: parseInt(data.order_count),
          total_amount: parseFloat(data.total_amount) || 0,
          total_duration: parseFloat(data.total_duration) || 0
        } : {
          recharge_count: parseInt(data.recharge_count),
          total_amount: parseFloat(data.total_amount) || 0
        })
      };
    });

    // 添加调试日志
    console.log('📊 会员排行榜数据:', {
      type,
      limit,
      startDate,
      endDate,
      rankingCount: formattedRanking.length,
      firstItem: formattedRanking[0]
    });

    // 强制发送200状态码，避免304
    res.status(200).json({
      code: '00000',
      message: '获取会员排行榜成功',
      data: formattedRanking.map((item: any) => ({
        memberId: String(item.member.id),
        memberUsername: item.member.username || item.member.phone || '',
        memberNickname: item.member.nickname || '',
        totalConsume: parseFloat(item.total_amount) || 0,
        orderCount: parseInt(item.order_count || item.recharge_count) || 0
      }))
    });
  } catch (error) {
    console.error('获取会员排行榜错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 打手排行榜
router.get('/worker-ranking', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('限制数量必须在1-100之间'),
  query('start_date').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('end_date').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const where: any = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.created_at = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.created_at = {
        [Op.lte]: new Date(endDate)
      };
    }

    const ranking = await Order.findAll({
      where,
      attributes: [
        'worker_id',
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'order_count'],
        [sequelize.fn('SUM', sequelize.col('price_final')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'total_duration']
      ],
      include: [{
        model: Worker,
        as: 'worker',
        attributes: ['id', 'name', 'real_name', 'type', 'price_hour']
      }],
      group: ['worker_id', 'worker.id', 'worker.name', 'worker.real_name', 'worker.type', 'worker.price_hour'],
      order: [[sequelize.fn('SUM', sequelize.col('price_final')), 'DESC']],
      limit,
      raw: false
    });

    const formattedRanking = ranking.map((item: any, index: number) => {
      const data = item.toJSON();
      return {
        rank: index + 1,
        worker: data.worker,
        order_count: parseInt(data.order_count),
        total_amount: parseFloat(data.total_amount) || 0,
        total_duration: parseFloat(data.total_duration) || 0
      };
    });

    // 添加调试日志
    console.log('📊 打手排行榜数据:', {
      limit,
      startDate,
      endDate,
      rankingCount: formattedRanking.length,
      firstItem: formattedRanking[0]
    });

    // 强制发送200状态码，避免304
    res.status(200).json({
      code: '00000',
      message: '获取打手排行榜成功',
      data: formattedRanking.map((item: any) => ({
        workerId: String(item.worker.id),
        workerName: item.worker.name || item.worker.real_name || '',
        workerType: item.worker.type || '',
        totalIncome: parseFloat(item.total_amount) || 0,
        orderCount: parseInt(item.order_count) || 0,
        totalDuration: parseFloat(item.total_duration) || 0
      }))
    });
  } catch (error) {
    console.error('获取打手排行榜错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 支付方式统计
router.get('/payment-stats', [
  query('type').isIn(['order', 'recharge']).withMessage('类型必须是order或recharge'),
  query('start_date').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('end_date').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const type = req.query.type as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const where: any = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.created_at = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.created_at = {
        [Op.lte]: new Date(endDate)
      };
    }

    let stats: any[];
    let getMethodText: (method: any) => string;
    if (type === 'order') {
      stats = await Order.findAll({
        where,
        attributes: [
          'pay_method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('price_final')), 'amount']
        ],
        group: ['pay_method'],
        raw: true
      });
      getMethodText = (method: any) => Order.getPayMethodText(method as PayMethod);
    } else {
      stats = await Recharge.findAll({
        where,
        attributes: [
          'method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
        ],
        group: ['method'],
        raw: true
      });
      getMethodText = (method: any) => Recharge.getMethodText(method as RechargeMethod);
    }

    const formattedStats = stats.map((stat: any) => ({
      method: type === 'order' ? stat.pay_method : stat.method,
      method_text: getMethodText(type === 'order' ? stat.pay_method : stat.method),
      count: parseInt(stat.count),
      amount: parseFloat(stat.amount) || 0
    }));

    // 计算总计
    const total = formattedStats.reduce((acc, curr) => ({
      count: acc.count + curr.count,
      amount: acc.amount + curr.amount
    }), { count: 0, amount: 0 });

    // 计算百分比
    const statsWithPercentage = formattedStats.map(stat => ({
      ...stat,
      count_percentage: total.count > 0 ? (stat.count / total.count * 100).toFixed(2) : '0.00',
      amount_percentage: total.amount > 0 ? (stat.amount / total.amount * 100).toFixed(2) : '0.00'
    }));

    // 添加调试日志
    console.log('📊 支付方式统计数据:', {
      type,
      startDate,
      endDate,
      statsCount: statsWithPercentage.length,
      totalCount: total.count,
      totalAmount: total.amount,
      firstStat: statsWithPercentage[0]
    });

    // 强制发送200状态码，避免304
    res.status(200).json({
      code: '00000',
      message: '获取支付方式统计成功',
      data: statsWithPercentage.map((stat: any) => ({
        method: stat.method,
        amount: parseFloat(stat.amount) || 0,
        count: parseInt(stat.count) || 0,
        percentage: parseFloat(stat.amount_percentage) || 0
      }))
    });
  } catch (error) {
    console.error('获取支付方式统计错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 综合统计报表
router.get('/comprehensive', [
  query('start_date').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('end_date').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const where: any = {};
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      where.created_at = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      where.created_at = {
        [Op.lte]: new Date(endDate)
      };
    }

    // 订单统计
    const orderStats = await Order.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('price_final')), 'amount'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'duration'],
        [sequelize.fn('AVG', sequelize.col('price_final')), 'avg_amount']
      ],
      raw: true
    });

    // 充值统计
    const rechargeStats = await Recharge.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'avg_amount']
      ],
      raw: true
    });

    // 会员统计
    const memberStats = await Member.findOne({
      where: startDate || endDate ? where : {},
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('balance')), 'total_balance'],
        [sequelize.fn('SUM', sequelize.col('total_recharge')), 'total_recharge'],
        [sequelize.fn('SUM', sequelize.col('total_consume')), 'total_consume']
      ],
      raw: true
    });

    // 打手统计
    const workerStats = await Worker.findOne({
      where: startDate || endDate ? where : {},
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('price_hour')), 'avg_price']
      ],
      raw: true
    });

    // 添加调试日志
    console.log('📊 综合统计数据:', {
      startDate,
      endDate,
      orderStats: {
        count: parseInt((orderStats as any)?.count || '0'),
        amount: parseFloat((orderStats as any)?.amount || '0')
      },
      rechargeStats: {
        count: parseInt((rechargeStats as any)?.count || '0'),
        amount: parseFloat((rechargeStats as any)?.amount || '0')
      },
      memberStats: {
        count: parseInt((memberStats as any)?.count || '0'),
        totalBalance: parseFloat((memberStats as any)?.total_balance || '0')
      },
      workerStats: {
        count: parseInt((workerStats as any)?.count || '0'),
        avgPrice: parseFloat((workerStats as any)?.avg_price || '0')
      }
    });

    // 强制发送200状态码，避免304
    res.status(200).json({
      code: '00000',
      message: '获取综合统计成功',
      data: {
        period: {
          start_date: startDate || null,
          end_date: endDate || null
        },
        orders: {
          count: parseInt((orderStats as any)?.count || '0'),
          amount: parseFloat((orderStats as any)?.amount || '0'),
          duration: parseFloat((orderStats as any)?.duration || '0'),
          avg_amount: parseFloat((orderStats as any)?.avg_amount || '0')
        },
        recharges: {
          count: parseInt((rechargeStats as any)?.count || '0'),
          amount: parseFloat((rechargeStats as any)?.amount || '0'),
          avg_amount: parseFloat((rechargeStats as any)?.avg_amount || '0')
        },
        members: {
          count: parseInt((memberStats as any)?.count || '0'),
          total_balance: parseFloat((memberStats as any)?.total_balance || '0'),
          total_recharge: parseFloat((memberStats as any)?.total_recharge || '0'),
          total_consume: parseFloat((memberStats as any)?.total_consume || '0')
        },
        workers: {
          count: parseInt((workerStats as any)?.count || '0'),
          avg_price: parseFloat((workerStats as any)?.avg_price || '0')
        }
      }
    });
  } catch (error) {
    console.error('获取综合统计错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

export default router;