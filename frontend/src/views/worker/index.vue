<template>
  <div class="app-container">
    <div class="search-container">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true">
        <el-form-item label="关键词" prop="keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="昵称/手机号/身份证号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="可用" value="可用" />
            <el-option label="忙碌" value="忙碌" />
            <el-option label="休息" value="休息" />
            <el-option label="禁用" value="禁用" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
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
            <i-ep-user-filled class="mr-1" />打手列表
          </div>
          <div>
            <el-button type="success" @click="handleOpenDialog()">
              <i-ep-plus />新增打手
            </el-button>
            <el-button type="info" @click="handleExport">
              <i-ep-download />导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="workerList" stripe>
        <el-table-column label="头像" width="80" align="center">
          <template #default="scope">
            <el-avatar :src="scope.row.avatar" :size="40">
              <i-ep-user-filled />
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="基本信息" width="200">
          <template #default="scope">
            <div>
              <div class="flex items-center mb-1">
                <span class="font-medium text-lg">{{ scope.row.nickname }}</span>
              </div>
              <div class="text-gray-500 text-sm mb-1">{{ scope.row.phone }}</div>
              <div class="text-gray-500 text-sm">{{ scope.row.realName }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="80" align="center">
          <template #default="scope">
            <el-tag 
              v-if="scope.row.level" 
              :type="getLevelType(scope.row.level)" 
              size="small"
            >
              {{ scope.row.level }}
            </el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="技能标签" width="120" align="center">
          <template #default="scope">
            <div class="flex flex-wrap gap-1 justify-center">
              <el-tag 
                v-for="skill in scope.row.skills" 
                :key="skill" 
                type="info" 
                size="small"
              >
                {{ skill }}
              </el-tag>
              <span v-if="!scope.row.skills || scope.row.skills.length === 0" class="text-gray-400">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="小时费率" width="100" align="center">
          <template #default="scope">
            <div class="text-center">
              <div class="text-green-600 font-bold text-lg">
                ¥{{ scope.row.hourlyRate }}/小时
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="业绩统计" width="120" align="center">
          <template #default="scope">
            <div class="text-center">
              <div class="text-blue-600 font-bold text-lg mb-1">
                {{ scope.row.totalOrders || 0 }}单
              </div>
              <div class="text-orange-600 font-medium">
                ¥{{ scope.row.totalIncome || 0 }}
              </div>
              <!-- 调试信息 -->
              <div class="text-xs text-gray-400" v-if="!scope.row.totalOrders && !scope.row.totalIncome">
                暂无数据
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="银行信息" width="150">
          <template #default="scope">
            <div>
              <div class="font-medium text-sm">{{ scope.row.bankName }}</div>
              <div class="text-gray-500 text-xs">{{ maskBankCard(scope.row.bankCard) }}</div>
              <div class="text-gray-500 text-xs">{{ maskName(scope.row.accountName) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="createTime" width="110" align="center">
          <template #default="scope">
            <div class="text-center text-sm text-gray-600">
              {{ formatDate(scope.row.createTime) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <div class="flex gap-2 justify-center">
              <el-button link type="primary" size="small" @click="handleOpenDialog(scope.row.id)">
                <i-ep-edit />编辑
              </el-button>
              <el-button link type="info" size="small" @click="handleViewDetail(scope.row.id)">
                <i-ep-view />详情
              </el-button>
              <el-button 
                link 
                size="small"
                :type="scope.row.status === '禁用' ? 'success' : 'warning'"
                @click="handleToggleStatus(scope.row.id, scope.row.status)"
              >
                {{ scope.row.status === '禁用' ? '启用' : '禁用' }}
              </el-button>
              <el-button link type="warning" size="small" @click="handleCancel(scope.row.id)">
                <i-ep-close />取消
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

    <!-- 打手表单弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="800px"
      @close="handleCloseDialog"
    >
      <el-form
        ref="workerFormRef"
        :model="formData"
        :rules="formData.id ? rules : { ...rules, ...bankRules }"
        label-width="100px"
      >
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="昵称" prop="nickname">
                  <el-input v-model="formData.nickname" placeholder="请输入昵称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="真实姓名" prop="realName">
                  <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="formData.phone" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="身份证号" prop="idCard">
                  <el-input v-model="formData.idCard" placeholder="请输入身份证号" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="小时费率" prop="hourlyRate">
                  <el-input-number
                    v-model="formData.hourlyRate"
                    :min="1"
                    :precision="2"
                    style="width: 100%"
                    placeholder="请输入小时费率"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="级别" prop="level">
                  <el-select v-model="formData.level" placeholder="请选择级别" style="width: 100%">
                    <el-option label="A" value="A" />
                    <el-option label="S" value="S" />
                    <el-option label="SSR" value="SSR" />
                    <el-option label="魔王" value="魔王" />
                  </el-select>
                  <div class="form-tip">当前级别: {{ formData.level || '未设置' }}</div>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                    <el-option label="可用" value="可用" />
                    <el-option label="忙碌" value="忙碌" />
                    <el-option label="休息" value="休息" />
                    <el-option label="禁用" value="禁用" />
                  </el-select>
                  <div class="form-tip">当前状态: {{ formData.status || '未设置' }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="技能标签" prop="skills">
                  <el-select
                    v-model="formData.skills"
                    multiple
                    placeholder="请选择技能标签"
                    style="width: 100%"
                  >
                    <el-option label="跑刀" value="跑刀" />
                    <el-option label="护航" value="护航" />
                    <el-option label="娱乐" value="娱乐" />
                    <el-option label="男陪" value="男陪" />
                    <el-option label="女陪" value="女陪" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="头像">
                  <el-upload
                    class="avatar-uploader"
                    action="#"
                    :show-file-list="false"
                    :before-upload="beforeAvatarUpload"
                    :http-request="handleAvatarUpload"
                  >
                    <img v-if="formData.avatar" :src="formData.avatar" class="avatar" />
                    <el-icon v-else class="avatar-uploader-icon"><i-ep-plus /></el-icon>
                  </el-upload>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="银行信息" name="bank">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="开户银行" prop="bankName">
                  <el-select v-model="formData.bankName" placeholder="请选择银行" style="width: 100%" filterable>
                    <el-option label="中国工商银行" value="中国工商银行" />
                    <el-option label="中国建设银行" value="中国建设银行" />
                    <el-option label="中国农业银行" value="中国农业银行" />
                    <el-option label="中国银行" value="中国银行" />
                    <el-option label="招商银行" value="招商银行" />
                    <el-option label="交通银行" value="交通银行" />
                    <el-option label="中信银行" value="中信银行" />
                    <el-option label="光大银行" value="光大银行" />
                    <el-option label="华夏银行" value="华夏银行" />
                    <el-option label="民生银行" value="民生银行" />
                    <el-option label="广发银行" value="广发银行" />
                    <el-option label="平安银行" value="平安银行" />
                    <el-option label="浦发银行" value="浦发银行" />
                    <el-option label="兴业银行" value="兴业银行" />
                  </el-select>
                  <div class="form-tip" v-if="!formData.id">* 新增打手时必填</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="银行卡号" prop="bankCard">
                  <el-input v-model="formData.bankCard" placeholder="请输入银行卡号" />
                  <div class="form-tip" v-if="!formData.id">* 新增打手时必填</div>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="开户姓名" prop="accountName">
                  <el-input v-model="formData.accountName" placeholder="请输入开户姓名" />
                  <div class="form-tip" v-if="!formData.id">* 新增打手时必填</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开户行地址" prop="bankAddress">
                  <el-input v-model="formData.bankAddress" placeholder="请输入开户行地址" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="其他信息" name="other">
            <el-form-item label="个人简介" prop="bio">
              <el-input
                v-model="formData.bio"
                type="textarea"
                placeholder="请输入个人简介"
                :rows="4"
              />
            </el-form-item>
            
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="formData.remark"
                type="textarea"
                placeholder="请输入备注"
                :rows="3"
              />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 打手详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="打手详情"
      width="1000px"
      @close="handleCloseDetailDialog"
    >
      <el-tabs v-model="detailActiveTab">
        <el-tab-pane label="基本信息" name="info">
                      <el-descriptions :column="2" border>
              <el-descriptions-item label="昵称">{{ detailData.nickname }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ detailData.phone }}</el-descriptions-item>
              <el-descriptions-item label="身份证号">{{ maskIdCard(detailData.idCard) }}</el-descriptions-item>
              <el-descriptions-item label="小时费率">¥{{ detailData.hourlyRate }}/小时</el-descriptions-item>
              <el-descriptions-item label="级别">
                <el-tag v-if="detailData.level" :type="getLevelType(detailData.level)">
                  {{ detailData.level }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="技能标签">
                <el-tag 
                  v-for="skill in detailData.skills" 
                  :key="skill" 
                  type="info" 
                  size="small" 
                  class="mr-1"
                >
                  {{ skill }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开户银行">{{ detailData.bankName }}</el-descriptions-item>
              <el-descriptions-item label="银行卡号">{{ maskBankCard(detailData.bankCard) }}</el-descriptions-item>
              <el-descriptions-item label="开户姓名">{{ maskName(detailData.accountName) }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(detailData.status)">
                  {{ getStatusText(detailData.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="注册时间">{{ detailData.createTime }}</el-descriptions-item>
              <el-descriptions-item label="最后登录">{{ detailData.lastLoginTime }}</el-descriptions-item>
            </el-descriptions>
        </el-tab-pane>
        
        <el-tab-pane label="订单记录" name="orders">
          <el-table :data="orderHistory" stripe>
            <el-table-column label="订单号" prop="orderNo" width="150" />
            <el-table-column label="会员" prop="memberUsername" width="120" />
            <el-table-column label="服务时长" width="100" align="center">
              <template #default="scope">
                {{ scope.row.serviceHours }}小时
              </template>
            </el-table-column>
            <el-table-column label="订单金额" prop="amount" width="100" align="right">
              <template #default="scope">
                ¥{{ scope.row.amount }}
              </template>
            </el-table-column>
            <el-table-column label="下单时间" prop="createTime" width="160" />
            <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="收入统计" name="earnings">
          <el-row :gutter="20" class="mb-4">
            <el-col :span="6">
              <el-card shadow="hover">
                <div class="stat-item">
                  <div class="stat-title">今日收入</div>
                  <div class="stat-value text-green-600">¥{{ earningsStats.today }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover">
                <div class="stat-item">
                  <div class="stat-title">本月收入</div>
                  <div class="stat-value text-blue-600">¥{{ earningsStats.month }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover">
                <div class="stat-item">
                  <div class="stat-title">总收入</div>
                  <div class="stat-value text-purple-600">¥{{ earningsStats.total }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover">
                <div class="stat-item">
                  <div class="stat-title">总订单</div>
                  <div class="stat-value text-orange-600">{{ earningsStats.orders }}单</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-blue-100 text-blue-600">
              <i-ep-user-filled />
            </div>
            <div class="stat-content">
              <div class="stat-title">总打手数</div>
              <div class="stat-value text-blue-600">{{ totalStats.total }}</div>
              <div class="stat-desc">较昨日 +{{ totalStats.todayNew }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-green-100 text-green-600">
              <i-ep-check />
            </div>
            <div class="stat-content">
              <div class="stat-title">可用打手</div>
              <div class="stat-value text-green-600">{{ statusStats.available }}</div>
              <div class="stat-desc">占比 {{ ((statusStats.available / totalStats.total) * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-orange-100 text-orange-600">
              <i-ep-loading />
            </div>
            <div class="stat-content">
              <div class="stat-title">忙碌打手</div>
              <div class="stat-value text-orange-600">{{ statusStats.busy }}</div>
              <div class="stat-desc">占比 {{ ((statusStats.busy / totalStats.total) * 100).toFixed(1) }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon bg-purple-100 text-purple-600">
              <i-ep-money />
            </div>
            <div class="stat-content">
              <div class="stat-title">平均费率</div>
              <div class="stat-value text-purple-600">¥{{ avgStats.hourlyRate }}</div>
              <div class="stat-desc">每小时</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import WorkerAPI from '@/api/worker'
import type { WorkerVO, WorkerForm, WorkerQuery, WorkerOrderRecord } from '@/api/worker'

defineOptions({
  name: 'Worker',
  inheritAttrs: false
})

// 响应式数据
const queryFormRef = ref<FormInstance>()
const workerFormRef = ref<FormInstance>()
const loading = ref(false)
const total = ref(0)
const workerList = ref<WorkerVO[]>([])
const dateRange = ref([])
const activeTab = ref('basic')
const detailActiveTab = ref('info')
const orderHistory = ref<WorkerOrderRecord[]>([])

// 查询参数
const queryParams = reactive<WorkerQuery>({
  page: 1,
  limit: 10,
  keyword: '',
  status: '',
  startTime: '',
  endTime: ''
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
const formData = reactive<WorkerForm>({
  id: undefined,
  username: '',
  nickname: '',
  phone: '',
  realName: '',
  idCard: '',
  hourlyRate: 100,
  status: '可用', // 修复：改为后端期望的状态值
  level: 'A', // 添加：级别字段
  avatar: '',
  bankName: '',
  bankCard: '',
  accountName: '',
  bankAddress: '',
  bio: '',
  skills: [],
  remark: ''
})

// 详情数据
const detailData = reactive({
  nickname: '',
  phone: '',
  idCard: '',
  hourlyRate: 0,
  level: '',
  skills: [] as string[],
  bankName: '',
  bankCard: '',
  accountName: '',
  status: '',
  createTime: '',
  lastLoginTime: ''
})

// 统计数据
const totalStats = reactive({ total: 0, todayNew: 0 })
const statusStats = reactive({ available: 0, busy: 0, rest: 0, disabled: 0 })
const avgStats = reactive({ hourlyRate: 0 })
const earningsStats = reactive({ today: 0, month: 0, total: 0, orders: 0 })

// 表单验证规则
const rules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  hourlyRate: [{ required: true, message: '请输入小时费率', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 银行信息验证规则（仅在新增时必填）
const bankRules: FormRules = {
  bankName: [{ required: true, message: '请选择开户银行', trigger: 'change' }],
  bankCard: [
    { required: true, message: '请输入银行卡号', trigger: 'blur' },
    { pattern: /^\d{16,19}$/, message: '银行卡号格式不正确', trigger: 'blur' }
  ],
  accountName: [{ required: true, message: '请输入开户姓名', trigger: 'blur' }]
}

// 脱敏函数
const maskIdCard = (idCard: string) => {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
}

const maskBankCard = (bankCard: string) => {
  if (!bankCard) return ''
  return bankCard.replace(/(\d{4})\d{8,11}(\d{4})/, '$1****$2')
}

const maskName = (name: string) => {
  if (!name) return ''
  if (name.length <= 2) return name
  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
}

// 状态类型
const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    '可用': 'success',
    '忙碌': 'warning',
    '休息': 'info',
    '禁用': 'danger'
  }
  return typeMap[status] || 'info'
}

// 状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    '可用': '可用',
    '忙碌': '忙碌',
    '休息': '休息',
    '禁用': '禁用'
  }
  return textMap[status] || status
}

// 级别类型
const getLevelType = (level: string): 'success' | 'warning' | 'info' | 'danger' => {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    'A': 'info',
    'S': 'success',
    'SSR': 'warning',
    '魔王': 'danger'
  }
  return typeMap[level] || 'info'
}

// 日期格式化
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
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
    const result = await WorkerAPI.getPage(queryParams)
    console.log('打手查询结果:', result)
    console.log('打手列表数据:', result.list)
    
    // 检查业绩统计数据
    if (result.list && result.list.length > 0) {
      console.log('第一个打手的业绩统计:', {
        id: result.list[0].id,
        nickname: result.list[0].nickname,
        totalOrders: result.list[0].totalOrders,
        totalIncome: result.list[0].totalIncome
      })
    }
    
    workerList.value = result.list
    total.value = result.total
  } catch (error) {
    console.error('获取打手列表失败:', error)
    ElMessage.error('获取打手列表失败')
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

// 打开弹窗
const handleOpenDialog = async (id?: string) => {
  dialog.visible = true
  activeTab.value = 'basic'
  if (id) {
    dialog.title = '编辑打手'
    try {
      const data = await WorkerAPI.getDetail(id)
      console.log('获取到的打手详情数据:', data)
      console.log('当前formData:', formData)
      Object.assign(formData, data)
      console.log('赋值后的formData:', formData)
    } catch (error) {
      console.error('获取打手详情失败:', error)
      ElMessage.error('获取打手详情失败')
    }
  } else {
    dialog.title = '新增打手'
    Object.assign(formData, {
      id: undefined,
      username: '',
      nickname: '',
      phone: '',
      realName: '',
      idCard: '',
      hourlyRate: 100,
      status: '可用',
      level: 'A',
      avatar: '',
      bankName: '',
      bankCard: '',
      accountName: '',
      bankAddress: '',
      bio: '',
      skills: [],
      remark: ''
    })
  }
}

// 关闭弹窗
const handleCloseDialog = () => {
  dialog.visible = false
  workerFormRef.value?.resetFields()
}

// 查看详情
const handleViewDetail = async (id: string) => {
  detailDialog.visible = true
  detailActiveTab.value = 'info'
  try {
    const data = await WorkerAPI.getDetail(id)
    Object.assign(detailData, data)
    
    // 获取订单记录
    const orderRes = await WorkerAPI.getOrderRecords(id)
    orderHistory.value = orderRes.list
    
    // 获取收入统计
    const statsRes = await WorkerAPI.getIncomeStats(id)
    Object.assign(earningsStats, {
      today: statsRes.todayIncome,
      month: statsRes.monthIncome,
      total: statsRes.totalIncome,
      orders: statsRes.totalOrders
    })
  } catch (error) {
    console.error('获取打手详情失败:', error)
    ElMessage.error('获取打手详情失败')
  }
}

// 关闭详情弹窗
const handleCloseDetailDialog = () => {
  detailDialog.visible = false
}

// 切换状态
const handleToggleStatus = (id: string, currentStatus: string) => {
  // 使用新的状态枚举值
  const newStatus = currentStatus === '禁用' ? '可用' : '禁用'
  const action = newStatus === '禁用' ? '禁用' : '启用'
  
  ElMessageBox.confirm(`确认${action}该打手吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await WorkerAPI.updateStatus(id, newStatus)
      ElMessage.success(`${action}成功`)
      await handleQuery()
      await loadStats()
    } catch (error) {
      console.error(`${action}失败:`, error)
      ElMessage.error(`${action}失败`)
    }
  })
}

// 提交表单
const handleSubmit = () => {
  console.log('开始提交表单...')
  console.log('表单引用:', workerFormRef.value)
  console.log('当前表单数据:', formData)
  
  // 根据模式选择验证规则
  const currentRules = formData.id ? rules : { ...rules, ...bankRules }
  
  workerFormRef.value?.validate(async (valid, fields) => {
    console.log('表单验证结果:', valid)
    console.log('验证失败字段:', fields)
    
    if (valid) {
      try {
        console.log('提交的表单数据:', formData)
        if (formData.id) {
          console.log('执行更新操作，ID:', formData.id)
          await WorkerAPI.update(formData.id, formData)
          ElMessage.success('更新成功')
        } else {
          console.log('执行创建操作')
          await WorkerAPI.create(formData)
          ElMessage.success('创建成功')
        }
        handleCloseDialog()
        console.log('开始刷新数据...')
        await handleQuery()
        await loadStats()
        console.log('数据刷新完成')
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      }
    } else {
      console.log('表单验证失败')
      // 提供更友好的验证失败提示
      if (fields) {
        const firstErrorField = Object.keys(fields)[0]
        const firstError = fields[firstErrorField]?.[0]?.message
        if (firstError) {
          ElMessage.error(`请完善信息：${firstError}`)
        } else {
          ElMessage.error('请完善必填信息')
        }
      } else {
        ElMessage.error('请完善必填信息')
      }
    }
  })
}

// 取消打手
const handleCancel = (id: string) => {
  ElMessageBox.prompt('请输入取消原因', '取消打手', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '请输入取消原因（必填）',
    inputValidator: (value) => {
      if (!value || value.trim() === '') {
        return '取消原因不能为空'
      }
      return true
    }
  }).then(async ({ value }) => {
    try {
      await WorkerAPI.delete(id, { cancel_reason: value })
      ElMessage.success('取消成功')
      await handleQuery()
      await loadStats()
    } catch (error) {
      console.error('取消失败:', error)
      ElMessage.error('取消失败')
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 导出
const handleExport = async () => {
  try {
    await WorkerAPI.export(queryParams)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 头像上传前验证
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传
const handleAvatarUpload = (options: any): Promise<unknown> => {
  // TODO: 实现头像上传逻辑
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.avatar = e.target?.result as string
      resolve(e.target?.result)
    }
    reader.readAsDataURL(options.file)
  })
}

// 加载统计数据
const loadStats = async () => {
  try {
    const data = await WorkerAPI.getStats()
    console.log('打手统计数据:', data)
    Object.assign(totalStats, { total: data.totalWorkers || 0, todayNew: 0 })
    Object.assign(statusStats, { 
      available: data.availableWorkers || 0, 
      busy: data.busyWorkers || 0, 
      rest: 0, 
      disabled: (data.totalWorkers || 0) - (data.availableWorkers || 0) - (data.busyWorkers || 0)
    })
    Object.assign(avgStats, { hourlyRate: data.averageRate || 0 })
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 初始化
onMounted(async () => {
  await handleQuery()
  await loadStats()
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

.avatar-uploader {
  .avatar {
    width: 80px;
    height: 80px;
    display: block;
    border-radius: 4px;
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 80px;
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:hover {
    border-color: #409eff;
  }
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

.stat-item {
  text-align: center;
  
  .stat-title {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: bold;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.2;
}
</style>