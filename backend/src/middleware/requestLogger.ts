import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  const contentLength = req.headers['content-length'] || 0;
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || req.headers['referrer'] || '';

  // 记录请求开始（包含关键头信息）
  console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip} - len=${contentLength} UA=${userAgent}`);
  if (referer) {
    console.log(`↪ referer: ${referer}`);
  }

  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = getStatusColor(res.statusCode);
    const responseLength = res.get('Content-Length') || 0;

    const baseLog = `[${new Date().toISOString()}] ${req.method} ${req.url} - ${statusColor}${res.statusCode}\x1b[0m - ${duration}ms - out=${responseLength}`;
    if (duration >= 1000) {
      console.warn(`🐢 SLOW REQUEST ${baseLog}`);
    } else {
      console.log(baseLog);
    }
  });

  // 监听连接被中断等异常
  res.on('close', () => {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      console.warn(`[${new Date().toISOString()}] ${req.method} ${req.url} - connection closed before response - ${duration}ms`);
    }
  });

  next();
};

function getStatusColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) {
    return '\x1b[32m'; // 绿色
  } else if (statusCode >= 300 && statusCode < 400) {
    return '\x1b[33m'; // 黄色
  } else if (statusCode >= 400 && statusCode < 500) {
    return '\x1b[31m'; // 红色
  } else {
    return '\x1b[35m'; // 紫色
  }
}