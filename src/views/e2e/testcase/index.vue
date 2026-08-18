<template>
  <div class="p-2 app-container e2e-testcase-page">
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
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="85px" class="query-form">
          <el-form-item label="用例名称" prop="caseName">
            <el-input
              v-model="queryParams.caseName"
              placeholder="请输入用例名称"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="用例分组" prop="caseGroup">
            <el-select v-model="queryParams.caseGroup" placeholder="请选择分组" clearable>
              <el-option v-for="group in caseGroupOptions" :key="group" :label="group" :value="group" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="用例状态" clearable>
              <el-option label="正常" value="0" />
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
            <span class="panel-kicker">Test Case Dataset</span>
            <h3>测试用例列表</h3>
            <p>共 {{ total }} 条记录，支持用例维护、编辑和同步。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['e2e:case:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增
            </el-button>
            <el-button v-hasPermi="['e2e:case:sync']" type="success" plain icon="Refresh" @click="handleSync">
              同步
            </el-button>
            <el-button v-hasPermi="['e2e:case:edit']" type="info" plain icon="MagicStick" @click="handleAiGenerate">
              AI生成
            </el-button>
            <el-button
              v-hasPermi="['e2e:case:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        border
        class="data-table"
        :data="testCaseList"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="用例编号" align="center" prop="caseId" />
        <el-table-column label="用例名称" align="center" prop="caseName" show-overflow-tooltip />
        <el-table-column label="Spec文件" align="center" prop="specFile" show-overflow-tooltip>
          <template #default="scope">
            <el-tooltip :content="scope.row.specFile" placement="top">
              <span class="spec-file-path">{{ scope.row.specFile }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="用例分组" align="center" prop="caseGroup">
          <template #default="scope">
            <el-tag v-if="scope.row.caseGroup" effect="plain">{{ scope.row.caseGroup }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '0'" type="success">正常</el-tag>
            <el-tag v-else-if="scope.row.status === '1'" type="danger">停用</el-tag>
            <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="编辑Spec" placement="top">
              <el-button
                v-hasPermi="['e2e:case:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleEditSpec(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button
                v-hasPermi="['e2e:case:edit']"
                link
                type="primary"
                icon="Document"
                @click="handleUpdate(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="执行" placement="top">
              <el-button
                v-hasPermi="['e2e:task:add']"
                link
                type="success"
                icon="VideoPlay"
                @click="handleRunCase(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                v-hasPermi="['e2e:case:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
              ></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加或修改测试用例对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body>
      <el-form ref="caseFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="用例名称" prop="caseName">
          <el-input v-model="form.caseName" placeholder="请输入用例名称" />
        </el-form-item>
        <el-form-item label="Spec文件" prop="specFile" v-if="form.caseId">
          <el-input v-model="form.specFile" placeholder="自动生成" disabled />
        </el-form-item>
        <el-form-item label="用例分组" prop="caseGroup">
          <el-input v-model="form.caseGroup" placeholder="请输入用例分组" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入用例描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Spec文件编辑对话框（全屏） -->
    <el-dialog
      v-model="specDialog.visible"
      :title="specDialog.title"
      fullscreen
      :close-on-click-modal="false"
      class="spec-editor-dialog"
    >
      <div class="spec-editor-layout">
        <div class="spec-editor-main">
          <el-input
            v-model="specContent"
            type="textarea"
            :autosize="false"
            class="spec-editor-textarea"
            placeholder="编写测试代码..."
            spellcheck="false"
          />
        </div>
        <div class="spec-editor-sidebar">
          <h4>历史版本</h4>
          <el-timeline>
            <el-timeline-item
              v-for="h in historyList"
              :key="h.historyId"
              :timestamp="parseTime(h.createTime)"
              placement="top"
            >
              <div class="history-item">
                <el-button link type="primary" size="small" @click="previewHistory(h)">v{{ h.version }}</el-button>
                <el-button link type="warning" size="small" @click="handleRevert(h)">回退</el-button>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="historyList.length === 0" description="暂无历史" :image-size="40" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="specSaving" type="primary" @click="handleSaveSpec">
            <el-icon><Check /></el-icon>保存
          </el-button>
          <el-button @click="specDialog.visible = false">
            <el-icon><Close /></el-icon>关闭
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 单个用例执行对话框 -->
    <el-dialog v-model="runDialog.visible" title="执行测试用例" width="500px" append-to-body>
      <el-form ref="runFormRef" :model="runForm" :rules="runRules" label-width="90px">
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="runForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="浏览器" prop="browser">
          <el-select v-model="runForm.browser" placeholder="请选择浏览器">
            <el-option label="Chromium" value="chromium" />
            <el-option label="Firefox" value="firefox" />
            <el-option label="WebKit" value="webkit" />
            <el-option label="全部" value="all" />
          </el-select>
        </el-form-item>
        <el-form-item label="有头模式" prop="headed">
          <el-switch v-model="runForm.headed" active-value="1" inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitRunCase">确 定</el-button>
          <el-button @click="runDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="E2eTestCase" lang="ts">
import { addTask } from '@/api/e2e/task';
import { addTestCase, delTestCase, getCaseHistory, getTestCase, listTestCase, revertCase, saveCaseContent, syncSpecFiles, updateTestCase } from '@/api/e2e/testcase';
import type { E2eTestCaseForm, E2eTestCaseHistoryVo, E2eTestCaseQuery, E2eTestCaseVO } from '@/api/e2e/testcase/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { parseTime } from '@/utils/ruoyi';

const testCaseList = ref<E2eTestCaseVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const { ids, single, multiple, handleSelectionChange } = useTableSelection<E2eTestCaseVO>(item => item.caseId);
const total = ref(0);

const caseFormRef = ref<ElFormInstance>();
const queryFormRef = ref<ElFormInstance>();
const runFormRef = ref<ElFormInstance>();

/** 用例分组选项（从列表中提取） */
const caseGroupOptions = ref<string[]>([]);

const initFormData: E2eTestCaseForm = {
  caseId: undefined,
  caseName: '',
  specFile: '',
  caseGroup: '',
  description: '',
  status: '0'
};

const data = reactive<PageData<E2eTestCaseForm, E2eTestCaseQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    caseName: '',
    caseGroup: '',
    status: ''
  },
  rules: {
    caseName: [{ required: true, message: '用例名称不能为空', trigger: 'blur' }],
    specFile: []
  }
});

const { queryParams, form, rules } = toRefs(data);
const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({
  form,
  formRef: caseFormRef,
  initialFormData: initFormData
});
const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  afterReset: () => {
    handleQuery();
  }
});

