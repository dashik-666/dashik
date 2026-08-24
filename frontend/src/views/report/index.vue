<template>
  <div class="app-container">
    <!-- 今日概览 -->
    <el-card shadow="never" class="overview-card mb-4">
      <template #header>
        <div class="flex-x-between">
          <div class="flex-y-center">
            <i-ep-data-analysis class="mr-1" />今日概览
          </div>
          <div class="text-gray-500 text-sm">
            {{ currentDate }}
          </div>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-icon bg-blue-100 text-blue-600">
              <i-ep-shopping-cart />
            </div>
            <div class="overview-content">
              <div class="overview-title">订单数量</div>
              <div class="overview-value text-blue-600">{{ todayOverview.orderCount }}</div>
              <div class="overview-desc">订单金额 ¥{{ todayOverview.orderAmount }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-icon bg-green-100 text-green-600">
              <i-ep-wallet />
            </div>
            <div class="overview-content">
              <div class="overview-title">充值数量</div>
              <div class="overview-value text-green-600">{{ todayOverview.rechargeCount }}</div>
              <div class="overview-desc">充值金额 ¥{{ todayOverview.rechargeAmount }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-icon bg-orange-100 text-orange-600">
              <i-ep-user />
            </div>
            <div class="overview-content">
              <div class="overview-title">新增会员</div>
              <div class="overview-value text-orange-600">{{ todayOverview.newMembers }}</div>
              <div class="overview-desc">总会员 {{ todayOverview.totalMembers }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-icon bg-purple-100 text-purple-600">
              <i-ep-user-filled />
            </div>
            <div class="overview-content">
              <div class="overview-title">活跃打手</div>
              <div class="overview-value text-purple-600">{{ todayOverview.activeWorkers }}</div>
              <div class="overview-desc">总打手 {{ todayOverview.totalWorkers }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-icon bg-red-100 text-red-600">
              <i-ep-money />
            </div>
            <div class="overview-content">
              <div class="overview-title">总收入</div>
              <div class="overview-value text-red-600">¥{{ todayOverview.totalIncome }}</div>
              <div class="overview-desc">较昨日 {{ todayOverview.incomeChange >= 0 ? '+' : '' }}{{ todayOverview.incomeChange }}%</div>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-icon bg-cyan-100 text-cyan-600">
              <i-ep-trend-charts />
            </div>
            <div class="overview-content">
              <div class="overview-title">平台余额</div>
              <div class="overview-value text-cyan-600">¥{{ todayOverview.platformBalance }}</div>
              <div class="overview-desc">可提现余额</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20">
      <!-- 趋势图表 -->
      <el-col :span="16">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="flex-x-between">
              <div class="flex-y-center">
                <i-ep-trend-charts class="mr-1" />趋势分析
              </div>
              <div>
                <el-radio-group v-model="trendType" size="small" @change="loadTrendData">
                  <el-radio-button value="order">订单趋势</el-radio-button>
                  <el-radio-button value="recharge">充值趋势</el-radio-button>
                </el-radio-group>
                <el-select v-model="trendPeriod" size="small" style="width: 100px; margin-left: 10px" @change="loadTrendData">
                  <el-option label="7天" value="7" />
                  <el-option label="30天" value="30" />
                  <el-option label="90天" value="90" />
                </el-select>
              </div>
            </div>
          </template>
          
          <div ref="trendChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <!-- 支付方式分布 -->
      <el-col :span="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="flex-y-center">
              <i-ep-pie-chart class="mr-1" />支付方式分布
            </div>
          </template>
          
          <div ref="paymentChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-4">
      <!-- 会员排行榜 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex-x-between">
              <div class="flex-y-center">
                <i-ep-trophy class="mr-1" />会员消费排行榜
              </div>
              <el-select v-model="memberRankingPeriod" size="small" style="width: 100px" @change="loadMemberRanking">
                <el-option label="今日" value="today" />
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
              </el-select>
            </div>
          </template>
          
          <div class="ranking-list">
            <div v-for="(item, index) in memberRanking" :key="item.id" class="ranking-item">
              <div class="ranking-number">
                <el-tag v-if="index < 3" :type="getRankingType(index)" size="small">
                  {{ index + 1 }}
                </el-tag>
                <span v-else class="text-gray-500">{{ index + 1 }}</span>
              </div>
              <div class="ranking-avatar">
                <el-avatar :src="item.avatar" :size="32">
                  <i-ep-user />
                </el-avatar>
              </div>
              <div class="ranking-info">
                <div class="ranking-name">{{ item.nickname }}</div>
                <div class="ranking-desc">{{ item.phone }}</div>
              </div>
              <div class="ranking-value">
                <div class="ranking-amount">¥{{ item.amount }}</div>
                <div class="ranking-count">{{ item.orderCount }}单</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 打手排行榜 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex-x-between">
              <div class="flex-y-center">
                <i-ep-medal class="mr-1" />打手收入排行榜
              </div>
              <el-select v-model="workerRankingPeriod" size="small" style="width: 100px" @change="loadWorkerRanking">
                <el-option label="今日" value="today" />
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
              </el-select>
            </div>
          </template>
          
          <div class="ranking-list">
            <div v-for="(item, index) in workerRanking" :key="item.id" class="ranking-item">
              <div class="ranking-number">
                <el-tag v-if="index < 3" :type="getRankingType(index)" size="small">
                  {{ index + 1 }}
                </el-tag>
                <span v-else class="text-gray-500">{{ index + 1 }}</span>
              </div>
              <div class="ranking-avatar">
                <el-avatar :src="item.avatar" :size="32">
                  <i-ep-user-filled />
                </el-avatar>
              </div>
              <div class="ranking-info">
                <div class="ranking-name">{{ item.nickname }}</div>
                <div class="ranking-desc">{{ item.phone }}</div>
              </div>
              <div class="ranking-value">
                <div class="ranking-amount">¥{{ item.earnings }}</div>
                <div class="ranking-count">{{ item.orderCount }}单</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据统计表格 -->
    <el-card shadow="never" class="mt-4">
      <template #header>
        <div class="flex-x-between">
          <div class="flex-y-center">
            <i-ep-data-line class="mr-1" />数据统计
          </div>
          <div>
            <el-date-picker
              v-model="statsDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              size="small"
              @change="loadStatsData"
            />
            <el-button type="primary" size="small" class="ml-2" @click="handleExportStats">
              <i-ep-download />导出报表
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="statsData" stripe>
        <el-table-column label="日期" prop="date" width="120" />
        <el-table-column label="订单数量" prop="orderCount" width="100" align="center" />
        <el-table-column label="订单金额" prop="orderAmount" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.orderAmount }}
          </template>
        </el-table-column>
        <el-table-column label="充值数量" prop="rechargeCount" width="100" align="center" />
        <el-table-column label="充值金额" prop="rechargeAmount" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.rechargeAmount }}
          </template>
        </el-table-column>
        <el-table-column label="新增会员" prop="newMembers" width="100" align="center" />
        <el-table-column label="活跃会员" prop="activeMembers" width="100" align="center" />
        <el-table-column label="活跃打手" prop="activeWorkers" width="100" align="center" />
        <el-table-column label="平台收入" prop="platformIncome" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.platformIncome }}
          </template>
        </el-table-column>
        <el-table-column label="余额支付" prop="balancePayment" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.balancePayment }}
          </template>
        </el-table-column>
        <el-table-column label="扫码支付" prop="scanPayment" width="120" align="right">
          <template #default="scope">
            ¥{{ scope.row.scanPayment }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import ReportAPI, { type DashboardStats, type TrendData, type PayMethodStats, type MemberRanking, type WorkerRanking, type DetailStats } from '@/api/report'

defineOptions({
  name: 'Report',
  inheritAttrs: false
})

// 响应式数据
const trendChartRef = ref()
const paymentChartRef = ref()
const trendType = ref<'order' | 'recharge' | 'consume'>('order')
const trendPeriod = ref<'7' | '30' | '90'>('7')
const memberRankingPeriod = ref<'today' | 'week' | 'month'>('today')
const workerRankingPeriod = ref<'today' | 'week' | 'month'>('today')
const statsDateRange = ref<string[]>([])
const memberRanking = ref<any[]>([])
const workerRanking = ref<any[]>([])
const statsData = ref<any[]>([])

// 图表实例
let trendChart: echarts.ECharts | null = null
let paymentChart: echarts.ECharts | null = null

// 当前日期
const currentDate = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
})

