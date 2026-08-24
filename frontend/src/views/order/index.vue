<template>
  <div class="app-container">
    <!-- 调试信息显示区域 -->
    <div v-if="showDebug" class="debug-info" style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="font-weight: bold; color: #0ea5e9;">🐛 调试模式已开启</div>
        <div>
          <el-button size="small" type="primary" @click="testDebug">测试调试</el-button>
          <el-button size="small" type="warning" @click="forceRefresh">强制刷新</el-button>
        </div>
      </div>
      <div style="font-size: 12px; color: #0369a1;">
        <div>页面状态: {{ debugStatus }}</div>
        <div>会员列表长度: {{ memberList.length }}</div>
        <div>打手列表长度: {{ workerList.length }}</div>
        <div>订单列表长度: {{ orderList.length }}</div>
        <div>当前时间: {{ new Date().toLocaleString() }}</div>
      </div>
    </div>
    
    <div class="search-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="订单号/会员昵称/打手昵称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-select v-model="queryParams.payMethod" placeholder="请选择" clearable style="width: 120px">
            <el-option label="余额" value="balance" />
            <el-option label="扫码" value="scan" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <i-ep-search />搜索
          </el-button>
          <el-button @click="handleResetQuery">
            <i-ep-refresh />重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="never" class="table-container">
      <template #header>
        <div class="flex-x-between">
          <div class="flex-y-center">
            <i-ep-shopping-cart class="mr-1" />订单列表
          </div>
          <div>
            <el-button type="success" @click="handleOpenDialog()">
              <i-ep-plus />新增订单
            </el-button>
            <el-button type="info" @click="handleExport">
              <i-ep-download />导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="orderList" stripe :row-class-name="getRowClassName">
        <el-table-column label="订单号" prop="orderNo" width="150" show-overflow-tooltip />
        <el-table-column label="会员信息" width="140">
          <template #default="scope">
            <div>
              <div class="font-medium">{{ scope.row.memberNickname }}</div>
              <div class="text-gray-500 text-sm">{{ scope.row.memberUsername }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="打手信息" width="140">
          <template #default="scope">
            <div>
              <div class="font-medium">{{ scope.row.workerNickname }}</div>
              <div class="text-gray-500 text-sm">{{ scope.row.workerUsername }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="服务时长" prop="serviceHours" width="100" align="center">
          <template #default="scope">
            <span class="text-blue-600">{{ scope.row.serviceHours }}小时</span>
          </template>
        </el-table-column>
        <el-table-column label="订单金额" prop="amount" width="110" align="right">
          <template #default="scope">
            <span class="text-red-600 font-medium">¥{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
                 <el-table-column label="支付方式" prop="payMethod" width="100" align="center">
           <template #default="scope">
             <span class="payment-method-text">{{ getPaymentMethodText(scope.row.payMethod) }}</span>
           </template>
         </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ scope.row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" prop="createTime" width="160" show-overflow-tooltip>
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="上钟时间" prop="startTime" width="160" show-overflow-tooltip>
          <template #default="scope">
            <div v-if="scope.row.startTime">
              {{ formatDateTime(scope.row.startTime) }}
            </div>
            <span v-else class="text-gray-400">未上钟</span>
          </template>
        </el-table-column>
        <el-table-column label="下钟时间" prop="endTime" width="160" show-overflow-tooltip>
          <template #default="scope">
            <div v-if="scope.row.endTime">
              {{ formatDateTime(scope.row.endTime) }}
            </div>
            <span v-else class="text-gray-400">未下钟</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <div class="flex gap-2 justify-center">
              <el-button 
                v-if="scope.row.status === 'pending'" 
                link 
                type="success" 
                size="small"
                @click="handleStartOrder(scope.row.id)"
              >
                <i-ep-video-play />上钟
              </el-button>
              <el-button 
                v-if="scope.row.status === 'in_service'" 
                link 
                type="warning" 
                size="small"
                @click="handleEndOrder(scope.row.id)"
              >
                <i-ep-video-pause />下钟
              </el-button>
              <el-button link type="primary" size="small" @click="handleOpenDialog(scope.row.id)">
                <i-ep-edit />编辑
              </el-button>
              <el-button link type="danger" size="small" @click="handleDelete(scope.row.id)">
                <i-ep-delete />删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.page"
        v-model:limit="queryParams.limit"
        @pagination="handleQuery"
      />
    </el-card>

    <!-- 订单表单弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="700px"
      @close="handleCloseDialog"
    >
      <el-form
        ref="orderFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择会员" prop="memberId">
              <div class="flex items-center">
                <el-input
                  v-model="selectedMemberText"
                  placeholder="请选择会员"
                  readonly
                  style="width: 100%"
                  @click="showMemberDialog = true"
                />
                <el-button type="primary" @click="showMemberDialog = true" class="ml-2">
                  <i-ep-search />选择
                </el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员余额">
              <el-input :value="`¥${memberBalance}`" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择打手" prop="workerId">
              <div class="flex items-center">
                <el-input
                  v-model="selectedWorkerText"
                  placeholder="请选择打手"
                  readonly
                  style="width: 100%"
                  @click="showWorkerDialog = true"
                />
                <el-button type="primary" @click="showWorkerDialog = true" class="ml-2">
                  <i-ep-search />选择
                </el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小时单价">
              <el-input :value="`¥${hourlyRate}/小时`" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务时长" prop="serviceHours">
              <el-input-number
                v-model="formData.serviceHours"
                :min="0.5"
                :step="0.5"
                :precision="1"
                style="width: 100%"
                placeholder="请输入服务时长"
                @change="calculateAmount"
              />
              <span class="ml-2 text-gray-500">小时</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小时单价">
              <el-input :value="`¥${hourlyRate}/小时`" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="原价金额">
              <el-input :value="`¥${calculatedAmount}`" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实付金额" prop="amount">
              <el-input-number
                v-model="formData.amount"
                :min="0.01"
                :step="0.01"
                :precision="2"
                style="width: 100%"
                placeholder="请输入实付金额"
                @change="handleAmountChange"
              />
              <span class="ml-2 text-gray-500">元</span>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 价格显示区域 -->
        <el-card shadow="never" class="price-card mb-4">
          <div class="price-row">
            <span>原价金额：</span>
            <span class="text-gray-600">¥{{ calculatedAmount }}</span>
          </div>
          <div class="price-row" v-if="isAmountModified">
            <span v-if="isPriceDecreased">优惠金额：</span>
            <span v-else-if="isPriceIncreased">加价金额：</span>
            <span v-else>调整金额：</span>
            <span v-if="isPriceDecreased" class="text-green-600">-¥{{ discountAmount }}</span>
            <span v-else-if="isPriceIncreased" class="text-orange-600">+¥{{ discountAmount }}</span>
            <span v-else class="text-blue-600">¥{{ discountAmount }}</span>
          </div>
          <div class="price-row total">
            <span>实付金额：</span>
            <span class="text-red-600 font-bold text-lg">¥{{ formData.amount }}</span>
          </div>
        </el-card>
        
        <el-form-item label="优惠原因" prop="discountReason" v-if="isAmountModified">
          <el-input
            v-model="formData.discountReason"
            type="textarea"
            placeholder="请填写优惠原因（如：老客户优惠、特殊情况调整等）"
            :rows="2"
          />
        </el-form-item>
        
        <el-form-item label="支付方式" prop="payMethod">
          <el-radio-group v-model="formData.payMethod">
            <el-radio value="balance">余额支付</el-radio>
            <el-radio value="scan">扫码支付</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            placeholder="请输入备注"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :disabled="!canSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-blue-100 text-blue-600">
              <i-ep-shopping-cart />
            </div>
            <div class="stat-content">
              <div class="stat-title">今日订单</div>
              <div class="stat-value text-blue-600">¥{{ statsData.todayAmount }}</div>
              <div class="stat-desc">{{ statsData.todayCount }}单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-green-100 text-green-600">
              <i-ep-trend-charts />
            </div>
            <div class="stat-content">
              <div class="stat-title">本月订单</div>
              <div class="stat-value text-green-600">¥{{ statsData.monthAmount }}</div>
              <div class="stat-desc">{{ statsData.monthCount }}单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-orange-100 text-orange-600">
              <i-ep-wallet />
            </div>
            <div class="stat-content">
              <div class="stat-title">余额支付</div>
              <div class="stat-value text-orange-600">¥{{ statsData.balancePayAmount }}</div>
              <div class="stat-desc">{{ statsData.balancePayCount }}单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-purple-100 text-purple-600">
              <i-ep-credit-card />
            </div>
            <div class="stat-content">
              <div class="stat-title">扫码支付</div>
              <div class="stat-value text-purple-600">¥{{ statsData.qrcodePayAmount }}</div>
              <div class="stat-desc">{{ statsData.qrcodePayCount }}单</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 会员选择弹窗 -->
    <el-dialog
      v-model="showMemberDialog"
      title="选择会员（仅显示正常状态）"
      width="900px"
      @close="handleCloseMemberDialog"
    >
      <div class="mb-4">
        <div class="text-gray-500 text-sm mb-2">
          <i-ep-info-filled class="mr-1" />
          注意：被禁用的会员不会显示在此列表中，如需启用会员请前往会员管理页面
        </div>
        <el-input
          v-model="memberSearchKeyword"
          placeholder="搜索会员昵称、用户名或手机号"
          clearable
          style="width: 300px"
          @keyup.enter="handleMemberSearch"
        >
          <template #append>
            <el-button @click="handleMemberSearch">
              <i-ep-search />
            </el-button>
          </template>
        </el-input>
      </div>
      
      <el-table
        v-loading="memberLoading"
        :data="memberList"
        stripe
        @row-click="handleMemberSelect"
        style="cursor: pointer"
      >
        <el-table-column label="用户名" prop="username" width="120" show-overflow-tooltip />
        <el-table-column label="昵称" prop="nickname" width="120" show-overflow-tooltip />
        <el-table-column label="手机号" prop="phone" width="130" show-overflow-tooltip />
        <el-table-column label="余额" prop="balance" width="100" align="right">
          <template #default="scope">
            <span class="text-green-600">¥{{ scope.row.balance }}</span>
          </template>
        </el-table-column>
        <el-table-column label="累计充值" prop="totalRecharge" width="100" align="right">
          <template #default="scope">
            <span class="text-blue-600">¥{{ scope.row.totalRecharge }}</span>
          </template>
        </el-table-column>
        <el-table-column label="累计消费" prop="totalConsume" width="100" align="right">
          <template #default="scope">
            <span class="text-red-600">¥{{ scope.row.totalConsume }}</span>
          </template>
        </el-table-column>

        <el-table-column label="注册时间" prop="createTime" width="160" show-overflow-tooltip>
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
      
      <pagination
        v-if="memberTotal > 0"
        v-model:total="memberTotal"
        v-model:page="memberQueryParams.page"
        v-model:limit="memberQueryParams.limit"
        @pagination="handleMemberQuery"
      />
    </el-dialog>

    <!-- 打手选择弹窗 -->
    <el-dialog
      v-model="showWorkerDialog"
      title="选择打手（仅显示可用状态）"
      width="900px"
      @close="handleCloseWorkerDialog"
    >
      <div class="mb-4">
        <div class="text-gray-500 text-sm mb-2">
          <i-ep-info-filled class="mr-1" />
          注意：不可用的打手不会显示在此列表中，如需启用打手请前往打手管理页面
        </div>
        <el-input
          v-model="workerSearchKeyword"
          placeholder="搜索打手昵称、真实姓名或手机号"
          clearable
          style="width: 300px"
          @keyup.enter="handleWorkerSearch"
        >
          <template #append>
            <el-button @click="handleWorkerSearch">
              <i-ep-search />
            </el-button>
          </template>
        </el-input>
      </div>
      
      <el-table
        v-loading="workerLoading"
        :data="workerList"
        stripe
        @row-click="handleWorkerSelect"
        style="cursor: pointer"
      >
        <el-table-column label="昵称" prop="nickname" width="120" show-overflow-tooltip />
        <el-table-column label="真实姓名" prop="realName" width="120" show-overflow-tooltip />
        <el-table-column label="手机号" prop="phone" width="130" show-overflow-tooltip />
        <el-table-column label="每小时单价" prop="hourlyRate" width="120" align="right">
          <template #default="scope">
            <span class="text-red-600 font-medium">¥{{ scope.row.hourlyRate }}/小时</span>
          </template>
        </el-table-column>

        <el-table-column label="添加时间" prop="createTime" width="160" show-overflow-tooltip>
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
      
      <pagination
        v-if="workerTotal > 0"
        v-model:total="workerTotal"
        v-model:page="workerQueryParams.page"
        v-model:limit="workerQueryParams.limit"
        @pagination="handleWorkerQuery"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import OrderAPI, { type OrderVO, type OrderForm, type OrderQuery, type OrderStats } from '@/api/order'
import MemberAPI, { type MemberVO } from '@/api/member'
import WorkerAPI, { type WorkerVO } from '@/api/worker'
import { WORKER_STATUS } from '@/constants/worker'
import { getPaymentMethodText } from '@/utils/payment'

defineOptions({
  name: 'Order',
  inheritAttrs: false
})

// 使用API定义的类型
type OrderItem = OrderVO

// 响应式数据
const queryFormRef = ref<FormInstance>()
const orderFormRef = ref<FormInstance>()
const loading = ref(false)
const total = ref(0)
const orderList = ref<OrderItem[]>([])
const memberOptions = ref<MemberVO[]>([])
const workerOptions = ref<WorkerVO[]>([])
const dateRange = ref([])
const memberBalance = ref(0)
const hourlyRate = ref(0)

// 会员选择相关
const showMemberDialog = ref(false)
const memberList = ref<MemberVO[]>([])
const memberLoading = ref(false)
const memberTotal = ref(0)
const memberSearchKeyword = ref('')
const selectedMemberText = ref('')
const memberQueryParams = reactive({
  page: 1,
  limit: 10,
  keyword: ''
})

// 打手选择相关
const showWorkerDialog = ref(false)
const workerList = ref<WorkerVO[]>([])
const workerLoading = ref(false)
const workerTotal = ref(0)
const workerSearchKeyword = ref('')
const selectedWorkerText = ref('')
const workerQueryParams = reactive({
  page: 1,
  limit: 10,
  keyword: ''
})

// 查询参数
const queryParams = reactive({
  page: 1,
  limit: 10,
  keyword: '',
  payMethod: '',
  startTime: '',
  endTime: ''
})

// 弹窗状态
const dialog = reactive({
  visible: false,
  title: ''
})

// 表单数据
const formData = reactive<OrderForm>({
  id: undefined,
  memberId: '',
  workerId: '',
  serviceHours: 1,
  amount: 0,
  payMethod: 'scan', // 默认使用扫码支付
  remark: '',
  discountReason: '' // 优惠原因
})

// 统计数据
const statsData = reactive<OrderStats>({
  todayAmount: 0,
  todayCount: 0,
  monthAmount: 0,
  monthCount: 0,
  balancePayAmount: 0,
  balancePayCount: 0,
  qrcodePayAmount: 0,
  qrcodePayCount: 0
})

// 调试相关
const showDebug = ref(true) // 始终显示调试信息
const debugStatus = ref('初始化中...')

// 调试函数
const testDebug = () => {
  console.log('=== 手动测试调试 ===');
  console.log('当前状态:', debugStatus.value);
  console.log('会员列表:', memberList.value);
  console.log('打手列表:', workerList.value);
  console.log('订单列表:', orderList.value);
  debugStatus.value = '手动测试完成 - ' + new Date().toLocaleString();
  ElMessage.success('调试测试完成，请查看控制台');
}

const forceRefresh = async () => {
  debugStatus.value = '强制刷新中...';
  try {
    await handleQuery();
    await handleMemberQuery();
    await handleWorkerQuery();
    debugStatus.value = '强制刷新完成 - ' + new Date().toLocaleString();
    ElMessage.success('强制刷新完成');
  } catch (error) {
    debugStatus.value = '强制刷新失败: ' + (error as Error).message;
    ElMessage.error('强制刷新失败');
  }
}

// 计算属性
const calculatedAmount = computed(() => {
  return (formData.serviceHours * hourlyRate.value).toFixed(2)
})

const isAmountModified = computed(() => {
  return Math.abs(formData.amount - parseFloat(calculatedAmount.value)) > 0.01
})

const discountAmount = computed(() => {
  if (isAmountModified.value) {
    const diff = parseFloat(calculatedAmount.value) - formData.amount
    return Math.abs(diff).toFixed(2)
  }
  return '0.00'
})

const isPriceIncreased = computed(() => {
  if (isAmountModified.value) {
    return formData.amount > parseFloat(calculatedAmount.value)
  }
  return false
})

const isPriceDecreased = computed(() => {
  if (isAmountModified.value) {
    return formData.amount < parseFloat(calculatedAmount.value)
  }
  return false
})

const canSubmit = computed(() => {
  if (formData.payMethod === 'balance') {
    return memberBalance.value >= formData.amount
  }
  return true
})

// 表单验证规则
const rules: FormRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  workerId: [{ required: true, message: '请选择打手', trigger: 'change' }],
  serviceHours: [{ required: true, message: '请输入服务时长', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入实付金额', trigger: 'blur' }],
  payMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  discountReason: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (isAmountModified.value && !value) {
          callback(new Error('金额已修改，请填写优惠原因'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
}



// 订单状态类型
const getStatusTagType = (status: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    'pending': 'info',
    'in_service': 'warning',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return typeMap[status] || 'info'
}

// 表格行样式
const getRowClassName = ({ row }: { row: any }) => {
  if (row.status === 'in_service') {
    return 'in-service-row'
  }
  return ''
}



// 会员状态类型
const getMemberStatusType = (status: string): 'success' | 'danger' | 'warning' | 'info' => {
  const typeMap: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    active: 'success',
    inactive: 'danger',
    pending: 'warning'
  }
  return typeMap[status] || 'info'
}

// 会员状态文本
const getMemberStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: '正常',
    inactive: '禁用',
    pending: '待审核'
  }
  return textMap[status] || '未知'
}

// 打手状态类型
const getWorkerStatusType = (status: string): 'success' | 'danger' | 'warning' | 'info' => {
  const typeMap: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    '可用': 'success',
    '忙碌': 'warning',
    '休息': 'info',
    '禁用': 'danger'
  }
  return typeMap[status] || 'info'
}



// 时间格式化函数
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  // 直接使用 toLocaleString 并指定时区为 Asia/Shanghai（北京时间）
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai'
  })
}

