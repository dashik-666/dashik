import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { generateUserToken, authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

const router = Router();

// 登录接口
router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('用户名不能为空')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符')
], async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 'B0001',
        message: '输入验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      res.status(401).json({
        code: 'A0210',
        msg: '用户名或密码错误',
        data: null
      });
      return;
    }

    // 检查用户状态
    if (!user.isActive()) {
      res.status(401).json({
        code: 'A0202',
        msg: '用户已被禁用',
        data: null
      });
      return;
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      res.status(401).json({
        code: 'A0210',
        msg: '用户名或密码错误',
        data: null
      });
      return;
    }

    // 更新最后登录时间
    await user.updateLastLogin();

    // 生成token
    const tokens = generateUserToken(user);

    res.json({
      code: '00000',
      msg: '登录成功',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600 // 1小时
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    
    res.json({
      code: '00000',
      msg: '获取用户信息成功',
      data: {
        userId: user.id.toString(),
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
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 修改密码
router.post('/change-password', [
  authenticateToken,
  body('old_password')
    .notEmpty()
    .withMessage('原密码不能为空'),
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('新密码长度至少6个字符'),
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('确认密码与新密码不匹配');
      }
      return true;
    })
], async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 'B0001',
        message: '输入验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const { old_password, new_password } = req.body;
    const user = req.user!;

    // 验证原密码
    const isValidOldPassword = await user.validatePassword(old_password);
    if (!isValidOldPassword) {
      res.status(400).json({
        code: 'B0001',
        message: '原密码错误',
        data: null
      });
      return;
    }

    // 设置新密码
    await user.setPassword(new_password);
    await user.save();

    res.json({
      code: '00000',
      message: '密码修改成功',
      data: null
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 登出接口（客户端删除 token）
router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // 这里可以实现 token 黑名单机制
    // 目前简单返回成功，客户端负责删除 token
    
    res.json({
      code: '00000',
      message: '登出成功',
      data: null
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      code: 'B0001',
      message: '服务器内部错误',
      data: null
    });
  }
});

// 刷新 token
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌不能为空')
], async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        code: 'B0001',
        message: '输入验证失败',
        data: null,
        errors: errors.array()
      });
      return;
    }

    const { refreshToken } = req.body;
    console.log('收到刷新token请求，refreshToken:', refreshToken);
    
    // 验证 refresh token
    const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';
    console.log('使用REFRESH_SECRET:', REFRESH_SECRET);
    
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
    
    // 查找用户
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      res.status(401).json({
        code: 'A0210',
        message: '用户不存在',
        data: null
      });
      return;
    }
    
    // 生成新的 token
    const tokens = generateUserToken(user);
    
    res.json({
      code: '00000',
      message: 'Token 刷新成功',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 3600
      }
    });
  } catch (error) {
    console.error('刷新 token 错误:', error);
    res.status(401).json({
      code: 'A0210',
      message: '刷新令牌无效',
      data: null
    });
  }
});

export default router;