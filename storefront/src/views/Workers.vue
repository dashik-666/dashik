<template>
  <div class="page">
    <h2 class="page-title">陪玩广场</h2>
    <div class="filter">
      <el-select v-model="type" placeholder="选择类型" clearable style="width: 180px" @change="load">
        <el-option v-for="t in types" :key="t" :label="t" :value="t" />
      </el-select>
      <el-input v-model="keyword" placeholder="搜索昵称/级别" clearable style="width: 240px" @keyup.enter="load" />
      <el-button type="primary" @click="load">搜索</el-button>
    </div>

    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="list.length === 0" class="empty">没有符合条件的陪玩师</div>
    <div v-else class="grid">
      <div class="worker-card" v-for="w in list" :key="w.id" @click="$router.push(`/workers/${w.id}`)">
        <div class="head">
          <span class="name">{{ w.name }}</span>
          <el-tag size="small" effect="dark" type="warning">{{ w.level }}</el-tag>
        </div>
        <div class="meta">{{ w.type }} · {{ w.status }}</div>
        <div class="price">¥{{ w.price_hour }}<span class="per">/小时</span></div>
        <div class="skills">
          <el-tag v-for="(s, i) in w.skills?.slice(0, 3)" :key="i" size="small" type="info">{{ s }}</el-tag>
          <span v-if="!w.skills?.length" class="muted">暂无标签</span>
        </div>
        <el-button type="primary" plain size="small" class="btn" @click.stop="$router.push(`/workers/${w.id}`)">查看详情</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api, WorkerItem } from '@/api';

const route = useRoute();
const types = ref(['陪玩', '跑刀', '陪练', '其他']);
const type = ref((route.query.type as string) || '');
const keyword = ref('');
const list = ref<WorkerItem[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    list.value = await api.getWorkers(type.value || undefined, keyword.value || undefined);
  } catch (e: any) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 24px; }
.page-title { font-size: 24px; margin-bottom: 16px; }
.filter { display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.worker-card {
  background: #151b2e; border: 1px solid #232d4a; border-radius: 14px; padding: 20px; cursor: pointer;
  transition: all 0.2s;
}
.worker-card:hover { border-color: #4f8bff; transform: translateY(-3px); }
.head { display: flex; align-items: center; gap: 8px; }
.name { font-weight: 700; font-size: 18px; }
.meta { color: #8b95b3; margin-top: 8px; font-size: 14px; }
.price { color: #ff8a3d; font-weight: 700; margin: 8px 0; font-size: 20px; }
.per { font-size: 13px; color: #8b95b3; font-weight: 400; }
.skills { display: flex; flex-wrap: wrap; gap: 6px; min-height: 24px; }
.btn { margin-top: 14px; width: 100%; }
.muted { color: #7f8aa8; font-size: 13px; }
.empty { color: #7f8aa8; text-align: center; padding: 40px; }
</style>
