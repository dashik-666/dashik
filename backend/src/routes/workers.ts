import { Router, Request, Response } from 'express';
import { Worker, WorkerType, WorkerStatus, Order } from '../models';
import { authenticateToken } from '../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取打手列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('keyword').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('type').optional().isIn(Object.values(WorkerType)).withMessage('类型值无效'),
  query('status').optional().custom((value) => {
    if (value) {
      // 支持英文和中文状态值的映射
      const statusMapping: Record<string, string> = {
        'available': '可用',
        'busy': '忙碌', 
        'rest': '休息',
        'disabled': '禁用'
      };
      
      // 如果传入的是英文，转换为中文
      const mappedValue = statusMapping[value] || value;
      
      if (!Object.values(WorkerStatus).includes(mappedValue)) {
        throw new Error('状态值无效');
      }
      
      // 将转换后的值设置回req.query
      return mappedValue;
    }
    return true;
  }).withMessage('状态值无效')
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
    const keyword = req.query.keyword as string;
    const type = req.query.type as WorkerType;
    const status = req.query.status as WorkerStatus;

    const offset = (page - 1) * limit;
    const where: any = {};

    // 搜索条件
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { real_name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { wechat_id: { [Op.like]: `%${keyword}%` } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status && status.trim()) {
      where.status = status;
    }

    const { rows: workers, count: total } = await Worker.scope('active').findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: {
        // 在列表中不返回敏感信息的完整内容
        exclude: []
      }
    });

    // 对敏感信息进行脱敏处理，并添加业绩统计数据
    const maskedWorkers = await Promise.all(workers.map(async (worker) => {
      const workerData = worker.toJSON();
      
      // 计算业绩统计数据
      const orderStats = await Order.findOne({
        where: { worker_id: worker.id },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
          [sequelize.fn('SUM', sequelize.col('price_final')), 'total_income']
        ],
        raw: true
      });
      
      console.log(`打手 ${worker.id} 的业绩统计:`, orderStats);
      
      return {
        ...workerData,
        id_number: worker.getMaskedIdNumber(),
        bank_account: worker.getMaskedBankAccount(),
        total_orders: parseInt((orderStats as any)?.total_orders || '0'),
        total_income: parseFloat((orderStats as any)?.total_income || '0')
      };
    }));

    res.json({
      code: '00000',
      message: '获取打手列表成功',
      data: {
        list: maskedWorkers,
        total: total
      }
    });
  } catch (error) {
    console.error('获取打手列表错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取打手统计数据
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  console.log('=== 打手统计数据请求开始 ===');
  console.log('请求路径:', req.path);
  console.log('请求方法:', req.method);
  console.log('请求头:', req.headers);
  console.log('用户信息:', req.user);
  
  try {
    console.log('开始获取打手统计数据...');
    
    // 检查Worker模型
    console.log('Worker模型:', typeof Worker);
    console.log('WorkerStatus枚举:', WorkerStatus);
    console.log('WorkerStatus.AVAILABLE值:', WorkerStatus.AVAILABLE);
    
    // 总打手数
    console.log('开始查询总打手数...');
    const totalWorkers = await Worker.count();
    console.log('总打手数查询成功:', totalWorkers);

    // 可用打手数（状态为在职）
    console.log('开始查询可用打手数...');
    const availableWorkers = await Worker.count({
      where: { status: WorkerStatus.AVAILABLE }
    });
    console.log('可用打手数查询成功:', availableWorkers, '状态条件:', WorkerStatus.AVAILABLE);

    // 简化忙碌打手查询
    const busyWorkers = 0; // 暂时设为0，避免复杂查询
    console.log('忙碌打手数:', busyWorkers);

    // 平均小时费率
    console.log('开始查询平均小时费率...');
    const avgRate = await Worker.findOne({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('price_hour')), 'average_rate']
      ],
      raw: true
    });
    console.log('平均费率查询结果:', avgRate);

    const responseData = {
      totalWorkers,
      availableWorkers,
      busyWorkers: busyWorkers,
      averageRate: parseFloat((avgRate as any)?.average_rate || '0')
    };
    
    console.log('统计数据响应:', responseData);
    console.log('准备发送响应...');

    res.json({
      code: '00000',
      message: '获取打手统计数据成功',
      data: responseData
    });
    
    console.log('响应发送成功');
  } catch (error: any) {
    console.error('=== 打手统计数据错误 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // 根据错误类型返回不同的错误信息
    if (error.name === 'SequelizeConnectionError') {
      res.status(500).json({
        code: 'B0001',
        message: '数据库连接错误',
        data: null
      });
    } else if (error.name === 'SequelizeValidationError') {
      res.status(400).json({
        code: 'B0001',
        message: '数据验证错误',
        data: null,
        errors: error.errors
      });
    } else {
      res.status(500).json({
        code: 'B0001',
        message: `服务器内部错误: ${error.message}`,
        data: null
      });
    }
  }
  
  console.log('=== 打手统计数据请求结束 ===');
});

