<template>
  <div>
    <h3 text-center m-0 mb-20px>{{ t("login.login") }}</h3>
    <el-form
      ref="loginFormRef"
      :model="loginFormData"
      :rules="loginRules"
      size="large"
      :validate-on-rule-change="false"
    >
      <!-- 用户名 -->
      <el-form-item prop="username">
        <el-input v-model.trim="loginFormData.username" :placeholder="t('login.username')">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- 密码 -->
      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="password">
          <el-input
            v-model.trim="loginFormData.password"
            :placeholder="t('login.password')"
            type="password"
            show-password
            @keyup="checkCapsLock"
            @keyup.enter="handleLoginSubmit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>



      <div class="flex-x-between w-full">
        <el-checkbox v-model="loginFormData.rememberMe">{{ t("login.rememberMe") }}</el-checkbox>
      </div>

      <!-- 登录按钮 -->
      <el-form-item>
        <el-button :loading="loading" type="primary" class="w-full" @click="handleLoginSubmit">
          {{ t("login.login") }}
        </el-button>
      </el-form-item>
    </el-form>


  </div>
</template>
<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { ElMessage } from "element-plus";
import AuthAPI, { type LoginFormData } from "@/api/auth-api";
import router from "@/router";
import { useUserStore } from "@/store";
import CommonWrapper from "@/components/CommonWrapper/index.vue";
import { AuthStorage } from "@/utils/auth";

const { t } = useI18n();
const userStore = useUserStore();
const route = useRoute();



const loginFormRef = ref<FormInstance>();
const loading = ref(false);
// 是否大写锁定
const isCapsLock = ref(false);
// 记住我
const rememberMe = AuthStorage.getRememberMe();

const loginFormData = ref<LoginFormData>({
  username: "admin",
  password: "123456",
  rememberMe,
});

const loginRules = computed(() => {
  return {
    username: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.username.required"),
      },
    ],
    password: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.password.required"),
      },
      {
        min: 6,
        message: t("login.message.password.min"),
        trigger: "blur",
      },
    ],

  };
});



/**
 * 登录提交
 */
async function handleLoginSubmit() {
    try {
    // 1. 表单验证
    const valid = await loginFormRef.value?.validate();
    if (!valid) return;

    loading.value = true;

    // 2. 执行登录
    await userStore.login(loginFormData.value);

    const redirectPath = (route.query.redirect as string) || "/";

    await router.push(decodeURIComponent(redirectPath));
  } catch (error: any) {
    // 详细的错误处理
    // 仅错误提示
    ElMessage.error('登录失败');
    
    // 如果错误已经被全局拦截器处理过，就不再显示错误
    if (error.message && (
      error.message.includes('数据库连接异常') ||
      error.message.includes('服务器内部错误') ||
      error.message.includes('网络连接失败') ||
      error.message.includes('请求超时') ||
      error.message.includes('用户名或密码错误')
    )) {
      // 错误已经被全局拦截器处理，不需要重复显示
      return;
    }
    
    let errorMessage = "登录失败，请稍后重试";
    
    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          errorMessage = "用户名或密码错误，请检查后重试";
          break;
        case 403:
          errorMessage = "账号已被禁用，请联系管理员";
          break;
        case 404:
          errorMessage = "登录服务不可用，请联系管理员";
          break;
        case 500:
          errorMessage = "服务器内部错误，请稍后重试";
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = "服务器暂时不可用，请稍后重试";
          break;
        default:
          if (data && data.msg) {
            errorMessage = data.msg;
          } else {
            errorMessage = `登录失败 (${status})`;
          }
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      if (error.code === 'ECONNABORTED') {
        errorMessage = "登录请求超时，请检查网络连接";
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "网络连接失败，请检查网络设置";
      } else {
        errorMessage = "无法连接到服务器，请检查网络连接";
      }
    } else if (error.message) {
      // 其他错误
      if (error.message.includes('Network Error')) {
        errorMessage = "网络连接失败，请检查网络设置";
      } else if (error.message.includes('timeout')) {
        errorMessage = "请求超时，请稍后重试";
      } else {
        errorMessage = error.message;
      }
    }
    
    ElMessage.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

// 检查输入大小写
function checkCapsLock(event: KeyboardEvent) {
  // 防止浏览器密码自动填充时报错
  if (event instanceof KeyboardEvent) {
    isCapsLock.value = event.getModifierState("CapsLock");
  }
}


</script>

<style lang="scss" scoped>
</style>