// 今日概览数据
const todayOverview = reactive({
  orderCount: 0,
  orderAmount: 0,
  rechargeCount: 0,
  rechargeAmount: 0,
  newMembers: 0,
  totalMembers: 0,
  activeWorkers: 0,
  totalWorkers: 0,
  totalIncome: 0,
  incomeChange: 0,
  platformBalance: 0
})

// 排行榜类型
const getRankingType = (index: number): 'danger' | 'warning' | 'success' | 'info' => {
  const types: ('danger' | 'warning' | 'success' | 'info')[] = ['danger', 'warning', 'success']
  return types[index] || 'info'
}

// 加载今日概览
const loadTodayOverview = async () => {
  try {
    const data = await ReportAPI.getDashboardStats()
    console.log('今日概览数据:', data)
    Object.assign(todayOverview, {
      orderCount: data.todayOrders || 0,
      orderAmount: 0, // 需要从趋势数据获取
      rechargeCount: data.todayRecharge || 0,
      rechargeAmount: 0, // 需要从趋势数据获取
      newMembers: data.todayMembers || 0,
      totalMembers: 0, // 需要从其他API获取
      activeWorkers: data.todayWorkers || 0,
      totalWorkers: 0, // 需要从其他API获取
      totalIncome: data.todayIncome || 0,
      incomeChange: 0, // 需要计算
      platformBalance: data.platformBalance || 0
    })
  } catch (error) {
    console.error('获取今日概览失败:', error)
    ElMessage.error('获取今日概览失败')
  }
}

