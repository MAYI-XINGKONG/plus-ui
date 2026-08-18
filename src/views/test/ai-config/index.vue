<template>
  <div class="p-2 app-container ai-config-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">AI Config Dataset</span>
            <h3>AI 配置列表</h3>
            <p>共 {{ total }} 条记录，管理 AI 模型 API 连接配置。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['test:aiConfig:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增配置
            </el-button>
            <right-toolbar :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border class="data-table" :data="configList">
        <el-table-column label="配置名称" align="center" prop="configName" min-width="120" />
        <el-table-column label="API地址" align="center" prop="apiUrl" :show-overflow-tooltip="true" min-width="180" />
        <el-table-column label="API密钥" align="center" min-width="140">
          <template #default="{ row }">
            <span>{{ maskApiKey(row.apiKey) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="模型" align="center" prop="modelName" min-width="120" />
        <el-table-column label="默认" align="center" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isDefault ? 'success' : 'info'">{{ row.isDefault ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
          <template #default="{ row }">
            <el-tooltip content="编辑" placement="top">
              <el-button v-hasPermi="['test:aiConfig:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)"></el-button>
            </el-tooltip>
            <el-tooltip content="获取模型" placement="top">
              <el-button v-hasPermi="['test:aiConfig:query']" link type="primary" icon="MagicStick" @click="handleFetchModels(row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['test:aiConfig:remove']" link type="primary" icon="Delete" @click="handleDelete(row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改配置对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="600px"
      append-to-body
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form ref="configFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="配置名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="API地址" prop="apiUrl">
          <el-input v-model="form.apiUrl" placeholder="https://api.openai.com" />
        </el-form-item>
        <el-form-item label="API密钥" prop="apiKey">
          <el-input v-model="form.apiKey" type="password" show-password placeholder="sk-xxx" />
        </el-form-item>
        <el-form-item label="模型" prop="modelName">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-select
              v-model="form.modelName"
              filterable
              allow-create
              default-first-option
              placeholder="点击右侧按钮获取模型列表"
              style="flex: 1"
            >
              <el-option v-for="item in modelOptions" :key="item" :label="item" :value="item" />
            </el-select>
            <el-button :loading="fetchLoading" icon="Refresh" @click="handleFetchModelsInDialog" />
          </div>
        </el-form-item>
        <el-form-item label="默认配置">
          <el-switch v-model="form.isDefault" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="AiConfig" lang="ts">
import { listAiConfig, getAiConfig, addAiConfig, updateAiConfig, delAiConfig, fetchModels, fetchModelsByCredentials } from '@/api/test/ai';
import type { AiConfigForm, AiConfigVO } from '@/api/test/ai/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import modal from '@/plugins/modal';

const configList = ref<AiConfigVO[]>([]);
const { loading, withLoading } = useLoading(true);
const total = ref(0);
const modelOptions = ref<string[]>([]);
const fetchLoading = ref(false);

const configFormRef = ref<ElFormInstance>();

const initFormData: AiConfigForm = {
  configId: undefined,
  configName: '',
  apiUrl: '',
  apiKey: '',
  modelName: '',
  modelList: '',
  status: '0',
  isDefault: false,
  remark: ''
};

const data = reactive<PageData<AiConfigForm, any>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10
  },
  rules: {
    configName: [{ required: true, message: '配置名称不能为空', trigger: 'blur' }],
    apiUrl: [{ required: true, message: 'API地址不能为空', trigger: 'blur' }],
    apiKey: [{ required: true, message: 'API密钥不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: configFormRef,
  initialFormData: initFormData
});

/** 遮盖API密钥 */
const maskApiKey = (key: string) => {
  if (!key) return '';
  if (key.length <= 8) return '***';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
};

/** 查询配置列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listAiConfig();
    configList.value = res.data || [];
    total.value = configList.value.length;
  });
};

/** 取消按钮 */
const cancel = () => {
  closeDialog();
};

/** 对话框关闭后重置 */
const handleDialogClosed = () => {
  reset();
  modelOptions.value = [];
};

/** 新增按钮操作 */
const handleAdd = () => {
  modelOptions.value = [];
  openDialog('添加 AI 配置');
};

/** 修改按钮操作 */
const handleUpdate = async (row: AiConfigVO) => {
  reset();
  const { data } = await getAiConfig(row.configId);
  // 解析 modelList JSON 字符串
  if (data.modelList) {
    try {
      modelOptions.value = JSON.parse(data.modelList);
    } catch {
      modelOptions.value = [];
    }
  } else {
    modelOptions.value = [];
  }
  Object.assign(form.value, data);
  showDialog('修改 AI 配置');
};

/** 获取模型列表（表格操作） */
const handleFetchModels = async (row: AiConfigVO) => {
  await withLoading(async () => {
    const res = await fetchModels(row.configId);
    const models = res.data || [];
    modelOptions.value = models;
    row.modelList = JSON.stringify(models);
    modal.msgSuccess('获取模型成功，共 ' + models.length + ' 个模型');
  });
};

/** 弹窗内获取模型列表 */
const handleFetchModelsInDialog = async () => {
  if (!form.value.apiUrl || !form.value.apiKey) {
    modal.msgWarning('请先填写 API 地址和 API 密钥');
    return;
  }
  fetchLoading.value = true;
  try {
    const res = await fetchModelsByCredentials(form.value.apiUrl, form.value.apiKey);
    const models = res.data || [];
    modelOptions.value = models;
    modal.msgSuccess('获取到 ' + models.length + ' 个模型');
  } catch (e: any) {
    modal.msgError('获取模型失败：' + (e.message || '请检查 API 地址和密钥'));
  } finally {
    fetchLoading.value = false;
  }
};

/** 提交按钮 */
const submitForm = () => {
  configFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 保存时将 modelOptions 序列化为 JSON
      form.value.modelList = JSON.stringify(modelOptions.value);
      form.value.configId ? await updateAiConfig(form.value) : await addAiConfig(form.value);
      modal.msgSuccess('操作成功');
      closeDialog();
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row: AiConfigVO) => {
  await modal.confirm('是否确认删除 AI 配置"' + row.configName + '"？');
  await delAiConfig(row.configId);
  await getList();
  modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
