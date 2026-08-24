import { store } from "@/store";

import AuthAPI, { type LoginFormData } from "@/api/auth-api";
import UserAPI, { type UserInfo } from "@/api/system/user-api";

import { AuthStorage } from "@/utils/auth";
import { usePermissionStoreHook } from "@/store/modules/permission-store";
// import { useDictStoreHook } from "@/store/modules/dict-store"; // 已移除
import { useTagsViewStore } from "@/store";
// import { cleanupWebSocket } from "@/plugins/websocket"; // 已移除

export const useUserStore = defineStore("user", () => {
  // 用户信息
  const userInfo = ref<UserInfo>({} as UserInfo);
  // 记住我状态
  const rememberMe = ref(AuthStorage.getRememberMe());

  /**
   * 登录
   *
   * @param {LoginFormData}
   * @returns
   */
  function login(LoginFormData: LoginFormData) {
    return new Promise<void>((resolve, reject) => {
      AuthAPI.login(LoginFormData)
        .then((data) => {
          console.log('登录成功，保存token:', data);
          console.log('data类型:', typeof data);
          console.log('data字段:', Object.keys(data || {}));
          
          // 检查数据结构
          const accessToken = data?.accessToken || (data as any)?.data?.accessToken;
          const refreshToken = data?.refreshToken || (data as any)?.data?.refreshToken;
          
          console.log('提取的accessToken:', accessToken);
          console.log('提取的refreshToken:', refreshToken);
          
          if (!accessToken || !refreshToken) {
            console.error('Token数据不完整:', { accessToken, refreshToken });
            reject(new Error('登录响应数据不完整'));
            return;
          }
          
          // 保存记住我状态和token
          rememberMe.value = LoginFormData.rememberMe;
          AuthStorage.setTokens(accessToken, refreshToken, rememberMe.value);
          console.log('Token已保存，AccessToken:', AuthStorage.getAccessToken());
          resolve();
        })
        .catch((error) => {
          console.error('登录失败:', error);
          reject(error);
        });
    });
  }

  /**
   * 获取用户信息
   *
   * @returns {UserInfo} 用户信息
   */
  function getUserInfo() {
    return new Promise<UserInfo>((resolve, reject) => {
      UserAPI.getInfo()
        .then((data) => {
          if (!data) {
            reject("Verification failed, please Login again.");
            return;
          }
          Object.assign(userInfo.value, { ...data });
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 登出
   */
  function logout() {
    return new Promise<void>((resolve, reject) => {
      AuthAPI.logout()
        .then(() => {
          // 重置所有系统状态
          resetAllState();
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  /**
   * 重置所有系统状态
   * 统一处理所有清理工作，包括用户凭证、路由、缓存等
   */
  function resetAllState() {
    // 1. 重置用户状态
    resetUserState();

    // 2. 重置其他模块状态
    // 重置路由
    usePermissionStoreHook().resetRouter();
    // 清除字典缓存 (已移除字典功能)
    // useDictStoreHook().clearDictCache();
    // 清除标签视图
    useTagsViewStore().delAllViews();

    // 3. 清理 WebSocket 连接 (已移除)
    // cleanupWebSocket();
    console.log("[UserStore] WebSocket cleanup skipped (removed)");

    return Promise.resolve();
  }

  /**
   * 重置用户状态
   * 仅处理用户模块内的状态
   */
  function resetUserState() {
    // 清除用户凭证
    AuthStorage.clearAuth();
    // 重置用户信息
    userInfo.value = {} as UserInfo;
  }

  /**
   * 刷新 token
   */
  function refreshToken() {
    const refreshToken = AuthStorage.getRefreshToken();
    console.log('尝试刷新token，refreshToken:', refreshToken);

    if (!refreshToken) {
      console.error('没有找到refreshToken');
      return Promise.reject(new Error("没有有效的刷新令牌"));
    }

    return new Promise<void>((resolve, reject) => {
      AuthAPI.refreshToken(refreshToken)
        .then((data) => {
          console.log('刷新token成功:', data);
          const { accessToken, refreshToken: newRefreshToken } = data;
          // 更新令牌，保持当前记住我状态
          AuthStorage.setTokens(accessToken, newRefreshToken, AuthStorage.getRememberMe());
          resolve();
        })
        .catch((error) => {
          console.error("refreshToken刷新失败", error);
          reject(error);
        });
    });
  }

  return {
    userInfo,
    rememberMe,
    isLoggedIn: () => !!AuthStorage.getAccessToken(),
    getUserInfo,
    login,
    logout,
    resetAllState,
    resetUserState,
    refreshToken,
  };
});

/**
 * 在组件外部使用UserStore的钩子函数
 * @see https://pinia.vuejs.org/core-concepts/outside-component-usage.html
 */
export function useUserStoreHook() {
  return useUserStore(store);
}
