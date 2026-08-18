<template>
  <div class="home">
    <section class="hero-panel">
      <div class="hero-copy">
        <h1>自动化测试中心</h1>
        <p>
          集成接口测试、E2E 测试、AI 辅助用例生成于一体，支持多浏览器并行执行，实时查看测试报告与通过率统计。
        </p>
        <div class="hero-actions">
          <el-button type="primary" icon="VideoPlay" @click="goPage('/autotest/execution')">执行测试</el-button>
          <el-button plain icon="List" @click="goPage('/autotest/suite')">用例管理</el-button>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat-card">
          <strong>{{ stats.suiteCount }}</strong>
          <span>测试用例</span>
        </div>
        <div class="stat-card">
          <strong>{{ stats.executionCount }}</strong>
          <span>执行次数</span>
        </div>
        <div class="stat-card">
          <strong :style="{ color: stats.passRate >= 80 ? '#67c23a' : '#f56c6c' }">{{ stats.passRate }}%</strong>
          <span>通过率</span>
        </div>
      </div>
    </section>

    <div class="content-grid">
      <section class="section-card">
        <div class="section-head">
          <div>
            <span class="section-kicker">Quick Access</span>
            <h2>功能入口</h2>
          </div>
        </div>
        <div class="quick-grid">
          <article v-for="item in quickLinks" :key="item.title" class="quick-card" @click="goPage(item.path)">
            <div class="quick-icon" :style="{ background: item.bg }">
              <el-icon :size="24"><component :is="item.icon" /></el-icon>
            </div>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="section-card">
        <div class="section-head">
          <div>
            <span class="section-kicker">Recent Runs</span>
            <h2>最近执行</h2>
          </div>
          <el-button link type="primary" @click="goPage('/autotest/report')">查看全部</el-button>
        </div>
        <div v-if="recentExecutions.length" class="recent-list">
          <div v-for="item in recentExecutions" :key="item.executionId" class="recent-item">
            <el-tag :type="getStatusType(item.status)" size="small" effect="dark">{{ getStatusLabel(item.status) }}</el-tag>
            <span class="recent-name">{{ item.suiteName || '全部用例' }}</span>
            <span class="recent-time">{{ item.browser }} · {{ formatDuration(item.duration) }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无执行记录" :image-size="80" />
      </section>
    </div>
  </div>
</template>

<script setup name="Index" lang="ts">
import { listSuite } from '@/api/test/suite';
import { listExecution } from '@/api/test/execution';

const router = useRouter();

const stats = reactive({
  suiteCount: 0,
  executionCount: 0,
  passRate: 0
});

const recentExecutions = ref<any[]>([]);

const quickLinks = [
  { title: '测试用例', desc: '管理接口测试与 E2E 用例', path: '/autotest/suite', icon: 'List', bg: 'rgba(64,158,255,0.12)' },
  { title: '测试执行', desc: '选择用例或批量执行测试', path: '/autotest/execution', icon: 'VideoPlay', bg: 'rgba(103,194,58,0.12)' },
  { title: '测试报告', desc: '查看历史报告与通过率趋势', path: '/autotest/report', icon: 'DataAnalysis', bg: 'rgba(230,162,60,0.12)' },
  { title: '接口文档', desc: 'Swagger UI 查看后端 API', path: '__swagger', icon: 'Document', bg: 'rgba(144,147,153,0.12)' }
];

const getStatusType = (status: string) => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
    pass: 'success', fail: 'danger', running: 'warning', pending: 'info', error: 'danger'
  };
  return map[status] || 'info';
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = { pass: '通过', fail: '失败', running: '执行中', pending: '待执行', error: '错误' };
  return map[status] || status;
};

const formatDuration = (ms: number) => {
  if (!ms) return '-';
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(1) + 's';
};

const goPage = (path: string) => {
  if (path === '__swagger') {
    window.open('/swagger-ui/index.html', '_blank');
  } else {
    router.push(path);
  }
};

onMounted(async () => {
  try {
    const [suiteRes, execRes] = await Promise.all([
      listSuite({ pageNum: 1, pageSize: 1 }),
      listExecution({ pageNum: 1, pageSize: 5 })
    ]);
    stats.suiteCount = suiteRes.data?.total || 0;
    stats.executionCount = execRes.data?.total || 0;
    const rows = execRes.data?.rows || [];
    recentExecutions.value = rows;
    if (rows.length > 0) {
      const passed = rows.filter((r: any) => r.status === 'pass').length;
      stats.passRate = Math.round((passed / rows.length) * 100);
    }
  } catch {
    // 接口未就绪时静默处理
  }
});
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-panel,
.section-card {
  border-radius: 28px;
  border: 1px solid var(--app-surface-border);
  background: var(--app-surface-bg);
  box-shadow: var(--app-shadow-sm);
  backdrop-filter: blur(18px);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 18px;
  padding: 30px;
  background: radial-gradient(circle at top left, rgba(53, 109, 255, 0.16), transparent 30%), var(--app-surface-bg);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 14px;

  h1 {
    margin: 0;
    font-size: clamp(30px, 4vw, 46px);
    line-height: 1.06;
    letter-spacing: -0.04em;
    color: var(--app-text-title);
  }

  p {
    margin: 0;
    max-width: 760px;
    color: var(--app-text-muted);
    font-size: 15px;
    line-height: 1.8;
  }
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.hero-stats {
  display: grid;
  gap: 12px;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 22px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    color: var(--app-text-title);
    font-size: 28px;
    letter-spacing: -0.03em;
  }

  span {
    color: var(--app-text-muted);
    font-size: 13px;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: 20px;
}

.section-card {
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;

  h2 {
    margin: 6px 0 0;
    color: var(--app-text-title);
    font-size: 22px;
    letter-spacing: -0.03em;
  }
}

.section-kicker {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(53, 109, 255, 0.3);
  }

  h3 {
    margin: 0 0 4px;
    font-size: 15px;
    color: var(--app-text-title);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--app-text-muted);
  }
}

.quick-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);
}

.recent-name {
  flex: 1;
  font-size: 14px;
  color: var(--app-text-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-time {
  font-size: 12px;
  color: var(--app-text-muted);
}

@media (max-width: 960px) {
  .hero-panel,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-panel,
  .section-card {
    padding: 20px;
    border-radius: 22px;
  }
}
</style>
