import { Router, Request, Response } from 'express';
import { CommissionRule, CommissionRuleType, CommissionRuleStatus, Worker } from '../models';
import { authenticateToken } from '../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取分成规则列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('type').optional().isIn(Object.values(CommissionRuleType)).withMessage('规则类型无效'),
  query('status').optional().isIn(Object.values(CommissionRuleStatus)).withMessage('状态无效'),
  query('keyword').optional().isString().withMessage('搜索关键词必须是字符串')
], async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔍 开始获取分成规则列表');
    console.log('📋 请求参数:', {
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ 参数验证失败:', errors.array());
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array(),
        details: {
          endpoint: '/api/v1/commission-rules',
          method: 'GET',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as CommissionRuleType;
    const status = req.query.status as CommissionRuleStatus;
    const keyword = req.query.keyword as string;

    console.log('📊 查询参数:', { page, limit, type, status, keyword });

    const offset = (page - 1) * limit;
    const where: any = {};

    // 筛选条件
    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    console.log('🔍 数据库查询条件:', where);

    const { rows: rules, count: total } = await CommissionRule.findAndCountAll({
      where,
      include: [{
        model: Worker,
        as: 'worker',
        attributes: ['id', 'name', 'real_name']
      }],
      limit,
      offset,
      order: [['priority', 'DESC'], ['created_at', 'DESC']]
    });

    console.log('✅ 数据库查询成功:', { count: total, returned: rules.length });

    res.json({
      code: '00000',
      message: '获取分成规则列表成功',
      data: {
        list: rules,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      details: {
        endpoint: '/api/v1/commission-rules',
        method: 'GET',
        timestamp: new Date().toISOString(),
        queryParams: { page, limit, type, status, keyword }
      }
    });
  } catch (error) {
    console.error('❌ 获取分成规则列表错误:', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      endpoint: '/api/v1/commission-rules',
      method: 'GET',
      timestamp: new Date().toISOString(),
      requestInfo: {
        query: req.query,
        headers: req.headers,
        url: req.url
      }
    });
    
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null,
      details: {
        endpoint: '/api/v1/commission-rules',
        method: 'GET',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
        errorType: (error as Error).constructor.name
      }
    });
  }
});

