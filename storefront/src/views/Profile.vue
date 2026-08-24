<template>
  <div class="page">
    <h2 class="page-title">个人中心</h2>
    <div class="profile">
      <div class="avatar">{{ (auth.nickname || '玩').charAt(0) }}</div>
      <div class="info">
        <div class="row"><span>昵称</span><b>{{ auth.member?.nickname || '-' }}</b></div>
        <div class="row"><span>手机号</span><b>{{ auth.member?.phone || '-' }}</b></div>
        <div class="row"><span>游戏ID</span><b>{{ auth.member?.game_id || '-' }}</b></div>
        <div class="row"><span>累计消费</span><b>¥{{ auth.member?.total_consume ?? 0 }}</b></div>
      </div>
    </div>
    <div class="balance">
      <div class="b-item"><div class="b-num">¥{{ auth.member?.balance ?? 0 }}</div><div class="b-label">余额</div></div>
      <div class="b-item"><div class="b-num">¥{{ auth.member?.total_recharge ?? 0 }}</div><div class="b-label">累计充值</div></div>
      <div class="b-item"><div class="b-num">¥{{ auth.member?.total_consume ?? 0 }}</div><div class="b-label">累计消费</div></div>
    </div>
    <el-button @click="logout">退出登录</el-button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth';

const auth = useAuthStore();

function logout() {
  auth.logout();
  window.location.href = '/login';
}
</script>

<style scoped>
.page { max-width: 860px; margin: 0 auto; padding: 24px; }
.page-title { font-size: 24px; margin-bottom: 18px; }
.profile {
  display: flex; gap: 24px; align-items: center; background: #151b2e; border: 1px solid #232d4a;
  border-radius: 16px; padding: 24px;
}
.avatar {
  width: 84px; height: 84px; border-radius: 16px; background: linear-gradient(135deg, #4080ff, #7b5cff);
  color: #fff; font-size: 36px; display: flex; align-items: center; justify-content: center;
}
.info { flex: 1; }
.row { display: flex; justify-content: space-between; padding: 8px 0; color: #b9c2d8; border-bottom: 1px solid #1c2338; }
.row b { color: #eceff7; }
.balance {
  display: flex; gap: 14px; margin: 20px 0; background: #151b2e; border: 1px solid #232d4a;
  border-radius: 16px; padding: 20px;
}
.b-item { flex: 1; text-align: center; }
.b-num { font-size: 28px; font-weight: 700; color: #ff8a3d; }
.b-label { color: #8b95b3; margin-top: 4px; }
</style>
