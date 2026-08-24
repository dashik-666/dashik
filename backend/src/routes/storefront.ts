import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Member, MemberStatus } from '../models/Member';
import { Worker } from '../models/Worker';
import { Order, PayMethod, OrderStatus } from '../models/Order';
import { Review } from '../models/Review';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MEMBER_TOKEN_EXPIRES = '7d';

/* ---------- 玩家会员鉴权中间件 ---------- */
declare global {
  namespace Express {
    interface Request {
      member?: Member;
    }
  }
}

async function authenticateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ code: 'A0230', msg: '请先登录', data: null });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.memberId || decoded.type !== 'member') {
      res.status(401).json({ code: 'A0230', msg: '登录已失效，请重新登录', data: null });
      return;
    }
    const member = await Member.findByPk(decoded.memberId);
    if (!member || member.status !== MemberStatus.ACTIVE) {
      res.status(401).json({ code: 'A0202', msg: '账号不存在或已被禁用', data: null });
      return;
    }
    req.member = member;
    next();
  } catch (error) {
    res.status(401).json({ code: 'A0230', msg: '登录已失效，请重新登录', data: null });
  }
}

function signMemberToken(member: Member): { accessToken: string; tokenType: string; expiresIn: number } {
  const accessToken = jwt.sign({ memberId: member.id, type: 'member' }, JWT_SECRET, {
    expiresIn: MEMBER_TOKEN_EXPIRES,
  });
  return { accessToken, tokenType: 'Bearer', expiresIn: 7 * 24 * 3600 };
}

/* ---------- 注册 ---------- */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, nickname, game_id } = req.body;
    if (!phone || !password) {
      res.status(400).json({ code: 'B0001', msg: '手机号和密码不能为空', data: null });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ code: 'B0001', msg: '密码长度至少6位', data: null });
      return;
    }
    const exists = await Member.findOne({ where: { username: String(phone) } });
    if (exists) {
      res.status(400).json({ code: 'B0001', msg: '该手机号已注册，请直接登录', data: null });
      return;
    }
    const hash = await bcrypt.hash(String(password), 10);
    const member = await Member.create({
      username: String(phone),
      phone: String(phone),
      nickname: nickname || `玩家${String(phone).slice(-4)}`,
      game_id: game_id || null,
      password: hash,
      balance: 0,
      total_recharge: 0,
      total_consume: 0,
      status: MemberStatus.ACTIVE,
    });
    const tokens = signMemberToken(member);
    res.json({ code: '00000', msg: '注册成功', data: { memberId: member.id, ...tokens, member: memberData(member) } });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

/* ---------- 登录 ---------- */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      res.status(400).json({ code: 'B0001', msg: '手机号和密码不能为空', data: null });
      return;
    }
    const member = await Member.findOne({ where: { username: String(phone) } });
    if (!member || !member.password) {
      res.status(401).json({ code: 'A0210', msg: '手机号或密码错误', data: null });
      return;
    }
    const ok = await bcrypt.compare(String(password), member.password);
    if (!ok) {
      res.status(401).json({ code: 'A0210', msg: '手机号或密码错误', data: null });
      return;
    }
    if (member.status !== MemberStatus.ACTIVE) {
      res.status(401).json({ code: 'A0202', msg: '账号已被禁用', data: null });
      return;
    }
    const tokens = signMemberToken(member);
    res.json({ code: '00000', msg: '登录成功', data: { memberId: member.id, ...tokens, member: memberData(member) } });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

/* ---------- 当前玩家信息 ---------- */
router.get('/me', authenticateMember, async (req: Request, res: Response): Promise<void> => {
  res.json({ code: '00000', msg: '获取成功', data: memberData(req.member!) });
});

function memberData(m: Member) {
  return {
    id: m.id,
    username: m.username,
    nickname: m.nickname,
    phone: m.phone,
    game_id: m.game_id,
    avatar: m.avatar || '',
    balance: Number(m.balance),
    total_recharge: Number(m.total_recharge),
    total_consume: Number(m.total_consume),
    status: m.status,
    createdAt: m.created_at,
  };
}

