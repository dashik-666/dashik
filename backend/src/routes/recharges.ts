import { Router, Request, Response } from 'express';
import { Recharge, RechargeMethod, Member } from '../models';
import { authenticateToken } from '../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import wechatService from '../services/wechat';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取充值记录列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('member_id').optional().isInt({ min: 1 }).withMessage('会员ID必须是正整数'),
  query('method').optional().isIn(Object.values(RechargeMethod)).withMessage('支付方式无效'),
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
    const method = req.query.method as RechargeMethod;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const keyword = req.query.keyword as string;

    const offset = (page - 1) * limit;
    const where: any = {};
    const memberWhere: any = {};

    // 筛选条件
    if (memberId) {
      where.member_id = memberId;
    }

    if (method) {
      where.method = method;
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

    // 搜索会员昵称或手机号
    if (keyword) {
      memberWhere[Op.or] = [
        { nickname: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { rows: recharges, count: total } = await Recharge.findAndCountAll({
      where,
      include: [{
        model: Member,
        as: 'member',
        attributes: ['id', 'nickname', 'phone'],
        where: Object.keys(memberWhere).length > 0 ? memberWhere : undefined
      }],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      code: '00000',
      message: '获取充值记录成功',
      data: {
        list: recharges,
        total: total
      }
    });
  } catch (error) {
    console.error('获取充值记录错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取充值记录详情
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('充值记录ID必须是正整数')
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

    const rechargeId = parseInt(req.params.id);

    const recharge = await Recharge.findByPk(rechargeId, {
      include: [{
        model: Member,
        as: 'member',
        attributes: ['id', 'nickname', 'phone', 'balance']
      }]
    });

    if (!recharge) {
      res.status(404).json({
        code: 'B0001',
        message: '充值记录不存在',
        data: null
      });
      return;
    }

    res.json({
      code: '00000',
      message: '获取充值记录详情成功',
      data: recharge
    });
  } catch (error) {
    console.error('获取充值记录详情错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 创建充值记录
router.post('/', [
  body('member_id')
    .isInt({ min: 1 })
    .withMessage('会员ID必须是正整数'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('充值金额必须大于0'),
  body('method')
    .isIn(Object.values(RechargeMethod))
    .withMessage('支付方式无效'),
  body('remark')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('备注长度不能超过255个字符')
], async (req: Request, res: Response): Promise<void> => {
  console.log('=== 创建充值记录请求 ===');
  console.log('请求体:', req.body);
  console.log('请求头:', req.headers);
  
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('参数验证失败:', errors.array());
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const { member_id, amount, method, remark } = req.body;
    console.log('解析后的参数:', { member_id, amount, method, remark });

    // 获取当前用户信息
    const userId = req.user?.id;
    const username = req.user?.username;
    console.log('操作人信息:', { userId, username });

    // 生成充值编号
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const rechargeNo = `RC${timestamp}${randomNum}`;
    console.log('生成充值编号:', rechargeNo);

    // 检查会员是否存在且状态正常
    console.log('查找会员ID:', member_id);
    const member = await Member.findByPk(member_id, { transaction });
    console.log('找到的会员:', member ? { id: member.id, nickname: member.nickname, status: member.status } : null);
    
    if (!member) {
      console.log('会员不存在，回滚事务');
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
      console.log('会员已被禁用，回滚事务');
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '该会员已被禁用，无法进行充值',
        data: null
      });
      return;
    }

    // 创建充值记录
    console.log('创建充值记录，参数:', { recharge_no: rechargeNo, member_id, amount: parseFloat(amount), method, remark, operator_id: userId, operator_name: username });
    const recharge = await Recharge.create({
      recharge_no: rechargeNo,
      member_id,
      amount: parseFloat(amount),
      method,
      remark,
      operator_id: userId,
      operator_name: username
    }, { transaction });
    console.log('充值记录创建成功:', { id: recharge.id, amount: recharge.amount });

    // 更新会员余额
    console.log('更新会员余额，当前余额:', member.balance, '增加金额:', parseFloat(amount));
    // 直接更新余额，不使用updateBalance方法，避免重复save
    member.balance = Number(member.balance) + Number(parseFloat(amount));
    member.total_recharge = Number(member.total_recharge) + Number(parseFloat(amount));
    await member.save({ transaction });
    console.log('会员余额更新成功，新余额:', member.balance);

    console.log('提交事务');
    await transaction.commit();
    console.log('事务提交成功');

    // 重新查询充值记录，包含会员信息
    console.log('重新查询充值记录，ID:', recharge.id);
    const createdRecharge = await Recharge.findByPk(recharge.id, {
      include: [{
        model: Member,
        as: 'member',
        attributes: ['id', 'nickname', 'phone', 'balance']
      }]
    });
    console.log('查询到的充值记录:', createdRecharge ? { id: createdRecharge.id, amount: createdRecharge.amount } : null);

    // 发送企业微信通知
    try {
      const methodText: Record<string, string> = {
        balance: '余额支付',
        scan: '扫码支付',
        mixed: '混合支付'
      };
      const displayMethod = methodText[method as string] || method;

      const message = `💰 **充值成功**\n\n` +
          `👤 会员：${member.nickname}\n` +
          `💵 金额：¥${amount}\n` +
          `💳 支付方式：${displayMethod}\n` +
        `💰 当前余额：¥${member.balance}\n` +
        `⏰ 时间：${new Date().toLocaleString('zh-CN')}`;

      await wechatService.sendMarkdownMessage(message);
    } catch (wechatError) {
      console.error('企业微信通知发送失败:', wechatError);
      // 不影响充值流程，只记录错误
    }

    console.log('发送成功响应');
    res.status(201).json({
      code: '00000',
      message: '充值成功',
      data: createdRecharge
    });
    console.log('响应发送完成');
  } catch (error: any) {
    await transaction.rollback();
    console.error('创建充值记录错误:', error);
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 更新充值记录（仅允许修改备注）
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('充值记录ID必须是正整数'),
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

    const rechargeId = parseInt(req.params.id);
    const { remark } = req.body;

    const recharge = await Recharge.findByPk(rechargeId);
    if (!recharge) {
      res.status(404).json({
        code: 'B0001',
        message: '充值记录不存在',
        data: null
      });
      return;
    }

    // 只允许修改备注
    await recharge.update({ remark });

    // 重新查询充值记录，包含会员信息
    const updatedRecharge = await Recharge.findByPk(rechargeId, {
      include: [{
        model: Member,
        as: 'member',
        attributes: ['id', 'nickname', 'phone', 'balance']
      }]
    });

    res.json({
      code: '00000',
      message: '更新充值记录成功',
      data: updatedRecharge
    });
  } catch (error) {
    console.error('更新充值记录错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 取消充值记录（谨慎操作，需要回滚余额）
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('充值记录ID必须是正整数')
], async (req: Request, res: Response): Promise<void> => {
  console.log('=== 取消充值记录请求 ===');
  console.log('充值记录ID:', req.params.id);
  
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('参数验证失败:', errors.array());
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const rechargeId = parseInt(req.params.id);
    console.log('解析后的充值记录ID:', rechargeId);

    console.log('查找充值记录，ID:', rechargeId);
    const recharge = await Recharge.findByPk(rechargeId, {
      include: [{
        model: Member,
        as: 'member'
      }],
      transaction
    });

    if (!recharge) {
      console.log('充值记录不存在');
      await transaction.rollback();
      res.status(404).json({
        code: 'B0001',
        message: '充值记录不存在',
        data: null
      });
      return;
    }

    // 检查充值记录状态
    if (recharge.status === 'cancelled') {
      console.log('充值记录已被取消');
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '充值记录已被取消',
        data: null
      });
      return;
    }

    console.log('找到充值记录:', { id: recharge.id, amount: recharge.amount, memberId: recharge.member_id, status: recharge.status });
    const member = recharge.member;
    console.log('会员信息:', { id: member.id, nickname: member.nickname, balance: member.balance });
    
    // 检查会员余额是否足够扣除
    const currentBalance = Number(member.balance);
    const rechargeAmount = Number(recharge.amount);
    console.log('检查余额:', { currentBalance, rechargeAmount });
    if (currentBalance < rechargeAmount) {
      console.log('余额不足，无法取消');
      await transaction.rollback();
      res.status(400).json({
        code: 'B0001',
        message: '会员余额不足，无法取消此充值记录',
        data: null
      });
      return;
    }

    // 获取当前用户信息
    const userId = req.user?.id;
    const username = req.user?.username;
    console.log('取消操作人信息:', { userId, username });

    // 扣除会员余额和累计充值金额
    console.log('扣除余额，当前余额:', member.balance, '扣除金额:', recharge.amount);
    member.balance = Number(member.balance) - Number(recharge.amount);
    member.total_recharge = Number(member.total_recharge) - Number(recharge.amount);
    await member.save({ transaction });
    console.log('余额扣除完成，新余额:', member.balance);

    // 标记充值记录为已取消
    console.log('标记充值记录为已取消');
    await recharge.update({
      status: 'cancelled',
      cancelled_by: userId,
      cancelled_by_name: username,
      cancelled_at: new Date()
    }, { transaction });
    console.log('充值记录取消完成');

    console.log('提交事务');
    await transaction.commit();
    console.log('事务提交成功');

    res.json({
      code: '00000',
      message: '取消充值记录成功',
      data: null
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('取消充值记录错误:', error);
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取充值统计信息
router.get('/stats/summary', [
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

    // 今日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWhere = { ...where, created_at: { [Op.gte]: today } };
    
    const todayStats: any = await Recharge.findOne({
      where: todayWhere,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
      ],
      raw: true
    });

    // 本月统计
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthWhere = { ...where, created_at: { [Op.gte]: monthStart } };
    
    const monthStats: any = await Recharge.findOne({
      where: monthWhere,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
      ],
      raw: true
    });

    // 按支付方式统计
    const balanceStats: any = await Recharge.findOne({
      where: { ...where, method: 'balance' },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
      ],
      raw: true
    });

    const qrcodeStats: any = await Recharge.findOne({
      where: { ...where, method: 'qrcode' },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
      ],
      raw: true
    });

    res.json({
      code: '00000',
      message: '获取充值统计成功',
      data: {
        todayAmount: parseFloat(todayStats?.amount as string) || 0,
        todayCount: parseInt(todayStats?.count as string) || 0,
        monthAmount: parseFloat(monthStats?.amount as string) || 0,
        monthCount: parseInt(monthStats?.count as string) || 0,
        balancePayAmount: parseFloat(balanceStats?.amount as string) || 0,
        balancePayCount: parseInt(balanceStats?.count as string) || 0,
        qrcodePayAmount: parseFloat(qrcodeStats?.amount as string) || 0,
        qrcodePayCount: parseInt(qrcodeStats?.count as string) || 0
      }
    });
  } catch (error) {
    console.error('获取充值统计错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

export default router;