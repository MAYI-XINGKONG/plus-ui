<template>
  <div class="p-2 app-container test-report-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Report Dataset</span>
            <h3>测试报告</h3>
            <p>共 {{ total }} 条报告记录。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['test:report:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
            <right-toolbar :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border class="data-table" :data="reportList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="报告ID" align="center" prop="reportId" width="100" show-overflow-tooltip />
        <el-table-column label="报告名称" align="center" prop="reportName" :show-overflow-tooltip="true" />
        <el-table-column label="报告类型" align="center" prop="reportType" width="100">
          <template #default="{ row }">
            <el-tag :type="getReportTypeTag(row.reportType)" size="small">{{ row.reportType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" align="center" prop="fileSize" width="100">
          <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column label="执行ID" align="center" prop="executionId" width="120" show-overflow-tooltip />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="查看报告" placement="top">
              <el-button link type="primary" icon="View" @click="handleViewReport(row)" />
            </el-tooltip>
            <el-tooltip content="Trace 查看" placement="top">
              <el-button link type="success" icon="Film" @click="handleViewTrace(row)" />
            </el-tooltip>
            <el-tooltip content="下载报告" placement="top">
              <el-button v-hasPermi="['test:report:download']" link type="primary" icon="Download" @click="handleDownload(row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['test:report:remove']" link type="danger" icon="Delete" @click="handleDelete(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 报告查看对话框 -->
    <el-dialog v-model="reportViewVisible" title="测试报告" width="90%" top="3vh" append-to-body destroy-on-close>
      <div class="report-iframe-container">
        <iframe :src="reportViewUrl" class="report-iframe" />
      </div>
      <template #footer>
        <el-button @click="reportViewVisible = false">关闭</el-button>
        <el-button type="primary" @click="openInNewTab(reportViewUrl)">新窗口打开</el-button>
      </template>
    </el-dialog>

    <!-- Trace 查看对话框 -->
    <el-dialog v-model="traceViewVisible" title="Trace 查看器" width="95%" top="2vh" append-to-body destroy-on-close>
      <div class="trace-info">
        <el-alert type="info" :closable="false" show-icon>
          Trace 文件已加载到 Playwright Trace Viewer。如需更完整的查看体验，请点击"在 trace.playwright.dev 打开"。
        </el-alert>
      </div>
      <div class="trace-iframe-container">
        <iframe :src="traceViewUrl" class="trace-iframe" />
      </div>
      <template #footer>
        <el-button @click="traceViewVisible = false">关闭</el-button>
        <el-button type="primary" @click="openTraceExternal">在 trace.playwright.dev 打开</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="TestReport" lang="ts">
import { to } from 'await-to-js';
import { listReport, delReport, getReportHtmlUrl, getTraceUrl, getReportDownloadUrl } from '@/api/test/report';
import { ReportVO } from '@/api/test/report/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';

const reportList = ref<ReportVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { ids, multiple, handleSelectionChange } = useTableSelection<ReportVO>(item => item.reportId);
const total = ref(0);

const queryParams = ref<PageQuery>({ pageNum: 1, pageSize: 10 });

// 报告查看
const reportViewVisible = ref(false);
const reportViewUrl = ref('');

// Trace 查看
const traceViewVisible = ref(false);
const traceViewUrl = ref('');
const traceExecutionId = ref<string | number>('');

const formatFileSize = (bytes: number | undefined) => {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getReportTypeTag = (type: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  const map: Record<string, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    html: 'primary', json: 'success', xml: 'warning', pdf: 'danger'
  };
  return map[type?.toLowerCase()] || 'info';
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listReport(queryParams.value);
    reportList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleViewReport = (row: ReportVO) => {
  if (row.executionId) {
    reportViewUrl.value = getReportHtmlUrl(row.executionId);
    reportViewVisible.value = true;
  } else {
    modal.msgWarning('无法定位报告文件');
  }
};

const handleViewTrace = (row: ReportVO) => {
  if (row.executionId) {
    traceExecutionId.value = row.executionId;
    traceViewUrl.value = getTraceUrl(row.executionId);
    traceViewVisible.value = true;
  } else {
    modal.msgWarning('无法定位 Trace 文件');
  }
};

const openTraceExternal = () => {
  // trace.playwright.dev 支持通过 URL 参数加载 trace
  const traceUrl = window.location.origin + getTraceUrl(traceExecutionId.value);
  window.open('https://trace.playwright.dev/?trace=' + encodeURIComponent(traceUrl), '_blank');
};

const openInNewTab = (url: string) => {
  window.open(url, '_blank');
};

const handleDownload = (row: ReportVO) => {
  const url = getReportDownloadUrl(row.reportId);
  const a = document.createElement('a');
  a.href = url;
  a.download = row.reportName || 'report';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const handleDelete = async (row?: Partial<ReportVO>) => {
  const reportIds = row?.reportId || ids.value;
  const [err] = await to(modal.confirm('确认删除选中的报告？') as any);
  if (!err) {
    await delReport(reportIds);
    await getList();
    modal.msgSuccess('删除成功');
  }
};

onMounted(() => { getList(); });
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;
@include pageShell.toolbar-responsive;

.report-iframe-container,
.trace-iframe-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.report-iframe {
  width: 100%;
  height: 70vh;
  border: none;
}

.trace-iframe {
  width: 100%;
  height: 75vh;
  border: none;
}

.trace-info {
  margin-bottom: 12px;
}
</style>
