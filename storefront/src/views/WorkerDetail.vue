<template>
  <div class="page">
    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="!worker" class="empty">陪玩师不存在</div>
    <div v-else class="detail">
      <div class="left">
        <div class="avatar">{{ worker.name.charAt(0) }}</div>
      </div>
      <div class="right">
        <div class="head">
          <span class="name">{{ worker.name }}</span>
          <el-tag effect="dark" type="warning">{{ worker.level }}</el-tag>
          <el-tag effect="plain">{{ worker.type }}</el-tag>
        </div>
        <div class="status">状态：{{ worker.status }}</div>
        <div class="rating">
          <el-rate :model-value="worker.avgRating" disabled />
          <span class="r-score">{{ worker.avgRating }}</span>
          <span class="r-count">({{ worker.reviewCount }}条评价)</span>
        </div>
        <div class="price">¥{{ worker.price_hour }} <span class="per">/小时</span></div>
        <div class="skills">
          <span class="label">标签：</span>
          <el-tag v-for="(s, i) in worker.skills" :key="i" size="small" type="info">{{ s }}</el-tag>
          <span v-if="!worker.skills?.length" class="muted">暂无</span>
        </div>
        <div class="desc">{{ worker.remark || '该陪玩师暂未填写简介。' }}</div>
        <div class="btns">
          <el-button type="primary" size="large" @click="goCheckout">立即下单</el-button>
          <el-button size="large" @click="$router.back()">返回</el-button>
        </div>
      </div>
    </div>

    <!-- 评价区 -->
    <div class="reviews">
      <h3 class="rv-title">玩家评价</h3>
      <div v-if="reviews.length === 0" class="empty">暂无评价</div>
      <div v-else class="rv-list">
        <div class="rv-item" v-for="r in reviews" :key="r.id">
          <div class="rv-head">
            <span class="rv-name">{{ r.nickname }}</span>
            <el-rate :model-value="r.rating" disabled size="small" />
            <span class="rv-time">{{ formatTime(r.createdAt) }}</span>
          </div>
          <div class="rv-content">{{ r.content || '（用户未填写评价内容）' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, WorkerItem, ReviewItem } from '@/api';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const worker = ref<WorkerItem | null>(null);
const reviews = ref<ReviewItem[]>([]);

onMounted(async () => {
  try {
    const id = Number(route.params.id);
    worker.value = await api.getWorker(id);
    reviews.value = await api.workerReviews(id);
  } catch (e: any) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

function goCheckout() {
  router.push({ path: '/order', query: { worker: String(worker.value!.id) } });
}

function formatTime(s: string) {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T'));
  return d.toLocaleString('zh-CN', { hour12: false });
}
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }
.detail {
  display: flex; gap: 28px; background: #151b2e; border: 1px solid #232d4a; border-radius: 20px; padding: 30px;
}
.avatar {
  width: 140px; height: 140px; border-radius: 16px; background: linear-gradient(135deg, #4080ff, #7b5cff);
  color: #fff; font-size: 60px; display: flex; align-items: center; justify-content: center;
}
.right { flex: 1; }
.head { display: flex; align-items: center; gap: 12px; }
.name { font-size: 28px; font-weight: 700; }
.status { color: #8b95b3; margin-top: 12px; }
.rating { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.r-score { color: #ffaa3d; font-weight: 700; font-size: 18px; }
.r-count { color: #8b95b3; font-size: 13px; }
.price { font-size: 28px; color: #ff8a3d; font-weight: 700; margin: 12px 0; }
.per { font-size: 15px; color: #8b95b3; font-weight: 400; }
.skills { margin-top: 8px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.label { color: #8b95b3; }
.desc { margin-top: 16px; color: #b9c2d8; line-height: 1.7; }
.btns { margin-top: 26px; display: flex; gap: 12px; }
.reviews { margin-top: 28px; background: #151b2e; border: 1px solid #232d4a; border-radius: 20px; padding: 26px; }
.rv-title { font-size: 20px; margin-bottom: 16px; }
.rv-list { display: flex; flex-direction: column; gap: 16px; }
.rv-item { border-bottom: 1px solid #1c2338; padding-bottom: 16px; }
.rv-head { display: flex; align-items: center; gap: 10px; }
.rv-name { font-weight: 600; }
.rv-time { margin-left: auto; color: #7f8aa8; font-size: 12px; }
.rv-content { color: #b9c2d8; margin-top: 8px; line-height: 1.6; }
.muted { color: #7f8aa8; }
.empty { color: #7f8aa8; text-align: center; padding: 30px; }
</style>
