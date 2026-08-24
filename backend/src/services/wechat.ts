import axios from 'axios';

/**
 * 企业微信机器人通知服务
 */
class WeChatService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.WECHAT_WEBHOOK_URL || '';
  }

  /**
   * 发送文本消息
   */
  async sendTextMessage(content: string): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('企业微信Webhook URL未配置，跳过消息发送');
      return false;
    }

    try {
      const response = await axios.post(this.webhookUrl, {
        msgtype: 'text',
        text: {
          content
        }
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.errcode === 0) {
        console.log('企业微信消息发送成功:', content);
        return true;
      } else {
        console.error('企业微信消息发送失败:', response.data);
        return false;
      }
    } catch (error) {
      console.error('企业微信消息发送异常:', error);
      return false;
    }
  }

  /**
   * 发送Markdown消息
   */
  async sendMarkdownMessage(content: string): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('企业微信Webhook URL未配置，跳过消息发送');
      return false;
    }

    try {
      const response = await axios.post(this.webhookUrl, {
        msgtype: 'markdown',
        markdown: {
          content
        }
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.errcode === 0) {
        console.log('企业微信Markdown消息发送成功');
        return true;
      } else {
        console.error('企业微信Markdown消息发送失败:', response.data);
        return false;
      }
    } catch (error) {
      console.error('企业微信Markdown消息发送异常:', error);
      return false;
    }
  }

  /**
   * 发送充值成功通知
   */
  async sendRechargeNotification(data: {
    memberNickname: string;
    memberPhone: string;
    amount: number;
    method: string;
    balance: number;
    time: string;
  }): Promise<boolean> {
    const content = `💰 **充值成功通知**

` +
      `👤 **会员信息**
` +
      `昵称：${data.memberNickname}
` +
      `手机：${data.memberPhone}

` +
      `💳 **充值详情**
` +
      `充值金额：¥${data.amount.toFixed(2)}
` +
      `支付方式：${data.method}
` +
      `当前余额：¥${data.balance.toFixed(2)}
` +
      `充值时间：${data.time}

` +
      `🎯 PayBoard代练管理系统`;

    return await this.sendMarkdownMessage(content);
  }

  /**
   * 发送订单完成通知
   */
  async sendOrderNotification(data: {
    orderNumber: string;
    memberNickname: string;
    memberPhone: string;
    workerName: string;
    duration: number;
    amount: number;
    payMethod: string;
    time: string;
  }): Promise<boolean> {
    const content = `🎮 **订单完成通知**

` +
      `📋 **订单信息**
` +
      `订单编号：${data.orderNumber}
` +
      `服务时长：${data.duration}小时
` +
      `订单金额：¥${data.amount.toFixed(2)}
` +
      `支付方式：${data.payMethod}
` +
      `下单时间：${data.time}

` +
      `👤 **会员信息**
` +
      `昵称：${data.memberNickname}
` +
      `手机：${data.memberPhone}

` +
      `🎯 **打手信息**
` +
      `打手：${data.workerName}

` +
      `🎯 PayBoard代练管理系统`;

    return await this.sendMarkdownMessage(content);
  }

  /**
   * 发送系统异常通知
   */
  async sendErrorNotification(data: {
    error: string;
    module: string;
    time: string;
    details?: string;
  }): Promise<boolean> {
    const content = `⚠️ **系统异常通知**

` +
      `🔧 **异常模块**：${data.module}
` +
      `❌ **错误信息**：${data.error}
` +
      `⏰ **发生时间**：${data.time}
` +
      (data.details ? `\n📝 **详细信息**：${data.details}` : '') +
      `\n\n🎯 PayBoard代练管理系统`;

    return await this.sendMarkdownMessage(content);
  }

  /**
   * 发送每日统计报告
   */
  async sendDailyReport(data: {
    date: string;
    orderCount: number;
    orderAmount: number;
    rechargeCount: number;
    rechargeAmount: number;
    newMemberCount: number;
    activeWorkerCount: number;
  }): Promise<boolean> {
    const content = `📊 **每日统计报告**

` +
      `📅 **日期**：${data.date}

` +
      `🎮 **订单统计**
` +
      `订单数量：${data.orderCount}单
` +
      `订单金额：¥${data.orderAmount.toFixed(2)}

` +
      `💰 **充值统计**
` +
      `充值笔数：${data.rechargeCount}笔
` +
      `充值金额：¥${data.rechargeAmount.toFixed(2)}

` +
      `👥 **用户统计**
` +
      `新增会员：${data.newMemberCount}人
` +
      `活跃打手：${data.activeWorkerCount}人

` +
      `🎯 PayBoard代练管理系统`;

    return await this.sendMarkdownMessage(content);
  }

  /**
   * 发送余额不足警告
   */
  async sendLowBalanceWarning(data: {
    memberNickname: string;
    memberPhone: string;
    balance: number;
    requiredAmount: number;
  }): Promise<boolean> {
    const content = `⚠️ **余额不足警告**

` +
      `👤 **会员信息**
` +
      `昵称：${data.memberNickname}
` +
      `手机：${data.memberPhone}

` +
      `💳 **余额信息**
` +
      `当前余额：¥${data.balance.toFixed(2)}
` +
      `所需金额：¥${data.requiredAmount.toFixed(2)}
` +
      `缺少金额：¥${(data.requiredAmount - data.balance).toFixed(2)}

` +
      `💡 **建议**：请提醒会员及时充值

` +
      `🎯 PayBoard代练管理系统`;

    return await this.sendMarkdownMessage(content);
  }

  /**
   * 测试企业微信连接
   */
  async testConnection(): Promise<boolean> {
    const testMessage = `🔧 **系统测试消息**\n\n` +
      `⏰ 测试时间：${new Date().toLocaleString('zh-CN')}\n` +
      `✅ PayBoard代练管理系统企业微信通知功能正常`;

    return await this.sendMarkdownMessage(testMessage);
  }
}

// 创建单例实例
const wechatService = new WeChatService();

export default wechatService;
export { WeChatService };