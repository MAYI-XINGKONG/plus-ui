# E2E 自动化测试管理平台 — 前端

基于 **Vue 3 + Element Plus + Vite** 的 E2E 自动化测试管理平台前端项目。

## 技术栈

| 组件 | 版本 |
|---|---|
| Vue | 3.5 |
| Element Plus | 2.14 |
| Vite | 8.x |
| TypeScript | 6.x |
| Pinia | 4.0 |
| Vue Router | 5.2 |
| UnoCSS | 66.7 |

## 页面功能

### 测试用例管理 `/e2e/testcase`

- 分组折叠视图 — 按 `caseGroup` 分组展示，可展开/折叠
- 用例 CRUD — 新增、修改、删除用例
- 代码编辑器 — 全屏编辑 `.spec.ts` 代码，支持语法高亮
- 版本历史 — 右侧面板展示历史版本，支持预览和回退
- 分组执行 — 每个分组有"执行分组"按钮，一键运行分组下所有用例
- 同步功能 — 将磁盘上的 spec 文件同步到数据库

### 测试任务管理 `/e2e/task`

- 任务列表 — 展示所有执行任务，支持搜索和状态筛选
- 创建任务 — 选择用例、浏览器、有头/无头模式
- 实时日志 — 轮询获取执行日志，自动刷新
- 任务控制 — 停止正在执行的任务
- 自动刷新 — 有执行中任务时每 5 秒自动刷新列表

### 测试报告管理 `/e2e/report`

- 报告列表 — 展示所有执行报告，含通过率进度条
- 报告详情 — 查看通过/失败/跳过统计
- 在线查看报告 — 通过 MinIO URL 直接打开 HTML 报告
- 产物查看 — 截图预览（el-image-viewer）、视频播放
- 产物下载 — 支持下载 Trace 和截图文件

## API 层

```
src/api/e2e/
├── testcase/
│   ├── index.ts    # 用例 API（CRUD、内容保存、历史、回退、同步）
│   └── types.ts    # 用例类型定义（VO、Form、Query、HistoryVo）
├── task/
│   ├── index.ts    # 任务 API（列表、创建、停止、分组执行、日志）
│   └── types.ts    # 任务类型定义
└── report/
    └── index.ts    # 报告 API（列表、详情、产物）
```

## 页面结构

```
src/views/e2e/
├── testcase/index.vue  # 测试用例管理（分组视图 + 代码编辑器 + 历史面板）
├── task/index.vue      # 测试任务管理（任务列表 + 日志对话框 + 创建对话框）
└── report/index.vue    # 测试报告管理（报告列表 + 详情对话框 + 产物查看）
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 权限标识

| 权限 | 说明 |
|---|---|
| `e2e:testcase:list` | 查询用例 |
| `e2e:testcase:add` | 新增用例 |
| `e2e:testcase:edit` | 修改用例/保存代码 |
| `e2e:testcase:remove` | 删除用例 |
| `e2e:testcase:sync` | 同步文件 |
| `e2e:task:list` | 查询任务 |
| `e2e:task:execute` | 执行任务 |
| `e2e:task:stop` | 停止任务 |
| `e2e:task:remove` | 删除任务 |
| `e2e:report:list` | 查询报告 |
| `e2e:report:remove` | 删除报告 |