// 获取打手详情
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('打手ID必须是正整数')
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

    const workerId = parseInt(req.params.id);

    const worker = await Worker.findByPk(workerId, {
      include: [{
        model: Order,
        as: 'orders',
        limit: 10,
        order: [['created_at', 'DESC']]
      }]
    });

    if (!worker) {
      res.status(404).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    // 详情页面返回完整信息（管理员可见）
    res.json({
      code: 200,
      message: '获取打手详情成功',
      data: worker
    });
  } catch (error) {
    console.error('获取打手详情错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 创建打手
router.post('/', [
  body('name')
    .notEmpty()
    .withMessage('昵称不能为空')
    .isLength({ max: 50 })
    .withMessage('昵称长度不能超过50个字符'),
  body('real_name')
    .notEmpty()
    .withMessage('真实姓名不能为空')
    .isLength({ max: 50 })
    .withMessage('真实姓名长度不能超过50个字符'),
  body('id_number')
    .notEmpty()
    .withMessage('身份证号不能为空')
    .matches(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/)
    .withMessage('身份证号格式不正确'),
  body('phone')
    .notEmpty()
    .withMessage('联系电话不能为空')
    .isMobilePhone('zh-CN')
    .withMessage('手机号格式不正确'),
  body('wechat_id')
    .optional()
    .isLength({ max: 50 })
    .withMessage('微信号长度不能超过50个字符'),
  body('bank_account')
    .optional()
    .isLength({ max: 50 })
    .withMessage('银行卡号长度不能超过50个字符'),
  body('bank_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('开户行名称长度不能超过100个字符'),
  body('account_name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('开户姓名长度不能超过50个字符'),
  body('price_hour')
    .isFloat({ min: 0.01 })
    .withMessage('每小时单价必须大于0'),
  body('type')
    .isIn(Object.values(WorkerType))
    .withMessage('类型值无效'),
  body('status')
    .optional()
    .isIn(Object.values(WorkerStatus))
    .withMessage('状态值无效'),
  body('level')
    .optional()
    .isIn(['A', 'S', 'SSR', '魔王'])
    .withMessage('级别值无效'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('技能标签必须是数组格式'),
  body('remark')
    .optional()
    .isLength({ max: 255 })
    .withMessage('备注长度不能超过255个字符')
], async (req: Request, res: Response): Promise<void> => {
  console.log('=== 创建打手请求开始 ===');
  console.log('请求体:', req.body);
  console.log('WorkerType枚举:', WorkerType);
  console.log('WorkerStatus枚举:', WorkerStatus);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('参数验证失败:', errors.array());
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const {
      name,
      real_name,
      id_number,
      phone,
      wechat_id,
      bank_account,
      bank_name,
      account_name,
      price_hour,
      type,
      status = WorkerStatus.AVAILABLE,
      level = 'A',
      skills = [],
      remark
    } = req.body;

    // 检查身份证号是否已存在
    const existingIdNumber = await Worker.findOne({ where: { id_number } });
    if (existingIdNumber) {
      res.status(400).json({
        code: 'B0001',
        message: '身份证号已存在',
        data: null
      });
      return;
    }

    // 检查手机号是否已存在
    const existingPhone = await Worker.findOne({ where: { phone } });
    if (existingPhone) {
      res.status(400).json({
        code: 'B0001',
        message: '手机号已存在',
        data: null
      });
      return;
    }

    // 检查银行卡号是否已存在（如果提供）
    if (bank_account) {
      const existingBankAccount = await Worker.findOne({ where: { bank_account } });
      if (existingBankAccount) {
        res.status(400).json({
          code: 'B0001',
          message: '银行卡号已存在',
          data: null
        });
        return;
      }
    }

    const worker = await Worker.create({
      name,
      real_name,
      id_number,
      phone,
      wechat_id,
      bank_account,
      bank_name,
      account_name,
      price_hour: parseFloat(price_hour),
      type,
      status,
      level,
      skills,
      remark
    });

    res.status(201).json({
      code: 201,
      message: '创建打手成功',
      data: worker
    });
  } catch (error) {
    console.error('创建打手错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 更新打手
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('打手ID必须是正整数'),
  body('name')
    .optional()
    .notEmpty()
    .withMessage('昵称不能为空')
    .isLength({ max: 50 })
    .withMessage('昵称长度不能超过50个字符'),
  body('real_name')
    .optional()
    .notEmpty()
    .withMessage('真实姓名不能为空')
    .isLength({ max: 50 })
    .withMessage('真实姓名长度不能超过50个字符'),
  body('id_number')
    .optional()
    .matches(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/)
    .withMessage('身份证号格式不正确'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('手机号格式不正确'),
  body('wechat_id')
    .optional()
    .isLength({ max: 50 })
    .withMessage('微信号长度不能超过50个字符'),
  body('bank_account')
    .optional()
    .isLength({ max: 50 })
    .withMessage('银行卡号长度不能超过50个字符'),
  body('bank_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('开户行名称长度不能超过100个字符'),
  body('price_hour')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('每小时单价必须大于0'),
  body('type')
    .optional()
    .isIn(Object.values(WorkerType))
    .withMessage('类型值无效'),
  body('status')
    .optional()
    .isIn(Object.values(WorkerStatus))
    .withMessage('状态值无效'),
  body('level')
    .optional()
    .isIn(['A', 'S', 'SSR', '魔王'])
    .withMessage('级别值无效'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('技能标签必须是数组格式'),
  body('remark')
    .optional()
    .isLength({ max: 255 })
    .withMessage('备注长度不能超过255个字符')
], async (req: Request, res: Response): Promise<void> => {
  console.log('=== 更新打手请求开始 ===');
  console.log('请求路径:', req.path);
  console.log('请求体:', req.body);
  console.log('WorkerType枚举:', WorkerType);
  console.log('WorkerStatus枚举:', WorkerStatus);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('参数验证失败:', errors.array());
      res.status(400).json({
        code: 400,
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const workerId = parseInt(req.params.id);
    const updateData = req.body;

    const worker = await Worker.findByPk(workerId);
    if (!worker) {
      res.status(404).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    // 检查身份证号是否已被其他打手使用
    if (updateData.id_number && updateData.id_number !== worker.id_number) {
      const existingIdNumber = await Worker.findOne({ 
        where: { 
          id_number: updateData.id_number,
          id: { [Op.ne]: workerId }
        } 
      });
      if (existingIdNumber) {
        res.status(400).json({
          code: 'B0001',
          message: '身份证号已存在',
          data: null
        });
        return;
      }
    }

    // 检查手机号是否已被其他打手使用
    if (updateData.phone && updateData.phone !== worker.phone) {
      const existingPhone = await Worker.findOne({ 
        where: { 
          phone: updateData.phone,
          id: { [Op.ne]: workerId }
        } 
      });
      if (existingPhone) {
        res.status(400).json({
          code: 'B0001',
          message: '手机号已存在',
          data: null
        });
        return;
      }
    }

    // 检查银行卡号是否已被其他打手使用
    if (updateData.bank_account && updateData.bank_account !== worker.bank_account) {
      const existingBankAccount = await Worker.findOne({ 
        where: { 
          bank_account: updateData.bank_account,
          id: { [Op.ne]: workerId }
        } 
      });
      if (existingBankAccount) {
        res.status(400).json({
          code: 'B0001',
          message: '银行卡号已存在',
          data: null
        });
        return;
      }
    }

    // 处理价格字段
    if (updateData.price_hour) {
      updateData.price_hour = parseFloat(updateData.price_hour);
    }

    await worker.update(updateData);

    res.json({
      code: '00000',
      message: '更新打手成功',
      data: worker
    });
  } catch (error) {
    console.error('更新打手错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 更新打手状态
router.put('/:id/status', [
  param('id').isInt({ min: 1 }).withMessage('打手ID必须是正整数'),
  body('status')
    .isIn(Object.values(WorkerStatus))
    .withMessage('状态值无效')
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

    const workerId = parseInt(req.params.id);
    const { status } = req.body;

    const worker = await Worker.findByPk(workerId);
    if (!worker) {
      res.status(404).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    await worker.update({ status });

    res.json({
      code: '00000',
      message: '更新打手状态成功',
      data: worker
    });
  } catch (error: any) {
    console.error('更新打手状态错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取打手收入统计
router.get('/:id/income-stats', [
  param('id').isInt({ min: 1 }).withMessage('打手ID必须是正整数')
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

    const workerId = parseInt(req.params.id);

    // 检查打手是否存在
    const worker = await Worker.findByPk(workerId);
    if (!worker) {
      res.status(404).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    // 计算今日收入
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayIncome = await Order.sum('price_final', {
      where: {
        worker_id: workerId,
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    // 计算本月收入
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const monthIncome = await Order.sum('price_final', {
      where: {
        worker_id: workerId,
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    // 计算总收入
    const totalIncome = await Order.sum('price_final', {
      where: { worker_id: workerId }
    });

    // 计算总订单数
    const totalOrders = await Order.count({
      where: { worker_id: workerId }
    });

    res.json({
      code: '00000',
      message: '获取打手收入统计成功',
      data: {
        todayIncome: parseFloat(String(todayIncome || '0')),
        monthIncome: parseFloat(String(monthIncome || '0')),
        totalIncome: parseFloat(String(totalIncome || '0')),
        totalOrders: totalOrders
      }
    });
  } catch (error: any) {
    console.error('获取打手收入统计错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 取消打手（软删除）
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('打手ID必须是正整数'),
  body('cancel_reason').optional().isString().withMessage('取消原因必须是字符串')
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

    const workerId = parseInt(req.params.id);
    const cancelReason = req.body.cancel_reason || '管理员取消';

    const worker = await Worker.findByPk(workerId);
    if (!worker) {
      res.status(404).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    // 检查是否有关联的订单
    const orderCount = await Order.count({ where: { worker_id: workerId } });
    if (orderCount > 0) {
      res.status(400).json({
        code: 'B0001',
        message: '该打手存在订单记录，无法取消',
        data: null
      });
      return;
    }

    // 软删除：标记为已取消
    await worker.update({
      is_cancelled: true,
      cancelled_at: new Date(),
      cancel_reason: cancelReason
    });

    res.json({
      code: 200,
      message: '取消打手成功',
      data: null
    });
  } catch (error) {
    console.error('取消打手错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取可用打手列表（用于下单时选择）
router.get('/available/list', [
  query('type').optional().isIn(Object.values(WorkerType)).withMessage('类型值无效')
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

    const type = req.query.type as WorkerType;
    const where: any = {
      status: WorkerStatus.AVAILABLE
    };

    if (type) {
      where.type = type;
    }

    const workers = await Worker.findAll({
      where,
      attributes: ['id', 'name', 'type', 'price_hour'],
      order: [['name', 'ASC']]
    });

    res.json({
      code: 200,
      message: '获取可用打手列表成功',
      data: workers
    });
  } catch (error) {
    console.error('获取可用打手列表错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取打手的订单记录
router.get('/:id/orders', [
  param('id').isInt({ min: 1 }).withMessage('打手ID必须是正整数'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
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

    const workerId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // 检查打手是否存在
    const worker = await Worker.findByPk(workerId);
    if (!worker) {
      res.status(404).json({
        code: 'B0001',
        message: '打手不存在',
        data: null
      });
      return;
    }

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where: { worker_id: workerId },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      code: 200,
      message: '获取订单记录成功',
      data: {
        list: orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取订单记录错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});



export default router;