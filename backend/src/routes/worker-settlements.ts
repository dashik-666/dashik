import { Router, Request, Response } from 'express';
import { WorkerSettlement, SettlementStatus, SettlementType } from '../models';
import { Worker, User, Order } from '../models';
import { authenticateToken } from '../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取对账分页列表
router.get('/page', [
  query('pageNum').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('workerId').optional().isInt({ min: 1 }).withMessage('打手ID必须是正整数'),
  query('status').optional().isIn(Object.values(SettlementStatus)).withMessage('状态值无效'),
  query('settlementType').optional().isIn(Object.values(SettlementType)).withMessage('结算类型无效'),
  query('startDate').optional().isISO8601().withMessage('开始日期格式无效'),
  query('endDate').optional().isISO8601().withMessage('结束日期格式无效')
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

    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const workerId = req.query.workerId ? parseInt(req.query.workerId as string) : undefined;
    const status = req.query.status as SettlementStatus;
    const settlementType = req.query.settlementType as SettlementType;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const offset = (pageNum - 1) * pageSize;
    const where: any = {};

    // 搜索条件
    if (workerId) {
      where.worker_id = workerId;
    }

    if (status) {
      where.status = status;
    }

    if (settlementType) {
      where.settlement_type = settlementType;
    }

    if (startDate && endDate) {
      where.start_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const { rows: settlements, count: total } = await WorkerSettlement.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Worker,
          as: 'worker',
          attributes: ['id', 'name', 'real_name', 'phone']
        },
        {
          model: User,
          as: 'confirmedByUser',
          attributes: ['id', 'username', 'display_name']
        }
      ]
    });

    // 格式化数据
    const formattedSettlements = settlements.map(settlement => ({
      id: settlement.id,
      workerId: settlement.worker_id,
      workerName: settlement.worker?.name || '',
      workerRealName: settlement.worker?.real_name || '',
      workerPhone: settlement.worker?.phone || '',
      settlementType: settlement.settlement_type,
      startDate: settlement.start_date,
      endDate: settlement.end_date,
      orderCount: settlement.order_count,
      orderAmount: settlement.order_amount,
      totalHours: settlement.total_hours,
      hourlyRate: settlement.hourly_rate,
      expectedAmount: settlement.expected_amount,
      actualAmount: settlement.actual_amount,
      differenceAmount: settlement.difference_amount,
      differenceReason: settlement.difference_reason,
      status: settlement.status,
      confirmedBy: settlement.confirmed_by,
      confirmedByUsername: settlement.confirmedByUser?.username || '',
      confirmedAt: settlement.confirmed_at,
      confirmationNote: settlement.confirmation_note,
      createTime: settlement.created_at,
      updateTime: settlement.updated_at
    }));

    res.json({
      code: '00000',
      msg: '获取对账列表成功',
      data: {
        list: formattedSettlements,
        total,
        pageNum,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取对账列表错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 获取对账详情
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('对账ID必须是正整数')
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

    const settlementId = parseInt(req.params.id);
    const settlement = await WorkerSettlement.findByPk(settlementId, {
      include: [
        {
          model: Worker,
          as: 'worker',
          attributes: ['id', 'name', 'real_name', 'phone', 'price_hour']
        },
        {
          model: User,
          as: 'confirmedByUser',
          attributes: ['id', 'username', 'display_name']
        }
      ]
    });

    if (!settlement) {
      res.status(404).json({
        code: 'B0001',
        message: '对账记录不存在',
        data: null
      });
      return;
    }

    // 获取相关订单详情
    const orders = await Order.findAll({
      where: {
        worker_id: settlement.worker_id,
        created_at: {
          [Op.between]: [settlement.start_date, settlement.end_date]
        }
      },
              attributes: ['id', 'price_final', 'duration', 'created_at'],
      order: [['created_at', 'ASC']]
    });

    const formattedSettlement = {
      id: settlement.id,
      workerId: settlement.worker_id,
      workerName: settlement.worker?.name || '',
      workerRealName: settlement.worker?.real_name || '',
      workerPhone: settlement.worker?.phone || '',
      workerHourlyRate: settlement.worker?.price_hour || 0,
      settlementType: settlement.settlement_type,
      startDate: settlement.start_date,
      endDate: settlement.end_date,
      orderCount: settlement.order_count,
      orderAmount: settlement.order_amount,
      totalHours: settlement.total_hours,
      hourlyRate: settlement.hourly_rate,
      expectedAmount: settlement.expected_amount,
      actualAmount: settlement.actual_amount,
      differenceAmount: settlement.difference_amount,
      differenceReason: settlement.difference_reason,
      status: settlement.status,
      confirmedBy: settlement.confirmed_by,
      confirmedByUsername: settlement.confirmedByUser?.username || '',
      confirmedAt: settlement.confirmed_at,
      confirmationNote: settlement.confirmation_note,
      createTime: settlement.created_at,
      updateTime: settlement.updated_at,
      orders: orders.map(order => ({
        id: order.id,
        orderNo: order.id, // 使用订单ID作为订单号
        priceFinal: order.price_final,
        serviceHours: order.duration, // 使用 duration 字段
        createTime: order.created_at
      }))
    };

    res.json({
      code: '00000',
      msg: '获取对账详情成功',
      data: formattedSettlement
    });
  } catch (error) {
    console.error('获取对账详情错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 创建对账记录
router.post('/', [
  body('workerId').isInt({ min: 1 }).withMessage('打手ID必须是正整数'),
  body('settlementType').isIn(Object.values(SettlementType)).withMessage('结算类型无效'),
  body('startDate').isISO8601().withMessage('开始日期格式无效'),
  body('endDate').isISO8601().withMessage('结束日期格式无效'),
  body('actualAmount').isFloat({ min: 0 }).withMessage('实发金额必须是非负数')
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

    const { workerId, settlementType, startDate, endDate, actualAmount } = req.body;

    // 检查打手是否存在
    const worker = await Worker.findByPk(workerId);
    if (!worker) {
      res.status(400).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    // 检查是否已存在该时间段的对账记录
    const existingSettlement = await WorkerSettlement.findOne({
      where: {
        worker_id: workerId,
        settlement_type: settlementType,
        start_date: startDate,
        end_date: endDate
      }
    });

    if (existingSettlement) {
      res.status(400).json({
        code: 'B0001',
        message: '该时间段的对账记录已存在',
        data: null
      });
      return;
    }

    // 查询该时间段的订单数据
    const orders = await Order.findAll({
      where: {
        worker_id: workerId,
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      }
    });

    // 计算统计数据
    const orderCount = orders.length;
    const orderAmount = orders.reduce((sum, order) => sum + Number(order.price_final), 0);
    const totalHours = orders.reduce((sum, order) => sum + Number(order.duration), 0);
    const hourlyRate = Number(worker.price_hour);
    const expectedAmount = totalHours * hourlyRate;

    // 创建对账记录
    const settlement = new WorkerSettlement();
    settlement.worker_id = workerId;
    settlement.settlement_type = settlementType;
    settlement.start_date = new Date(startDate);
    settlement.end_date = new Date(endDate);
    settlement.order_count = orderCount;
    settlement.order_amount = orderAmount;
    settlement.total_hours = totalHours;
    settlement.hourly_rate = hourlyRate;
    settlement.expected_amount = expectedAmount;
    settlement.actual_amount = actualAmount;
    settlement.calculateDifference();

    await settlement.save();

    res.json({
      code: '00000',
      msg: '创建对账记录成功',
      data: { id: settlement.id }
    });
  } catch (error) {
    console.error('创建对账记录错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 确认核账
router.put('/:id/confirm', [
  param('id').isInt({ min: 1 }).withMessage('对账ID必须是正整数'),
  body('note').optional().isString().withMessage('备注必须是字符串')
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

    const settlementId = parseInt(req.params.id);
    const { note } = req.body;
    const confirmedBy = (req.user as any).id;

    const settlement = await WorkerSettlement.findByPk(settlementId);
    if (!settlement) {
      res.status(404).json({
        code: 'B0001',
        message: '对账记录不存在',
        data: null
      });
      return;
    }

    if (settlement.status !== SettlementStatus.PENDING) {
      res.status(400).json({
        code: 'B0001',
        message: '该对账记录已处理',
        data: null
      });
      return;
    }

    // 确认核账
    settlement.confirm(confirmedBy, note);
    await settlement.save();

    res.json({
      code: '00000',
      msg: '核账确认成功',
      data: null
    });
  } catch (error) {
    console.error('确认核账错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 标记争议
router.put('/:id/dispute', [
  param('id').isInt({ min: 1 }).withMessage('对账ID必须是正整数'),
  body('reason').isString().isLength({ min: 1 }).withMessage('争议原因不能为空')
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

    const settlementId = parseInt(req.params.id);
    const { reason } = req.body;

    const settlement = await WorkerSettlement.findByPk(settlementId);
    if (!settlement) {
      res.status(404).json({
        code: 'B0001',
        message: '对账记录不存在',
        data: null
      });
      return;
    }

    if (settlement.status !== SettlementStatus.PENDING) {
      res.status(400).json({
        code: 'B0001',
        message: '该对账记录已处理',
        data: null
      });
      return;
    }

    // 标记争议
    settlement.markDisputed(reason);
    await settlement.save();

    res.json({
      code: '00000',
      msg: '标记争议成功',
      data: null
    });
  } catch (error) {
    console.error('标记争议错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 更新对账记录
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('对账ID必须是正整数'),
  body('actualAmount').isFloat({ min: 0 }).withMessage('实发金额必须是非负数'),
  body('differenceReason').optional().isString().withMessage('差额说明必须是字符串')
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

    const settlementId = parseInt(req.params.id);
    const { actualAmount, differenceReason } = req.body;

    const settlement = await WorkerSettlement.findByPk(settlementId);
    if (!settlement) {
      res.status(404).json({
        code: 'B0001',
        message: '对账记录不存在',
        data: null
      });
      return;
    }

    if (settlement.status !== SettlementStatus.PENDING) {
      res.status(400).json({
        code: 'B0001',
        message: '已核账的记录不能修改',
        data: null
      });
      return;
    }

    // 更新对账记录
    settlement.actual_amount = actualAmount;
    settlement.difference_reason = differenceReason;
    settlement.calculateDifference();
    await settlement.save();

    res.json({
      code: '00000',
      msg: '更新对账记录成功',
      data: null
    });
  } catch (error) {
    console.error('更新对账记录错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 删除对账记录
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('对账ID必须是正整数')
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

    const settlementId = parseInt(req.params.id);
    const settlement = await WorkerSettlement.findByPk(settlementId);
    
    if (!settlement) {
      res.status(404).json({
        code: 'B0001',
        message: '对账记录不存在',
        data: null
      });
      return;
    }

    if (settlement.status !== SettlementStatus.PENDING) {
      res.status(400).json({
        code: 'B0001',
        message: '已核账的记录不能删除',
        data: null
      });
      return;
    }

    await settlement.destroy();

    res.json({
      code: '00000',
      msg: '删除对账记录成功',
      data: null
    });
  } catch (error) {
    console.error('删除对账记录错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

export default router;
