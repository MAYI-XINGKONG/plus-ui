<template>
  <div class="p-2 app-container test-suite-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div>
              <span class="panel-kicker">Search Filters</span>
              <h3>筛选条件</h3>
            </div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="用例名称" prop="suiteName">
            <el-input v-model="queryParams.suiteName" placeholder="请输入用例名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="标签" prop="tags">
            <el-input v-model="queryParams.tags" placeholder="请输入标签" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择" clearable>
              <el-option label="启用" value="0" />
              <el-option label="停用" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Test Suite</span>
            <h3>测试用例</h3>
            <p>共 {{ total }} 条用例，基于 Playwright 脚本执行</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['test:suite:add']" type="primary" plain icon="Plus" @click="handleAdd">新增用例</el-button>
            <el-button v-hasPermi="['test:suite:add']" type="success" plain icon="MagicStick" @click="handleAiGenerate">AI 生成</el-button>
            <el-button v-hasPermi="['test:suite:execute']" type="warning" plain icon="VideoPlay" :disabled="multiple" @click="handleBatchExecute">批量执行</el-button>
            <el-button v-hasPermi="['test:suite:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border class="data-table" :data="suiteList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="用例名称" align="center" prop="suiteName" min-width="200" show-overflow-tooltip />
        <el-table-column label="脚本路径" align="center" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="script-path">{{ row.scriptPath || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="标签" align="center" prop="tags" width="140" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="70">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{ row.status === '0' ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['test:suite:editCode']" link type="primary" icon="EditPen" @click="handleEditCode(row)" />
            <el-button v-hasPermi="['test:suite:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" />
            <el-button v-hasPermi="['test:suite:execute']" link type="primary" icon="VideoPlay" @click="handleExecute(row)" />
            <el-button v-hasPermi="['test:suite:remove']" link type="danger" icon="Delete" @click="handleDelete(row)" />
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body destroy-on-close>
      <el-form ref="suiteFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用例名称" prop="suiteName">
          <el-input v-model="form.suiteName" placeholder="如：登录页面元素正常加载" />
        </el-form-item>
        <el-form-item label="脚本路径" prop="scriptPath">
          <el-input v-model="form.scriptPath" placeholder="tests/login.spec.ts">
            <template #prepend>e2e-test/</template>
          </el-input>
          <div class="form-tip">Playwright 测试文件路径，相对于 e2e-test 目录</div>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="多个标签用逗号分隔，如：登录,核心" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio value="0">启用</el-radio>
                <el-radio value="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.orderNum" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="用例说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 在线代码编辑器对话框 -->
    <el-dialog v-model="codeEditorVisible" title="在线编辑脚本" width="90%" top="3vh" append-to-body destroy-on-close>
      <div class="code-editor-header">
        <span class="file-path">{{ editingScriptPath }}</span>
        <div>
          <el-button size="small" @click="codeEditorVisible = false">取消</el-button>
          <el-button size="small" type="primary" :loading="codeSaving" @click="handleSaveCode">保存</el-button>
        </div>
      </div>
      <div class="code-editor-container">
        <textarea v-model="codeContent" class="code-textarea" spellcheck="false" />
      </div>
    </el-dialog>

    <!-- AI 生成对话框 -->
    <el-dialog v-model="aiDialogVisible" title="AI 生成测试用例" width="700px" append-to-body>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
        描述你要测试的功能，AI 自动生成基于 POM + ElementHelper 的 Playwright 测试代码
      </el-alert>
      <el-input
        v-model="aiDescription"
        type="textarea"
        :rows="6"
        placeholder="例如：&#10;测试用户管理模块：&#10;1. 进入用户管理页面，验证表格有数据&#10;2. 按用户名搜索，验证搜索结果正确&#10;3. 点击新增按钮，填写表单提交，验证新增成功"
      />
      <div v-if="aiGeneratedCode" style="margin-top: 16px">
        <h4>生成的代码预览</h4>
        <textarea v-model="aiGeneratedCode" class="code-textarea" style="height: 300px" spellcheck="false" />
      </div>
      <template #footer>
        <el-button @click="aiDialogVisible = false">取 消</el-button>
        <el-button v-if="aiGeneratedCode" type="success" @click="handleAiSaveCode">保存代码到文件</el-button>
        <el-button type="primary" :loading="aiLoading" @click="handleAiSubmit">生成</el-button>
      </template>
    </el-dialog>

    <!-- 批量执行对话框 -->
    <el-dialog v-model="batchExecVisible" title="批量执行用例" width="500px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="已选用例">
          <el-tag v-for="id in ids.slice(0, 5)" :key="id" style="margin-right: 4px">{{ id }}</el-tag>
          <span v-if="ids.length > 5">... 共 {{ ids.length }} 个</span>
        </el-form-item>
        <el-form-item label="浏览器">
          <el-select v-model="batchBrowser" style="width: 100%">
            <el-option label="Chromium" value="chromium" />
            <el-option label="Firefox" value="firefox" />
            <el-option label="WebKit" value="webkit" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示模式">
          <el-radio-group v-model="batchHeaded">
            <el-radio :value="0">无头模式</el-radio>
            <el-radio :value="1">有头模式</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchExecVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleBatchSubmit">开始执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="TestSuite" lang="ts">
import { to } from 'await-to-js';
import { listSuite, getSuite, addSuite, updateSuite, delSuite, getScriptContent, saveScriptContent, aiGenerate } from '@/api/test/suite';
import type { SuiteForm, SuiteQuery, SuiteVO } from '@/api/test/suite/types';
import { runTest } from '@/api/test/execution';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';

const suiteList = ref<SuiteVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const { ids, multiple, handleSelectionChange } = useTableSelection<SuiteVO>(item => item.suiteId);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const suiteFormRef = ref<ElFormInstance>();
const aiDialogVisible = ref(false);
const aiDescription = ref('');
const aiLoading = ref(false);
const aiGeneratedCode = ref('');

// 代码编辑器状态
const codeEditorVisible = ref(false);
const codeContent = ref('');
const editingScriptPath = ref('');
const editingSuiteId = ref<string | number>('');
const codeSaving = ref(false);

// 批量执行状态
const batchExecVisible = ref(false);
const batchBrowser = ref('chromium');
const batchHeaded = ref(0);

const initFormData: SuiteForm = {
  suiteId: undefined, suiteName: '', suiteType: '2', method: '', url: '',
  headers: '', body: '', expectCode: 200, expectBody: '', scriptPath: '',
  tags: '', status: '0', orderNum: 0, remark: ''
};

const data = reactive<PageData<SuiteForm, SuiteQuery>>({
  form: { ...initFormData },
  queryParams: { pageNum: 1, pageSize: 10, suiteName: '', tags: '', status: '' },
  rules: {
    suiteName: [{ required: true, message: '请输入用例名称', trigger: 'blur' }],
    scriptPath: [{ required: true, message: '请输入脚本路径', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const getList = async () => {
  await withLoading(async () => {
    const res = await listSuite(queryParams.value);
    suiteList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };

const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({
  form, formRef: suiteFormRef, initialFormData: initFormData
});
const { resetQuery } = useSearchReset({ queryFormRef, queryParams, pageNumKey: 'pageNum', afterReset: handleQuery });

const cancel = () => { closeDialog(); };

const handleAdd = () => {
  resetForm();
  openDialog('新增测试用例');
};

const handleUpdate = async (row: SuiteVO) => {
  resetForm();
  const res = await getSuite(row.suiteId);
  Object.assign(form.value, res.data);
  showDialog('修改测试用例');
};

const submitForm = () => {
  suiteFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    form.value.suiteId ? await updateSuite(form.value) : await addSuite(form.value);
    modal.msgSuccess('操作成功');
    closeDialog();
    await getList();
  });
};

const handleDelete = async (row?: Partial<SuiteVO>) => {
  const suiteIds = row?.suiteId || ids.value;
  await to(modal.confirm('确认删除选中的用例？'));
  await delSuite(suiteIds);
  await getList();
  modal.msgSuccess('删除成功');
};

const handleExecute = async (row: SuiteVO) => {
  if (!row.scriptPath) {
    modal.msgWarning('该用例未配置脚本路径');
    return;
  }
  await to(modal.confirm('确认执行「' + row.suiteName + '」？'));
  await runTest({ suiteId: row.suiteId, execType: '1', browser: 'chromium', headed: 0 });
  modal.msgSuccess('执行任务已提交，请到「测试执行」页面查看结果');
};

// 在线编辑代码
const handleEditCode = async (row: SuiteVO) => {
  if (!row.scriptPath) {
    modal.msgWarning('该用例未配置脚本路径');
    return;
  }
  editingSuiteId.value = row.suiteId;
  editingScriptPath.value = 'e2e-test/' + row.scriptPath;
  codeContent.value = '';
  codeEditorVisible.value = true;
  try {
    const res = await getScriptContent(row.suiteId);
    codeContent.value = res.data?.content || '';
  } catch (e: any) {
    modal.msgError('读取脚本失败: ' + (e?.response?.data?.msg || e?.message || '未知错误'));
  }
};

const handleSaveCode = async () => {
  codeSaving.value = true;
  try {
    await saveScriptContent(editingSuiteId.value, codeContent.value);
    modal.msgSuccess('保存成功');
    codeEditorVisible.value = false;
  } catch (e: any) {
    modal.msgError('保存失败: ' + (e?.response?.data?.msg || e?.message || '未知错误'));
  } finally {
    codeSaving.value = false;
  }
};

// 批量执行
const handleBatchExecute = () => {
  if (ids.value.length === 0) {
    modal.msgWarning('请先选择要执行的用例');
    return;
  }
  batchExecVisible.value = true;
};

const handleBatchSubmit = async () => {
  await runTest({ suiteIds: ids.value, execType: '3', browser: batchBrowser.value, headed: batchHeaded.value });
  batchExecVisible.value = false;
  modal.msgSuccess('批量执行任务已提交');
};

// AI 生成
const handleAiGenerate = () => { aiDescription.value = ''; aiGeneratedCode.value = ''; aiDialogVisible.value = true; };

const handleAiSubmit = async () => {
  if (!aiDescription.value.trim()) { modal.msgWarning('请输入描述'); return; }
  aiLoading.value = true;
  try {
    const res = await aiGenerate(aiDescription.value);
    const rawData = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    const g = JSON.parse(rawData);
    aiGeneratedCode.value = g.code || '';
    resetForm();
    Object.assign(form.value, {
      ...initFormData,
      suiteName: g.suiteName || g.name || '',
      scriptPath: g.scriptPath || g.script_path || '',
      tags: g.tags || '',
      remark: g.remark || ''
    });
    if (!aiGeneratedCode.value) {
      // 没有代码，直接打开新增对话框
      aiDialogVisible.value = false;
      openDialog('AI 生成用例 - 确认后保存');
    }
  } catch (e: any) {
    modal.msgError('AI 生成失败：' + (e?.response?.data?.msg || e?.message || '请检查 AI 配置'));
  } finally { aiLoading.value = false; }
};

const handleAiSaveCode = async () => {
  if (!form.value.suiteName) { modal.msgWarning('请先生成用例'); return; }
  // 先保存用例
  form.value.suiteType = '2';
  const res = form.value.suiteId ? await updateSuite(form.value) : await addSuite(form.value);
  const suiteId = form.value.suiteId || res.data;
  if (suiteId && aiGeneratedCode.value) {
    await saveScriptContent(suiteId, aiGeneratedCode.value);
  }
  aiDialogVisible.value = false;
  modal.msgSuccess('用例和代码已保存');
  await getList();
};

onMounted(() => { getList(); });
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;
@include pageShell.toolbar-responsive;

.script-path {
  font-family: monospace;
  font-size: 12px;
  color: #67c23a;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.code-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  .file-path {
    font-family: monospace;
    font-size: 14px;
    color: #409eff;
  }
}

.code-editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.code-textarea {
  width: 100%;
  height: 500px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  border: none;
  outline: none;
  resize: vertical;
  background: #1e1e1e;
  color: #d4d4d4;
  tab-size: 2;
}
</style>
