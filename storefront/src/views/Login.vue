<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <img src="/logo.svg" class="logo" alt="logo" />
      <h2 class="title">登录乐乐电竞</h2>
      <el-form label-position="top" @keyup.enter="submit">
        <el-form-item label="手机号">
          <el-input v-model="phone" placeholder="请输入手机号" size="large" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password placeholder="请输入密码" size="large" />
        </el-form-item>
      </el-form>
      <el-button type="primary" size="large" class="btn" :loading="loading" @click="submit">登录</el-button>
      <div class="foot">还没有账号？<a @click="$router.push('/register')">立即注册</a></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const phone = ref('');
const password = ref('');
const loading = ref(false);

async function submit() {
  if (!phone.value || !password.value) {
    ElMessage.warning('请输入手机号和密码');
    return;
  }
  loading.value = true;
  try {
    await auth.login(phone.value, password.value);
    ElMessage.success('登录成功');
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (e: any) {
    ElMessage.error(e.response?.data?.msg || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-wrap { display: flex; align-items: center; justify-content: center; padding: 60px 24px; }
.auth-card {
  width: 400px; background: #151b2e; border: 1px solid #232d4a; border-radius: 20px; padding: 36px;
}
.logo { width: 52px; height: 52px; display: block; margin: 0 auto 12px; }
.title { text-align: center; margin-bottom: 20px; }
.btn { width: 100%; }
.foot { text-align: center; margin-top: 16px; color: #8b95b3; font-size: 14px; }
.foot a { color: #7aa2ff; cursor: pointer; }
</style>
