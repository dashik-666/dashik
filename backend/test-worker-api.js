const axios = require('axios');

async function testWorkerAPI() {
  try {
    console.log('测试 Worker API...');
    
    // 首先登录获取 token
    const loginResponse = await axios.post('http://localhost:10000/api/v1/auth/login', {
      username: 'admin',
      password: '123456'
    });
    
    console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data?.accessToken || loginResponse.data.data?.token || loginResponse.data.token;
    console.log('登录成功，获取到 token');
    
    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 测试获取 worker 列表
    console.log('\n测试获取 worker 列表...');
    try {
      const workersResponse = await axios.get('http://localhost:10000/api/v1/workers?page=1&limit=10', { headers });
      console.log('Worker 列表响应:', workersResponse.data);
      
      if (workersResponse.data.data && workersResponse.data.data.list) {
        const workers = workersResponse.data.data.list;
        console.log(`\n找到 ${workers.length} 个 worker:`);
        workers.forEach((worker, index) => {
          console.log(`${index + 1}. ID: ${worker.id}, 姓名: ${worker.name}, 级别: ${worker.level || 'N/A'}, 技能: ${JSON.stringify(worker.skills || [])}`);
        });
      }
    } catch (error) {
      console.error('获取 worker 列表失败:', error.response?.data || error.message);
    }
    
    // 测试获取 worker 统计数据
    console.log('\n测试获取 worker 统计数据...');
    try {
      const statsResponse = await axios.get('http://localhost:10000/api/v1/workers/stats', { headers });
      console.log('Worker 统计数据响应:', statsResponse.data);
    } catch (error) {
      console.error('获取 worker 统计数据失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testWorkerAPI();
