<template>
  <div class="app-container">
    <div class="search-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="规则名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="规则类型" prop="type">
          <el-select v-model="queryParams.type" placeholder="请选择" clearable style="width: 120px">
            <el-option label="全局" value="global" />
            <el-option label="级别" value="level" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
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
        <div class="card-header">
          <span>分成规则管理</span>
          <el-button type="primary" @click="handleAdd">
            <i-ep-plus />新增规则
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="ruleList"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="name" label="规则名称" min-width="150" />
        <el-table-column prop="type" label="规则类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="worker_level" label="打手级别" width="100">
          <template #default="{ row }">
            <span v-if="row.type === 'level'">{{ row.worker_level }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="worker" label="打手" width="120">
          <template #default="{ row }">
            <span v-if="row.type === 'custom' && row.worker">
              {{ row.worker.name }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="commission_rate" label="分成比例" width="100">
          <template #default="{ row }">
            {{ (row.commission_rate * 100).toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              <i-ep-edit />编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              <i-ep-delete />删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入规则名称" />
        </el-form-item>
        
        <el-form-item label="规则类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择规则类型" style="width: 100%">
            <el-option label="全局" value="global" />
            <el-option label="级别" value="level" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="formData.type === 'level'"
          label="打手级别"
          prop="worker_level"
        >
          <el-select v-model="formData.worker_level" placeholder="请选择打手级别" style="width: 100%">
            <el-option label="A" value="A" />
            <el-option label="S" value="S" />
            <el-option label="SSR" value="SSR" />
            <el-option label="魔王" value="魔王" />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="formData.type === 'custom'"
          label="选择打手"
          prop="worker_id"
        >
          <el-select
            v-model="formData.worker_id"
            placeholder="请选择打手"
            style="width: 100%"
            filterable
            remote
            :remote-method="searchWorkers"
            :loading="workerLoading"
          >
            <el-option
              v-for="worker in workerOptions"
              :key="worker.id"
              :label="`${worker.name} (${worker.real_name})`"
              :value="worker.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分成比例" prop="commission_rate">
          <el-input-number
            v-model="formData.commission_rate"
            :min="0"
            :max="1"
            :precision="4"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入分成比例 (0-1)"
          />
          <div class="form-tip">分成比例范围：0-1，例如：0.7 表示打手获得70%</div>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-input-number
            v-model="formData.priority"
            :min="0"
            :max="999"
            style="width: 100%"
            placeholder="请输入优先级"
          />
          <div class="form-tip">数字越大优先级越高，自定义 > 级别 > 全局</div>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import CommissionRuleAPI, {
  type CommissionRuleVO,
  type CommissionRuleForm,
  type CommissionRuleQuery
} from '@/api/commission-rule'
import WorkerAPI, { type WorkerVO } from '@/api/worker'

defineOptions({
  name: 'CommissionRule',
  inheritAttrs: false
})

// 响应式数据
const queryFormRef = ref<FormInstance>()
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitLoading = ref(false)
const total = ref(0)
const ruleList = ref<CommissionRuleVO[]>([])
const workerOptions = ref<WorkerVO[]>([])
const workerLoading = ref(false)

// 查询参数
const queryParams = reactive<CommissionRuleQuery>({
  page: 1,
  limit: 10,
  keyword: '',
  type: '',
  status: ''
})

// 弹窗状态
const dialog = reactive({
  visible: false,
  title: ''
})

// 表单数据
const formData = reactive<CommissionRuleForm>({
  name: '',
  type: 'global',
  worker_level: '',
  worker_id: undefined,
  commission_rate: 0.7,
  priority: 0,
  status: 'active',
  remark: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 1, max: 100, message: '规则名称长度在1-100个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择规则类型', trigger: 'change' }
  ],
  worker_level: [
    { required: true, message: '请选择打手级别', trigger: 'change' }
  ],
  worker_id: [
    { required: true, message: '请选择打手', trigger: 'change' }
  ],
  commission_rate: [
    { required: true, message: '请输入分成比例', trigger: 'blur' },
    { type: 'number', min: 0, max: 1, message: '分成比例必须在0-1之间', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请输入优先级', trigger: 'blur' },
    { type: 'number', min: 0, message: '优先级不能小于0', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 获取分成规则列表
const getRuleList = async () => {
  loading.value = true
  try {
    console.log('🔍 开始获取分成规则列表');
    console.log('📋 查询参数:', queryParams);
    
    const result = await CommissionRuleAPI.getPage(queryParams)
    console.log('✅ 获取分成规则列表成功:', result);
    
    ruleList.value = result.list
    total.value = result.total
  } catch (error) {
    console.error('❌ 获取分成规则列表失败:', {
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack,
      queryParams,
      timestamp: new Date().toISOString()
    });
    
    // 根据错误类型显示不同的错误信息
    if (error.message.includes('Network Error')) {
      ElMessage.error('网络连接失败，请检查网络设置');
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请稍后重试');
    } else if (error.message.includes('404')) {
      ElMessage.error('API端点不存在，请检查后端服务');
    } else if (error.message.includes('500')) {
      ElMessage.error('服务器内部错误，请稍后重试');
    } else {
      ElMessage.error(`获取分成规则列表失败: ${error.message}`);
    }
  } finally {
    loading.value = false
  }
}

// 搜索打手
const searchWorkers = async (query: string) => {
  if (query) {
    workerLoading.value = true
    try {
      const result = await WorkerAPI.getPage({
        page: 1,
        limit: 20,
        keyword: query
      })
      workerOptions.value = result.list
    } catch (error) {
      console.error('搜索打手失败:', error)
    } finally {
      workerLoading.value = false
    }
  } else {
    workerOptions.value = []
  }
}

// 查询
const handleQuery = () => {
  queryParams.page = 1
  getRuleList()
}

// 重置查询
const handleResetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.page = 1
  getRuleList()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  queryParams.limit = size
  queryParams.page = 1
  getRuleList()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  queryParams.page = page
  getRuleList()
}

// 新增
const handleAdd = () => {
  dialog.title = '新增分成规则'
  dialog.visible = true
  resetForm()
}

// 编辑
const handleEdit = (row: CommissionRuleVO) => {
  dialog.title = '编辑分成规则'
  dialog.visible = true
  Object.assign(formData, row)
}

// 删除
const handleDelete = async (row: CommissionRuleVO) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分成规则"${row.name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await CommissionRuleAPI.delete(row.id)
    ElMessage.success('删除成功')
    getRuleList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分成规则失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitLoading.value = true

    if (formData.id) {
      await CommissionRuleAPI.update(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await CommissionRuleAPI.create(formData)
      ElMessage.success('创建成功')
    }

    dialog.visible = false
    getRuleList()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    id: undefined,
    name: '',
    type: 'global',
    worker_level: '',
    worker_id: undefined,
    commission_rate: 0.7,
    priority: 0,
    status: 'active',
    remark: ''
  })
  formRef.value?.clearValidate()
}

// 获取类型标签样式
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    global: 'info',
    level: 'warning',
    custom: 'success'
  }
  return typeMap[type] || 'info'
}

// 获取类型文本
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    global: '全局',
    level: '级别',
    custom: '自定义'
  }
  return typeMap[type] || type
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 监听规则类型变化
const handleTypeChange = () => {
  formData.worker_level = ''
  formData.worker_id = undefined
}

// 监听弹窗关闭
const handleDialogClose = () => {
  resetForm()
}

onMounted(() => {
  getRuleList()
})
</script>

<style scoped>
.search-container {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
