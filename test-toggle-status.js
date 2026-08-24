const http = require('http');

const BASE_URL = 'http://localhost:10000/api/v1';
let accessToken = '';

// 简单的HTTP请求函数
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 登录获取token
async function login() {
  try {
    const response = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: '123456'
    });
    
    console.log('登录响应:', response);
    
    if (response.data && response.data.code === '00000') {
      accessToken = response.data.data.accessToken;
      console.log('✅ 登录成功');
      return true;
    } else {
      console.log('❌ 登录失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 登录错误:', error.message);
    return false;
  }
}

// 获取会员列表
async function getMembers() {
  try {
    const response = await makeRequest('GET', '/members?page=1&limit=10', null, {
      Authorization: `Bearer ${accessToken}`
    });
    
    console.log('获取会员列表响应:', response);
    
    if (response.data && response.data.code === '00000') {
      return response.data.data.list || [];
    }
    return [];
  } catch (error) {
    console.error('❌ 获取会员列表失败:', error.message);
    return [];
  }
}

// 切换会员状态
async function toggleMemberStatus(memberId, status) {
  try {
    const response = await makeRequest('PATCH', `/members/${memberId}/toggle-status`, 
      { status },
      { Authorization: `Bearer ${accessToken}` }
    );
    
    console.log('🔧 切换状态响应:', response);
    
    if (response.data && response.data.code === '00000') {
      console.log('✅ 状态切换成功');
      return true;
    } else {
      console.log('❌ 状态切换失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 切换状态错误:', error.message);
    return false;
  }
}

// 主测试函数
async function runTest() {
  console.log('🚀 开始测试会员状态切换功能...\n');

  // 1. 登录
  if (!await login()) {
    console.log('❌ 登录失败，测试终止');
    return;
  }

  // 2. 获取会员列表
  const members = await getMembers();
  if (members.length === 0) {
    console.log('❌ 没有找到会员，测试终止');
    return;
  }

  const testMember = members[0];
  console.log(`📋 测试会员: ID=${testMember.id}, 昵称=${testMember.nickname}, 当前状态=${testMember.status}\n`);

  // 3. 测试切换状态
  const newStatus = testMember.status === 'active' ? 0 : 1;
  const action = newStatus === 1 ? '启用' : '禁用';
  console.log(`🔧 测试${action}会员...`);
  
  const success = await toggleMemberStatus(testMember.id, newStatus);
  
  if (success) {
    console.log(`✅ ${action}成功！`);
  } else {
    console.log(`❌ ${action}失败！`);
  }

  console.log('\n🎉 测试完成！');
}

// 运行测试
runTest().catch(console.error);
