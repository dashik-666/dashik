<!-- 角色管理 -->
<template>
  <div class="app-container">
    <!-- 角色列表 -->
    <div>
      <!-- 搜索区域 -->
      <div class="search-container">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="auto">
          <el-form-item label="关键字" prop="keywords">
            <el-input
              v-model="queryParams.keywords"
              placeholder="角色名称/角色编码"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>

                     <el-form-item label="状态" prop="status">
             <el-select
               v-model="queryParams.status"
               placeholder="全部"
               clearable
               style="width: 100px"
             >
               <el-option label="正常" value="active" />
               <el-option label="禁用" value="disabled" />
             </el-select>
           </el-form-item>

          <el-form-item class="search-buttons">
            <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
            <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-card shadow="hover" class="data-table">
        <div class="data-table__toolbar">
          <div class="data-table__toolbar--actions">
            <el-button
              type="success"
              icon="plus"
              @click="handleOpenDialog()"
            >
              新增
            </el-button>
            <el-button
              type="danger"
              icon="delete"
              :disabled="selectIds.length === 0"
              @click="handleDelete()"
            >
              删除
            </el-button>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="pageData"
          border
          stripe
          highlight-current-row
          class="data-table__content"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="角色名称" prop="name" />
          <el-table-column label="角色编码" prop="code" />
          <el-table-column label="角色描述" prop="description" show-overflow-tooltip />
                     <el-table-column label="状态" width="100" align="center">
             <template #default="scope">
               <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                 {{ scope.row.status === 'active' ? '正常' : '禁用' }}
               </el-tag>
             </template>
           </el-table-column>
          <el-table-column label="创建时间" prop="createTime" width="180" />
          <el-table-column label="操作" width="200" align="center">
            <template #default="scope">
              <el-button
                link
                type="primary"
                size="small"
                @click="handleOpenDialog(scope.row.id)"
              >
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDelete(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-if="total > 0"
          v-model:total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="handleQuery"
        />
      </el-card>
    </div>

    <!-- 角色表单弹窗 -->
    <el-drawer
      v-model="dialog.visible"
      :title="dialog.title"
      :size="drawerSize"
      direction="rtl"
    >
      <el-form
        ref="roleFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名称" />
        </el-form-item>

        <el-form-item label="角色编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入角色编码" />
        </el-form-item>

        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入角色描述"
            :rows="3"
          />
        </el-form-item>

                 <el-form-item label="状态" prop="status">
           <el-switch
             v-model="formData.status"
             inline-prompt
             active-text="正常"
             inactive-text="禁用"
             active-value="active"
             inactive-value="disabled"
           />
         </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
          <el-button @click="handleCloseDialog">取 消</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from "@/store/modules/app-store";
import { DeviceEnum } from "@/enums/settings/device.enum";

import RoleAPI, { RoleForm, RolePageQuery, RolePageVO } from "@/api/system/role-api";

defineOptions({
  name: "Role",
  inheritAttrs: false,
});

const appStore = useAppStore();

const queryFormRef = ref();
const roleFormRef = ref();

const queryParams = reactive<RolePageQuery>({
  pageNum: 1,
  pageSize: 10,
});

const pageData = ref<RolePageVO[]>();
const total = ref(0);
const loading = ref(false);

const dialog = reactive({
  visible: false,
  title: "新增角色",
});
const drawerSize = computed(() => (appStore.device === DeviceEnum.DESKTOP ? "600px" : "90%"));

const formData = reactive<RoleForm>({
  status: 'active',
});

const rules = reactive({
  name: [{ required: true, message: "角色名称不能为空", trigger: "blur" }],
  code: [{ required: true, message: "角色编码不能为空", trigger: "blur" }],
});

// 选中的角色ID
const selectIds = ref<number[]>([]);

// 查询角色列表
const handleQuery = async () => {
  loading.value = true;
  try {
    const response = await RoleAPI.getPage(queryParams);
    pageData.value = response.list;
    total.value = response.total;
  } catch (error) {
    console.error("获取角色列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 重置查询
const handleResetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

// 打开弹窗
const handleOpenDialog = async (id?: number) => {
  dialog.visible = true;
  if (id) {
    dialog.title = "编辑角色";
    try {
      const response = await RoleAPI.getFormData(id);
      Object.assign(formData, response);
    } catch (error) {
      console.error("获取角色详情失败:", error);
    }
  } else {
    dialog.title = "新增角色";
         Object.assign(formData, {
       id: undefined,
       name: "",
       code: "",
       description: "",
       status: 'active',
     });
  }
};

// 关闭弹窗
const handleCloseDialog = () => {
  dialog.visible = false;
  roleFormRef.value.resetFields();
  roleFormRef.value.clearValidate();

     formData.id = undefined;
   formData.status = 'active';
};

// 提交角色表单（防抖）
const handleSubmit = useDebounceFn(() => {
  roleFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const roleId = formData.id;
      loading.value = true;
      if (roleId) {
        RoleAPI.update(roleId, formData)
          .then(() => {
            ElMessage.success("修改角色成功");
            handleCloseDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        RoleAPI.create(formData)
          .then(() => {
            ElMessage.success("新增角色成功");
            handleCloseDialog();
            handleResetQuery();
          })
          .finally(() => (loading.value = false));
      }
    }
  });
}, 1000);

/**
 * 删除角色
 *
 * @param id  角色ID
 */
function handleDelete(id?: number) {
  const roleIds = [id || selectIds.value].join(",");
  if (!roleIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }

  ElMessageBox.confirm("确认删除角色?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    function () {
      loading.value = true;
      RoleAPI.deleteByIds(roleIds)
        .then(() => {
          ElMessage.success("删除成功");
          handleResetQuery();
        })
        .finally(() => (loading.value = false));
    },
    function () {
      ElMessage.info("已取消删除");
    }
  );
}

// 选择变化
const handleSelectionChange = (selection: RolePageVO[]) => {
  selectIds.value = selection.map((item) => item.id);
};

onMounted(() => {
  handleQuery();
});
</script>

<style lang="scss" scoped>
.search-container {
  margin-bottom: 20px;
}

.data-table {
  margin-bottom: 20px;
}

.dialog-footer {
  text-align: right;
}
</style>