// 加载趋势数据
const loadTrendData = async () => {
  try {
    console.log('🔄 === 开始加载趋势数据 ===')
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(trendPeriod.value))
    
    const queryParams = {
      type: trendType.value, // 添加必需的type参数
      period: (trendPeriod.value + 'd') as '7d' | '30d' | '90d', // 修复类型
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
    
    console.log('📊 趋势查询参数:', queryParams)
    console.log('📅 时间范围:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startDateFormatted: startDate.toISOString().split('T')[0],
      endDateFormatted: endDate.toISOString().split('T')[0]
    })
    
    console.log('🚀 调用趋势数据API...')
    const data = await ReportAPI.getTrendData(queryParams)
    
    console.log('📥 趋势数据API响应:', data)
    console.log('📊 响应数据类型:', typeof data)
    console.log('📊 是否为数组:', Array.isArray(data))
    console.log('📊 响应数据详情:', {
      length: Array.isArray(data) ? data.length : 'N/A',
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'N/A',
      lastItem: Array.isArray(data) && data.length > 0 ? data[data.length - 1] : 'N/A'
    })
    
    // 如果没有数据，创建默认的空数据
    let chartData = data
    if (!Array.isArray(data) || data.length === 0) {
      console.log('⚠️ 趋势数据为空，创建默认空数据')
      // 创建最近7天的空数据
      const dates = []
      const values = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }))
        values.push(0)
      }
      chartData = dates.map((date, index) => ({
        date: date,
        orderCount: values[index],
        rechargeAmount: values[index]
      }))
      console.log('📊 创建的默认数据:', chartData)
    } else {
      console.log('✅ 使用API返回的实际数据')
    }
    
    console.log('🔄 处理图表数据...')
    const dates = chartData.map((item: any, index: number) => {
       console.log(`📅 处理第${index + 1}个日期项:`, item)
       const date = new Date(item.date)
       const formattedDate = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
       console.log(`📅 日期转换: ${item.date} -> ${formattedDate}`)
       return formattedDate
     })
     const values = chartData.map((item: any, index: number) => {
       const value = trendType.value === 'order' ? (item.orderCount || 0) : (item.rechargeAmount || 0)
       console.log(`📊 处理第${index + 1}个数值项:`, { item, value, trendType: trendType.value })
       return value
     })
     
     console.log('📊 处理后的趋势数据:', { dates, values })
     console.log('📊 数据统计:', {
       datesCount: dates.length,
       valuesCount: values.length,
       maxValue: Math.max(...values),
       minValue: Math.min(...values),
       totalValue: values.reduce((sum, val) => sum + val, 0)
     })
     
     nextTick(() => {
      if (trendChart) {
        console.log('🎨 设置趋势图表选项...')
        const chartOption = {
          title: {
            text: trendType.value === 'order' ? '订单趋势' : '充值趋势',
            left: 'center',
            textStyle: { fontSize: 14 }
          },
          tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
              const data = params[0]
              return `${data.name}<br/>${data.seriesName}: ${trendType.value === 'order' ? data.value + '单' : '¥' + data.value}`
            }
          },
          xAxis: {
            type: 'category',
            data: dates,
            axisLabel: { fontSize: 12 }
          },
          yAxis: {
            type: 'value',
            axisLabel: { fontSize: 12 }
          },
          series: [{
            name: trendType.value === 'order' ? '订单数量' : '充值金额',
            type: 'line',
            data: values,
            smooth: true,
            itemStyle: { color: '#409EFF' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
                ]
              }
            }
          }],
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          }
        }
        
        console.log('🎨 图表配置:', chartOption)
        trendChart.setOption(chartOption)
        console.log('✅ 趋势图表设置完成')
      } else {
        console.warn('⚠️ 趋势图表实例未找到')
      }
    })
  } catch (error) {
    console.error('❌ 获取趋势数据失败:', error)
    console.error('❌ 错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    ElMessage.error('获取趋势数据失败')
  }
}