/* ---------- 陪玩分类（静态） ---------- */
router.get('/types', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    code: '00000',
    msg: '成功',
    data: ['陪玩', '跑刀', '陪练', '其他'],
  });
});

/* ---------- 陪玩师列表（公开） ---------- */
router.get('/workers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, keyword } = req.query;
    const where: any = { status: { [require('sequelize').Op.ne]: '离职' }, is_cancelled: false };
    if (type && typeof type === 'string' && type !== '全部') where.type = type;
    if (keyword && typeof keyword === 'string') {
      where[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${keyword}%` } },
        { level: { [require('sequelize').Op.like]: `%${keyword}%` } },
      ];
    }
    const workers = await Worker.findAll({ where, order: [['price_hour', 'ASC']] });
    const data = await Promise.all(workers.map(async (w) => attachRating(workerData(w), w.id)));
    res.json({ code: '00000', msg: '成功', data });
  } catch (error) {
    console.error('陪玩列表错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

/* ---------- 陪玩师详情（公开） ---------- */
router.get('/workers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) {
      res.status(404).json({ code: 'B0001', msg: '陪玩师不存在', data: null });
      return;
    }
    const data = await attachRating(workerData(worker), worker.id);
    res.json({ code: '00000', msg: '成功', data });
  } catch (error) {
    console.error('陪玩详情错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

function workerData(w: Worker) {
  const base = Number(w.price_hour);
  const packages = [
    { key: 'p1', name: '体验局', hours: 1, price: Number((base * 1).toFixed(2)), note: '单小时体验' },
    { key: 'p2', name: '标准局', hours: 3, price: Number((base * 3 * 0.95).toFixed(2)), note: '95折 · 3小时' },
    { key: 'p3', name: '畅玩局', hours: 5, price: Number((base * 5 * 0.9).toFixed(2)), note: '9折 · 5小时' },
  ];
  return {
    id: w.id,
    name: w.name,
    type: w.type,
    level: w.level,
    price_hour: base,
    status: w.status,
    skills: w.skills || [],
    remark: w.remark || '',
    real_name: w.real_name,
    phone: w.phone,
    wechat_id: w.wechat_id || '',
    packages,
  };
}

async function attachRating(data: any, workerId: number) {
  const agg = await Review.findOne({
    attributes: [
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avg'],
    ],
    where: { worker_id: workerId },
    raw: true,
  }) as any;
  data.reviewCount = Number(agg?.count || 0);
  data.avgRating = agg?.avg ? Number(Number(agg.avg).toFixed(1)) : 0;
  return data;
}

/* ---------- 陪玩师评价列表（公开） ---------- */
router.get('/workers/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await Review.findAll({
      where: { worker_id: req.params.id },
      include: [{ model: Member, as: 'member', attributes: ['id', 'nickname', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json({
      code: '00000',
      msg: '成功',
      data: reviews.map((r: any) => ({
        id: r.id,
        orderId: r.order_id,
        rating: r.rating,
        content: r.content || '',
        nickname: r.member?.nickname || '匿名玩家',
        avatar: r.member?.avatar || '',
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('评价列表错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

/* ---------- 评价订单（完成后可评，需登录） ---------- */
router.post('/orders/:id/review', authenticateMember, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, content } = req.body;
    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      res.status(400).json({ code: 'B0001', msg: '评分需在1-5之间', data: null });
      return;
    }
    const order = await Order.findOne({ where: { id: req.params.id, member_id: req.member!.id } });
    if (!order) {
      res.status(404).json({ code: 'B0001', msg: '订单不存在', data: null });
      return;
    }
    if (!order.isEnded()) {
      res.status(400).json({ code: 'B0001', msg: '订单完成后才能评价', data: null });
      return;
    }
    const exists = await Review.findOne({ where: { order_id: order.id } });
    if (exists) {
      res.status(400).json({ code: 'B0001', msg: '该订单已评价', data: null });
      return;
    }
    const review = await Review.create({
      order_id: order.id,
      member_id: req.member!.id,
      worker_id: order.worker_id,
      rating: r,
      content: content || null,
    } as any);
    res.json({ code: '00000', msg: '评价成功', data: { reviewId: review.id } });
  } catch (error) {
    console.error('评价错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

/* ---------- 下单（模拟支付，需登录） ---------- */
router.post('/orders', authenticateMember, async (req: Request, res: Response): Promise<void> => {
  try {
    const { worker_id, duration, remark, game_id, package_name, package_key } = req.body;
    if (!worker_id || !duration || Number(duration) <= 0) {
      res.status(400).json({ code: 'B0001', msg: '请选择陪玩师和服务套餐', data: null });
      return;
    }
    const worker = await Worker.findByPk(worker_id);
    if (!worker) {
      res.status(404).json({ code: 'B0001', msg: '陪玩师不存在', data: null });
      return;
    }
    const dur = Number(duration);
    const priceOrigin = Number((dur * Number(worker.price_hour)).toFixed(2));
    // 套餐折扣（服务端权威，防止前端篡改）
    const discountMap: Record<string, number> = { p1: 1, p2: 0.95, p3: 0.9 };
    const ratio = discountMap[String(package_key)] ?? 1;
    const priceFinal = Number((priceOrigin * ratio).toFixed(2));
    const discount = Number((priceOrigin - priceFinal).toFixed(2));
    const order = await Order.create({
      member_id: req.member!.id,
      worker_id: worker.id,
      duration: dur,
      price_origin: priceOrigin,
      discount,
      price_final: priceFinal,
      pay_method: PayMethod.SCAN,
      pay_balance: 0,
      pay_scan: priceFinal,
      remark: package_name ? `${package_name}${remark ? ' · ' + remark : ''}` : (remark || null),
      status: OrderStatus.PENDING,
    } as any);
    // 模拟支付：此处直接视为已支付（待上钟状态）
    res.json({ code: '00000', msg: '下单成功（已模拟支付）', data: { orderId: order.id, status: order.status } });
  } catch (error) {
    console.error('下单错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

/* ---------- 我的订单列表 ---------- */
router.get('/orders', authenticateMember, async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.findAll({
      where: { member_id: req.member!.id },
      include: [
        { model: Worker, as: 'worker', attributes: ['id', 'name', 'type', 'level', 'price_hour'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({
      code: '00000',
      msg: '成功',
      data: orders.map((o) => orderData(o as any)),
    });
  } catch (error) {
    console.error('我的订单错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

/* ---------- 订单详情 ---------- */
router.get('/orders/:id', authenticateMember, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, member_id: req.member!.id },
      include: [{ model: Worker, as: 'worker', attributes: ['id', 'name', 'type', 'level', 'price_hour'] }],
    });
    if (!order) {
      res.status(404).json({ code: 'B0001', msg: '订单不存在', data: null });
      return;
    }
    res.json({ code: '00000', msg: '成功', data: orderData(order as any) });
  } catch (error) {
    console.error('订单详情错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

/* ---------- 取消订单（仅待上钟状态） ---------- */
router.post('/orders/:id/cancel', authenticateMember, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, member_id: req.member!.id } });
    if (!order) {
      res.status(404).json({ code: 'B0001', msg: '订单不存在', data: null });
      return;
    }
    if (!order.isPending()) {
      res.status(400).json({ code: 'B0001', msg: '当前状态不可取消', data: null });
      return;
    }
    order.status = OrderStatus.CANCELLED;
    await order.save();
    res.json({ code: '00000', msg: '订单已取消', data: null });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({ code: 'B0001', msg: '服务器内部错误', data: null });
  }
});

function orderData(o: any) {
  return {
    id: o.id,
    orderNo: o.getOrderNumber ? o.getOrderNumber() : `ORD${o.id}`,
    memberId: o.member_id,
    worker: o.worker
      ? { id: o.worker.id, name: o.worker.name, type: o.worker.type, level: o.worker.level }
      : null,
    duration: Number(o.duration),
    price_origin: Number(o.price_origin),
    discount: Number(o.discount || 0),
    price_final: Number(o.price_final),
    status: o.status,
    statusText: Order.getStatusText(o.status),
    pay_method: o.pay_method,
    remark: o.remark || '',
    start_time: o.start_time,
    end_time: o.end_time,
    created_at: o.created_at,
  };
}

export default router;
