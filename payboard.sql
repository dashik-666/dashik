/*
 Navicat MySQL Dump SQL

 Source Server         : 192.168.3.38
 Source Server Type    : MySQL
 Source Server Version : 80043 (8.0.43)
 Source Host           : 192.168.3.38:3306
 Source Schema         : payboard

 Target Server Type    : MySQL
 Target Server Version : 80043 (8.0.43)
 File Encoding         : 65001

 Date: 25/08/2025 14:50:04
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for members
-- ----------------------------
DROP TABLE IF EXISTS `members`;
CREATE TABLE `members`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会员昵称',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `balance` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '当前余额',
  `total_recharge` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '累计充值金额',
  `total_consume` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '累计消费金额',
  `status` enum('active','disabled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_2`(`username` ASC) USING BTREE,
  INDEX `idx_username`(`username` ASC) USING BTREE,
  INDEX `idx_nickname`(`nickname` ASC) USING BTREE,
  INDEX `idx_phone`(`phone` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '会员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of members
-- ----------------------------
INSERT INTO `members` VALUES (2, 'lisi', '李四', '13800138002', 45.00, 500.00, 455.00, 'active', '2025-08-23 04:59:48', '2025-08-23 20:18:35');
INSERT INTO `members` VALUES (3, 'wangwu', '王五', '13800138003', 0.00, 0.00, 0.00, 'active', '2025-08-23 04:59:48', '2025-08-23 15:45:14');
INSERT INTO `members` VALUES (4, '黎政', 'Liszt', '13823232323', 10.01, 10.01, 0.00, 'active', '2025-08-23 15:45:50', '2025-08-23 16:57:18');

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL COMMENT '会员ID',
  `worker_id` int NOT NULL COMMENT '打手ID',
  `duration` decimal(5, 2) NOT NULL COMMENT '服务时长(小时)',
  `price_origin` decimal(10, 2) NOT NULL COMMENT '原价',
  `discount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '优惠金额',
  `price_final` decimal(10, 2) NOT NULL COMMENT '实付金额',
  `pay_method` enum('balance','scan','mixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付方式',
  `pay_balance` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '余额支付金额',
  `pay_scan` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '扫码支付金额',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `start_time` datetime NULL DEFAULT NULL COMMENT '上钟时间（开始服务时间）',
  `end_time` datetime NULL DEFAULT NULL COMMENT '下钟时间（结束服务时间）',
  `status` enum('pending','in_service','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_member_id`(`member_id` ASC) USING BTREE,
  INDEX `idx_worker_id`(`worker_id` ASC) USING BTREE,
  INDEX `idx_pay_method`(`pay_method` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_orders_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_orders_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (2, 3, 2, 1.00, 45.00, 0.00, 45.00, 'scan', 0.00, 45.00, '1212', '2025-08-23 13:14:57', '2025-08-23 13:14:57', NULL, NULL, 'pending');
INSERT INTO `orders` VALUES (4, 2, 3, 1.00, 55.00, 0.00, 55.00, 'balance', 55.00, 0.00, '', '2025-08-23 13:17:10', '2025-08-23 16:51:16', '2025-08-23 16:51:16', '2025-08-23 17:51:16', 'in_service');
INSERT INTO `orders` VALUES (5, 2, 3, 1.00, 55.00, 0.00, 55.00, 'balance', 55.00, 0.00, '', '2025-08-23 13:17:14', '2025-08-23 16:40:42', '2025-08-23 16:40:20', '2025-08-23 16:40:42', 'completed');
INSERT INTO `orders` VALUES (6, 2, 2, 1.00, 45.00, 0.00, 45.00, 'balance', 45.00, 0.00, '', '2025-08-23 13:19:44', '2025-08-23 13:19:44', NULL, NULL, 'pending');
INSERT INTO `orders` VALUES (7, 2, 1, 1.00, 50.00, 0.00, 50.00, 'scan', 0.00, 50.00, '12', '2025-08-23 13:22:48', '2025-08-23 16:55:29', '2025-08-23 16:46:28', '2025-08-23 16:55:28', 'completed');
INSERT INTO `orders` VALUES (8, 4, 2, 1.00, 45.00, 0.00, 45.00, 'scan', 0.00, 45.00, '测试订单', '2025-08-23 16:24:23', '2025-08-23 16:43:15', '2025-08-23 16:35:16', '2025-08-23 17:35:16', 'completed');

-- ----------------------------
-- Table structure for recharges
-- ----------------------------
DROP TABLE IF EXISTS `recharges`;
CREATE TABLE `recharges`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `member_id` int NOT NULL COMMENT '会员ID',
  `amount` decimal(10, 2) NOT NULL COMMENT '充值金额',
  `method` enum('balance','scan') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '充值方式',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `recharge_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '充值编号',
  `operator_id` int NOT NULL COMMENT '操作人ID',
  `operator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作人姓名',
  `status` enum('active','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '状态：active-有效，cancelled-已取消',
  `cancelled_by` int NULL DEFAULT NULL COMMENT '取消操作人ID',
  `cancelled_by_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '取消操作人姓名',
  `cancelled_at` datetime NULL DEFAULT NULL COMMENT '取消时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `recharge_no`(`recharge_no` ASC) USING BTREE,
  INDEX `idx_member_id`(`member_id` ASC) USING BTREE,
  INDEX `idx_method`(`method` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_recharges_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '充值记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of recharges
-- ----------------------------
INSERT INTO `recharges` VALUES (1, 3, 33.00, 'scan', '', '2025-08-23 13:02:37', '2025-08-23 13:13:00', 'RC1755925357907140', 1, 'admin', 'cancelled', 1, 'admin', '2025-08-23 13:13:00');
INSERT INTO `recharges` VALUES (2, 3, 2.00, 'scan', '111', '2025-08-23 13:12:53', '2025-08-23 15:45:12', 'RC1755925973524146', 1, 'admin', 'cancelled', 1, 'admin', '2025-08-23 15:45:12');
INSERT INTO `recharges` VALUES (3, 3, 32.00, 'scan', '', '2025-08-23 13:48:04', '2025-08-23 15:45:14', 'RC1755928084650899', 1, 'admin', 'cancelled', 1, 'admin', '2025-08-23 15:45:14');
INSERT INTO `recharges` VALUES (4, 4, 10.00, 'scan', '啊飒飒的阿萨大时代阿斯顿阿斯顿阿德阿萨阿斯顿阿斯顿阿萨', '2025-08-23 15:46:17', '2025-08-23 16:43:49', 'RC1755935177287536', 1, 'admin', 'active', NULL, NULL, NULL);
INSERT INTO `recharges` VALUES (5, 4, 0.01, 'scan', '2323', '2025-08-23 16:51:54', '2025-08-23 16:51:54', 'RC1755939114896078', 1, 'admin', 'active', NULL, NULL, NULL);

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码',
  `display_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '显示名称',
  `role` enum('admin','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user' COMMENT '角色',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '状态',
  `last_login_at` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  INDEX `idx_username`(`username` ASC) USING BTREE,
  INDEX `idx_role`(`role` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'admin', '$2a$10$8x3pmm7oIU24a9F0s/GfzOcYM1IgI0PrUQTL/nrbtLm0q7a2p9nBy', '系统管理员', 'admin', 'active', '2025-08-23 20:18:12', '2025-08-23 04:59:48', '2025-08-23 20:18:12');

-- ----------------------------
-- Table structure for workers
-- ----------------------------
DROP TABLE IF EXISTS `workers`;
CREATE TABLE `workers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '打手昵称',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '真实姓名',
  `id_number` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '身份证号',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系电话',
  `wechat_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信号',
  `bank_account` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '银行卡号',
  `bank_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '开户行名称',
  `price_hour` decimal(10, 2) NOT NULL COMMENT '每小时单价',
  `type` enum('跑刀','陪玩','陪练','其他') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '可用',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `account_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '开户姓名',
  `skills` json NULL COMMENT 'JSON数组，可以存储多个技能标签',
  `level` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'A' COMMENT '打手级别：A、S、SSR、魔王',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_name`(`name` ASC) USING BTREE,
  INDEX `idx_phone`(`phone` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '打手表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of workers
-- ----------------------------
INSERT INTO `workers` VALUES (1, 'Masons', '李美美', '110101199001011234', '13900139001', 'xiaoming_wx', '', '中国工商银行', 50.00, '跑刀', '可用', NULL, '2025-08-23 04:59:48', '2025-08-23 16:55:28', 'as d', '[\"跑刀\", \"女陪\"]', 'SSR');
INSERT INTO `workers` VALUES (2, 'Liszt', '黎政', '110101199002022345', '13900139002', 'xiaohong_wx', '', '中国工商银行', 45.00, '跑刀', '忙碌', NULL, '2025-08-23 04:59:48', '2025-08-23 16:35:16', '22', '[\"娱乐\", \"护航\", \"跑刀\"]', '魔王');
INSERT INTO `workers` VALUES (3, '小刚', '王小刚', '110101199003033456', '13900139003', 'xiaogang_wx', NULL, NULL, 55.00, '陪练', '忙碌', NULL, '2025-08-23 04:59:48', '2025-08-23 16:51:16', NULL, NULL, 'A');

-- ----------------------------
-- Table structure for workers_backup
-- ----------------------------
DROP TABLE IF EXISTS `workers_backup`;
CREATE TABLE `workers_backup`  (
  `id` int NOT NULL DEFAULT 0,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '打手昵称',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '真实姓名',
  `id_number` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '身份证号',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系电话',
  `wechat_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信号',
  `bank_account` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '银行卡号',
  `bank_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '开户行名称',
  `price_hour` decimal(10, 2) NOT NULL COMMENT '每小时单价',
  `type` enum('跑刀','陪玩','陪练','其他') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型',
  `status` enum('待审核','在职','禁用') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '待审核' COMMENT '状态',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `account_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '开户姓名'
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of workers_backup
-- ----------------------------
INSERT INTO `workers_backup` VALUES (1, '小明', '张小明', '110101199001011234', '13900139001', 'xiaoming_wx', NULL, NULL, 50.00, '跑刀', '禁用', NULL, '2025-08-23 04:59:48', '2025-08-23 15:52:27', NULL);
INSERT INTO `workers_backup` VALUES (2, '小红', '李小红', '110101199002022345', '13900139002', 'xiaohong_wx', '110101199002022345', '中国工商银行', 45.00, '跑刀', '禁用', NULL, '2025-08-23 04:59:48', '2025-08-23 13:43:05', '22');
INSERT INTO `workers_backup` VALUES (3, '小刚', '王小刚', '110101199003033456', '13900139003', 'xiaogang_wx', NULL, NULL, 55.00, '陪练', '禁用', NULL, '2025-08-23 04:59:48', '2025-08-23 15:52:33', NULL);

-- ----------------------------
-- Table structure for commission_rules
-- ----------------------------
DROP TABLE IF EXISTS `commission_rules`;
CREATE TABLE `commission_rules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则名称',
  `type` enum('global','level','custom') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则类型：global-全局，level-级别，custom-自定义',
  `worker_level` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '打手级别（仅level类型使用）',
  `worker_id` int NULL DEFAULT NULL COMMENT '打手ID（仅custom类型使用）',
  `commission_rate` decimal(5, 4) NOT NULL COMMENT '分成比例（0.0000-1.0000）',
  `min_amount` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '最小金额限制',
  `max_amount` decimal(10, 2) NULL DEFAULT NULL COMMENT '最大金额限制',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT '状态',
  `priority` int NOT NULL DEFAULT 0 COMMENT '优先级（数字越大优先级越高）',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_worker_level`(`worker_level` ASC) USING BTREE,
  INDEX `idx_worker_id`(`worker_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_priority`(`priority` ASC) USING BTREE,
  CONSTRAINT `fk_commission_rules_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '分成规则表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of commission_rules
-- ----------------------------
INSERT INTO `commission_rules` VALUES (1, '全局默认分成', 'global', NULL, NULL, 0.7000, 0.00, NULL, 'active', 0, '系统默认分成比例', '2025-08-25 15:00:00', '2025-08-25 15:00:00');
INSERT INTO `commission_rules` VALUES (2, 'SSR级别分成', 'level', 'SSR', NULL, 0.7500, 0.00, NULL, 'active', 10, 'SSR级别打手分成比例', '2025-08-25 15:00:00', '2025-08-25 15:00:00');
INSERT INTO `commission_rules` VALUES (3, '魔王级别分成', 'level', '魔王', NULL, 0.8000, 0.00, NULL, 'active', 20, '魔王级别打手分成比例', '2025-08-25 15:00:00', '2025-08-25 15:00:00');

SET FOREIGN_KEY_CHECKS = 1;
