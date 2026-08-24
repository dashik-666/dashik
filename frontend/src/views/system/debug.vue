<template>
  <div class="app-container">
    <h2>API调试页面</h2>
    
    <el-card>
      <h3>角色API测试</h3>
      <el-button @click="testRoleAPI">测试角色API</el-button>
      <div v-if="roleResult">
        <h4>角色API结果:</h4>
        <pre>{{ JSON.stringify(roleResult, null, 2) }}</pre>
      </div>
    </el-card>

    <el-card style="margin-top: 20px;">
      <h3>用户API测试</h3>
      <el-button @click="testUserAPI">测试用户API</el-button>
      <div v-if="userResult">
        <h4>用户API结果:</h4>
        <pre>{{ JSON.stringify(userResult, null, 2) }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import RoleAPI from "@/api/system/role-api";
import UserAPI from "@/api/system/user-api";

const roleResult = ref(null);
const userResult = ref(null);

const testRoleAPI = async () => {
  try {
    console.log('测试角色API...');
    const result = await RoleAPI.getPage({ pageNum: 1, pageSize: 10 });
    console.log('角色API结果:', result);
    roleResult.value = result;
  } catch (error) {
    console.error('角色API错误:', error);
    roleResult.value = { error: error.message };
  }
};

const testUserAPI = async () => {
  try {
    console.log('测试用户API...');
    const result = await UserAPI.getPage({ pageNum: 1, pageSize: 10 });
    console.log('用户API结果:', result);
    userResult.value = result;
  } catch (error) {
    console.error('用户API错误:', error);
    userResult.value = { error: error.message };
  }
};
</script>
