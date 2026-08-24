import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserStatus } from '../models/User';

// 扩展 Request 接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// JWT认证中间件
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      res.status(401).json({
        code: 'A0230',
        msg: '访问令牌缺失',
        data: null
      });
      return;
    }

    // 验证JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 查找用户
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      res.status(401).json({
        code: 'A0230',
        msg: '用户不存在',
        data: null
      });
      return;
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      res.status(401).json({
        code: 'A0202',
        msg: '用户已被禁用',
        data: null
      });
      return;
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        code: 'A0230',
        msg: '访问令牌无效',
        data: null
      });
      return;
    }
    
    console.error('认证中间件错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
};

// 管理员权限检查中间件
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      code: 401,
      message: '用户未认证',
      data: null
    });
    return;
  }

  if (req.user.role !== 'ROOT' && req.user.role !== 'ADMIN') {
    res.status(403).json({
      code: 403,
      message: '需要管理员权限',
      data: null
    });
    return;
  }

  next();
};

// 生成JWT token
export const generateUserToken = (user: User): { accessToken: string; refreshToken: string } => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';
  
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// 验证用户标识
export const verifyUserToken = async (userId: string): Promise<User | null> => {
  try {
    const user = await User.findByPk(parseInt(userId));
    return user && user.status === UserStatus.ACTIVE ? user : null;
  } catch (error) {
    return null;
  }
};

// 可选的认证中间件（不强制要求认证）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (userId) {
      const user = await verifyUserToken(userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    next();
  }
};