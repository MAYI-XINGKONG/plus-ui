<template>
  <div class="p-2 app-container e2e-report-page">
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
            <span class="panel-kicker">Report Archive</span>
            <h3>测试报告列表</h3>
            <p>共 {{ total }} 条记录，支持报告查看和下载。</p>
          </div>
          <div class="toolbar-actions">
            <el-button
              v-hasPermi="['e2e:report:remove']"
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
        :data="reportList"
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
        <el-table-column label="状态" align="center" prop="status">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '0'" type="info">待执行</el-tag>
            <el-tag v-else-if="scope.row.status === '1'" type="primary">执行中</el-tag>
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
        <el-table-column label="通过率" align="center" width="160">
          <template #default="scope">
            <el-progress
              v-if="scope.row.totalCases > 0"
              :percentage="calcPassRate(scope.row)"
              :color="getPassRateColor(scope.row)"
              :stroke-width="14"
              :text-inside="true"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" align="center" prop="startTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.startTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="查看详情" placement="top">
              <el-button
                link
                type="primary"
                icon="View"
                @click="handleViewDetail(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="查看报告" placement="top">
              <el-button
                link
                type="primary"
                icon="DataAnalysis"
                @click="handleOpenReport(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="下载报告" placement="top">
              <el-button
                v-hasPermi="['e2e:report:export']"
                link
                type="primary"
                icon="Download"
                @click="handleDownloadReport(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                v-hasPermi="['e2e:report:remove']"
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

    <!-- 报告详情对话框 -->
    <el-dialog v-model="detailDialog.visible" :title="detailDialog.title" width="900px" append-to-body>
      <div v-loading="detailLoading" class="report-detail">
        <!-- 概览卡片 -->
        <el-row :gutter="16" class="summary-row">
          <el-col :span="4">
            <div class="summary-card">
              <div class="summary-label">用例总数</div>
              <div class="summary-value">{{ detailData.totalCases || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card summary-passed">
              <div class="summary-label">通过</div>
              <div class="summary-value">{{ detailData.passedCases || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card summary-failed">
              <div class="summary-label">失败</div>
              <div class="summary-value">{{ detailData.failedCases || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="summary-card summary-skipped">
              <div class="summary-label">跳过</div>
              <div class="summary-value">{{ detailData.skippedCases || 0 }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="summary-card">
              <div class="summary-label">通过率</div>
              <el-progress
                :percentage="calcDetailPassRate"
                :color="getDetailPassRateColor"
                :stroke-width="20"
                :text-inside="true"
                class="summary-progress"
              />
            </div>
          </el-col>
        </el-row>

        <!-- 基本信息 -->
        <el-descriptions :column="2" border class="detail-descriptions">
          <el-descriptions-item label="任务名称">{{ detailData.taskName }}</el-descriptions-item>
          <el-descriptions-item label="浏览器">{{ detailData.browser }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="detailData.status === '2'" type="success">成功</el-tag>
            <el-tag v-else-if="detailData.status === '3'" type="danger">失败</el-tag>
            <el-tag v-else type="info">{{ detailData.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="报告路径">
            <a v-if="detailData.reportPath && detailData.reportPath.startsWith('http')" :href="detailData.reportPath" target="_blank" class="report-path">查看报告</a>
            <span v-else class="report-path text-secondary">报告未上传</span>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ parseTime(detailData.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ parseTime(detailData.endTime) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 错误信息 -->
        <el-collapse v-if="detailData.errorMsg" class="error-collapse">
          <el-collapse-item title="错误信息" name="error">
            <pre class="error-stack">{{ detailData.errorMsg }}</pre>
          </el-collapse-item>
        </el-collapse>

        <!-- 测试产物 -->
        <div v-if="artifacts.length > 0" class="artifacts-section">
          <h4 class="section-title">测试产物</h4>
          <el-table :data="artifacts" border size="small" class="artifact-table">
            <el-table-column label="用例名称" align="center" prop="caseName" show-overflow-tooltip />
            <el-table-column label="类型" align="center" prop="artifactType" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.artifactType === 'screenshot'" type="primary" size="small">截图</el-tag>
                <el-tag v-else-if="scope.row.artifactType === 'video'" type="success" size="small">视频</el-tag>
                <el-tag v-else-if="scope.row.artifactType === 'trace'" type="warning" size="small">Trace</el-tag>
                <el-tag v-else type="info" size="small">{{ scope.row.artifactType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="文件路径" align="center" prop="filePath" show-overflow-tooltip>
              <template #default="scope">
                <span v-if="scope.row.filePath && scope.row.filePath.startsWith('http')" class="artifact-path">{{ scope.row.filePath }}</span>
                <el-tag v-else type="info" size="small">未上传</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="文件大小" align="center" width="100">
              <template #default="scope">
                <span>{{ formatFileSize(scope.row.fileSize) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="160">
              <template #default="scope">
                <template v-if="scope.row.filePath && scope.row.filePath.startsWith('http')">
                  <el-button
                    v-if="scope.row.artifactType === 'screenshot'"
                    link
                    type="primary"
                    size="small"
                    @click="handlePreviewImage(scope.row)"
                  >
                    预览
                  </el-button>
                  <el-button
                    v-if="scope.row.artifactType === 'video'"
                    link
                    type="primary"
                    size="small"
                    @click="handlePlayVideo(scope.row)"
                  >
                    播放
                  </el-button>
                  <el-button
                    link
                    type="primary"
                    size="small"
                    @click="handleDownloadArtifact(scope.row)"
                  >
                    下载
                  </el-button>
                </template>
                <span v-else class="text-secondary">-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="imageViewerVisible"
      :url-list="previewImageList"
      :initial-index="previewImageIndex"
      @close="imageViewerVisible = false"
    />

    <!-- 视频播放对话框 -->
    <el-dialog v-model="videoDialog.visible" title="视频回放" width="800px" append-to-body>
      <div class="video-player-wrapper">
        <video
          v-if="videoDialog.url"
          :src="videoDialog.url"
          controls
          autoplay
          class="video-player"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="videoDialog.visible = false">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="E2eReport" lang="ts">
import { delReport, getArtifacts, getReport, listReport } from '@/api/e2e/report';
import type { E2eTestArtifactVO, E2eTestTaskVO } from '@/api/e2e/task/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { parseTime } from '@/utils/ruoyi';

const route = useRoute();

const reportList = ref<E2eTestTaskVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const { ids, single, multiple, handleSelectionChange } = useTableSelection<E2eTestTaskVO>(item => item.taskId);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

const data = reactive({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    taskName: '',
    status: ''
  } as any
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

/** ========== 报告详情相关 ========== */
const detailDialog = reactive({
  visible: false,
  title: ''
});
const detailLoading = ref(false);
const detailData = ref<E2eTestTaskVO>({} as E2eTestTaskVO);
const artifacts = ref<E2eTestArtifactVO[]>([]);

/** 计算详情通过率 */
const calcDetailPassRate = computed(() => {
  if (!detailData.value.totalCases) return 0;
  return Math.round((detailData.value.passedCases / detailData.value.totalCases) * 100);
});

/** 详情通过率颜色 */
const getDetailPassRateColor = computed(() => {
  const rate = calcDetailPassRate.value;
  if (rate >= 80) return '#67c23a';
  if (rate >= 60) return '#e6a23c';
  return '#f56c6c';
});

/** ========== 图片预览相关 ========== */
const imageViewerVisible = ref(false);
const previewImageList = ref<string[]>([]);
const previewImageIndex = ref(0);

/** ========== 视频播放相关 ========== */
const videoDialog = reactive({
  visible: false,
  url: ''
});

/** 查询测试报告列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listReport(queryParams.value);
    reportList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 计算通过率 */
const calcPassRate = (row: E2eTestTaskVO) => {
  if (!row.totalCases) return 0;
  return Math.round((row.passedCases / row.totalCases) * 100);
};

/** 通过率颜色 */
const getPassRateColor = (row: E2eTestTaskVO) => {
  const rate = calcPassRate(row);
  if (rate >= 80) return '#67c23a';
  if (rate >= 60) return '#e6a23c';
  return '#f56c6c';
};

/** 格式化文件大小 */
const formatFileSize = (bytes: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/** 查看详情 */
const handleViewDetail = async (row: E2eTestTaskVO) => {
  detailDialog.title = `报告详情 - ${row.taskName}`;
  detailDialog.visible = true;
  detailLoading.value = true;
  artifacts.value = [];
  try {
    const [reportRes, artifactRes] = await Promise.all([
      getReport(row.taskId),
      getArtifacts(row.taskId).catch(() => ({ data: [] }))
    ]);
    detailData.value = reportRes.data || ({} as E2eTestTaskVO);
    artifacts.value = artifactRes.data || [];
  } catch (e) {
    modal.msgError('加载报告详情失败');
  } finally {
    detailLoading.value = false;
  }
};

/** 查看HTML报告（仅支持MinIO HTTP URL） */
const handleOpenReport = (row: E2eTestTaskVO) => {
  if (row.reportPath && row.reportPath.startsWith('http')) {
    window.open(row.reportPath, '_blank');
  } else {
    modal.msgWarning('报告未上传到文件服务器，请检查MinIO配置');
  }
};

/** 下载报告（仅支持MinIO HTTP URL） */
const handleDownloadReport = (row: E2eTestTaskVO) => {
  if (row.reportPath && row.reportPath.startsWith('http')) {
    window.open(row.reportPath, '_blank');
  } else {
    modal.msgWarning('报告未上传到文件服务器，请检查MinIO配置');
  }
};

/** 获取产物URL（仅支持MinIO HTTP URL） */
const getArtifactUrl = (filePath: string) => {
  if (filePath && filePath.startsWith('http')) {
    return filePath;
  }
  return '';
};

/** 预览截图 */
const handlePreviewImage = (artifact: E2eTestArtifactVO) => {
  previewImageList.value = [getArtifactUrl(artifact.filePath)];
  previewImageIndex.value = 0;
  imageViewerVisible.value = true;
};

/** 播放视频 */
const handlePlayVideo = (artifact: E2eTestArtifactVO) => {
  videoDialog.url = getArtifactUrl(artifact.filePath);
  videoDialog.visible = true;
};

/** 下载产物 */
const handleDownloadArtifact = (artifact: E2eTestArtifactVO) => {
  window.open(getArtifactUrl(artifact.filePath), '_blank');
};

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<E2eTestTaskVO>) => {
  const taskIds = row?.taskId || ids.value;
  await modal.confirm('是否确认删除测试报告编号为"' + taskIds + '"的数据项？');
  await delReport(taskIds);
  await getList();
  modal.msgSuccess('删除成功');
};

onMounted(() => {
  // 如果从任务页跳转过来带了taskId，自动打开详情
  const taskId = route.query.taskId as string;
  if (taskId) {
    handleViewDetail({ taskId } as E2eTestTaskVO);
  }
  getList();
});
</script>

<style lang="scss" scoped>
.e2e-report-page {
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

  .text-secondary {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.report-detail {
  .summary-row {
    margin-bottom: 20px;
  }

  .summary-card {
    text-align: center;
    padding: 16px 8px;
    border-radius: 8px;
    background: var(--el-fill-color-light);

    .summary-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }

    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    &.summary-passed .summary-value {
      color: var(--el-color-success);
    }

    &.summary-failed .summary-value {
      color: var(--el-color-danger);
    }

    &.summary-skipped .summary-value {
      color: var(--el-color-warning);
    }

    .summary-progress {
      margin-top: 8px;
    }
  }

  .detail-descriptions {
    margin-bottom: 16px;
  }

  .report-path {
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
    color: var(--el-color-primary);
  }

  .error-collapse {
    margin-bottom: 16px;

    .error-stack {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: var(--el-color-danger);
      white-space: pre-wrap;
      word-break: break-all;
      background: var(--el-fill-color-light);
      padding: 12px;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
    }
  }

  .artifacts-section {
    .section-title {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--el-text-color-primary);
    }

    .artifact-path {
      font-family: monospace;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      word-break: break-all;
    }
  }
}

.video-player-wrapper {
  text-align: center;

  .video-player {
    width: 100%;
    max-height: 500px;
    border-radius: 6px;
  }
}
</style>
