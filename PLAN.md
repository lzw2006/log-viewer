# Log Viewer 实施计划 (PLAN.md)

> 基于 `Instructions.md` + 需求澄清问答生成的开发计划。纯前端日志指标可视化应用。

## 1. 项目概述

一个**无后端**的 React 单页应用：用户拖拽上传访问日志 CSV，应用在浏览器内完成解析、聚合、可视化。支持按多种时间维度统计所有 / 单个 Profile 的调用量，并按 HTTP 状态码类别下钻。

- **输入**：CSV 文件（每行一条访问日志：Profile、访问时间、HTTP 返回码）
- **输出**：多维交互式图表 dashboard + 单 Profile 详情
- **数据量**：几百 ~ 上千行，客户端聚合无性能压力

## 2. 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 框架 | **React 18 + Vite** | 单页应用，无后端 |
| 语言 | TypeScript | 纯前端，类型安全 |
| 图表 | **Apache ECharts** + `echarts-for-react` | dataZoom 适合分钟级密集数据 |
| CSV 解析 | **PapaParse** | 流式、header 模式、容错 |
| 日期处理 | **dayjs** + `dayjs/plugin/*`（weekOfYear/isoWeek/utc） | 兼容 `YYYY-MM-DD HH:mm:ss` |
| 状态管理 | React hooks + **Zustand**（轻量） | 全局数据/过滤状态 |
| UI 组件 | 自建轻样式 + 必要时组件库（如 Ant Design 仅用 Select/表格） | 保持轻量 |

## 3. 数据模型 & CSV 解析

### 3.1 自动识别 Schema（按 header，失败回退位置）

Parser 按 header 名模糊匹配三列，匹配规则：

| 字段 | 匹配的 header 关键词（不区分大小写） | 回退位置 |
|---|---|---|
| Profile | `profile`, `user`, `client`, `pc` | 第 1 列 |
| 时间戳 | `time`, `timestamp`, `date`, `datetime`, `访问时间` | 第 2 列 |
| HTTP 状态码 | `code`, `status`, `http`, `http_code`, `返回码` | 第 3 列 |

> 若解析出的列数 < 2，视为无效文件，提示用户。

### 3.2 内部数据结构

```ts
interface LogRecord {
  profile: string;        // e.g. "PC0003"
  timestamp: number;      // dayjs 转 Unix ms
  httpCode: number;       // e.g. 200；非数字 → 视为坏行
}
interface ParseResult {
  records: LogRecord[];   // 有效行
  skipped: { row: number; reason: string }[]; // 跳过的坏行
  columns: { profileCol: string; timeCol: string; codeCol: string }; // 识别到的列名
}
```

### 3.3 脏数据处理策略：**跳过坏行 + 顶部提示**

- 缺列 / 时间戳无法解析 / 状态码非数字 → 该行跳过，记入 `skipped`
- 顶部 banner：「⚠️ 跳过 N 行无效数据」，点击展开查看原因
- 至少 1 行有效才进入可视化；否则提示「文件无可解析数据」

## 4. 状态码维度（范围广 → 按类别归并）

具体码归并到 4 桶：

| 类别 | 区间 | 颜色（建议） |
|---|---|---|
| `2xx` | 200–299 | 绿 |
| `3xx` | 300–399 | 蓝 |
| `4xx` | 400–499 | 橙 |
| `5xx` | 500–599 | 红 |

- 所有趋势图默认**按类别堆叠**
- 图表上方提供 `2xx / 3xx / 4xx / 5xx` **过滤 chips**（点击显隐对应 series）

## 5. 视图结构：两个 Tab

```
┌─────────────────────────────────────────────┐
│  [拖拽上传区 / 当前文件名]   ⚠️跳过N行  [重新上传] │
├─────────────────────────────────────────────┤
│  [总览]  [单 Profile]          ← Tab 切换     │
├─────────────────────────────────────────────┤
│   [月][周][日][时][分]   ← 当前 Tab 独立粒度   │
├─────────────────────────────────────────────┤
│                (Tab 内容)                    │
└─────────────────────────────────────────────┘
```

- 每个 Tab **各自独立**的时间维度状态，互不影响
- 上传区 / 跳过提示 / 粒度切换为全局/Tab 级控件

### 5.1 `[总览]` Tab — 4 块 Dashboard

1. **总量趋势图**：所有 Profile 调用量之和，按时间桶 × 堆叠状态码类别（带 dataZoom + 过滤 chips）
2. **Top N 调用量排行**：横向条形图 / 表格，默认 Top **20**（下拉可改 10/20/50/100），其余不显示
3. **错误率排行表**：按 `4xx+5xx 占比` 降序的表格，揪出问题最严重的 Profile
4. **调用量分布直方图**：横轴=调用量区间，纵轴=Profile 数量，看头部/长尾分布

> 原计划的「热力图」因几百个 Profile 不适合已**移除**，替换为错误率排行 + 分布直方图。

### 5.2 `[单 Profile]` Tab — 搜索 + 详情