// 加载支付方式分布
const loadPaymentDistribution = async () => {
  try {
    console.log('开始加载支付方式分布数据...')
    const data = await ReportAPI.getPayMethodStats({
      type: 'order' // 添加必需的type参数，默认查询订单支付方式
    })
    
    console.log('支付方式分布API响应:', data)
    
    // 如果没有数据，创建默认的空数据
    let chartData = data
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('支付方式分布数据为空，创建默认空数据')
      chartData = [
        { method: 'balance', percentage: 0 },
        { method: 'qrcode', percentage: 0 }
      ]
    }
    
    const processedData = chartData.map((item: any) => ({
       value: item.percentage || 0,
       name: item.method === 'balance' ? '余额支付' : 
             item.method === 'qrcode' ? '扫码支付' : '混合支付'
     }))
     
     console.log('处理后的支付方式数据:', processedData)
     
     nextTick(() => {
      if (paymentChart) {
        console.log('设置支付方式图表选项...')
        paymentChart.setOption({
          title: {
            text: '支付方式',
            left: 'center',
            top: 'bottom',
            textStyle: { fontSize: 14 }
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c}% ({d}%)'
          },
          series: [{
            name: '支付方式',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            data: processedData,
            itemStyle: {
              borderRadius: 5,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        })
        console.log('支付方式图表设置完成')
      } else {
        console.warn('支付方式图表实例未找到')
      }
    })
  } catch (error) {
    console.error('获取支付方式分布失败:', error)
    ElMessage.error('获取支付方式分布失败')
  }
}

// 加载会员排行榜
const loadMemberRanking = async () => {
  try {
    console.log('开始加载会员排行榜...')
    const period = memberRankingPeriod.value
    const endDate = new Date()
    const startDate = new Date()
    
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      startDate.setDate(endDate.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(endDate.getMonth() - 1)
    }
    
    console.log('会员排行榜查询参数:', {
      type: 'consume',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 10
    })
    
    const data = await ReportAPI.getMemberRanking({
      type: 'consume', // 添加必需的type参数，查询消费排行榜
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 10
    })
    
    console.log('会员排行榜API响应:', data)
    console.log('数据类型:', typeof data)
    console.log('是否为数组:', Array.isArray(data))
    
    // 如果没有数据，创建默认的空数据
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('会员排行榜数据为空，创建默认空数据')
      memberRanking.value = [
        { id: 1, nickname: '暂无数据', phone: '-', avatar: '', amount: 0, orderCount: 0 }
      ]
    } else {
      console.log('处理会员排行榜数据...')
      memberRanking.value = data.map((item: any, index: number) => {
        console.log(`处理第${index + 1}条数据:`, item)
        return {
          id: item.memberId || item.id || index + 1,
          nickname: item.memberNickname || item.nickname || '未知用户',
          phone: item.memberUsername || item.username || item.phone || '-',
          avatar: '',
          amount: item.totalConsume || item.total_amount || item.amount || 0,
          orderCount: item.orderCount || item.order_count || 0
        }
      })
    }
    
    console.log('最终会员排行榜数据:', memberRanking.value)
  } catch (error) {
    console.error('获取会员排行榜失败:', error)
    ElMessage.error('获取会员排行榜失败')
    // 设置默认空数据
    memberRanking.value = [
      { id: 1, nickname: '加载失败', phone: '-', avatar: '', amount: 0, orderCount: 0 }
    ]
  }
}

