<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <img src="/logo.svg" class="logo" alt="logo" />
      <h2 class="title">注册玩家账号</h2>
      <el-form label-position="top" @keyup.enter="submit">
        <el-form-item label="手机号">
          <el-input v-model="phone" placeholder="请输入手机号" size="large" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="nickname" placeholder="选填" size="large" />
        </el-form-item>
        <el-form-item label="游戏ID">
          <el-input v-model="gameId" placeholder="选填" size="large" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password placeholder="至少6位" size="large" />
        </el-form-item>
      </el-form>
      <el-button type="primary" size="large" class="btn" :loading="loading" @click="submit">注册并登录</el-button>
      <div class="foot">已有账号？<a @click="$router.push('/login')">去登录</a></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const auth = useAuthStore();
const phone = ref('');
const nickname = ref('');
const gameId = ref('');
const password = ref('');
const loading = ref(false);

async function submit() {
  if (!/^1\d{10}$/.test(phone.value)) {
    ElMessage.warning('请输入正确的11位手机号');
    return;
  }
  if (!password.value || password.value.length < 6) {
    ElMessage.warning('密码至少6位');
    return;
  }
  loading.value = true;
  try {
    await auth.register({ phone: phone.value, password: password.value, nickname: nickname.value, game_id: gameId.value });
    ElMessage.success('注册成功');
    router.push('/');
  } catch (e: any) {
    ElMessage.error(e.response?.data?.msg || '注册失败');
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
