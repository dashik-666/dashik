import { Router, Request, Response } from 'express';
import { Order, PayMethod, OrderStatus, Member, Worker, WorkerStatus } from '../models';
import { authenticateToken } from '../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import wechatService from '../services/wechat';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取订单列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('member_id').optional().isInt({ min: 1 }).withMessage('会员ID必须是正整数'),
  query('worker_id').optional().isInt({ min: 1 }).withMessage('打手ID必须是正整数'),
  query('pay_method').optional().isIn(Object.values(PayMethod)).withMessage('支付方式无效'),
  query('start_date').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('end_date').optional().isISO8601().withMessage('结束日期格式不正确'),
  query('keyword').optional().isString().withMessage('搜索关键词必须是字符串')
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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const memberId = req.query.member_id ? parseInt(req.query.member_id as string) : undefined;
    const workerId = req.query.worker_id ? parseInt(req.query.worker_id as string) : undefined;
    const payMethod = req.query.pay_method as PayMethod;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const keyword = req.query.keyword as string;

    const offset = (page - 1) * limit;
    const where: any = {};
    const memberWhere: any = {};
    const workerWhere: any = {};

    // 筛选条件
    if (memberId) {
      where.member_id = memberId;
    }

    if (workerId) {
      where.worker_id = workerId;
    }

    if (payMethod) {
      where.pay_method = payMethod;
    }

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

    // 搜索会员或打手信息
    if (keyword) {
      memberWhere[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
      workerWhere[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { real_name: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['id', 'nickname', 'phone'],
          where: Object.keys(memberWhere).length > 0 ? memberWhere : undefined
        },
        {
          model: Worker,
          as: 'worker',
          attributes: ['id', 'name', 'real_name', 'type', 'price_hour'],
          where: Object.keys(workerWhere).length > 0 ? workerWhere : undefined
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    // 为每个订单添加订单编号
    const ordersWithNumber = orders.map(order => ({
      ...order.toJSON(),
      order_number: order.getOrderNumber()
    }));

    res.json({
      code: '00000',
      message: '获取订单列表成功',
      data: {
        list: ordersWithNumber,
        total
      }
    });
    
    console.log('订单列表响应数据:', {
      code: '00000',
      message: '获取订单列表成功',
      data: {
        list: ordersWithNumber,
        total
      }
    });
    
    // 打印第一个订单的详细信息用于调试
    if (ordersWithNumber.length > 0) {
      console.log('第一个订单详细信息:', JSON.stringify(ordersWithNumber[0], null, 2));
    }
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取订单详情
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('订单ID必须是正整数')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 400,
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const orderId = parseInt(req.params.id);

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['id', 'nickname', 'phone', 'balance']
        },
        {
          model: Worker,
          as: 'worker',
          attributes: ['id', 'name', 'real_name', 'type', 'price_hour']
        }
      ]
    });

    if (!order) {
      res.status(404).json({
        code: 'B0001',
        message: '订单不存在',
        data: null
      });
      return;
    }

    // 添加订单编号
    const orderData = {
      ...order.toJSON(),
      order_number: order.getOrderNumber()
    };

    res.json({
      code: '00000',
      message: '获取订单详情成功',
      data: orderData
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 创建订单
router.post('/', [
  body('member_id')
    .isInt({ min: 1 })
    .withMessage('会员ID必须是正整数'),
  body('worker_id')
    .isInt({ min: 1 })
    .withMessage('打手ID必须是正整数'),
  body('duration')
    .isFloat({ min: 0.1 })
    .withMessage('服务时长必须大于0.1小时'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('优惠金额必须是非负数'),
  body('pay_method')
    .isIn(Object.values(PayMethod))
    .withMessage('支付方式无效'),
  body('pay_balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('余额支付金额必须是非负数'),
  body('pay_scan')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('扫码支付金额必须是非负数'),
  body('remark')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('备注长度不能超过255个字符')
], async (req: Request, res: Response): Promise<void> => {
  console.log('=== 创建订单请求开始 ===');
  console.log('请求体:', req.body);
  
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      res.status(400).json({
        code: 400,
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const {
      member_id,
      worker_id,
      duration,
      discount = 0,
      pay_method,
      pay_balance = 0,
      pay_scan = 0,
      remark,
      discount_reason
    } = req.body;

    // 如果前端发送的是amount字段，需要转换为pay_balance和pay_scan
    let finalPayBalance = pay_balance;
    let finalPayScan = pay_scan;
    
    // 优先使用前端发送的amount字段
    if (req.body.amount !== undefined) {
      const amount = parseFloat(req.body.amount);
      console.log('前端发送的amount字段:', amount);
      
      if (pay_method === PayMethod.BALANCE) {
        finalPayBalance = amount;
        finalPayScan = 0;
        console.log('余额支付，分配金额:', { finalPayBalance, finalPayScan });
      } else if (pay_method === PayMethod.SCAN) {
        finalPayBalance = 0;
        finalPayScan = amount;
        console.log('扫码支付，分配金额:', { finalPayBalance, finalPayScan });
      } else if (pay_method === PayMethod.MIXED) {
        // 混合支付，需要前端提供payBalance和payScan
        console.log('混合支付，使用前端提供的金额');
      }
    } else {
      console.log('前端未发送amount字段，使用pay_balance和pay_scan');
    }

    // 检查会员是否存在且状态正常
    console.log('检查会员，ID:', member_id);
    const member = await Member.findByPk(member_id, { transaction });
    console.log('会员信息:', member);
    if (!member) {
      await transaction.rollback();
      res.status(404).json({
        code: 'B0001',
        message: '会员不存在',
        data: null
      });
      return;
    }

    // 检查会员状态
    if (member.status === 'disabled') {
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '该会员已被禁用，无法创建订单',
        data: null
      });
      return;
    }

    // 检查打手是否存在且可用
    console.log('检查打手，ID:', worker_id);
    const worker = await Worker.findByPk(worker_id, { transaction });
    console.log('打手信息:', worker);
    if (!worker) {
      await transaction.rollback();
      res.status(404).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    console.log('检查打手是否可以接单...');
    console.log('打手状态:', worker.status);
    console.log('WorkerStatus.AVAILABLE:', WorkerStatus.AVAILABLE);
    console.log('canTakeOrder结果:', worker.canTakeOrder());
    if (!worker.canTakeOrder()) {
      console.log('打手不可接单');
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '该打手当前不可接单',
        data: null
      });
      return;
    }
    console.log('打手可以接单');

    // 计算价格
    const durationNum = parseFloat(duration);
    const discountNum = parseFloat(discount);
    console.log('价格计算参数:', { durationNum, discountNum, workerPriceHour: worker.price_hour });
    const priceOrigin = Order.calculateOriginPrice(durationNum, worker.price_hour);
    
    // 如果前端发送了amount字段，使用前端的价格作为实付金额
    let priceFinal = priceOrigin;
    if (req.body.amount) {
      priceFinal = parseFloat(req.body.amount);
      // 计算实际的优惠金额
      const actualDiscount = priceOrigin - priceFinal;
      console.log('前端价格调整:', { priceOrigin, priceFinal, actualDiscount });
    } else {
      priceFinal = Order.calculateFinalPrice(priceOrigin, discountNum);
    }
    
    console.log('价格计算结果:', { priceOrigin, priceFinal });

    // 验证支付金额
    const payBalanceNum = parseFloat(finalPayBalance);
    const payScanNum = parseFloat(finalPayScan);
    console.log('支付金额:', { payBalanceNum, payScanNum, pay_method });
    
    const tempOrder = new Order({
      price_final: priceFinal,
      pay_method,
      pay_balance: payBalanceNum,
      pay_scan: payScanNum
    });

    console.log('验证支付金额...');
    if (!tempOrder.validatePaymentAmounts()) {
      console.log('支付金额验证失败');
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '支付金额与支付方式不匹配',
        data: null
      });
      return;
    }
    console.log('支付金额验证通过');

    // 检查会员余额是否足够（如果使用余额支付）
    console.log('检查会员余额...');
    console.log('会员余额:', member.balance, '需要支付:', payBalanceNum);
    if (payBalanceNum > 0 && !member.hasEnoughBalance(payBalanceNum)) {
      console.log('会员余额不足');
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '会员余额不足',
        data: {
          required: payBalanceNum,
          available: member.balance
        }
      });
      return;
    }
    console.log('会员余额检查通过');

    // 计算实际的优惠金额
    const actualDiscount = priceOrigin - priceFinal;
    
    // 创建订单
    const order = await Order.create({
      member_id,
      worker_id,
      duration: durationNum,
      price_origin: priceOrigin,
      discount: actualDiscount,
      price_final: priceFinal,
      pay_method,
      pay_balance: payBalanceNum,
      pay_scan: payScanNum,
      remark,
      discount_reason
    }, { transaction });

    // 扣除会员余额（如果使用余额支付）
    if (payBalanceNum > 0) {
      console.log('扣除会员余额:', payBalanceNum);
      member.balance = Number(member.balance) - Number(payBalanceNum);
      member.total_consume = Number(member.total_consume) + Number(payBalanceNum);
      await member.save({ transaction });
      console.log('会员余额扣除完成，新余额:', member.balance);
    }

    await transaction.commit();
    console.log('事务提交成功，订单ID:', order.id);

    // 重新查询订单，包含关联信息
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['id', 'nickname', 'phone', 'balance']
        },
        {
          model: Worker,
          as: 'worker',
          attributes: ['id', 'name', 'real_name', 'type', 'price_hour']
        }
      ]
    });
    console.log('重新查询订单成功:', createdOrder?.id);

    // 企业微信通知已移除

    console.log('准备发送响应...');
    res.json({
      code: '00000',
      message: '创建订单成功',
      data: {
        ...createdOrder!.toJSON(),
        order_number: createdOrder!.getOrderNumber()
      }
    });
    console.log('响应发送完成');
  } catch (error) {
    await transaction.rollback();
    console.error('创建订单错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 更新订单（仅允许修改备注）
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('订单ID必须是正整数'),
  body('remark')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('备注长度不能超过255个字符')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 400,
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const orderId = parseInt(req.params.id);
    const { remark } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({
        code: 'B0001',
        message: '订单不存在',
        data: null
      });
      return;
    }

    // 只允许修改备注
    await order.update({ remark });

    // 重新查询订单，包含关联信息
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['id', 'nickname', 'phone', 'balance']
        },
        {
          model: Worker,
          as: 'worker',
          attributes: ['id', 'name', 'real_name', 'type', 'price_hour']
        }
      ]
    });

    res.json({
      code: 200,
      message: '更新订单成功',
      data: {
        ...updatedOrder!.toJSON(),
        order_number: updatedOrder!.getOrderNumber()
      }
    });
  } catch (error) {
    console.error('更新订单错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 删除订单（谨慎操作，需要回滚余额）
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('订单ID必须是正整数')
], async (req: Request, res: Response): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      res.status(400).json({
        code: 400,
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const orderId = parseInt(req.params.id);

    const order = await Order.findByPk(orderId, {
      include: [{
        model: Member,
        as: 'member'
      }],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      res.status(404).json({
        code: 'B0001',
        message: '订单不存在',
        data: null
      });
      return;
    }

    const member = order.member;
    
    // 如果使用了余额支付，需要退还余额
    if (order.pay_balance && order.pay_balance > 0) {
      member.balance = Number(member.balance) + Number(order.pay_balance);
      member.total_consume = Number(member.total_consume) - Number(order.pay_balance);
      await member.save({ transaction });
    }

    // 删除订单
    await order.destroy({ transaction });

    await transaction.commit();

    res.json({
      code: 200,
      message: '删除订单成功',
      data: null
    });
  } catch (error) {
    await transaction.rollback();
    console.error('删除订单错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 计算订单价格（用于前端实时计算）
router.post('/calculate-price', [
  body('worker_id')
    .isInt({ min: 1 })
    .withMessage('打手ID必须是正整数'),
  body('duration')
    .isFloat({ min: 0.1 })
    .withMessage('服务时长必须大于0.1小时'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('优惠金额必须是非负数')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 400,
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const { worker_id, duration, discount = 0 } = req.body;

    // 检查打手是否存在
    const worker = await Worker.findByPk(worker_id, {
      attributes: ['id', 'name', 'price_hour']
    });

    if (!worker) {
      res.status(404).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    const durationNum = parseFloat(duration);
    const discountNum = parseFloat(discount);
    const priceOrigin = Order.calculateOriginPrice(durationNum, worker.price_hour);
    const priceFinal = Order.calculateFinalPrice(priceOrigin, discountNum);

    res.json({
      code: 200,
      message: '计算价格成功',
      data: {
        worker: {
          id: worker.id,
          name: worker.name,
          price_hour: worker.price_hour
        },
        duration: durationNum,
        price_origin: priceOrigin,
        discount: discountNum,
        price_final: priceFinal
      }
    });
  } catch (error) {
    console.error('计算价格错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取订单统计信息
router.get('/stats/summary', [
  query('start_date').optional().isISO8601().withMessage('开始日期格式不正确'),
  query('end_date').optional().isISO8601().withMessage('结束日期格式不正确')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 400,
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

    // 总订单统计
    const totalStats: any = await Order.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_count'],
        [sequelize.fn('SUM', sequelize.col('price_final')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'total_duration']
      ],
      raw: true
    });

    // 按支付方式统计
    const payMethodStats = await Order.findAll({
      where,
      attributes: [
        'pay_method',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('price_final')), 'amount']
      ],
      group: ['pay_method'],
      raw: true
    });

    res.json({
      code: 200,
      message: '获取订单统计成功',
      data: {
        total: {
          count: parseInt(totalStats?.total_count as string) || 0,
          amount: parseFloat(totalStats?.total_amount as string) || 0,
          duration: parseFloat(totalStats?.total_duration as string) || 0
        },
        by_pay_method: payMethodStats.map((stat: any) => ({
          pay_method: stat.pay_method,
          pay_method_text: Order.getPayMethodText(stat.pay_method),
          count: parseInt(stat.count),
          amount: parseFloat(stat.amount)
        }))
      }
    });
  } catch (error) {
    console.error('获取订单统计错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 上钟接口 - 设置订单开始时间
router.post('/:id/start', [
  param('id').isInt({ min: 1 }).withMessage('订单ID必须是正整数'),
  body('start_time').optional().isISO8601().withMessage('上钟时间格式不正确')
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

    const orderId = parseInt(req.params.id);
    const { start_time } = req.body;

    const order = await Order.findByPk(orderId, {
      include: [
        { model: Member, as: 'member' },
        { model: Worker, as: 'worker' }
      ]
    });

    if (!order) {
      res.status(404).json({
        code: 'B0001',
        message: '订单不存在',
        data: null
      });
      return;
    }

    // 检查订单状态
    if (order.isStarted()) {
      res.status(400).json({
        code: 'B0001',
        message: '订单已上钟，不能重复上钟',
        data: null
      });
      return;
    }

    // 检查打手状态
    if (order.worker.status !== '可用') {
      res.status(400).json({
        code: 'B0001',
        message: '打手当前不可用，无法上钟',
        data: null
      });
      return;
    }

    // 设置上钟时间
    const startTime = start_time ? new Date(start_time) : new Date();
    order.setStartTime(startTime);

    // 更新打手状态为忙碌
    await order.worker.update({ status: '忙碌' });

    // 保存订单
    await order.save();

    res.json({
      code: '00000',
      message: '上钟成功',
      data: {
        order_id: order.id,
        start_time: order.start_time,
        end_time: order.end_time,
        worker_status: order.worker.status
      }
    });
  } catch (error) {
    console.error('上钟错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 下钟接口 - 设置订单结束时间
router.post('/:id/end', [
  param('id').isInt({ min: 1 }).withMessage('订单ID必须是正整数'),
  body('end_time').optional().isISO8601().withMessage('下钟时间格式不正确')
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

    const orderId = parseInt(req.params.id);
    const { end_time } = req.body;

    const order = await Order.findByPk(orderId, {
      include: [
        { model: Member, as: 'member' },
        { model: Worker, as: 'worker' }
      ]
    });

    if (!order) {
      res.status(404).json({
        code: 'B0001',
        message: '订单不存在',
        data: null
      });
      return;
    }

    // 检查订单状态
    if (!order.isStarted()) {
      res.status(400).json({
        code: 'B0001',
        message: '订单未上钟，无法下钟',
        data: null
      });
      return;
    }

    if (order.isEnded()) {
      res.status(400).json({
        code: 'B0001',
        message: '订单已下钟，不能重复下钟',
        data: null
      });
      return;
    }

    // 设置下钟时间
    const endTime = end_time ? new Date(end_time) : new Date();
    order.setEndTime(endTime);

    // 更新打手状态为可用
    await order.worker.update({ status: '可用' });

    // 保存订单
    await order.save();

    // 计算实际服务时长
    const actualDuration = order.start_time && order.end_time 
      ? (order.end_time.getTime() - order.start_time.getTime()) / (1000 * 60 * 60) // 转换为小时
      : order.duration;

    res.json({
      code: '00000',
      message: '下钟成功',
      data: {
        order_id: order.id,
        start_time: order.start_time,
        end_time: order.end_time,
        actual_duration: actualDuration,
        worker_status: order.worker.status
      }
    });
  } catch (error) {
    console.error('下钟错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取即将下钟的订单列表（用于提醒）
router.get('/ending-soon', [
  query('minutes').optional().isInt({ min: 1, max: 60 }).withMessage('提醒时间必须在1-60分钟之间')
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

    const minutes = parseInt(req.query.minutes as string) || 10; // 默认10分钟内下钟的订单
    const now = new Date();
    const threshold = new Date(now.getTime() + minutes * 60 * 1000);

    const orders = await Order.findAll({
      where: {
        start_time: { [Op.ne]: null },
        end_time: {
          [Op.ne]: null,
          [Op.between]: [now, threshold]
        }
      },
      include: [
        { model: Member, as: 'member', attributes: ['id', 'nickname', 'phone'] },
        { model: Worker, as: 'worker', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['end_time', 'ASC']]
    });

    const endingSoonOrders = orders.map(order => ({
      order_id: order.id,
      order_number: order.getOrderNumber(),
      member_name: order.member.nickname,
      member_phone: order.member.phone,
      worker_name: order.worker.name,
      worker_phone: order.worker.phone,
      start_time: order.start_time,
      end_time: order.end_time,
      remaining_minutes: order.getRemainingTime(),
      duration: order.duration
    }));

    res.json({
      code: '00000',
      message: '获取即将下钟订单成功',
      data: {
        orders: endingSoonOrders,
        count: endingSoonOrders.length,
        threshold_minutes: minutes
      }
    });
  } catch (error) {
    console.error('获取即将下钟订单错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

export default router;