-- 创建默认管理员用户
-- 密码: 123456 (使用 bcrypt 加密)

-- 先创建角色表（如果不存在）
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `code` varchar(50) NOT NULL COMMENT '角色编码',
  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `status` enum('active','disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 插入默认角色
INSERT IGNORE INTO `roles` (`name`, `code`, `description`, `status`) VALUES
('超级管理员', 'ROOT', '拥有所有权限的超级管理员', 'active'),
('管理员', 'ADMIN', '系统管理员', 'active'),
('普通用户', 'USER', '普通用户', 'active');

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `display_name` varchar(100) DEFAULT NULL COMMENT '显示名称',
  `role` varchar(50) NOT NULL DEFAULT 'USER' COMMENT '角色',
  `status` enum('active','disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
  `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 插入默认管理员用户
-- 密码: 123456 (使用 bcrypt 加密)
-- 注意：这个哈希值对应密码 "123456"
INSERT IGNORE INTO `users` (`username`, `password`, `display_name`, `role`, `status`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '系统管理员', 'ROOT', 'active');

-- 创建用户角色关联表（如果不存在）
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `role_id` int(11) NOT NULL COMMENT '角色ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 关联默认用户和角色
INSERT IGNORE INTO `user_roles` (`user_id`, `role_id`) 
SELECT u.id, r.id 
FROM `users` u, `roles` r 
WHERE u.username = 'admin' AND r.code = 'ROOT';

-- 显示创建结果
SELECT '用户表创建完成' as message;
SELECT COUNT(*) as user_count FROM `users`;
SELECT COUNT(*) as role_count FROM `roles`;
SELECT COUNT(*) as user_role_count FROM `user_roles`;
