<template>
  <div class="p-2 app-container e2e-task-page">
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
          <el-form-item label="任务名称" prop="taskName">
            <el-input
              v-model="queryParams.taskName"
              placeholder="请输入任务名称"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="任务状态" clearable>
              <el-option label="待执行" value="0" />
              <el-option label="执行中" value="1" />
              <el-option label="已完成" value="2" />
              <el-option label="异常" value="3" />
              <el-option label="已停止" value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="浏览器" prop="browser">
            <el-select v-model="queryParams.browser" placeholder="浏览器类型" clearable>
              <el-option label="Chromium" value="chromium" />
              <el-option label="Firefox" value="firefox" />
              <el-option label="WebKit" value="webkit" />
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
            <span class="panel-kicker">Task Monitor</span>
            <h3>测试任务列表</h3>
            <p>共 {{ total }} 条记录，支持任务管理和实时日志。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['e2e:task:add']" type="primary" plain icon="Plus" @click="handleCreateTask">
              创建任务
            </el-button>
            <el-button
              v-hasPermi="['e2e:task:remove']"
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
        :data="taskList"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="任务编号" align="center" prop="taskId" />
        <el-table-column label="任务名称" align="center" prop="taskName" show-overflow-tooltip />
        <el-table-column label="浏览器" align="center" prop="browser">
          <template #default="scope">
            <el-tag effect="plain">{{ scope.row.browser }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有头模式" align="center" prop="headed">
          <template #default="scope">
            <el-tag :type="scope.row.headed === '1' ? 'success' : 'info'">
              {{ scope.row.headed === '1' ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '0'" type="info">待执行</el-tag>
            <el-tag v-else-if="scope.row.status === '1'" type="primary">
              <el-icon class="is-loading"><Loading /></el-icon>
              执行中
            </el-tag>
            <el-tag v-else-if="scope.row.status === '2'" type="success">已完成</el-tag>
            <el-tag v-else-if="scope.row.status === '3'" type="danger">异常</el-tag>
            <el-tag v-else-if="scope.row.status === '4'" type="warning">已停止</el-tag>
            <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用例数" align="center" prop="totalCases" width="80" />
        <el-table-column label="通过" align="center" width="70">
          <template #default="scope">
            <span class="text-success">{{ scope.row.passedCases || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="失败" align="center" width="70">
          <template #default="scope">
            <span class="text-danger">{{ scope.row.failedCases || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="跳过" align="center" width="70">
          <template #default="scope">
            <span class="text-warning">{{ scope.row.skippedCases || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" align="center" prop="startTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.startTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结束时间" align="center" prop="endTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗时" align="center" width="100">
          <template #default="scope">
            <span v-if="scope.row.startTime && scope.row.endTime">
              {{ calcDuration(scope.row.startTime, scope.row.endTime) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="查看日志" placement="top">
              <el-button
                link
                type="primary"
                icon="Document"
                @click="handleViewLog(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="查看报告" placement="top">
              <el-button
                link
                type="primary"
                icon="DataAnalysis"
                @click="handleViewReport(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.status === '1'" content="停止" placement="top">
              <el-button
                v-hasPermi="['e2e:task:stop']"
                link
                type="warning"
                icon="VideoPause"
                @click="handleStopTask(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                v-hasPermi="['e2e:task:remove']"
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

    <!-- 创建任务对话框 -->
    <el-dialog v-model="createDialog.visible" title="创建测试任务" width="700px" append-to-body>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="90px">
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="createForm.taskName" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="浏览器" prop="browser">
          <el-select v-model="createForm.browser" placeholder="请选择浏览器">
            <el-option label="Chromium" value="chromium" />
            <el-option label="Firefox" value="firefox" />
            <el-option label="WebKit" value="webkit" />
            <el-option label="全部" value="all" />
          </el-select>
        </el-form-item>
        <el-form-item label="有头模式" prop="headed">
          <el-switch v-model="createForm.headed" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="选择用例" prop="caseIds">
          <div v-loading="casesLoading" class="case-selection-box">
            <el-checkbox-group v-model="createForm.caseIds">
              <el-checkbox
                v-for="item in availableCases"
                :key="item.caseId"
                :value="item.caseId"
                class="case-checkbox-item"
              >
                {{ item.caseName }}
                <el-tag v-if="item.caseGroup" size="small" effect="plain" class="case-group-tag">{{ item.caseGroup }}</el-tag>
              </el-checkbox>
            </el-checkbox-group>
            <el-empty v-if="!casesLoading && availableCases.length === 0" description="暂无可用用例" :image-size="60" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :disabled="createForm.caseIds.length === 0" @click="submitCreateTask">
            确 定（已选 {{ createForm.caseIds.length }} 条用例）
          </el-button>
          <el-button @click="createDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 实时日志对话框 -->
    <el-dialog v-model="logDialog.visible" title="执行日志" width="850px" append-to-body :close-on-click-modal="false">
      <div class="log-header">
        <span class="log-task-name">{{ logDialog.taskName }}</span>
        <el-tag v-if="logPollTimer" type="primary" size="small">实时刷新中</el-tag>
        <el-tag v-else type="info" size="small">已完成</el-tag>
      </div>
      <div id="log-container" ref="logContainerRef" class="log-container">
        <div v-if="logLines.length === 0" class="log-empty">等待日志输出...</div>
        <div v-for="(line, index) in logLines" :key="index" class="log-line">{{ line }}</div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseLogDialog">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="E2eTask" lang="ts">
import { listTestCase } from '@/api/e2e/testcase';
import type { E2eTestCaseVO } from '@/api/e2e/testcase/types';
import { addTask, delTask, getTask, getTaskLogs, listTask, stopTask } from '@/api/e2e/task';
import type { E2eTestTaskQuery, E2eTestTaskVO } from '@/api/e2e/task/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { parseTime } from '@/utils/ruoyi';

const router = useRouter();

const taskList = ref<E2eTestTaskVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const { ids, single, multiple, handleSelectionChange } = useTableSelection<E2eTestTaskVO>(item => item.taskId);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const createFormRef = ref<ElFormInstance>();

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    taskName: '',
    status: '',
    browser: ''
  } as E2eTestTaskQuery
});

const { queryParams } = toRefs(data);
const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  afterReset: () => {
    handleQuery();
  }
});

/** ========== 创建任务相关 ========== */
const createDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const createForm = reactive({
  taskName: '',
  browser: 'chromium',
  headed: '1',
  caseIds: [] as Array<string | number>
});
const createRules = {
  taskName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  browser: [{ required: true, message: '请选择浏览器', trigger: 'change' }]
};
const availableCases = ref<E2eTestCaseVO[]>([]);
const casesLoading = ref(false);

/** ========== 实时日志相关 ========== */
const logDialog = reactive({
  visible: false,
  taskName: '',
  taskId: '' as string | number,
  status: ''
});
const logLines = ref<string[]>([]);
const logPollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const listPollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const logContainerRef = ref<HTMLDivElement>();

/** 查询测试任务列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listTask(queryParams.value);
    taskList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
    // Auto-refresh if any task is running
    const hasRunning = (taskList.value || []).some((t: E2eTestTaskVO) => t.status === '1');
    if (hasRunning && !listPollTimer.value) {
      listPollTimer.value = setInterval(() => getList(), 5000);
    } else if (!hasRunning && listPollTimer.value) {
      clearInterval(listPollTimer.value);
      listPollTimer.value = null;
    }
  });
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 计算耗时 */
const calcDuration = (start: string, end: string) => {
  if (!start || !end) return '-';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (diff < 0) return '-';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}分${remainSeconds}秒`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}时${remainMinutes}分${remainSeconds}秒`;
};

/** 创建任务 */
const handleCreateTask = async () => {
  createForm.taskName = '';
  createForm.browser = 'chromium';
  createForm.headed = '1';
  createForm.caseIds = [];
  createDialog.visible = true;
  // 加载可用用例
  casesLoading.value = true;
  try {
    const res = await listTestCase({ pageNum: 1, pageSize: 9999, status: '0' });
    availableCases.value = res.data?.rows || [];
  } catch (e) {
    availableCases.value = [];
  } finally {
    casesLoading.value = false;
  }
};

/** 提交创建任务 */
const submitCreateTask = () => {
  createFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await addTask({
        taskName: createForm.taskName,
        browser: createForm.browser,
        headed: createForm.headed,
        caseIds: createForm.caseIds
      });
      modal.msgSuccess('任务创建成功');
      createDialog.visible = false;
      await getList();
    }
  });
};

/** 查看日志 */
const handleViewLog = (row: E2eTestTaskVO) => {
  logDialog.taskName = row.taskName;
  logDialog.taskId = row.taskId;
  logDialog.visible = true;
  logLines.value = [];
  logDialog.status = row.status;
  // 立即拉取一次
  fetchLogs(row.taskId);
  // 轮询：仅任务执行中时开启
  if (row.status === '1') {
    logPollTimer.value = window.setInterval(() => fetchLogs(row.taskId), 2000);
  }
};

/** 拉取日志 */
const fetchLogs = async (taskId: string | number) => {
  try {
    const res = await getTaskLogs(taskId);
    const lines = res.data || [];
    logLines.value = lines;
    nextTick(() => {
      if (logContainerRef.value) {
        logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
      }
    });
    // Check if task finished
    try {
      const taskRes = await getTask(taskId);
      if (taskRes.data && taskRes.data.status !== '1') {
        logDialog.status = taskRes.data.status;
        if (logPollTimer.value) {
          clearInterval(logPollTimer.value);
          logPollTimer.value = null;
        }
      }
    } catch (ignored) {}
  } catch (e) {
    // ignore
  }
};

/** 关闭日志对话框 */
const handleCloseLogDialog = () => {
  if (logPollTimer.value) {
    clearInterval(logPollTimer.value);
    logPollTimer.value = null;
  }
  logDialog.visible = false;
};

/** 查看报告 */
const handleViewReport = (row: E2eTestTaskVO) => {
  if (row.reportPath) {
    window.open(row.reportPath, '_blank');
  } else {
    // 跳转到报告详情页
    router.push({ path: '/e2e/report', query: { taskId: row.taskId } });
  }
};

/** 停止任务 */
const handleStopTask = async (row: E2eTestTaskVO) => {
  await modal.confirm('是否确认停止任务"' + row.taskName + '"？');
  await stopTask(row.taskId);
  modal.msgSuccess('任务已停止');
  await getList();
};

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<E2eTestTaskVO>) => {
  const taskIds = row?.taskId || ids.value;
  await modal.confirm('是否确认删除测试任务编号为"' + taskIds + '"的数据项？');
  await delTask(taskIds);
  await getList();
  modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
});

onBeforeUnmount(() => {
  if (logPollTimer.value) { clearInterval(logPollTimer.value); logPollTimer.value = null; }
  if (listPollTimer.value) { clearInterval(listPollTimer.value); listPollTimer.value = null; }
});
</script>

<style lang="scss" scoped>
.e2e-task-page {
  .text-success {
    color: var(--el-color-success);
    font-weight: 600;
  }

  .text-danger {
    color: var(--el-color-danger);
    font-weight: 600;
  }

  .text-warning {
    color: var(--el-color-warning);
    font-weight: 600;
  }
}

.case-selection-box {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 12px;

  .case-checkbox-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    width: 100%;

    .case-group-tag {
      margin-left: 8px;
    }
  }
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .log-task-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.log-container {
  height: 500px;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;

  .log-empty {
    color: #888;
    text-align: center;
    padding: 40px 0;
  }

  .log-line {
    color: #d4d4d4;
    white-space: pre-wrap;
    word-break: break-all;

    &::selection {
      background: #264f78;
    }
  }
}
</style>