// 查询
const handleQuery = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startTime = dateRange.value[0]
    queryParams.endTime = dateRange.value[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
  
  debugStatus.value = '查询订单中...'
  console.log('=== 前端订单查询开始 ===');
  console.log('查询参数:', queryParams);
  console.log('日期范围:', dateRange.value);
  
  loading.value = true
  try {
    const result = await OrderAPI.getPage(queryParams)
    
    console.log('=== 前端订单查询成功 ===');
    console.log('API响应:', result);
    console.log('订单列表长度:', result.list?.length);
    console.log('总数:', result.total);
    
    orderList.value = result.list
    total.value = result.total
    
    console.log('=== 数据更新完成 ===');
    console.log('orderList长度:', orderList.value.length);
    console.log('total值:', total.value);
    
    debugStatus.value = `订单查询完成: ${result.list?.length || 0}条`
    
  } catch (error) {
    console.error('=== 前端订单查询失败 ===');
    console.error('错误对象:', error);
    console.error('错误消息:', (error as Error).message);
    console.error('错误堆栈:', (error as Error).stack);
    debugStatus.value = `订单查询失败: ${(error as Error).message}`
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 重置查询
const handleResetQuery = () => {
  queryFormRef.value?.resetFields()
  dateRange.value = []
  handleQuery()
}

// 会员选择相关方法
const handleMemberSearch = () => {
  memberQueryParams.keyword = memberSearchKeyword.value
  memberQueryParams.page = 1
  handleMemberQuery()
}

const handleMemberQuery = async () => {
  memberLoading.value = true
  debugStatus.value = '查询会员中...'
  try {
    console.log('=== 前端会员查询开始 ===');
    console.log('查询参数:', {
      keywords: memberQueryParams.keyword,
      pageNum: memberQueryParams.page,
      pageSize: memberQueryParams.limit,
      status: 1
    });
    
    const result = await MemberAPI.getPage({
      keywords: memberQueryParams.keyword,
      pageNum: memberQueryParams.page,
      pageSize: memberQueryParams.limit,
      status: 1 // 只查询状态为正常的会员（1=正常，0=禁用）
    })
    
    console.log('=== 前端会员查询成功 ===');
    console.log('API响应:', result);
    console.log('会员列表长度:', result.list?.length);
    console.log('总数:', result.total);
    
    memberList.value = result.list
    memberTotal.value = result.total
    
    console.log('=== 数据更新完成 ===');
    console.log('memberList长度:', memberList.value.length);
    console.log('memberTotal值:', memberTotal.value);
    
    debugStatus.value = `会员查询完成: ${result.list?.length || 0}条`
    
  } catch (error) {
    console.error('=== 前端会员查询失败 ===');
    console.error('错误对象:', error);
    console.error('错误消息:', (error as Error).message);
    console.error('错误堆栈:', (error as Error).stack);
    debugStatus.value = `会员查询失败: ${(error as Error).message}`
    ElMessage.error('获取会员列表失败')
  } finally {
    memberLoading.value = false
  }
}

const handleMemberSelect = (row: MemberVO) => {
  console.log('=== 前端会员选择 ===');
  console.log('选中的会员:', row);
  console.log('会员ID:', row.id);
  console.log('会员余额:', row.balance);
  
  formData.memberId = row.id
  memberBalance.value = row.balance
  selectedMemberText.value = `${row.nickname} (${row.username})`
  
  console.log('✅ 会员选择完成');
  console.log('formData.memberId:', formData.memberId);
  console.log('memberBalance:', memberBalance.value);
  console.log('selectedMemberText:', selectedMemberText.value);
  
  showMemberDialog.value = false
  calculateAmount()
}

const handleCloseMemberDialog = () => {
  showMemberDialog.value = false
  memberSearchKeyword.value = ''
  memberQueryParams.keyword = ''
  memberQueryParams.page = 1
}

// 打手选择相关方法
const handleWorkerSearch = () => {
  workerQueryParams.keyword = workerSearchKeyword.value
  workerQueryParams.page = 1
  handleWorkerQuery()
}

const handleWorkerQuery = async () => {
  workerLoading.value = true
  debugStatus.value = '查询打手中...'
  try {
    console.log('=== 前端打手查询开始 ===');
    console.log('查询参数:', {
      keyword: workerQueryParams.keyword,
      page: workerQueryParams.page,
      limit: workerQueryParams.limit,
      status: '可用'
    });
    
    const result = await WorkerAPI.getPage({
      keyword: workerQueryParams.keyword,
      page: workerQueryParams.page,
      limit: workerQueryParams.limit,
      status: WORKER_STATUS.AVAILABLE // 使用常量，确保与后端一致
    })
    
    console.log('=== 前端打手查询成功 ===');
    console.log('API响应:', result);
    console.log('打手列表长度:', result.list?.length);
    console.log('打手列表长度:', result.list?.length);
    console.log('总数:', result.total);
    
    workerList.value = result.list
    workerTotal.value = result.total
    
    console.log('=== 数据更新完成 ===');
    console.log('workerList长度:', workerList.value.length);
    console.log('workerTotal值:', workerTotal.value);
    
    debugStatus.value = `打手查询完成: ${result.list?.length || 0}条`
    
  } catch (error) {
    console.error('=== 前端打手查询失败 ===');
    console.error('错误对象:', error);
    console.error('错误消息:', (error as Error).message);
    console.error('错误堆栈:', (error as Error).stack);
    debugStatus.value = `打手查询失败: ${(error as Error).message}`
    ElMessage.error('获取打手列表失败')
  } finally {
    workerLoading.value = false
  }
}

const handleWorkerSelect = (row: WorkerVO) => {
  console.log('=== 前端打手选择 ===');
  console.log('选中的打手:', row);
  console.log('打手ID:', row.id);
  console.log('小时单价:', row.hourlyRate);
  
  formData.workerId = row.id
  hourlyRate.value = row.hourlyRate
  selectedWorkerText.value = `${row.nickname} (¥${row.hourlyRate}/小时)`
  
  console.log('✅ 打手选择完成');
  console.log('formData.workerId:', formData.workerId);
  console.log('hourlyRate:', hourlyRate.value);
  console.log('selectedWorkerText:', selectedWorkerText.value);
  
  showWorkerDialog.value = false
  
  // 计算金额（会自动同步实付金额）
  calculateAmount()
  
  // 确保表单更新显示
  nextTick(() => {
    console.log('✅ 表单更新完成，实付金额:', formData.amount);
  })
}

const handleCloseWorkerDialog = () => {
  showWorkerDialog.value = false
  workerSearchKeyword.value = ''
  workerQueryParams.keyword = ''
  workerQueryParams.page = 1
}

// 计算金额
const calculateAmount = async () => {
  console.log('=== 前端金额计算开始 ===');
  console.log('计算参数:', { 
    workerId: formData.workerId, 
    serviceHours: formData.serviceHours,
    hourlyRate: hourlyRate.value
  });
  
  if (formData.workerId && formData.serviceHours > 0) {
    try {
      console.log('🔄 调用API计算金额...');
      const result = await OrderAPI.calculateAmount(formData.workerId, formData.serviceHours)
      
      // 在新增模式下，自动同步实付金额为计算出的金额
      if (!formData.id) {
        const oldAmount = formData.amount;
        formData.amount = result.amount;
        console.log('✅ 新增模式：实付金额从', oldAmount, '更新为:', result.amount);
        
        // 强制触发响应式更新
        nextTick(() => {
          console.log('✅ 响应式更新完成，当前实付金额:', formData.amount);
        });
      }
      
      console.log('✅ API计算金额成功:', result.amount);
    } catch (error) {
      console.error('❌ API计算金额失败:', error);
      console.log('🔄 使用本地计算...');
      // 如果API调用失败，使用本地计算
      const localAmount = parseFloat(calculatedAmount.value)
      
      // 在新增模式下，自动同步实付金额
      if (!formData.id) {
        const oldAmount = formData.amount;
        formData.amount = localAmount;
        console.log('✅ 新增模式：本地计算实付金额从', oldAmount, '更新为:', localAmount);
        
        // 强制触发响应式更新
        nextTick(() => {
          console.log('✅ 响应式更新完成，当前实付金额:', formData.amount);
        });
      }
      
      console.log('✅ 本地计算金额结果:', localAmount);
    }
  } else {
    console.log('⚠️ 计算金额条件不满足');
    console.log('workerId:', formData.workerId);
    console.log('serviceHours:', formData.serviceHours);
  }
  
  console.log('=== 金额计算完成 ===');
  console.log('最终金额:', formData.amount);
  console.log('计算属性金额:', calculatedAmount.value);
}

// 处理金额变化
const handleAmountChange = () => {
  console.log('=== 金额手动修改 ===');
  console.log('原价金额:', calculatedAmount.value);
  console.log('实付金额:', formData.amount);
  
  if (isAmountModified.value) {
    console.log('✅ 金额已修改，优惠金额:', discountAmount.value);
    // 如果金额被修改，清空优惠原因（让用户重新填写）
    if (!formData.discountReason) {
      formData.discountReason = '';
    }
  } else {
    console.log('✅ 金额未修改，使用原价');
    formData.discountReason = '';
  }
}

// 打开弹窗
const handleOpenDialog = async (id?: string) => {
  console.log('=== 前端弹窗打开 ===');
  console.log('订单ID:', id);
  
  dialog.visible = true
  // 重置选择文本
  selectedMemberText.value = ''
  selectedWorkerText.value = ''
  
  if (id) {
    console.log('🔄 编辑模式');
    dialog.title = '编辑订单'
    try {
      console.log('🔄 获取订单详情...');
      const data = await OrderAPI.getDetail(id)
      console.log('✅ 获取订单详情成功:', data);
      
      Object.assign(formData, {
        id: data.id,
        memberId: data.memberId,
        workerId: data.workerId,
        serviceHours: data.serviceHours,
        amount: data.amount,
        payMethod: data.payMethod,
        remark: data.remark,
        discountReason: data.discountReason || ''
      })
      
      console.log('✅ 表单数据更新完成:', formData);
      
      // 设置选中文本
      selectedMemberText.value = `${data.memberNickname} (${data.memberUsername})`
      selectedWorkerText.value = `${data.workerNickname} (¥${data.amount / data.serviceHours}/小时)`
      
      // 设置余额和单价
      memberBalance.value = 0 // 编辑时暂时设为0，实际应该从会员详情获取
      hourlyRate.value = data.amount / data.serviceHours
      
      console.log('✅ 编辑模式初始化完成');
      
    } catch (error) {
      console.error('❌ 获取订单详情失败:', error)
      ElMessage.error('获取订单详情失败')
    }
  } else {
    console.log('🆕 新增模式');
    dialog.title = '新增订单'
    Object.assign(formData, {
      id: undefined,
      memberId: '',
      workerId: '',
      serviceHours: 1,
      amount: 0, // 初始为0，选择打手后会自动计算
      payMethod: 'balance',
      remark: '',
      discountReason: ''
    })
    memberBalance.value = 0
    hourlyRate.value = 0
    
    console.log('✅ 新增模式初始化完成');
    console.log('初始表单数据:', formData);
  }
  
  console.log('=== 弹窗打开完成 ===');
}

// 关闭弹窗
const handleCloseDialog = () => {
  dialog.visible = false
  
  // 不要使用 resetFields()，它会重置为初始值
  // 手动清理表单数据
  Object.assign(formData, {
    id: undefined,
    memberId: '',
    workerId: '',
    serviceHours: 1,
    amount: 0, // 重置为0，下次打开时会自动计算
    payMethod: 'scan',
    remark: '',
    discountReason: ''
  })
  
  // 清理选择相关数据
  selectedMemberText.value = ''
  selectedWorkerText.value = ''
  memberBalance.value = 0
  hourlyRate.value = 0
  
  // 清理表单验证状态
  orderFormRef.value?.clearValidate()
}

// 提交表单
const handleSubmit = async () => {
  if (!orderFormRef.value) return
  
  console.log('=== 前端订单提交开始 ===');
  console.log('表单验证开始...');
  
  const valid = await orderFormRef.value.validate().catch(() => false)
  if (!valid) {
    console.log('❌ 表单验证失败');
    return
  }
  
  console.log('✅ 表单验证通过');
  
  // 验证金额
  if (formData.amount <= 0) {
    console.log('❌ 实付金额必须大于0');
    ElMessage.error('实付金额必须大于0')
    return
  }
  
  // 如果金额被修改，验证优惠原因
  if (isAmountModified.value && !formData.discountReason) {
    console.log('❌ 金额已修改，必须填写优惠原因');
    ElMessage.error('金额已修改，必须填写优惠原因')
    return
  }
  
  console.log('提交订单，实付金额:', formData.amount);
  console.log('原价金额:', calculatedAmount.value);
  console.log('优惠金额:', discountAmount.value);
  console.log('支付方式:', formData.payMethod);
  console.log('会员余额:', memberBalance.value);
  
  if (formData.payMethod === 'balance' && memberBalance.value < formData.amount) {
    console.log('❌ 会员余额不足');
    ElMessage.error('会员余额不足')
    return
  }
  
  try {
    if (formData.id) {
      console.log('🔄 开始更新订单...');
      console.log('更新数据:', formData);
      await OrderAPI.update(formData.id, formData)
      console.log('✅ 订单更新成功');
      ElMessage.success('订单更新成功')
    } else {
      console.log('🆕 开始创建订单...');
      console.log('创建数据:', formData);
      const result = await OrderAPI.create(formData)
      console.log('✅ 订单创建成功');
      console.log('API返回结果:', result);
      ElMessage.success('订单创建成功')
    }
    handleCloseDialog()
    handleQuery()
    loadStats()
  } catch (error: any) {
    console.error('💥 保存订单失败:', error);
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    ElMessage.error('保存订单失败')
  }
}

// 删除
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确认删除该订单吗？删除后会回滚会员余额。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await OrderAPI.delete(id)
    ElMessage.success('删除成功')
    handleQuery()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除订单失败:', error)
      ElMessage.error('删除订单失败')
    }
  }
}

