<template>
  <div class="page">
    <h2 class="page-title">我的订单</h2>
    <div v-if="loading" class="empty">加载中...</div>
    <div v-else-if="list.length === 0" class="empty">暂无订单，去 <a @click="$router.push('/workers')">找陪玩</a> 吧</div>
    <div v-else class="list">
      <div class="order" v-for="o in list" :key="o.id">
        <div class="o-head">
          <span class="o-no">{{ o.orderNo }}</span>
          <el-tag :type="statusType(o.status)">{{ o.statusText }}</el-tag>
        </div>
        <div class="o-body">
          <div class="o-worker">{{ o.worker?.name }}（{{ o.worker?.level }} · {{ o.worker?.type }}）</div>
          <div class="o-meta">时长 {{ o.duration }} 小时 · {{ o.pay_method === 'scan' ? '模拟支付' : '余额' }}</div>
        </div>
        <div class="o-price">¥{{ o.price_final }}</div>
        <div class="o-actions">
          <el-button v-if="o.status === 'completed' && !isReviewed(o)" size="small" type="primary" plain @click="openReview(o)">评价</el-button>
          <el-button v-if="o.status === 'pending'" size="small" @click="cancel(o)">取消订单</el-button>
          <el-button size="small" text @click="$router.push(`/workers/${o.worker!.id}`)">再来一单</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="reviewVisible" title="评价订单" width="480px">
      <div class="rv-wrap">
        <div class="rv-target">对 {{ reviewTarget?.worker?.name }} 的评价</div>
        <div class="rv-rate"><el-rate v-model="reviewRating" /></div>
        <el-input v-model="reviewContent" type="textarea" :rows="4" placeholder="说说你的服务体验（选填）" />
      </div>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSubmitting" @click="submitReview">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { api, OrderItem } from '@/api';

const list = ref<OrderItem[]>([]);
const loading = ref(true);
const reviewedIds = ref<Set<number>>(new Set());

const reviewVisible = ref(false);
const reviewTarget = ref<OrderItem | null>(null);
const reviewRating = ref(5);
const reviewContent = ref('');
const reviewSubmitting = ref(false);

function isReviewed(o: OrderItem) {
  return reviewedIds.value.has(o.id);
}

function openReview(o: OrderItem) {
  reviewTarget.value = o;
  reviewRating.value = 5;
  reviewContent.value = '';
  reviewVisible.value = true;
}

async function submitReview() {
  if (!reviewTarget.value) return;
  reviewSubmitting.value = true;
  try {
    await api.reviewOrder(reviewTarget.value.id, { rating: reviewRating.value, content: reviewContent.value });
    ElMessage.success('评价成功，感谢反馈');
    reviewedIds.value.add(reviewTarget.value.id);
    reviewVisible.value = false;
  } catch (e: any) {
    ElMessage.error(e.response?.data?.msg || '评价失败');
  } finally {
    reviewSubmitting.value = false;
  }
}

function statusType(s: string) {
  return s === 'completed' ? 'success' : s === 'in_service' ? 'warning' : s === 'cancelled' ? 'danger' : 'info';
}

async function load() {
  loading.value = true;
  try {
    list.value = await api.myOrders();
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

async function cancel(o: OrderItem) {
  await ElMessageBox.confirm('确定取消该订单吗？', '提示', { type: 'warning' });
  try {
    await api.cancelOrder(o.id);
    ElMessage.success('已取消');
    load();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.msg || '取消失败');
  }
}

onMounted(load);
</script>

<style scoped>
.page { max-width: 900px; margin: 0 auto; padding: 24px; }
.page-title { font-size: 24px; margin-bottom: 18px; }
.list { display: flex; flex-direction: column; gap: 14px; }
.order {
  background: #151b2e; border: 1px solid #232d4a; border-radius: 14px; padding: 18px 22px;
}
.o-head { display: flex; justify-content: space-between; align-items: center; }
.o-no { color: #8b95b3; font-size: 13px; }
.o-body { margin-top: 12px; }
.o-worker { font-weight: 600; }
.o-meta { color: #8b95b3; font-size: 13px; margin-top: 6px; }
.o-price { color: #ff8a3d; font-size: 22px; font-weight: 700; margin-top: 8px; }
.o-actions { margin-top: 12px; display: flex; gap: 8px; }
.empty { color: #7f8aa8; text-align: center; padding: 40px; }
.empty a { color: #7aa2ff; cursor: pointer; }
.rv-target { margin-bottom: 12px; color: #dfe4f0; }
.rv-rate { margin-bottom: 14px; }
</style>
