<template>
  <div class="app-container">
    <div class="search-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="会员昵称/手机号/订单号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="支付方式" prop="payMethod">
          <el-select v-model="queryParams.payMethod" placeholder="请选择" clearable style="width: 120px">
            <el-option label="扫码" value="scan" />
          </el-select>
        </el-form-item>
        <el-form-item label="充值时间">
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
            <i-ep-money class="mr-1" />充值记录
          </div>
          <div>
            <el-button type="success" @click="handleOpenDialog()">
              <i-ep-plus />新增充值
            </el-button>
            <el-button type="info" @click="handleExport">
              <i-ep-download />导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="rechargeList" stripe>
        <el-table-column label="充值编号" prop="rechargeNo" width="180" show-overflow-tooltip />
        <el-table-column label="会员信息" width="160">
          <template #default="scope">
            <div>
              <div class="font-medium">{{ scope.row.memberNickname }}</div>
              <div class="text-gray-500 text-sm">{{ scope.row.memberUsername }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="充值金额" prop="amount" width="120" align="right">
          <template #default="scope">
            <span class="text-green-600 font-medium">+¥{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
                 <el-table-column label="支付方式" prop="payMethod" width="110" align="center">
           <template #default="scope">
             <span class="payment-method-text">{{ getPaymentMethodText(scope.row.payMethod) }}</span>
           </template>
         </el-table-column>
        <el-table-column label="余额变动" prop="balanceChange" width="120" align="right">
          <template #default="scope">
            <span class="text-green-600">+¥{{ scope.row.balanceChange }}</span>
          </template>
        </el-table-column>
        <el-table-column label="充值时间" prop="createTime" width="180" show-overflow-tooltip>
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorName" width="100" show-overflow-tooltip />
        <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="130" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleOpenDialog(scope.row.id)">
              <i-ep-edit />编辑
            </el-button>
            <el-button 
              v-if="scope.row.status !== 'cancelled'"
              link 
              type="danger" 
              @click="handleCancel(scope.row.id)"
            >
              <i-ep-close />取消
            </el-button>
            <el-tag v-else type="danger" size="small">已取消</el-tag>
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

    <!-- 充值表单弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      @close="handleCloseDialog"
    >
      <el-form
        ref="rechargeFormRef"
        :model="formData"
        :rules="formData.id ? { remark: [] } : rules"
        label-width="100px"
      >
        <!-- 编辑模式：只读字段 -->
        <template v-if="formData.id">
          <el-form-item label="充值编号">
            <el-input :value="editDisplayData.rechargeNo" readonly />
          </el-form-item>
          <el-form-item label="会员信息">
            <el-input :value="editDisplayData.memberName" readonly />
          </el-form-item>
          <el-form-item label="充值金额">
            <el-input :value="`¥${editDisplayData.amount}`" readonly />
          </el-form-item>
          <el-form-item label="支付方式">
            <el-input :value="editDisplayData.payMethodText" readonly />
          </el-form-item>
          <el-form-item label="操作人">
            <el-input :value="editDisplayData.operatorName" readonly />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :rows="3"
            />
          </el-form-item>
        </template>
        
        <!-- 新增模式：可编辑字段 -->
        <template v-else>
          <el-form-item label="选择会员" prop="memberId">
            <el-select
              v-model="formData.memberId"
              placeholder="请选择会员"
              filterable
              remote
              :remote-method="searchMembers"
              style="width: 100%"
              @change="handleMemberChange"
            >
              <el-option
                v-for="member in memberOptions"
                :key="member.id"
                :label="`${member.nickname} (${member.username})`"
                :value="member.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="当前余额">
            <el-input :value="`¥${currentBalance}`" readonly />
          </el-form-item>
          <el-form-item label="充值金额" prop="amount">
            <el-input-number
              v-model="formData.amount"
              :min="0.01"
              :precision="2"
              style="width: 100%"
              placeholder="请输入充值金额"
            />
          </el-form-item>
          <el-form-item label="支付方式" prop="payMethod">
            <el-radio-group v-model="formData.payMethod">
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
        </template>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-blue-100 text-blue-600">
              <i-ep-money />
            </div>
            <div class="stat-content">
              <div class="stat-title">今日充值</div>
              <div class="stat-value text-blue-600">¥{{ todayStats.amount }}</div>
              <div class="stat-desc">{{ todayStats.count }}笔</div>
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
              <div class="stat-title">本月充值</div>
              <div class="stat-value text-green-600">¥{{ monthStats.amount }}</div>
              <div class="stat-desc">{{ monthStats.count }}笔</div>
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
              <div class="stat-value text-orange-600">{{ paymentStats.balance.amount }}</div>
              <div class="stat-desc">{{ paymentStats.balance.count }}笔</div>
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
              <div class="stat-value text-purple-600">{{ paymentStats.scan.amount }}</div>
              <div class="stat-desc">{{ paymentStats.scan.count }}笔</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import RechargeAPI, { type RechargeVO, type RechargeForm, type RechargeQuery } from '@/api/recharge'
import MemberAPI, { type MemberVO } from '@/api/member'

defineOptions({
  name: 'Recharge',
  inheritAttrs: false
})

// 响应式数据
const queryFormRef = ref<FormInstance>()
const rechargeFormRef = ref<FormInstance>()
const loading = ref(false)
const total = ref(0)
const rechargeList = ref<RechargeVO[]>([])
const memberOptions = ref<MemberVO[]>([])
const dateRange = ref([])
const currentBalance = ref(0)

// 查询参数
const queryParams = reactive<RechargeQuery>({
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
const formData = reactive<RechargeForm>({
  id: undefined,
  memberId: '',
  amount: 0,
  payMethod: 'scan',
  remark: ''
})

// 编辑时的显示数据
const editDisplayData = reactive({
  rechargeNo: '',
  memberName: '',
  amount: 0,
  payMethodText: '',
  operatorName: ''
})

// 统计数据
const todayStats = reactive({ amount: 0, count: 0 })
const monthStats = reactive({ amount: 0, count: 0 })
const paymentStats = reactive({
  balance: { amount: 0, count: 0 },
  scan: { amount: 0, count: 0 }
})

// 表单验证规则
const rules: FormRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  amount: [{ required: true, message: '请输入充值金额', trigger: 'blur' }],
  payMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }]
}



// 支付方式文本
const getPaymentMethodText = (method: string) => {
  const textMap: Record<string, string> = {
    balance: '余额支付',
    scan: '扫码支付',
    qrcode: '扫码支付' // 兼容旧值
  }
  return textMap[method] || '未知'
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
  
  loading.value = true
  try {
    const result = await RechargeAPI.getPage(queryParams)
    console.log('充值查询结果:', result)
    rechargeList.value = result.list
    total.value = result.total
  } catch (error) {
    console.error('充值查询失败:', error)
    ElMessage.error('获取充值记录失败')
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

// 搜索会员
const searchMembers = async (query: string) => {
  if (query) {
    try {
      console.log('搜索会员，查询词:', query);
      const result = await MemberAPI.getPage({ keywords: query, pageNum: 1, pageSize: 10 })
      console.log('会员搜索结果:', result);
      memberOptions.value = result.list
      console.log('设置会员选项:', memberOptions.value);
    } catch (error) {
      console.error('搜索会员失败:', error);
      ElMessage.error('搜索会员失败')
    }
  }
}

// 会员变更
const handleMemberChange = (memberId: string) => {
  const member = memberOptions.value.find(m => m.id === memberId)
  if (member) {
    currentBalance.value = member.balance
  }
}

// 打开弹窗
const handleOpenDialog = async (id?: string) => {
  dialog.visible = true
  if (id) {
    dialog.title = '编辑充值记录'
    try {
      const data = await RechargeAPI.getDetail(id)
      Object.assign(formData, {
        id: data.id,
        memberId: data.memberId,
        amount: data.amount,
        payMethod: data.payMethod,
        remark: data.remark
      })
      // 设置显示数据
      Object.assign(editDisplayData, {
        rechargeNo: data.rechargeNo,
        memberName: `${data.memberNickname} (${data.memberUsername})`,
        amount: data.amount,
        payMethodText: getPaymentMethodText(data.payMethod),
        operatorName: data.operatorName || ''
      })
    } catch (error) {
      ElMessage.error('获取充值记录详情失败')
    }
  } else {
    dialog.title = '新增充值'
    Object.assign(formData, {
      id: undefined,
      memberId: '',
      amount: 0,
      payMethod: 'scan',
      remark: ''
    })
    // 清空显示数据
    Object.assign(editDisplayData, {
      rechargeNo: '',
      memberName: '',
      amount: 0,
      payMethodText: '',
      operatorName: ''
    })
    currentBalance.value = 0
  }
}

// 关闭弹窗
const handleCloseDialog = () => {
  dialog.visible = false
  rechargeFormRef.value?.resetFields()
  memberOptions.value = []
}

// 提交表单
const handleSubmit = () => {
  rechargeFormRef.value?.validate(async (valid) => {
    if (valid) {
      // 防止重复提交
      if (loading.value) {
        console.log('正在处理中，忽略重复提交');
        return;
      }
      
      loading.value = true;
      try {
        console.log('提交充值表单数据:', formData);
        
        if (formData.id) {
          // 编辑时只更新备注
          const updateResult = await RechargeAPI.update(formData.id, { remark: formData.remark } as any)
          console.log('更新结果:', updateResult);
          ElMessage.success('更新成功')
        } else {
          const createResult = await RechargeAPI.create(formData)
          console.log('创建结果:', createResult);
          ElMessage.success('充值成功')
        }
        console.log('关闭弹窗');
        handleCloseDialog()
        console.log('刷新充值列表');
        await handleQuery()
        console.log('刷新统计数据');
        await loadStats()
        console.log('充值操作完成');
      } catch (error: any) {
        console.error('充值操作失败:', error);
        console.error('错误详情:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        ElMessage.error(error.response?.data?.message || error.message || '操作失败')
      } finally {
        loading.value = false;
      }
    }
  })
}

// 取消
const handleCancel = (id: string) => {
  ElMessageBox.confirm('确认取消该充值记录吗？取消后会回滚会员余额。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await RechargeAPI.delete(id)
      ElMessage.success('取消成功')
      handleQuery()
      loadStats()
    } catch (error) {
      ElMessage.error('取消失败')
    }
  })
}

// 导出
const handleExport = async () => {
  try {
    const response = await RechargeAPI.export(queryParams)
    const url = window.URL.createObjectURL(response as unknown as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `充值记录_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const stats = await RechargeAPI.getStats()
    console.log('统计数据:', stats);
    Object.assign(todayStats, { amount: stats.todayAmount, count: stats.todayCount })
    Object.assign(monthStats, { amount: stats.monthAmount, count: stats.monthCount })
    Object.assign(paymentStats, {
      balance: { amount: stats.balancePayAmount, count: stats.balancePayCount },
      scan: { amount: stats.qrcodePayAmount, count: stats.qrcodePayCount }
    })
  } catch (error) {
    console.error('获取统计数据失败:', error);
    ElMessage.error('获取统计数据失败')
  }
}

// 初始化
onMounted(async () => {
  try {
    console.log('充值页面初始化开始');
    await handleQuery()
    await loadStats()
    console.log('充值页面初始化完成');
  } catch (error) {
    console.error('充值页面初始化失败:', error);
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

/* 支付方式文本样式 */
.payment-method-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
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
</style>