// 加载打手排行榜
const loadWorkerRanking = async () => {
  try {
    console.log('开始加载打手排行榜...')
    const period = workerRankingPeriod.value
    const endDate = new Date()
    const startDate = new Date()
    
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      startDate.setDate(endDate.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(endDate.getMonth() - 1)
    }
    
    console.log('打手排行榜查询参数:', {
      type: 'consume',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 10
    })
    
    const data = await ReportAPI.getWorkerRanking({
      type: 'consume', // 添加必需的type参数，查询收入排行榜
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 10
    })
    
    console.log('打手排行榜API响应:', data)
    console.log('数据类型:', typeof data)
    console.log('是否为数组:', Array.isArray(data))
    
    // 如果没有数据，创建默认的空数据
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('打手排行榜数据为空，创建默认空数据')
      workerRanking.value = [
        { id: 1, nickname: '暂无数据', phone: '-', avatar: '', earnings: 0, orderCount: 0 }
      ]
    } else {
      console.log('处理打手排行榜数据...')
      workerRanking.value = data.map((item: any, index: number) => {
        console.log(`处理第${index + 1}条数据:`, item)
        return {
          id: item.workerId || item.id || index + 1,
          nickname: item.workerNickname || item.nickname || item.name || '未知打手',
          phone: item.workerUsername || item.username || item.phone || '-',
          avatar: '',
          earnings: item.totalIncome || item.total_amount || item.earnings || 0,
          orderCount: item.orderCount || item.order_count || 0
        }
      })
    }
    
    console.log('最终打手排行榜数据:', workerRanking.value)
  } catch (error) {
    console.error('获取打手排行榜失败:', error)
    ElMessage.error('获取打手排行榜失败')
    // 设置默认空数据
    workerRanking.value = [
      { id: 1, nickname: '加载失败', phone: '-', avatar: '', earnings: 0, orderCount: 0 }
    ]
  }
}

