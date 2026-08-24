import { Router, Request, Response } from 'express';
import { User, UserRole, UserStatus } from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取当前用户信息
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    res.json({
      code: '00000',
      msg: '获取用户信息成功',
      data: {
        userId: user.id,
        username: user.username,
        nickname: user.display_name,
        avatar: '', // 暂时为空，后续可以添加头像功能
        roles: [user.role], // 将角色转换为数组格式
        perms: [] // 暂时为空，后续可以根据角色添加权限
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 获取用户分页列表
router.get('/page', [
  query('pageNum').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('keywords').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('status').optional().isIn(['active', 'disabled']).withMessage('状态值无效'),
  query('createTime').optional().isString().withMessage('创建时间必须是字符串')
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
    const keywords = req.query.keywords as string;
    const status = req.query.status as UserStatus;
    const createTime = req.query.createTime as string;

    const offset = (pageNum - 1) * pageSize;
    const where: any = {};

    // 搜索条件
    if (keywords) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keywords}%` } },
        { display_name: { [Op.like]: `%${keywords}%` } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // 创建时间范围查询
    if (createTime) {
      try {
        const [startDate, endDate] = createTime.split('~');
        if (startDate && endDate) {
          where.created_at = {
            [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
          };
        }
      } catch (error) {
        console.error('日期解析错误:', error);
      }
    }

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'username', 'display_name', 'role', 'status', 'last_login_at', 'created_at', 'updated_at']
    });

    // 格式化用户数据以匹配前端期望
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      nickname: user.display_name,
      role: user.role,
      status: user.status,
      createTime: user.created_at,
      updateTime: user.updated_at
    }));

    res.json({
      code: '00000',
      msg: '获取用户列表成功',
      data: {
        list: formattedUsers,
        total,
        pageNum,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 获取用户表单数据
router.get('/:id/form', [
  param('id').isInt({ min: 1 }).withMessage('用户ID必须是正整数')
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

    const userId = parseInt(req.params.id);
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({
        code: 'B0001',
        message: '用户不存在',
        data: null
      });
      return;
    }

    res.json({
      code: '00000',
      msg: '获取用户表单数据成功',
      data: {
        id: user.id,
        username: user.username,
        nickname: user.display_name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('获取用户表单数据错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 创建用户
router.post('/', [
  body('username').isString().isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间'),
  body('nickname').isString().isLength({ min: 1, max: 50 }).withMessage('昵称长度必须在1-50个字符之间'),
  body('password').isString().isLength({ min: 6 }).withMessage('密码长度至少6个字符'),
  body('role').optional().isIn(Object.values(UserRole)).withMessage('角色值无效'),
  body('status').optional().isIn(Object.values(UserStatus)).withMessage('状态值无效')
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

    const { username, nickname, password, role = UserRole.USER, status = UserStatus.ACTIVE } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      res.status(400).json({
        code: 'B0001',
        message: '用户名已存在',
        data: null
      });
      return;
    }

    // 创建用户
    const user = new User();
    user.username = username;
    user.display_name = nickname;
    user.role = role;
    user.status = status;
    await user.setPassword(password);
    await user.save();

    res.json({
      code: '00000',
      msg: '创建用户成功',
      data: null
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 更新用户
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('用户ID必须是正整数'),
  body('nickname').isString().isLength({ min: 1, max: 50 }).withMessage('昵称长度必须在1-50个字符之间'),
  body('role').optional().isIn(Object.values(UserRole)).withMessage('角色值无效'),
  body('status').optional().isIn(Object.values(UserStatus)).withMessage('状态值无效')
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

    const userId = parseInt(req.params.id);
    const { nickname, role, status } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({
        code: 'B0001',
        message: '用户不存在',
        data: null
      });
      return;
    }

    // 更新用户信息
    user.display_name = nickname;
    if (role) user.role = role;
    if (status !== undefined) {
      user.status = status;
    }
    await user.save();

    res.json({
      code: '00000',
      msg: '更新用户成功',
      data: null
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 删除用户
router.delete('/:ids', [
  param('ids').isString().withMessage('用户ID必须是字符串')
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

    const ids = req.params.ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (ids.length === 0) {
      res.status(400).json({
        code: 'B0001',
        message: '无效的用户ID',
        data: null
      });
      return;
    }

    // 删除用户
    const deletedCount = await User.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    res.json({
      code: '00000',
      msg: `删除用户成功，共删除${deletedCount}个用户`,
      data: null
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

export default router;