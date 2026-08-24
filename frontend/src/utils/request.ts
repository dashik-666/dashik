import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosInstance } from "axios";
import qs from "qs";
import { ElMessage, ElNotification } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user-store";
import { ResultEnum } from "@/enums/api/result.enum";
import { AuthStorage } from "@/utils/auth";
import router from "@/router";

/**
 * 创建 HTTP 请求实例
 */
const viteEnv = (import.meta as any).env || {};
// 优先使用 Vite 代理前缀（如 /dev-api），否则回退到完整后端地址
const PROXY_BASE = viteEnv.VITE_APP_BASE_API; // 例如 '/dev-api'
const API_BASE_URL = PROXY_BASE || viteEnv.VITE_API_BASE_URL || 'http://localhost:10000/api/v1';

const httpRequest = axios.create({
  baseURL: API_BASE_URL, // 可通过 VITE_API_BASE_URL 配置
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

/**
 * 请求拦截器 - 添加 Authorization 头
 */
httpRequest.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 打点开始时间（仅用于调试）
    (config as any)._meta = { startTime: Date.now() };

    const accessToken = AuthStorage.getAccessToken();

    // 如果 Authorization 设置为 no-auth，则不携带 Token
    if (config.headers.Authorization !== "no-auth" && accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete config.headers.Authorization;
    }

    // 关闭调试日志

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器 - 统一处理响应和错误
 */
httpRequest.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>): any => {
    // 计算耗时
    const startTime: number | undefined = (response.config as any)?._meta?.startTime;
    const duration = typeof startTime === 'number' ? Date.now() - startTime : undefined;
    // 关闭调试日志
    
    // 如果响应是二进制流，则直接返回（用于文件下载、Excel 导出等）
    if (response.config.responseType === "blob") {
      console.log('📁 二进制流响应，直接返回');
      return response;
    }

    // 处理304状态码 - 现在后端强制发送200，这里应该不会执行
    if (response.status === 304) {
      console.log('⚠️ 收到304响应，让axios正常处理响应');
      console.log('304响应详情:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      // 对于304响应，我们不应该返回空数组，而是让axios正常处理
      // 这样前端就能获取到缓存的数据
      const { code, data, msg, message } = response.data as any;
      
      if (code === ResultEnum.SUCCESS || code === 200 || code === "00000") {
        console.log('✅ 304响应中获取到缓存数据:', data);
        return data;
      }
      
      // 如果没有业务数据，返回空数组
      console.log('⚠️ 304响应中没有业务数据，返回空数组');
      return [];
    }

    const { code, data, msg, message } = response.data as any;

    // 请求成功 - 支持字符串和数字格式的响应码
    if (code === ResultEnum.SUCCESS || code === 200 || code === "00000") {
      console.log('✅ 请求成功，返回数据:', data);
      console.log('返回数据类型:', typeof data);
      console.log('是否为数组:', Array.isArray(data));
      if (Array.isArray(data)) {
        console.log('数组长度:', data.length);
        console.log('数组前3项:', data.slice(0, 3));
      }
      return data; // 返回实际数据，而不是整个响应对象
    }

    // 业务错误 - 直接显示后端返回的具体错误信息
    const errorMessage = msg || message || "系统出错";
    
    console.log('❌ 业务错误:', errorMessage);
    console.log('错误详情:', { code, msg, message, data });
    ElMessage.error(errorMessage);
    return Promise.reject(new Error(errorMessage));
  },
  (error) => {
    // 关闭调试日志
    // 计算耗时（若可用）
    const startTime: number | undefined = (error.config as any)?._meta?.startTime;
    const duration = typeof startTime === 'number' ? Date.now() - startTime : undefined;
    if (duration !== undefined) {
      console.error(`⏱️ 请求耗时(错误): ${duration}ms`);
    }
    console.error('错误堆栈:', error.stack);
    
    // 网络错误
    if (error.code === 'ECONNABORTED') {
      const msg = `请求超时${duration !== undefined ? `（${duration}ms）` : ''}，请检查网络连接`;
      ElMessage.error(msg);
      return Promise.reject(error);
    }
    
    // 网络连接错误
    if (error.code === 'ERR_NETWORK') {
      const isCors = error.message?.toLowerCase().includes('network error');
      const hint = isCors ? '（可能是后端未启动或 CORS/端口不通）' : '';
      ElMessage.error(`网络连接失败${hint}`);
      return Promise.reject(error);
    }
    
    // HTTP状态码错误
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          ElMessage.error(data?.message || data?.msg || '请求参数错误');
          break;
        case 401:
          ElMessage.error(data?.message || data?.msg || '请先登录');
          // 可以在这里处理登录跳转
          break;
        case 403:
          ElMessage.error(data?.message || data?.msg || '没有权限访问此资源');
          break;
        case 404:
          ElMessage.error(data?.message || data?.msg || '请求的资源不存在');
          break;
        case 500:
          ElMessage.error(data?.message || data?.msg || '服务器内部错误，请稍后重试');
          break;
        default:
          ElMessage.error(data?.message || data?.msg || `请求失败 (${status})`);
      }
    } else {
      // 其他错误
      const isCors = error.message?.toLowerCase().includes('network error');
      ElMessage.error(isCors ? '请求失败：可能的 CORS 或网络阻断' : '请求失败，请稍后重试');
    }
    
    return Promise.reject(error);
  }
);

/**
 * 重试请求的回调函数类型
 */
type RetryCallback = () => void;

// Token 刷新相关状态
let isRefreshingToken = false;
const pendingRequests: RetryCallback[] = [];

/**
 * 刷新 Token 并重试请求
 */
async function refreshTokenAndRetry(config: InternalAxiosRequestConfig): Promise<any> {
  return new Promise((resolve, reject) => {
    // 封装需要重试的请求
    const retryRequest = () => {
      const newToken = AuthStorage.getAccessToken();
      if (newToken && config.headers) {
        config.headers.Authorization = `Bearer ${newToken}`;
      }
      httpRequest(config).then(resolve).catch(reject);
    };

    // 将请求加入等待队列
    pendingRequests.push(retryRequest);

    // 如果没有正在刷新，则开始刷新流程
    if (!isRefreshingToken) {
      isRefreshingToken = true;

      useUserStoreHook()
        .refreshToken()
        .then(() => {
          // 刷新成功，重试所有等待的请求
          pendingRequests.forEach((callback) => {
            try {
              callback();
            } catch (error) {
              console.error("Retry request error:", error);
            }
          });
          // 清空队列
          pendingRequests.length = 0;
        })
        .catch(async (error) => {
          console.error("Token refresh failed:", error);
          // 刷新失败，清空队列并跳转登录页
          pendingRequests.length = 0;
          await redirectToLogin("登录状态已失效，请重新登录");
          // 拒绝所有等待的请求
          pendingRequests.forEach(() => {
            reject(new Error("Token refresh failed"));
          });
        })
        .finally(() => {
          isRefreshingToken = false;
        });
    }
  });
}

/**
 * 重定向到登录页面
 */
async function redirectToLogin(message: string = "请重新登录"): Promise<void> {
  try {
    ElNotification({
      title: "提示",
      message,
      type: "warning",
      duration: 3000,
    });

    await useUserStoreHook().resetAllState();

    // 跳转到登录页，保留当前路由用于登录后跳转
    const currentPath = router.currentRoute.value.fullPath;
    await router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  } catch (error) {
    console.error("Redirect to login error:", error);
  }
}

export default httpRequest;
