<template>
  <div class="app">
    <header class="topbar">
      <div class="brand" @click="$router.push('/')">
        <img src="/logo.svg" class="logo" alt="logo" />
        <span class="brand-name">乐乐电竞</span>
        <span class="brand-sub">三角洲陪玩</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/workers" class="nav-link">陪玩广场</router-link>
        <router-link to="/orders" class="nav-link">我的订单</router-link>
      </nav>
      <div class="actions">
        <template v-if="auth.isLoggedIn">
          <el-dropdown @command="onCommand">
            <span class="user">{{ auth.nickname }} <el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button text @click="$router.push('/login')">登录</el-button>
          <el-button type="primary" @click="$router.push('/register')">注册</el-button>
        </template>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">© 2026 乐乐电竞 · 三角洲行动陪玩接单平台</footer>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth';
import { ArrowDown } from '@element-plus/icons-vue';

const auth = useAuthStore();
auth.fetchMe();

function onCommand(cmd: string | number) {
  if (cmd === 'logout') {
    auth.logout();
    window.location.href = '/';
  } else if (cmd === 'orders') {
    window.location.href = '/orders';
  } else if (cmd === 'profile') {
    window.location.href = '/profile';
  }
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #0b0f1a;
  color: #e6e8ef;
  min-height: 100vh;
}
.app { display: flex; flex-direction: column; min-height: 100vh; }
.topbar {
  display: flex; align-items: center; gap: 24px; height: 64px; padding: 0 28px;
  background: rgba(20, 26, 44, 0.9); border-bottom: 1px solid #1e2740; position: sticky; top: 0; z-index: 20;
}
.brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo { width: 34px; height: 34px; }
.brand-name { font-size: 20px; font-weight: 700; color: #4f8bff; letter-spacing: 1px; }
.brand-sub { font-size: 12px; color: #8792b0; margin-top: 6px; }
.nav { display: flex; gap: 6px; margin-left: 20px; }
.nav-link {
  color: #b6bed6; text-decoration: none; padding: 8px 14px; border-radius: 8px; font-size: 15px;
}
.nav-link:hover { background: #1a2238; color: #fff; }
.router-link-active { background: rgba(79, 139, 255, 0.15); color: #7aa2ff; }
.actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.user { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: #dfe4f0; }
.main { flex: 1; }
.footer {
  text-align: center; padding: 18px; color: #7f8aa8; font-size: 13px; border-top: 1px solid #1e2740;
}
</style>
