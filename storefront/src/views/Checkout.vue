<template>
  <div class="page">
    <div v-if="loading" class="empty">加载中...</div>
    <div v-else class="box">
      <h2 class="title">选择服务套餐</h2>
      <div v-if="worker" class="info">
        <div class="row"><span>陪玩师</span><b>{{ worker.name }}（{{ worker.level }} · {{ worker.type }}）</b></div>
        <div class="row"><span>单价</span><b>¥{{ worker.price_hour }}/小时</b></div>
      </div>

      <!-- 套餐选择 -->
      <div class="packs">
        <div
          v-for="p in worker?.packages || []"
          :key="p.key"
          class="pack"
          :class="{ active: selected?.key === p.key }"
          @click="selected = p"
        >
          <div class="p-name">{{ p.name }}</div>
          <div class="p-hours">{{ p.hours }} 小时</div>
          <div class="p-price">¥{{ p.price }}</div>
          <div class="p-note">{{ p.note }}</div>
          <div class="p-tag" v-if="selected?.key === p.key">已选 ✓</div>
        </div>
      </div>

      <el-form label-position="left" class="form">
        <el-form-item label="你的游戏ID">
          <el-input v-model="gameId" placeholder="选填" style="width: 220px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="remark" placeholder="选填，如具体需求" style="width: 340px" />
        </el-form-item>
      </el-form>

      <div class="price">
        应付金额：<span class="amount">¥{{ (selected?.price || 0).toFixed(2) }}</span>
        <div class="hint">支付方式：模拟支付（演示环境不产生真实扣款）</div>
      </div>
      <div class="btns">
        <el-button type="primary" size="large" :loading="submitting" @click="submit">提交订单并模拟支付</el-button>
        <el-button size="large" @click="$router.back()">返回</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api, WorkerItem, WorkerPackage } from '@/api';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(true);
const submitting = ref(false);
const worker = ref<WorkerItem | null>(null);
const selected = ref<WorkerPackage | null>(null);
const gameId = ref('');
const remark = ref('');

const total = computed(() => selected.value?.price || 0);

onMounted(async () => {
  try {
    worker.value = await api.getWorker(Number(route.query.worker));
    selected.value = worker.value.packages?.[0] || null;
    gameId.value = auth.member?.game_id || '';
  } catch (e: any) {
    ElMessage.error('陪玩师信息加载失败');
  } finally {
    loading.value = false;
  }
});

async function submit() {
  if (!worker.value || !selected.value) return;
  submitting.value = true;
  try {
    const res = await api.createOrder({
      worker_id: worker.value.id,
      duration: selected.value.hours,
      package_name: selected.value.name,
      package_key: selected.value.key,
      game_id: gameId.value || undefined,
      remark: remark.value || undefined,
    });
    ElMessage.success(res.msg);
    router.push('/orders');
  } catch (e: any) {
    ElMessage.error(e.response?.data?.msg || '下单失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page { max-width: 860px; margin: 0 auto; padding: 40px 24px; }
.box { background: #151b2e; border: 1px solid #232d4a; border-radius: 20px; padding: 30px; }
.title { margin-bottom: 20px; font-size: 22px; }
.info { background: #0f1424; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }
.row { display: flex; justify-content: space-between; padding: 6px 0; color: #b9c2d8; }
.packs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px; }
.pack {
  position: relative; background: #0f1424; border: 1px solid #2a3554; border-radius: 14px; padding: 20px;
  cursor: pointer; text-align: center; transition: all 0.2s;
}
.pack:hover { border-color: #4f8bff; }
.pack.active { border-color: #4f8bff; background: rgba(79, 139, 255, 0.12); }
.p-name { font-weight: 700; font-size: 18px; }
.p-hours { color: #8b95b3; margin-top: 6px; font-size: 13px; }
.p-price { color: #ff8a3d; font-size: 26px; font-weight: 700; margin: 10px 0; }
.p-note { color: #7aa2ff; font-size: 13px; }
.p-tag { position: absolute; top: 10px; right: 12px; color: #4f8bff; font-size: 13px; font-weight: 600; }
.form { max-width: 460px; }
.price { margin: 18px 0; padding: 18px 20px; background: #1a2238; border-radius: 12px; }
.amount { color: #ff8a3d; font-size: 26px; font-weight: 700; }
.hint { color: #7f8aa8; font-size: 13px; margin-top: 6px; }
.btns { display: flex; gap: 12px; }
.empty { color: #7f8aa8; text-align: center; padding: 60px; }
</style>