// 获取分成规则详情
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('规则ID必须是正整数')
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

    const ruleId = parseInt(req.params.id);

    const rule = await CommissionRule.findByPk(ruleId, {
      include: [{
        model: Worker,
        as: 'worker',
        attributes: ['id', 'name', 'real_name']
      }]
    });

    if (!rule) {
      res.status(404).json({
        code: 'B0001',
        message: '分成规则不存在',
        data: null
      });
      return;
    }

    res.json({
      code: '00000',
      message: '获取分成规则详情成功',
      data: rule
    });
  } catch (error) {
    console.error('获取分成规则详情错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 创建分成规则
router.post('/', [
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('规则名称长度必须在1-100个字符之间'),
  body('type')
    .isIn(Object.values(CommissionRuleType))
    .withMessage('规则类型无效'),
  body('worker_level')
    .optional()
    .isString()
    .isLength({ max: 20 })
    .withMessage('打手级别长度不能超过20个字符'),
  body('worker_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('打手ID必须是正整数'),
  body('commission_rate')
    .isFloat({ min: 0, max: 1 })
    .withMessage('分成比例必须在0-1之间'),
  body('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最小金额不能小于0'),
  body('max_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最大金额不能小于0'),
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('优先级必须是非负整数'),
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
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const {
      name,
      type,
      worker_level,
      worker_id,
      commission_rate,
      min_amount,
      max_amount,
      priority,
      remark
    } = req.body;

    // 验证规则类型与字段的匹配
    if (type === CommissionRuleType.LEVEL && !worker_level) {
      res.status(400).json({
        code: 'B0001',
        message: '级别类型规则必须指定打手级别',
        data: null
      });
      return;
    }

    if (type === CommissionRuleType.CUSTOM && !worker_id) {
      res.status(400).json({
        code: 'B0001',
        message: '自定义类型规则必须指定打手ID',
        data: null
      });
      return;
    }

    if (type === CommissionRuleType.GLOBAL && (worker_level || worker_id)) {
      res.status(400).json({
        code: 'B0001',
        message: '全局类型规则不能指定打手级别或打手ID',
        data: null
      });
      return;
    }

    // 验证金额范围
    if (min_amount !== undefined && max_amount !== undefined && min_amount >= max_amount) {
      res.status(400).json({
        code: 'B0001',
        message: '最小金额必须小于最大金额',
        data: null
      });
      return;
    }

    // 检查是否已存在相同规则
    const existingRule = await CommissionRule.findOne({
      where: {
        type,
        worker_level: type === CommissionRuleType.LEVEL ? worker_level : undefined,
        worker_id: type === CommissionRuleType.CUSTOM ? worker_id : undefined,
        status: CommissionRuleStatus.ACTIVE
      }
    });

    if (existingRule) {
      res.status(400).json({
        code: 'B0001',
        message: '已存在相同类型的活跃规则',
        data: null
      });
      return;
    }

    const rule = await CommissionRule.create({
      name,
      type,
      worker_level,
      worker_id,
      commission_rate: parseFloat(commission_rate),
      min_amount: min_amount ? parseFloat(min_amount) : undefined,
      max_amount: max_amount ? parseFloat(max_amount) : undefined,
      priority: priority || 0,
      remark
    });

    res.status(201).json({
      code: '00000',
      message: '创建分成规则成功',
      data: rule
    });
  } catch (error) {
    console.error('创建分成规则错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 更新分成规则
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('规则ID必须是正整数'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('规则名称长度必须在1-100个字符之间'),
  body('commission_rate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('分成比例必须在0-1之间'),
  body('min_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最小金额不能小于0'),
  body('max_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('最大金额不能小于0'),
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('优先级必须是非负整数'),
  body('status')
    .optional()
    .isIn(Object.values(CommissionRuleStatus))
    .withMessage('状态无效'),
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
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const ruleId = parseInt(req.params.id);
    const {
      name,
      commission_rate,
      min_amount,
      max_amount,
      priority,
      status,
      remark
    } = req.body;

    const rule = await CommissionRule.findByPk(ruleId);
    if (!rule) {
      res.status(404).json({
        code: 'B0001',
        message: '分成规则不存在',
        data: null
      });
      return;
    }

    // 验证金额范围
    if (min_amount !== undefined && max_amount !== undefined && min_amount >= max_amount) {
      res.status(400).json({
        code: 'B0001',
        message: '最小金额必须小于最大金额',
        data: null
      });
      return;
    }

    await rule.update({
      name,
      commission_rate: commission_rate ? parseFloat(commission_rate) : undefined,
      min_amount: min_amount !== undefined ? parseFloat(min_amount) : undefined,
      max_amount: max_amount !== undefined ? parseFloat(max_amount) : undefined,
      priority,
      status,
      remark
    });

    res.json({
      code: '00000',
      message: '更新分成规则成功',
      data: rule
    });
  } catch (error) {
    console.error('更新分成规则错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 删除分成规则
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('规则ID必须是正整数')
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

    const ruleId = parseInt(req.params.id);

    const rule = await CommissionRule.findByPk(ruleId);
    if (!rule) {
      res.status(404).json({
        code: 'B0001',
        message: '分成规则不存在',
        data: null
      });
      return;
    }

    await rule.destroy();

    res.json({
      code: '00000',
      message: '删除分成规则成功',
      data: null
    });
  } catch (error) {
    console.error('删除分成规则错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 计算打手分成
router.post('/calculate', [
  body('worker_id').isInt({ min: 1 }).withMessage('打手ID必须是正整数'),
  body('amount').isFloat({ min: 0.01 }).withMessage('订单金额必须大于0'),
  body('worker_level').optional().isString().withMessage('打手级别必须是字符串')
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

    const { worker_id, amount, worker_level } = req.body;

    // 按优先级查找适用的分成规则
    const rules = await CommissionRule.findAll({
      where: {
        status: CommissionRuleStatus.ACTIVE,
        [Op.or]: [
          { type: CommissionRuleType.CUSTOM, worker_id },
          { type: CommissionRuleType.LEVEL, worker_level },
          { type: CommissionRuleType.GLOBAL }
        ]
      },
      order: [['priority', 'DESC']]
    });

    let applicableRule = null;
    let commissionRate = 0.7; // 默认分成比例

    // 按优先级选择规则
    for (const rule of rules) {
      if (rule.type === CommissionRuleType.CUSTOM && rule.worker_id === worker_id) {
        applicableRule = rule;
        break;
      } else if (rule.type === CommissionRuleType.LEVEL && rule.worker_level === worker_level) {
        if (!applicableRule || rule.priority > applicableRule.priority) {
          applicableRule = rule;
        }
      } else if (rule.type === CommissionRuleType.GLOBAL) {
        if (!applicableRule) {
          applicableRule = rule;
        }
      }
    }

    if (applicableRule) {
      commissionRate = applicableRule.commission_rate;
    }

    const commissionAmount = amount * commissionRate;
    const platformAmount = amount - commissionAmount;

    res.json({
      code: '00000',
      message: '计算分成成功',
      data: {
        rule: applicableRule,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        platform_amount: platformAmount,
        total_amount: amount
      }
    });
  } catch (error) {
    console.error('计算分成错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

export default router;