// 上钟
const handleStartOrder = async (orderId: string) => {
  try {
    await ElMessageBox.confirm('确认上钟吗？上钟后将开始计时。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await OrderAPI.startOrder(orderId)
    ElMessage.success('上钟成功')
    handleQuery() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('上钟失败:', error)
      ElMessage.error('上钟失败')
    }
  }
}

// 下钟
const handleEndOrder = async (orderId: string) => {
  try {
    await ElMessageBox.confirm('确认下钟吗？下钟后将结束计时。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await OrderAPI.endOrder(orderId)
    ElMessage.success('下钟成功')
    handleQuery() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('下钟失败:', error)
      ElMessage.error('下钟失败')
    }
  }
}

// 导出
const handleExport = async () => {
  try {
         const response = await OrderAPI.export(queryParams)
     const url = window.URL.createObjectURL(response as unknown as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `订单列表_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const { data } = await OrderAPI.getStats()
    Object.assign(statsData, data)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 初始化
onMounted(async () => {
  console.log('=== 前端页面初始化开始 ===');
  debugStatus.value = '页面初始化开始...'
  
  try {
    console.log('🔄 加载订单列表...');
    debugStatus.value = '加载订单列表中...'
    await handleQuery()
    console.log('✅ 订单列表加载完成');
    
    console.log('🔄 加载统计数据...');
    debugStatus.value = '加载统计数据中...'
    await loadStats()
    console.log('✅ 统计数据加载完成');
    
    console.log('🔄 初始化会员列表...');
    debugStatus.value = '初始化会员列表中...'
    await handleMemberQuery()
    console.log('✅ 会员列表初始化完成');
    
    console.log('🔄 初始化打手列表...');
    debugStatus.value = '初始化打手列表中...'
    await handleWorkerQuery()
    console.log('✅ 打手列表初始化完成');
    
    console.log('🎉 页面初始化完成');
    debugStatus.value = '页面初始化完成'
  } catch (error) {
    console.error('💥 页面初始化失败:', error);
    debugStatus.value = `页面初始化失败: ${(error as Error).message}`
  }
})

// 监听服务时长变化，自动同步实付金额
watch(() => formData.serviceHours, (newHours) => {
  if (formData.workerId && newHours > 0 && !formData.id) {
    console.log('🔄 服务时长变化，自动同步实付金额');
    // 延迟计算，避免频繁调用
    setTimeout(() => {
      calculateAmount()
    }, 300)
  }
})

// 监听打手选择，自动同步实付金额
watch(() => formData.workerId, (newWorkerId) => {
  if (newWorkerId && formData.serviceHours > 0 && !formData.id) {
    console.log('🔄 打手选择变化，自动同步实付金额');
    // 延迟计算，避免频繁调用
    setTimeout(() => {
      calculateAmount()
    }, 300)
  }
})
</script>

<style lang="scss" scoped>
.search-container {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.price-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  
  .price-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.total {
      border-top: 1px solid #dee2e6;
      padding-top: 8px;
      margin-top: 8px;
    }
  }
}

.payment-detail {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-right: 16px;
  }
  
  .stat-content {
    flex: 1;
    
    .stat-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .stat-desc {
      font-size: 12px;
      color: #999;
    }
  }
}

/* 服务中订单的高亮样式 */
:deep(.in-service-row) {
  background-color: #fff7e6 !important;
  border-left: 4px solid #e6a23c;
}

:deep(.in-service-row:hover) {
  background-color: #fff2d9 !important;
}

/* 支付方式文本样式 */
.payment-method-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 状态标签样式优化 */
:deep(.el-tag) {
  font-weight: 500;
  border-radius: 4px;
}

:deep(.el-tag--info) {
  background-color: #f4f4f5;
  border-color: #e9e9eb;
  color: #909399;
}

:deep(.el-tag--warning) {
  background-color: #fdf6ec;
  border-color: #f5dab1;
  color: #e6a23c;
}

:deep(.el-tag--success) {
  background-color: #f0f9ff;
  border-color: #b3d8ff;
  color: #67c23a;
}

:deep(.el-tag--danger) {
  background-color: #fef0f0;
  border-color: #fbc4c4;
  color: #f56c6c;
}
</style>