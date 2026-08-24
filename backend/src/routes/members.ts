import { Router, Request, Response } from 'express';
import { Member, MemberStatus, Recharge, Order } from '../models';
import { authenticateToken } from '../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取会员列表
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('keyword').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('status').optional().isIn(Object.values(MemberStatus)).withMessage('状态值无效')
], async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 === 获取会员列表请求 ===');
    console.log('📍 请求路径:', req.path);
    console.log('📝 请求方法:', req.method);
    console.log('🔍 查询参数:', req.query);
    console.log('📋 请求头:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : '无',
      'user-agent': req.headers['user-agent']
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ 参数验证失败:', errors.array());
      console.log('❌ 验证错误详情:', errors.array().map(err => `${(err as any).param}: ${err.msg}`));
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }
    console.log('✅ 参数验证通过');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const keyword = req.query.keyword as string;
    const status = req.query.status as MemberStatus;

    console.log('🔍 解析后的参数:', { page, limit, keyword: keyword || '无', status: status || '无' });

    const offset = (page - 1) * limit;
    const where: any = {};

    // 搜索条件
    if (keyword && keyword.trim()) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword.trim()}%` } },
        { nickname: { [Op.like]: `%${keyword.trim()}%` } },
        { phone: { [Op.like]: `%${keyword.trim()}%` } }
      ];
    }

    if (status) {
      where.status = status;
    }

    console.log('🔍 数据库查询条件:', where);
    console.log('📊 分页参数:', { offset, limit, page });

    const { rows: members, count: total } = await Member.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      attributes: {
        exclude: []
      }
    });

    console.log('✅ 查询结果:', { 
      total, 
      membersCount: members.length,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });

    console.log('📤 发送成功响应');
    res.json({
      code: "00000",
      message: '获取会员列表成功',
      data: {
        list: members,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    console.log('🎉 获取会员列表请求处理完成');
  } catch (error) {
    console.error('💥 获取会员列表错误:', error);
    console.error('💥 错误类型:', (error as any).constructor?.name || 'Unknown');
    console.error('💥 错误消息:', (error as any).message || 'Unknown error');
    console.error('💥 错误堆栈:', (error as any).stack || 'No stack trace');
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取会员详情
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('会员ID必须是正整数')
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

    const memberId = parseInt(req.params.id);

    const member = await Member.findByPk(memberId, {
      include: [
        {
          model: Recharge,
          as: 'recharges',
          limit: 10,
          order: [['created_at', 'DESC']]
        },
        {
          model: Order,
          as: 'orders',
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!member) {
      res.status(404).json({
        code: 'B0001',
        message: '会员不存在',
        data: null
      });
      return;
    }

    res.json({
      code: '00000',
      message: '获取会员详情成功',
      data: member
    });
  } catch (error) {
    console.error('获取会员详情错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 创建会员
router.post('/', [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ max: 50 })
    .withMessage('用户名长度不能超过50个字符'),
  body('nickname')
    .notEmpty()
    .withMessage('昵称不能为空')
    .isLength({ max: 50 })
    .withMessage('昵称长度不能超过50个字符'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('手机号格式不正确'),
  body('balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('余额必须是非负数'),
  body('status')
    .optional()
    .isIn(Object.values(MemberStatus))
    .withMessage('状态值无效')
], async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🆕 === 创建会员请求开始 ===');
    console.log('📍 请求路径:', req.path);
    console.log('📝 请求方法:', req.method);
    console.log('📋 请求头:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : '无',
      'user-agent': req.headers['user-agent']
    });
    console.log('📦 原始请求体:', JSON.stringify(req.body, null, 2));
    console.log('📊 请求体类型:', typeof req.body);
    console.log('📊 请求体是否为空对象:', Object.keys(req.body).length === 0);
    console.log('🔍 请求参数:', req.params);
    console.log('🔍 请求查询参数:', req.query);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ 参数验证失败:', errors.array());
      console.log('❌ 验证错误详情:', errors.array().map(err => `${(err as any).param}: ${err.msg}`));
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }
    console.log('✅ 参数验证通过');

    const { username, nickname, phone, balance = 0, status = MemberStatus.ACTIVE } = req.body;
    
    console.log('🔍 解构后的字段:');
    console.log('- username:', username, typeof username);
    console.log('- nickname:', nickname, typeof nickname);
    console.log('- phone:', phone, typeof phone);
    console.log('- balance:', balance, typeof balance);
    console.log('- status:', status, typeof status);

    // 检查用户名是否已存在
    console.log('🔍 检查用户名是否已存在:', username);
    const existingUsername = await Member.findOne({ where: { username } });
    if (existingUsername) {
      console.log('❌ 用户名已存在，ID:', existingUsername.id);
      res.status(400).json({
        code: 'B0001',
        message: `用户名 ${username} 已存在`,
        data: null
      });
      return;
    }
    console.log('✅ 用户名检查通过');

    // 检查昵称是否已存在
    console.log('🔍 检查昵称是否已存在:', nickname);
    const existingMember = await Member.findOne({ where: { nickname } });
    if (existingMember) {
      console.log('❌ 昵称已存在，ID:', existingMember.id);
      res.status(400).json({
        code: 'B0001',
        message: `昵称 ${nickname} 已存在`,
        data: null
      });
      return;
    }
    console.log('✅ 昵称检查通过');

    // 检查手机号是否已存在
    if (phone) {
      console.log('🔍 检查手机号是否已存在:', phone);
      const existingPhone = await Member.findOne({ where: { phone } });
      if (existingPhone) {
        console.log('❌ 手机号已存在，ID:', existingPhone.id);
        res.status(400).json({
          code: 'B0001',
          message: `手机号 ${phone} 已存在`,
          data: null
        });
        return;
      }
      console.log('✅ 手机号检查通过');
    } else {
      console.log('⏭️ 跳过手机号检查（未提供）');
    }

    console.log('🔄 开始创建会员...');
    console.log('📝 创建数据:', { username, nickname, phone, balance, status });
    
    const member = await Member.create({
      username,
      nickname,
      phone,
      balance,
      status
    });

    console.log('✅ 会员创建成功，ID:', member.id);
    console.log('📤 发送成功响应');
    
    res.status(201).json({
      code: '00000',
      message: '创建会员成功',
      data: member
    });
    console.log('🎉 创建会员请求处理完成');
  } catch (error) {
    console.error('💥 创建会员错误:', error);
    console.error('💥 错误类型:', (error as any).constructor?.name || 'Unknown');
    console.error('💥 错误消息:', (error as any).message || 'Unknown error');
    console.error('💥 错误堆栈:', (error as any).stack || 'No stack trace');
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 更新会员
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('会员ID必须是正整数'),
  body('username')
    .optional()
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ max: 50 })
    .withMessage('用户名长度不能超过50个字符'),
  body('nickname')
    .optional()
    .notEmpty()
    .withMessage('昵称不能为空')
    .isLength({ max: 50 })
    .withMessage('昵称长度不能超过50个字符'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('手机号格式不正确'),
  body('status')
    .optional()
    .isIn(Object.values(MemberStatus))
    .withMessage('状态值无效')
], async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔧 === 更新会员请求开始 ===');
    console.log('📍 请求路径:', req.path);
    console.log('📝 请求方法:', req.method);
    console.log('🔍 请求参数:', req.params);
    console.log('📦 请求体:', JSON.stringify(req.body, null, 2));
    console.log('📋 请求头:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : '无',
      'user-agent': req.headers['user-agent']
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ 参数验证失败:', errors.array());
      console.log('❌ 验证错误详情:', errors.array().map(err => `${(err as any).param}: ${err.msg}`));
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const memberId = parseInt(req.params.id);
    const { username, nickname, phone, status } = req.body;
    
    console.log('✅ 参数验证通过');
    console.log('🔍 解析后的参数:', { 
      memberId, 
      username: username || '未提供', 
      nickname: nickname || '未提供', 
      phone: phone || '未提供', 
      status: status || '未提供' 
    });

    console.log('🔍 开始查找会员，ID:', memberId);
    const member = await Member.findByPk(memberId);
    if (!member) {
      console.log('❌ 会员不存在，ID:', memberId);
      res.status(404).json({
        code: 'B0001',
        message: '会员不存在',
        data: null
      });
      return;
    }
    console.log('✅ 找到会员:', {
      id: member.id,
      username: member.username,
      nickname: member.nickname,
      phone: member.phone,
      status: member.status
    });

    // 检查用户名是否已被其他会员使用
    if (username && username !== member.username) {
      console.log('🔍 检查用户名重复:', { 
        newUsername: username, 
        currentUsername: member.username, 
        memberId 
      });
      const existingUsername = await Member.findOne({ 
        where: { 
          username,
          id: { [Op.ne]: memberId }
        } 
      });
      if (existingUsername) {
        console.log('❌ 用户名重复，已存在的会员:', existingUsername.id);
        res.status(400).json({
          code: 'B0001',
          message: `用户名 ${username} 已被其他会员使用`,
          data: null
        });
        return;
      }
      console.log('✅ 用户名检查通过');
    } else {
      console.log('⏭️ 跳过用户名检查（未提供或未变更）');
    }

    // 检查昵称是否已被其他会员使用
    if (nickname && nickname !== member.nickname) {
      console.log('🔍 检查昵称重复:', { 
        newNickname: nickname, 
        currentNickname: member.nickname, 
        memberId 
      });
      const existingMember = await Member.findOne({ 
        where: { 
          nickname,
          id: { [Op.ne]: memberId }
        } 
      });
      if (existingMember) {
        console.log('❌ 昵称重复，已存在的会员:', existingMember.id);
        res.status(400).json({
          code: 'B0001',
          message: `昵称 ${nickname} 已被其他会员使用`,
          data: null
        });
        return;
      }
      console.log('✅ 昵称检查通过');
    } else {
      console.log('⏭️ 跳过昵称检查（未提供或未变更）');
    }

    // 检查手机号是否已被其他会员使用
    if (phone && phone !== member.phone) {
      console.log('🔍 检查手机号重复:', { 
        newPhone: phone, 
        currentPhone: member.phone, 
        memberId 
      });
      const existingPhone = await Member.findOne({ 
        where: { 
          phone,
          id: { [Op.ne]: memberId }
        } 
      });
      if (existingPhone) {
        console.log('❌ 手机号重复，已存在的会员:', existingPhone.id);
        res.status(400).json({
          code: 'B0001',
          message: `手机号 ${phone} 已被其他会员使用`,
          data: null
        });
        return;
      }
      console.log('✅ 手机号检查通过');
    } else {
      console.log('⏭️ 跳过手机号检查（未提供或未变更）');
    }

    // 更新会员信息
    console.log('🔄 开始更新会员信息...');
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (nickname !== undefined) updateData.nickname = nickname;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;

    console.log('📝 准备更新的数据:', updateData);
    console.log('📝 更新数据字段数量:', Object.keys(updateData).length);

    await member.update(updateData);
    console.log('✅ 会员信息更新成功');

    console.log('📤 发送成功响应');
    res.json({
      code: '00000',
      message: '更新会员成功',
      data: member
    });
    console.log('🎉 更新会员请求处理完成');
  } catch (error) {
    console.error('💥 更新会员错误:', error);
    console.error('💥 错误类型:', (error as any).constructor?.name || 'Unknown');
    console.error('💥 错误消息:', (error as any).message || 'Unknown error');
    console.error('💥 错误堆栈:', (error as any).stack || 'No stack trace');
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});



// 获取会员的充值记录
router.get('/:id/recharges', [
  param('id').isInt({ min: 1 }).withMessage('会员ID必须是正整数'),
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

    const memberId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // 检查会员是否存在
    const member = await Member.findByPk(memberId);
    if (!member) {
      res.status(404).json({
        code: 'B0001',
        message: '会员不存在',
        data: null
      });
      return;
    }

    const { rows: recharges, count: total } = await Recharge.findAndCountAll({
      where: { member_id: memberId },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      code: '00000',
      message: '获取充值记录成功',
      data: {
        list: recharges,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
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

// 获取会员的订单记录
router.get('/:id/orders', [
  param('id').isInt({ min: 1 }).withMessage('会员ID必须是正整数'),
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

    const memberId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // 检查会员是否存在
    const member = await Member.findByPk(memberId);
    if (!member) {
      res.status(404).json({
        code: 404,
        message: '会员不存在',
        data: null
      });
      return;
    }

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where: { member_id: memberId },
      include: [{
        model: Member,
        as: 'member',
        attributes: ['id', 'nickname']
      }],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      code: '00000',
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

// 切换会员状态（禁用/启用）
router.patch('/:id/toggle-status', [
  param('id').isInt({ min: 1 }).withMessage('会员ID必须是正整数'),
  body('status').isInt({ min: 0, max: 1 }).withMessage('状态值必须是0或1')
], async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔄 === 切换会员状态请求开始 ===');
    console.log('📍 请求路径:', req.path);
    console.log('📝 请求方法:', req.method);
    console.log('🔍 请求参数:', req.params);
    console.log('📦 请求体:', req.body);
    console.log('📋 请求头:', {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : '无',
      'user-agent': req.headers['user-agent']
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ 参数验证失败:', errors.array());
      res.status(400).json({
        code: 'B0001',
        message: '参数验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }
    console.log('✅ 参数验证通过');

    const memberId = parseInt(req.params.id);
    const status = parseInt(req.body.status);
    
    console.log('🔍 操作详情:');
    console.log('- 会员ID:', memberId);
    console.log('- 目标状态:', status, '(0=禁用, 1=启用)');

    // 检查会员是否存在
    const member = await Member.findByPk(memberId);
    if (!member) {
      console.log('❌ 会员不存在，ID:', memberId);
      res.status(404).json({
        code: 'B0001',
        message: '会员不存在',
        data: null
      });
      return;
    }
    console.log('✅ 找到会员:', { id: member.id, username: member.username, nickname: member.nickname, currentStatus: member.status });

    // 转换状态值
    const newStatus = status === 1 ? MemberStatus.ACTIVE : MemberStatus.DISABLED;
    console.log('🔄 状态转换:', { oldStatus: member.status, newStatus, statusCode: status });
    
    // 更新会员状态
    console.log('📝 开始更新会员状态...');
    await member.update({ status: newStatus });
    console.log('✅ 会员状态更新成功');

    console.log('📤 发送成功响应');
    res.json({
      code: '00000',
      message: status === 1 ? '会员已启用' : '会员已禁用',
      data: null
    });
    console.log('🎉 切换会员状态请求处理完成');
  } catch (error) {
    console.error('💥 切换会员状态错误:', error);
    console.error('错误类型:', (error as any).constructor?.name || 'Unknown');
    console.error('错误消息:', (error as any).message || 'Unknown error');
    console.error('错误堆栈:', (error as any).stack || 'No stack trace');
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

export default router;