<template>
  <div class="app-container">
    <div class="search-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="用户名/昵称/手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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
            <i-ep-user class="mr-1" />会员列表
          </div>
          <div>
            <el-button type="success" @click="handleOpenDialog()">
              <i-ep-plus />新增
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="memberList" stripe>
        <el-table-column label="用户名" prop="username" width="120" show-overflow-tooltip />
        <el-table-column label="昵称" prop="nickname" width="120" show-overflow-tooltip />
        <el-table-column label="手机号" prop="phone" width="130" show-overflow-tooltip />
        <el-table-column label="余额" prop="balance" width="100" align="right">
          <template #default="scope">
            <span class="text-green-600">¥{{ scope.row.balance }}</span>
          </template>
        </el-table-column>
        <el-table-column label="累计充值" prop="totalRecharge" width="110" align="right">
          <template #default="scope">
            <span class="text-blue-600">¥{{ scope.row.totalRecharge }}</span>
          </template>
        </el-table-column>
        <el-table-column label="累计消费" prop="totalConsume" width="110" align="right">
          <template #default="scope">
            <span class="text-orange-600">¥{{ scope.row.totalConsume }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="createdAt" width="160" show-overflow-tooltip>
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
                 <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleOpenDialog(scope.row.id)">
              <i-ep-edit />编辑
            </el-button>
            <el-button link type="info" @click="handleViewDetail(scope.row)">
              <i-ep-view />详情
            </el-button>
            <el-button 
              v-if="scope.row.status === 1" 
              link 
              type="warning" 
              @click="handleToggleStatus(scope.row.id, 0)"
            >
              <i-ep-lock />禁用
            </el-button>
            <el-button 
              v-else 
              link 
              type="success" 
              @click="handleToggleStatus(scope.row.id, 1)"
            >
              <i-ep-unlock />启用
            </el-button>
            
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum!"
        v-model:limit="queryParams.pageSize!"
        @pagination="handleQuery"
      />
    </el-card>

    <!-- 会员表单弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      @close="handleCloseDialog"
    >
      <el-form
        ref="memberFormRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="formData.nickname" placeholder="请输入会员昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 会员详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="会员详情"
      width="800px"
      @close="detailDialog.visible = false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
        <el-descriptions-item label="会员昵称">{{ detailData.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.phone }}</el-descriptions-item>
        <el-descriptions-item label="当前余额">
          <span class="text-green-600">¥{{ detailData.balance }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="累计充值">
          <span class="text-blue-600">¥{{ detailData.totalRecharge }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="累计消费">
          <span class="text-orange-600">¥{{ detailData.totalConsume }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 'active' ? 'success' : 'danger'">
            {{ detailData.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
                 <el-descriptions-item label="注册时间" :span="2">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" class="mt-4">
        <el-tab-pane label="充值记录" name="recharge">
          <el-table :data="rechargeList" stripe>
            <el-table-column label="充值金额" prop="amount" width="100" align="right">
              <template #default="scope">
                <span class="text-green-600">+¥{{ scope.row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="支付方式" prop="paymentMethod" width="100" />
                         <el-table-column label="充值时间" prop="createdAt" width="160">
               <template #default="scope">
                 {{ formatDateTime(scope.row.createdAt) }}
               </template>
             </el-table-column>
            <el-table-column label="备注" prop="remark" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="消费记录" name="order">
          <el-table :data="orderList" stripe>
            <el-table-column label="订单编号" prop="orderNo" width="150" />
            <el-table-column label="打手" prop="workerName" width="100" />
            <el-table-column label="服务时长" prop="duration" width="100">
              <template #default="scope">
                {{ scope.row.duration }}小时
              </template>
            </el-table-column>
            <el-table-column label="消费金额" prop="actualAmount" width="100" align="right">
              <template #default="scope">
                <span class="text-red-600">-¥{{ scope.row.actualAmount }}</span>
              </template>
            </el-table-column>
                         <el-table-column label="下单时间" prop="createdAt" width="160">
               <template #default="scope">
                 {{ formatDateTime(scope.row.createdAt) }}
               </template>
             </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import MemberAPI, { type MemberQuery, type MemberVO, type MemberForm, type RechargeRecord, type ConsumeRecord } from '@/api/member'

defineOptions({
  name: 'Member',
  inheritAttrs: false
})

// 响应式数据
const queryFormRef = ref<FormInstance>()
const memberFormRef = ref<FormInstance>()
const loading = ref(false)
const total = ref(0)
const memberList = ref<MemberVO[]>([])
const rechargeList = ref<RechargeRecord[]>([])
const orderList = ref<ConsumeRecord[]>([])
const activeTab = ref('recharge')

// 查询参数
const queryParams = reactive<MemberQuery>({
  pageNum: 1,
  pageSize: 10,
  keywords: '',
  status: undefined
})

// 弹窗状态
const dialog = reactive({
  visible: false,
  title: ''
})

const detailDialog = reactive({
  visible: false
})

// 表单数据
const formData = reactive<MemberForm>({
  id: undefined,
  username: '',
  nickname: '',
  phone: '',
  status: 1
})

const detailData = reactive({
  username: '',
  nickname: '',
  phone: '',
  balance: 0,
  totalRecharge: 0,
  totalConsume: 0,
  status: '',
  createdAt: '',
  remark: ''
})

// 表单验证规则
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入会员昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
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
  try {
    console.log('=== 前端查询开始 ===');
    console.log('查询参数:', queryParams);
    console.log('查询参数类型:', typeof queryParams);
    console.log('查询参数字段:', Object.keys(queryParams));
    
    loading.value = true
    const response = await MemberAPI.getPage(queryParams)
    
    console.log('=== 前端查询成功 ===');
    console.log('API响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应字段:', Object.keys(response));
    console.log('列表数据:', response.list);
    console.log('总数:', response.total);
    
    memberList.value = response.list
    total.value = response.total
    
    console.log('=== 数据更新完成 ===');
    console.log('memberList长度:', memberList.value.length);
    console.log('total值:', total.value);
    
  } catch (error) {
    console.error('=== 前端查询失败 ===');
    console.error('错误对象:', error);
    console.error('错误消息:', (error as Error).message);
    console.error('错误堆栈:', (error as Error).stack);
    ElMessage.error('获取会员列表失败')
  } finally {
    loading.value = false
  }
}

// 重置查询
const handleResetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

// 打开弹窗
const handleOpenDialog = async (id?: string) => {
  dialog.visible = true
  if (id) {
    dialog.title = '编辑会员'
    try {
      const response = await MemberAPI.getDetail(id)
      Object.assign(formData, response)
    } catch (error) {
      console.error('获取会员详情失败:', error)
      ElMessage.error('获取会员详情失败')
    }
  } else {
    dialog.title = '新增会员'
    Object.assign(formData, {
      id: undefined,
      username: '',
      nickname: '',
      phone: '',
      status: 1
    })
  }
}

// 关闭弹窗
const handleCloseDialog = () => {
  dialog.visible = false
  memberFormRef.value?.resetFields()
}

// 提交表单
const handleSubmit = () => {
  memberFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        // 创建formData的副本，避免在API调用过程中数据被清空
        const submitData = { ...formData }
        console.log('=== 前端提交会员数据 ===')
        console.log('原始formData:', formData)
        console.log('提交的submitData:', submitData)
        console.log('submitData类型:', typeof submitData)
        console.log('submitData字段数量:', Object.keys(submitData).length)
        console.log('即将调用API:', submitData.id ? 'update' : 'create')
        
        if (submitData.id) {
          await MemberAPI.update(submitData.id, submitData)
          ElMessage.success('更新成功')
        } else {
          await MemberAPI.create(submitData)
          ElMessage.success('创建成功')
        }
        handleCloseDialog()
        handleQuery()
      } catch (error: any) {
        console.error('保存会员失败:', error)
        // 显示具体的错误信息
        const errorMessage = error?.message || '保存失败'
        ElMessage.error(errorMessage)
      }
    }
  })
}

// 查看详情
const handleViewDetail = async (row: MemberVO) => {
  Object.assign(detailData, row)
  detailDialog.visible = true
  try {
    // 获取充值记录
    const rechargeResponse = await MemberAPI.getRechargeRecords(row.id)
    rechargeList.value = rechargeResponse.list
    // 获取消费记录
    const consumeResponse = await MemberAPI.getConsumeRecords(row.id)
    orderList.value = consumeResponse.list
  } catch (error: any) {
    console.error('获取会员记录失败:', error)
    const errorMessage = error?.message || '获取会员记录失败'
    ElMessage.error(errorMessage)
  }
}

// 切换状态
const handleToggleStatus = (id: string, status: number) => {
  const action = status === 1 ? '启用' : '禁用'
  ElMessageBox.confirm(`确认${action}该会员吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await MemberAPI.toggleStatus(id, status)
      ElMessage.success(`${action}成功`)
      handleQuery()
    } catch (error: any) {
      console.error(`${action}会员失败:`, error)
      const errorMessage = error?.message || `${action}失败`
      ElMessage.error(errorMessage)
    }
  })
}



// 初始化
onMounted(() => {
  handleQuery()
})
</script>

<style lang="scss" scoped>
.search-container {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
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