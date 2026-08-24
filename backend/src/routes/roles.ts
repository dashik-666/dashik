import { Router, Request, Response } from 'express';
import { Role, RoleStatus } from '../models/Role';
import { authenticateToken } from '../middleware/auth';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取角色分页列表
router.get('/page', [
  query('pageNum').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('keywords').optional().isString().withMessage('搜索关键词必须是字符串'),
  query('status').optional().isIn(['active', 'disabled']).withMessage('状态值无效')
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
    const status = req.query.status as RoleStatus;

    const offset = (pageNum - 1) * pageSize;
    const where: any = {};

    // 搜索条件
    if (keywords) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keywords}%` } },
        { code: { [Op.like]: `%${keywords}%` } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const { rows: roles, count: total } = await Role.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      code: '00000',
      msg: '获取角色列表成功',
      data: {
        list: roles,
        total,
        pageNum,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 获取角色表单数据
router.get('/:id/form', [
  param('id').isInt({ min: 1 }).withMessage('角色ID必须是正整数')
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

    const roleId = parseInt(req.params.id);
    const role = await Role.findByPk(roleId);

    if (!role) {
      res.status(404).json({
        code: 'B0001',
        message: '角色不存在',
        data: null
      });
      return;
    }

    res.json({
      code: '00000',
      msg: '获取角色表单数据成功',
      data: {
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description,
        status: role.status === RoleStatus.ACTIVE ? 1 : 0
      }
    });
  } catch (error) {
    console.error('获取角色表单数据错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 创建角色
router.post('/', [
  body('name').isString().isLength({ min: 1, max: 50 }).withMessage('角色名称长度必须在1-50个字符之间'),
  body('code').isString().isLength({ min: 1, max: 50 }).withMessage('角色编码长度必须在1-50个字符之间'),
  body('description').optional().isString().isLength({ max: 255 }).withMessage('角色描述长度不能超过255个字符'),
  body('status').optional().isIn([0, 1]).withMessage('状态值无效')
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

    const { name, code, description, status = 1 } = req.body;

    // 检查角色名称是否已存在
    const existingName = await Role.findOne({ where: { name } });
    if (existingName) {
      res.status(400).json({
        code: 'B0001',
        message: '角色名称已存在',
        data: null
      });
      return;
    }

    // 检查角色编码是否已存在
    const existingCode = await Role.findOne({ where: { code } });
    if (existingCode) {
      res.status(400).json({
        code: 'B0001',
        message: '角色编码已存在',
        data: null
      });
      return;
    }

    // 创建角色
    const role = await Role.create({
      name,
      code,
      description,
      status: status === 1 ? RoleStatus.ACTIVE : RoleStatus.DISABLED
    });

    res.json({
      code: '00000',
      msg: '创建角色成功',
      data: null
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 更新角色
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('角色ID必须是正整数'),
  body('name').isString().isLength({ min: 1, max: 50 }).withMessage('角色名称长度必须在1-50个字符之间'),
  body('code').isString().isLength({ min: 1, max: 50 }).withMessage('角色编码长度必须在1-50个字符之间'),
  body('description').optional().isString().isLength({ max: 255 }).withMessage('角色描述长度不能超过255个字符'),
  body('status').optional().isIn([0, 1]).withMessage('状态值无效')
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

    const roleId = parseInt(req.params.id);
    const { name, code, description, status } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      res.status(404).json({
        code: 'B0001',
        message: '角色不存在',
        data: null
      });
      return;
    }

    // 检查角色名称是否已被其他角色使用
    if (name !== role.name) {
      const existingName = await Role.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: roleId }
        } 
      });
      if (existingName) {
        res.status(400).json({
          code: 'B0001',
          message: '角色名称已存在',
          data: null
        });
        return;
      }
    }

    // 检查角色编码是否已被其他角色使用
    if (code !== role.code) {
      const existingCode = await Role.findOne({ 
        where: { 
          code,
          id: { [Op.ne]: roleId }
        } 
      });
      if (existingCode) {
        res.status(400).json({
          code: 'B0001',
          message: '角色编码已存在',
          data: null
        });
        return;
      }
    }

    // 更新角色信息
    role.name = name;
    role.code = code;
    if (description !== undefined) role.description = description;
    if (status !== undefined) {
      role.status = status === 1 ? RoleStatus.ACTIVE : RoleStatus.DISABLED;
    }
    await role.save();

    res.json({
      code: '00000',
      msg: '更新角色成功',
      data: null
    });
  } catch (error) {
    console.error('更新角色错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 删除角色
router.delete('/:ids', [
  param('ids').isString().withMessage('角色ID必须是字符串')
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
        message: '无效的角色ID',
        data: null
      });
      return;
    }

    // 删除角色
    const deletedCount = await Role.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    res.json({
      code: '00000',
      msg: `删除角色成功，共删除${deletedCount}个角色`,
      data: null
    });
  } catch (error) {
    console.error('删除角色错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

// 获取角色下拉数据源
router.get('/options', async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await Role.findAll({
      where: { status: RoleStatus.ACTIVE },
      attributes: ['id', 'name', 'code'],
      order: [['name', 'ASC']]
    });

    const options = roles.map(role => ({
      value: role.id,
      label: role.name
    }));

    res.json({
      code: '00000',
      msg: '获取角色选项成功',
      data: options
    });
  } catch (error) {
    console.error('获取角色选项错误:', error);
    res.status(500).json({
      code: '50000',
      msg: '服务器内部错误',
      data: null
    });
  }
});

export default router;
