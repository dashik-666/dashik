<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-title">乐乐电竞 · 三角洲行动陪玩</h1>
      <p class="hero-sub">专业陪玩师 ｜ 上分护航 ｜ 跑刀陪练 ｜ 安全可靠</p>
      <div class="hero-actions">
        <el-button type="primary" size="large" round @click="$router.push('/workers')">立即找陪玩</el-button>
        <el-button size="large" round @click="$router.push('/register')">注册玩家账号</el-button>
      </div>
    </section>

    <!-- 服务分类 -->
    <section class="section">
      <h2 class="section-title">热门服务分类</h2>
      <div class="cards">
        <div class="card" v-for="c in categories" :key="c.name" @click="$router.push({ path: '/workers', query: { type: c.name } })">
          <div class="card-icon">{{ c.icon }}</div>
          <div class="card-name">{{ c.name }}</div>
          <div class="card-desc">{{ c.desc }}</div>
        </div>
      </div>
    </section>

    <!-- 精选陪玩 -->
    <section class="section">
      <h2 class="section-title">精选陪玩师</h2>
      <div v-if="loading" class="empty">加载中...</div>
      <div v-else-if="featured.length === 0" class="empty">暂无陪玩师，请稍后再来</div>
      <div v-else class="workers-grid">
        <div class="worker-card" v-for="w in featured" :key="w.id" @click="$router.push(`/workers/${w.id}`)">
          <div class="worker-name">{{ w.name }} <el-tag size="small" effect="dark">{{ w.level }}</el-tag></div>
          <div class="worker-tag">{{ w.type }}</div>
          <div class="worker-price">¥{{ w.price_hour }}/小时</div>
          <div class="worker-skills">
            <el-tag v-for="(s, i) in w.skills?.slice(0, 3)" :key="i" size="small" type="info">{{ s }}</el-tag>
            <span v-if="!w.skills?.length" class="muted">暂无标签</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api, WorkerItem } from '@/api';

const categories = [
  { name: '陪玩', icon: '🎮', desc: '组队上分 · 全程陪伴' },
  { name: '跑刀', icon: '🗡️', desc: '护航撤离 · 稳稳上嗨' },
  { name: '陪练', icon: '🔥', desc: '技能教学 · 带飞冲榜' },
  { name: '其他', icon: '⭐', desc: '更多个性化服务' },
];

const loading = ref(true);
const featured = ref<WorkerItem[]>([]);

onMounted(async () => {
  try {
    featured.value = (await api.getWorkers()).slice(0, 8);
  } catch (e: any) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home { max-width: 1100px; margin: 0 auto; padding: 0 24px 40px; }
.hero {
  margin: 24px 0; padding: 56px 32px; text-align: center; border-radius: 20px;
  background: radial-gradient(circle at 20% 20%, rgba(79, 139, 255, 0.25), transparent 50%),
    radial-gradient(circle at 80% 30%, rgba(123, 92, 255, 0.22), transparent 50%), #141a2c;
  border: 1px solid #232d4a;
}
.hero-title { font-size: 34px; font-weight: 700; }
.hero-sub { color: #96a0bd; margin: 14px 0 26px; font-size: 15px; }
.hero-actions { display: flex; gap: 14px; justify-content: center; }
.section { margin-top: 36px; }
.section-title { font-size: 22px; margin-bottom: 18px; color: #fff; }
.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.card {
  background: #151b2e; border: 1px solid #232d4a; border-radius: 14px; padding: 22px; cursor: pointer;
  transition: all 0.2s;
}
.card:hover { border-color: #4f8bff; transform: translateY(-3px); }
.card-icon { font-size: 30px; }
.card-name { margin-top: 10px; font-weight: 600; font-size: 17px; }
.card-desc { margin-top: 6px; color: #8b95b3; font-size: 13px; }
.workers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.worker-card {
  background: #151b2e; border: 1px solid #232d4a; border-radius: 14px; padding: 20px; cursor: pointer;
  transition: all 0.2s;
}
.worker-card:hover { border-color: #4f8bff; transform: translateY(-3px); }
.worker-name { font-weight: 600; display: flex; gap: 8px; align-items: center; }
.worker-tag { color: #7aa2ff; margin-top: 8px; font-size: 14px; }
.worker-price { color: #ff8a3d; font-weight: 700; margin-top: 8px; font-size: 18px; }
.worker-skills { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
.muted { color: #7f8aa8; font-size: 13px; }
.empty { color: #7f8aa8; text-align: center; padding: 30px; }
</style>
