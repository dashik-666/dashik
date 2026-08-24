-- 创建打手对账表
CREATE TABLE IF NOT EXISTS worker_settlements (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '对账ID',
  worker_id INT NOT NULL COMMENT '打手ID',
  settlement_type ENUM('daily', 'weekly', 'monthly') NOT NULL COMMENT '结算类型',
  start_date DATE NOT NULL COMMENT '结算开始日期',
  end_date DATE NOT NULL COMMENT '结算结束日期',
  order_count INT NOT NULL DEFAULT 0 COMMENT '订单数量',
  order_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单总金额',
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '小时数',
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '小时单价',
  expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '应得金额',
  actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '实发金额',
  difference_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '差额',
  difference_reason TEXT NULL COMMENT '差额说明',
  status ENUM('pending', 'confirmed', 'disputed') NOT NULL DEFAULT 'pending' COMMENT '核账状态',
  confirmed_by INT NULL COMMENT '核账操作人ID',
  confirmed_at DATETIME NULL COMMENT '核账时间',
  confirmation_note TEXT NULL COMMENT '核账备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  -- 索引
  INDEX idx_worker_id (worker_id),
  INDEX idx_settlement_type (settlement_type),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  -- 外键约束
  FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打手对账表';

-- 插入示例数据（可选）
-- INSERT INTO worker_settlements (worker_id, settlement_type, start_date, end_date, order_count, order_amount, total_hours, hourly_rate, expected_amount, actual_amount, difference_amount, status) VALUES
-- (1, 'daily', '2024-01-01', '2024-01-01', 5, 500.00, 10.00, 50.00, 500.00, 500.00, 0.00, 'confirmed'),
-- (2, 'weekly', '2024-01-01', '2024-01-07', 15, 1500.00, 30.00, 50.00, 1500.00, 1480.00, -20.00, 'pending');
