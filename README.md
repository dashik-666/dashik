# 🎮 乐乐电竞 · 三角洲陪玩接单平台

> 一个面向《三角洲行动》游戏的陪玩接单平台：**玩家端下单前台** + **工作室管理后台**。
> 基于 [Guyungy/Kuangniao](https://github.com/Guyungy/Kuangniao)（MIT）二次开发，品牌改造为「乐乐电竞」。

| 技术栈 | 🔧 |
| --- | --- |
| 玩家端前台 | Vue 3 + Vite + TypeScript + Element Plus + Pinia + Vue Router |
| 管理后台 | Vue 3 + Vite + TypeScript + Element Plus + ECharts |
| 后端 API | Node.js + TypeScript + Express + sequelize-typescript |
| 数据库 | MySQL 8（utf8mb4） |
| 认证 | JWT（管理员 / 玩家双体系） |
| 部署 | Docker Compose；前端可发布为静态站点 |

---

## 📦 目录结构

```
lele-esports/
├── frontend/      # 管理后台（会员/订单/充值/打手/报表/佣金/评价）
├── storefront/    # 玩家端前台（陪玩广场/下单/订单/评价/个人中心）
├── backend/       # Express + TS 后端 API
│   ├── src/routes/storefront.ts   # 玩家店铺接口
│   └── src/models/Review.ts       # 评价模型
├── payboard.sql   # 数据库表结构
├── docker-compose.yml
└── docs/          # 说明文档
```

## ✨ 已实现功能

### 玩家端（storefront，`http://localhost:3002`）
- 手机号 + 密码**注册 / 登录**（JWT）
- **陪玩广场**：按类型筛选、关键词搜索、查看价格/级别/标签
- **陪玩详情**：评分星级、评价列表、立即下单
- **下单**：选择服务时长 → 模拟支付 → 生成订单
- **我的订单**：订单状态跟踪（待上钟/服务中/已完成/已取消）、取消、**订单评价**
- **个人中心**：余额、累计充值/消费、基本信息

### 管理后台（frontend，`http://localhost:3001`）
- 会员管理、充值管理、订单管理（上钟/下钟）、打手管理、打手对账
- 佣金规则、数据报表（今日概览/趋势/排行榜）、系统管理（用户/角色）
- 数据可视化（ECharts）

### 后端 API（`http://localhost:10000/api/v1`）
- 管理员认证 `/auth`、`/users`、`/roles`
- 业务 `/members`、`/orders`、`/recharges`、`/workers`、`/reports`、`/commission-rules`
- 玩家店铺 `/store`：注册/登录、陪玩列表/详情、下单、我的订单、评价

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- pnpm 8+

### 1. 初始化数据库
```bash
mysql -uroot -p -e "CREATE DATABASE payboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -uroot -p payboard < payboard.sql
```

### 2. 启动后端
```bash
cd backend
cp .env.example .env      # 修改 DB_HOST/DB_PASSWORD 等
pnpm install
pnpm run build
node dist/app.js          # http://localhost:10000
```
首次启动会自动建表并创建默认管理员：`admin / admin123`（可在 `.env` 或登录后修改）。

### 3. 启动管理后台
```bash
cd frontend
pnpm install
node node_modules/vite/bin/vite.js   # http://localhost:3001
```
登录：`admin` / `123456`

### 4. 启动玩家端前台
```bash
cd storefront
pnpm install
node node_modules/vite/bin/vite.js   # http://localhost:3002
```

> 提示：后台默认密码 `123456` 与登录表单一致；如原先用 `sync-database` 初始化则为 `admin123`。

---

## 🐳 Docker 一键部署

仓库自带 `docker-compose.yml`，一键启动 MySQL + 后端 + 前端 + phpMyAdmin：
```bash
docker compose up -d --build
```

---

## 🔐 账号说明
- **管理后台**：`admin` / `123456`（默认，生产环境请修改）
- **玩家注册**：前台自行注册

## 📄 License
[MIT](./LICENSE)

## 🙏 致谢
本项目基于 [Guyungy/Kuangniao](https://github.com/Guyungy/Kuangniao)（原上游为 Vue3 后台模板生态）二次开发改进，感谢上游开源。
