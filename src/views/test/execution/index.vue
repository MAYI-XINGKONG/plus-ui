<template>
  <div class="p-2 app-container test-execution-page">
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
          <el-form-item label="执行状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
              <el-option label="待执行" value="pending" />
              <el-option label="排队中" value="queued" />
              <el-option label="执行中" value="running" />
              <el-option label="通过" value="pass" />
              <el-option label="失败" value="fail" />
              <el-option label="错误" value="error" />
              <el-option label="已终止" value="stopped" />
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
            <span class="panel-kicker">Execution Dataset</span>
            <h3>测试执行</h3>
            <p>共 {{ total }} 条执行记录。</p>
          </div>
          <div class="toolbar-actions">
            <el-select v-model="selectedBrowser" style="width: 130px; margin-right: 8px">
              <el-option label="Chromium" value="chromium" />
              <el-option label="Firefox" value="firefox" />
              <el-option label="WebKit" value="webkit" />
            </el-select>
            <el-radio-group v-model="selectedHeaded" style="margin-right: 8px">
              <el-radio-button :value="0">无头</el-radio-button>
              <el-radio-button :value="1">有头</el-radio-button>
            </el-radio-group>
            <el-button v-hasPermi="['test:execution:run']" type="primary" icon="VideoPlay" @click="handleExecuteAll">
              全部执行
            </el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="总执行数" :value="stats.total" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card stat-pass">
            <el-statistic title="通过数" :value="stats.passed" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card stat-fail">
            <el-statistic title="失败数" :value="stats.failed" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card stat-rate">
            <el-statistic title="通过率">
              <template #default>
                <span>{{ stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0' }}%</span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <el-table v-loading="loading" border class="data-table" :data="executionList">
        <el-table-column label="执行ID" align="center" prop="executionId" width="100" show-overflow-tooltip />
        <el-table-column label="用例名称" align="center" prop="suiteName" :show-overflow-tooltip="true">
          <template #default="{ row }">
            {{ row.suiteName || '全部' }}
          </template>
        </el-table-column>
        <el-table-column label="浏览器" align="center" prop="browser" width="100" />
        <el-table-column label="模式" align="center" width="70">
          <template #default="{ row }">
            <el-tag :type="row.headed === 1 ? 'warning' : 'info'" size="small">{{ row.headed === 1 ? '有头' : '无头' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="通过" align="center" prop="passed" width="70" />
        <el-table-column label="失败" align="center" prop="failed" width="70" />
        <el-table-column label="总计" align="center" prop="total" width="70" />
        <el-table-column label="耗时" align="center" width="90">
          <template #default="{ row }">
            {{ row.duration ? (row.duration / 1000).toFixed(1) + 's' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="开始时间" align="center" prop="startTime" width="170" />
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-tooltip v-if="row.status === 'running' || row.status === 'queued'" content="终止" placement="top">
              <el-button link type="danger" icon="VideoPause" @click="handleStop(row)" />
            </el-tooltip>
            <el-tooltip content="详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(row)" />
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

    <!-- 详情/日志对话框 -->
    <el-dialog v-model="detailDialog.visible" :title="detailDialog.title" width="80%" top="5vh" append-to-body>
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="执行ID">{{ detailData.executionId }}</el-descriptions-item>
        <el-descriptions-item label="用例名称">{{ detailData.suiteName || '全部' }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ detailData.browser }}</el-descriptions-item>
        <el-descriptions-item label="模式">{{ detailData.headed === 1 ? '有头' : '无头' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(detailData.status)">{{ getStatusLabel(detailData.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">
          {{ detailData.duration ? (detailData.duration / 1000).toFixed(1) + 's' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="通过数">{{ detailData.passed }}</el-descriptions-item>
        <el-descriptions-item label="失败数">{{ detailData.failed }}</el-descriptions-item>
        <el-descriptions-item label="总计">{{ detailData.total }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detailData.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ detailData.endTime }}</el-descriptions-item>
        <el-descriptions-item label="PID">{{ detailData.processId || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 16px">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
          <h4 style="margin: 0">执行日志</h4>
          <el-tag v-if="wsConnected" type="success" size="small">实时连接中</el-tag>
          <el-tag v-else type="info" size="small">未连接</el-tag>
        </div>
        <div ref="logContainer" class="log-container">
          <pre class="log-content">{{ logContent }}</pre>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="detailData.status === 'running' || detailData.status === 'queued'" type="danger" @click="handleStop(detailData)">
            终止执行
          </el-button>
          <el-button @click="closeDetailDialog">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="TestExecution" lang="ts">
import { to } from 'await-to-js';
import { listExecution, getExecution, runTest, stopTest } from '@/api/test/execution';
import { ExecutionQuery, ExecutionVO } from '@/api/test/execution/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';

const executionList = ref<ExecutionVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
const selectedBrowser = ref('chromium');
const selectedHeaded = ref(0);

const queryFormRef = ref<ElFormInstance>();
const logContainer = ref<HTMLElement>();

const stats = reactive({ total: 0, passed: 0, failed: 0 });

const detailDialog = reactive<DialogOption>({ visible: false, title: '执行详情' });
const detailData = reactive<ExecutionVO>({
  executionId: '', suiteId: '', suiteIds: '', suiteName: '', execType: '',
  browser: '', headed: 0, status: '', processId: '', total: 0, passed: 0,
  failed: 0, skipped: 0, duration: 0, logOutput: '', reportPath: '',
  startTime: '', endTime: '', createTime: ''
});

const queryParams = ref<ExecutionQuery>({ pageNum: 1, pageSize: 10, status: '' });

// WebSocket 实时日志
const wsConnected = ref(false);
const logContent = ref('');
let stompClient: any = null;

const getStatusTagType = (status: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  const map: Record<string, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    pending: 'info', queued: 'info', running: 'warning', pass: 'success', fail: 'danger', error: 'danger', stopped: 'info'
  };
  return map[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = { pending: '待执行', queued: '排队中', running: '执行中', pass: '通过', fail: '失败', error: '错误', stopped: '已终止' };
  return map[status] || status;
};

const calcStats = () => {
  const rows = executionList.value || [];
  stats.total = rows.reduce((sum, r) => sum + (r.total || 0), 0);
  stats.passed = rows.reduce((sum, r) => sum + (r.passed || 0), 0);
  stats.failed = rows.reduce((sum, r) => sum + (r.failed || 0), 0);
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listExecution(queryParams.value);
    executionList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
    calcStats();
  });
};

const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };

const { resetQuery } = useSearchReset({ queryFormRef, queryParams, pageNumKey: 'pageNum', afterReset: handleQuery });

const handleExecuteAll = async () => {
  const [err] = await to(modal.confirm('是否确认执行全部测试用例？') as any);
  if (!err) {
    await runTest({ execType: '2', browser: selectedBrowser.value, headed: selectedHeaded.value });
    modal.msgSuccess('全部执行任务已提交');
    await getList();
  }
};

const handleStop = async (row: ExecutionVO) => {
  const [err] = await to(modal.confirm('确认终止该执行任务？') as any);
  if (!err) {
    await stopTest(row.executionId);
    modal.msgSuccess('终止命令已发送');
    await getList();
  }
};

const handleDetail = async (row: ExecutionVO) => {
  const res = await getExecution(row.executionId);
  Object.assign(detailData, res.data);
  logContent.value = detailData.logOutput || '';
  detailDialog.visible = true;

  // 如果正在运行，建立 WebSocket 连接接收实时日志
  if (detailData.status === 'running' || detailData.status === 'queued') {
    connectWebSocket(detailData.executionId as number);
  }
};

const closeDetailDialog = () => {
  disconnectWebSocket();
  detailDialog.visible = false;
};

const connectWebSocket = (executionId: number) => {
  disconnectWebSocket();
  try {
    // 动态导入 sockjs-client 和 stompjs
    const SockJS = (window as any).SockJS;
    const Stomp = (window as any).Stomp;
    if (!SockJS || !Stomp) {
      console.warn('SockJS/Stomp 未加载，实时日志不可用');
      return;
    }
    const wsUrl = (import.meta.env.VITE_APP_BASE_API || '') + '/ws/test';
    const socket = new SockJS(wsUrl);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, () => {
      wsConnected.value = true;
      // 订阅日志
      stompClient.subscribe('/topic/test/log/' + executionId, (message: any) => {
        logContent.value += message.body + '\n';
        nextTick(() => {
          if (logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight;
          }
        });
      });
      // 订阅状态
      stompClient.subscribe('/topic/test/status/' + executionId, (message: any) => {
        try {
          const data = JSON.parse(message.body);
          detailData.status = data.status;
          // 如果执行完成，断开连接并刷新列表
          if (data.status !== 'running' && data.status !== 'queued') {
            disconnectWebSocket();
            getList();
          }
        } catch (e) {
          console.error('解析状态消息失败', e);
        }
      });
    }, () => {
      wsConnected.value = false;
    });
  } catch (e) {
    console.error('WebSocket 连接失败', e);
  }
};

const disconnectWebSocket = () => {
  if (stompClient) {
    try { stompClient.disconnect(); } catch (e) { /* ignore */ }
    stompClient = null;
  }
  wsConnected.value = false;
};

onMounted(() => { getList(); });

onUnmounted(() => { disconnectWebSocket(); });
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;
@include pageShell.toolbar-responsive;

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

:deep(.stat-card .el-card__body) {
  padding: 16px;
}

.log-container {
  height: 400px;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 4px;
  padding: 12px;
}

.log-content {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