/** ========== Spec编辑相关 ========== */
const specDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const specContent = ref('');
const specSaving = ref(false);
const currentSpecFile = ref('');
const currentCaseId = ref<string | number>('');

/** ========== 历史版本相关 ========== */
const historyList = ref<E2eTestCaseHistoryVo[]>([]);

/** ========== 单用例执行相关 ========== */
const runDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const runForm = reactive({
  taskName: '',
  browser: 'chromium',
  headed: '1',
  caseIds: [] as Array<string | number>
});
const runRules = {
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  browser: [{ required: true, message: '请选择浏览器', trigger: 'change' }]
};

/** 查询测试用例列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listTestCase(queryParams.value);
    testCaseList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
    // 提取用例分组选项
    const groups = new Set(testCaseList.value.map(item => item.caseGroup).filter(Boolean));
    caseGroupOptions.value = Array.from(groups);
  });
};

/** 取消按钮 */
const cancel = () => {
  closeDialog();
  resetForm();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 新增按钮操作 */
const handleAdd = () => {
  openDialog('添加测试用例');
};

/** 修改按钮操作 */
const handleUpdate = async (row?: Partial<E2eTestCaseVO>) => {
  resetForm();
  const caseId = row?.caseId || ids.value[0];
  const res = await getTestCase(caseId);
  Object.assign(form.value, res.data);
  showDialog('修改测试用例');
};

/** 提交按钮 */
const submitForm = () => {
  caseFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.caseId ? await updateTestCase(form.value) : await addTestCase(form.value);
      modal.msgSuccess('操作成功');
      closeDialog();
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<E2eTestCaseVO>) => {
  const caseIds = row?.caseId || ids.value;
  await modal.confirm('是否确认删除测试用例编号为"' + caseIds + '"的数据项？');
  await delTestCase(caseIds);
  await getList();
  modal.msgSuccess('删除成功');
};

/** 同步Spec文件 */
const handleSync = async () => {
  await withLoading(async () => {
    await syncSpecFiles();
    modal.msgSuccess('同步成功');
    await getList();
  });
};

/** AI生成用例（占位） */
const handleAiGenerate = () => {
  modal.msgWarning('AI生成功能开发中...');
};

/** 编辑Spec文件 - 从DB读取内容 */
const handleEditSpec = async (row: E2eTestCaseVO) => {
  currentCaseId.value = row.caseId;
  currentSpecFile.value = row.specFile;
  specDialog.title = `编辑 - ${row.caseName}`;
  specContent.value = row.content || '// 用例内容为空，请编写测试代码';
  specDialog.visible = true;
  // 加载历史版本
  try {
    const res = await getCaseHistory(row.caseId);
    historyList.value = res.data || [];
  } catch (e) {
    historyList.value = [];
  }
};

/** 保存Spec内容到DB */
const handleSaveSpec = async () => {
  specSaving.value = true;
  try {
    await saveCaseContent(currentCaseId.value, specContent.value);
    modal.msgSuccess('保存成功');
    await getList();
    // 刷新历史版本
    const res = await getCaseHistory(currentCaseId.value);
    historyList.value = res.data || [];
  } catch (e) {
    modal.msgError('保存失败');
  } finally {
    specSaving.value = false;
  }
};

/** 预览历史版本内容 */
const previewHistory = (h: E2eTestCaseHistoryVo) => {
  specContent.value = h.content || '';
};

/** 回退到指定版本 */
const handleRevert = async (h: E2eTestCaseHistoryVo) => {
  await modal.confirm(`确认回退到版本 v${h.version}？`);
  await revertCase(currentCaseId.value, h.historyId);
  specContent.value = h.content || '';
  modal.msgSuccess('回退成功');
  // 重新加载历史版本
  const res = await getCaseHistory(currentCaseId.value);
  historyList.value = res.data || [];
  await getList();
};

/** 执行单个用例 */
const handleRunCase = (row: E2eTestCaseVO) => {
  runForm.taskName = `运行-${row.caseName}-${Date.now()}`;
  runForm.browser = 'chromium';
  runForm.headed = '1';
  runForm.caseIds = [row.caseId];
  runDialog.visible = true;
};

/** 提交执行 */
const submitRunCase = () => {
  runFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await addTask({
        taskName: runForm.taskName,
        browser: runForm.browser,
        headed: runForm.headed,
        caseIds: runForm.caseIds
      });
      modal.msgSuccess('任务创建成功');
      runDialog.visible = false;
    }
  });
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.e2e-testcase-page {
  .spec-file-path {
    font-family: monospace;
    font-size: 12px;
    color: var(--el-color-primary);
    cursor: pointer;
    word-break: break-all;
  }
}

.spec-editor-dialog {
  .spec-editor-layout {
    display: flex;
    height: calc(100vh - 150px);
    gap: 16px;
  }

  .spec-editor-main {
    flex: 1;
  }

  .spec-editor-sidebar {
    width: 240px;
    border-left: 1px solid var(--el-border-color-lighter);
    padding-left: 16px;
    overflow-y: auto;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    .history-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .spec-editor-textarea {
    height: 100%;

    :deep(.el-textarea__inner) {
      height: 100% !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      tab-size: 2;
    }
  }
}
</style>