- 顶部**搜索框**（带自动补全，支持几百个 Profile 模糊匹配）
- 选中某 Profile 后展示：
  - **统计卡片**：总调用量 / 成功率 / 错误数 / 峰值时段
  - **调用量趋势图**：该 Profile 按时间桶 × 堆叠状态码（带 dataZoom + 过滤 chips）

## 6. 时间维度 & 聚合逻辑

| 维度 | 桶定义 | 桶 key 格式 |
|---|---|---|
| 月 | 自然月 | `YYYY-MM` |
| 周 | **周一起始**（ISO 周） | `YYYY-Www`（如 `2016-W10`） |
| 日 | 自然日 | `YYYY-MM-DD` |
| 时 | 自然小时 | `YYYY-MM-DD HH:00` |
| 分 | 自然分钟 | `YYYY-MM-DD HH:mm` |

### 聚合算法（纯客户端）

```
for each record:
  bucket = truncate(record.timestamp, granularity)   // dayjs startOf
  key = profile + '|' + bucket
  counts[key][statusCodeClass] += 1
```

- 用 `Map` / 对象按 `(profile, bucket, class)` 三元组累加，O(n)
- 空桶：按所选粒度生成连续时间轴，缺失桶补 0（避免折线断点）
- 聚合结果按当前过滤状态 memo 缓存，切换粒度/过滤才重算

## 7. 模块划分

```
src/
├── main.tsx
├── App.tsx                      # Tab 路由 + 全局上传区
├── store/
│   └── useDataStore.ts          # Zustand: records / parseResult / 过滤状态
├── lib/
│   ├── parse.ts                 # CSV → ParseResult（PapaParse + schema 识别 + 坏行收集）
│   ├── aggregate.ts             # 聚合：按粒度/profile 桶化 + 状态码归并
│   ├── timeBuckets.ts           # 生成连续时间轴 + 空桶补 0
│   └── constants.ts             # 状态码类别 / 颜色 / 列名匹配规则
├── components/
│   ├── UploadZone.tsx           # 拖拽上传 + 文件名 + 重传
│   ├── SkipBanner.tsx           # 跳过坏行提示
│   ├── GranularitySwitch.tsx    # [月|周|日|时|分]
│   ├── StatusFilterChips.tsx    # 2xx/3xx/4xx/5xx
│   ├── charts/
│   │   ├── TotalTrendChart.tsx
│   │   ├── TopNRankingChart.tsx
│   │   ├── ErrorRateTable.tsx
│   │   ├── DistributionHistogram.tsx
│   │   └── ProfileTrendChart.tsx
│   ├── ProfileSearch.tsx        # 自动补全搜索
│   └── StatCards.tsx            # 单 Profile 统计卡片
├── tabs/
│   ├── OverviewTab.tsx          # 4 块 dashboard
│   └── ProfileTab.tsx           # 搜索 + 详情
└── types.ts                     # LogRecord / ParseResult / Granularity 等
```

## 8. 实施步骤（垂直切片，逐步可跑）

### 阶段 0 — 脚手架（可启动空壳）
- `npm create vite@latest` (react-ts) → 装 echarts / papaparse / dayjs / zustand
- 跑通 `npm run dev`

### 阶段 1 — 数据管线（解析 → store）✅ 贯通点
- `parse.ts`：上传 → 自动识别列 → 坏行收集
- `useDataStore`：存 records + skipped
- `UploadZone` + `SkipBanner` 上屏，控制台打印聚合前数据

### 阶段 2 — 聚合 + 总览趋势图 ✅ 第一个可见图表
- `aggregate.ts` + `timeBuckets.ts`
- `TotalTrendChart`（堆叠状态码）+ `GranularitySwitch` + `StatusFilterChips`
- 此刻「所有 Profile 调用量按时间维度」已可用

### 阶段 3 — 总览其余 3 块
- `TopNRankingChart` / `ErrorRateTable` / `DistributionHistogram`
- 总览 dashboard 完整

### 阶段 4 — 单 Profile Tab
- `ProfileSearch` + `StatCards` + `ProfileTrendChart`
- Tab 路由 + 各自独立粒度状态

### 阶段 5 — 打磨
- dataZoom / 主题 / 响应式 / 空状态（上传前落地页）/ 边界错误提示

## 9. 默认值与约定

- Top N 默认 **20**，下拉可改 10/20/50/100
- 周起始日 = **周一**（ISO）
- 上传前显示**拖拽落地页**引导；无数据时图表区显示空状态
- 状态码颜色：2xx 绿 / 3xx 蓝 / 4xx 橙 / 5xx 红
- 空桶补 0，折线连续不断点
- 日期解析容错：优先 `YYYY-MM-DD HH:mm:ss`，兼容常见变体

## 10. 不做（Out of Scope）

- ❌ 后端服务（纯前端）
- ❌ 热力图（数百 Profile 不适合，已替换）
- ❌ 单独的日期范围选择器（用图表内 dataZoom 替代）
- ❌ 按每个具体状态码（200/301/404…）单独成色（按类别归并）