// 加载统计数据
const loadStatsData = async () => {
  try {
    console.log('开始加载统计数据...')
    let startDate = ''
    let endDate = ''
    
    if (statsDateRange.value && statsDateRange.value.length === 2) {
      startDate = statsDateRange.value[0]
      endDate = statsDateRange.value[1]
    } else {
      // 默认查询最近7天
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 7)
      startDate = start.toISOString().split('T')[0]
      endDate = end.toISOString().split('T')[0]
    }
    
    const data = await ReportAPI.getDetailStats({
      type: 'order', // 添加必需的type参数，查询订单统计
      startDate,
      endDate
    })
    
    console.log('统计数据API响应:', data)
    
    // 如果没有数据，创建默认的空数据
    if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
      console.warn('统计数据为空，创建默认空数据')
      // 创建最近7天的空数据
      const defaultData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        defaultData.push({
          date: date.toISOString().split('T')[0],
          orderCount: 0,
          orderAmount: 0,
          rechargeCount: 0,
          rechargeAmount: 0,
          newMembers: 0,
          activeMembers: 0,
          activeWorkers: 0,
          platformIncome: 0,
          balancePayment: 0,
          scanPayment: 0
        })
      }
      statsData.value = defaultData
    } else {
      statsData.value = data.list.map((item: any) => ({
        date: item.date,
        orderCount: item.orderCount || 0,
        orderAmount: item.orderAmount || 0,
        rechargeCount: item.rechargeCount || 0,
        rechargeAmount: item.rechargeAmount || 0,
        newMembers: item.newMembers || 0,
        activeMembers: item.activeMembers || 0,
        activeWorkers: item.newWorkers || 0,
        platformIncome: item.platformIncome || 0,
        balancePayment: item.balancePayAmount || 0,
        scanPayment: item.qrcodePayAmount || 0
      }))
    }
    
    console.log('统计数据:', statsData.value)
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
    // 设置默认空数据
    const defaultData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      defaultData.push({
        date: date.toISOString().split('T')[0],
        orderCount: 0,
        orderAmount: 0,
        rechargeCount: 0,
        rechargeAmount: 0,
        newMembers: 0,
        activeMembers: 0,
        activeWorkers: 0,
        platformIncome: 0,
        balancePayment: 0,
        scanPayment: 0
      })
    }
    statsData.value = defaultData
  }
}

// 导出统计报表
const handleExportStats = async () => {
  try {
    let startDate = ''
    let endDate = ''
    
    if (statsDateRange.value && statsDateRange.value.length === 2) {
      startDate = statsDateRange.value[0]
      endDate = statsDateRange.value[1]
    } else {
      // 默认导出最近7天
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 7)
      startDate = start.toISOString().split('T')[0]
      endDate = end.toISOString().split('T')[0]
    }
    
    await ReportAPI.exportReport({
      type: 'detail',
      startDate,
      endDate
    })
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 初始化图表
const initCharts = () => {
  // 延迟初始化，确保DOM完全渲染
  setTimeout(() => {
    nextTick(() => {
      // 初始化趋势图表
      if (trendChartRef.value) {
        console.log('初始化趋势图表容器:', trendChartRef.value)
        trendChart = echarts.init(trendChartRef.value)
        loadTrendData()
      } else {
        console.warn('趋势图表容器未找到')
      }
      
      // 初始化支付方式图表
      if (paymentChartRef.value) {
        console.log('初始化支付方式图表容器:', paymentChartRef.value)
        paymentChart = echarts.init(paymentChartRef.value)
        loadPaymentDistribution()
      } else {
        console.warn('支付方式图表容器未找到')
      }
      
      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        trendChart?.resize()
        paymentChart?.resize()
      })
    })
  }, 100) // 延迟100ms确保DOM渲染完成
}

// 初始化
onMounted(async () => {
  console.log('页面挂载完成，开始初始化...')
  
  // 先加载数据
  await loadTodayOverview()
  await loadMemberRanking()
  await loadWorkerRanking()
  await loadStatsData()
  
  // 延迟初始化图表，确保所有数据都加载完成
  setTimeout(() => {
    console.log('开始初始化图表...')
    initCharts()
  }, 200)
})
</script>

<style lang="scss" scoped>
.overview-card {
  .overview-item {
    display: flex;
    align-items: center;
    padding: 16px;
    
    .overview-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-right: 16px;
    }
    
    .overview-content {
      flex: 1;
      
      .overview-title {
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .overview-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .overview-desc {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.chart-card {
  height: 380px;
}

.ranking-list {
  .ranking-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .ranking-number {
      width: 30px;
      text-align: center;
      margin-right: 12px;
    }
    
    .ranking-avatar {
      margin-right: 12px;
    }
    
    .ranking-info {
      flex: 1;
      
      .ranking-name {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 2px;
      }
      
      .ranking-desc {
        font-size: 12px;
        color: #999;
      }
    }
    
    .ranking-value {
      text-align: right;
      
      .ranking-amount {
        font-size: 14px;
        font-weight: 500;
        color: #f56c6c;
        margin-bottom: 2px;
      }
      
      .ranking-count {
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>