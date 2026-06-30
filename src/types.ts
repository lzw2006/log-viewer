// 全局类型定义 —— 所有模块的契约层

/** 时间粒度：月 / 周 / 日 / 时 / 分 */
export type Granularity = 'month' | 'week' | 'day' | 'hour' | 'minute'

/** HTTP 状态码类别（按百位归并） */
export type StatusCodeClass = '2xx' | '3xx' | '4xx' | '5xx'

/** 日期范围过滤：YYYY-MM-DD 字符串；null 表示该侧无限制 */
export interface DateRange {
  start: string | null
  end: string | null
}

/** 一条解析后的有效日志记录 */
export interface LogRecord {
  profile: string // e.g. "PC0003"
  timestamp: number // Unix ms
  httpCode: number // e.g. 200
}

/** 被跳过的坏行 */
export interface SkippedRow {
  row: number // 源文件 1-based 行号（含表头）
  reason: string
}

/** 自动识别出的列名 */
export interface ParsedColumns {
  profileCol: string
  timeCol: string
  codeCol: string
}

/** CSV 解析结果 */
export interface ParseResult {
  records: LogRecord[] // 有效行
  skipped: SkippedRow[] // 跳过的坏行
  columns: ParsedColumns // 识别到的列名
  totalRows: number // 数据行总数（不含表头）
}

/** 聚合后的一条时间序列样本 */
export interface SeriesPoint {
  class: StatusCodeClass
  data: number[] // 每个时间桶的计数值，与 buckets 一一对齐
}

/** 趋势图数据（总量 / 单 Profile 通用） */
export interface TrendData {
  buckets: string[] // 桶标签（显示用）
  timestamps: number[] // 桶时间戳（ms）
  series: SeriesPoint[] // 按状态码类别拆分
}

/** Top N / 排行条目 */
export interface RankItem {
  profile: string
  count: number
}

/** 错误率排行条目 */
export interface ErrorRateItem {
  profile: string
  total: number
  errors: number // 4xx + 5xx
  errorRate: number // 0..1
}

/** 分布直方图数据 */
export interface HistogramData {
  binLabels: string[] // 区间标签
  counts: number[] // 落入该区间的 Profile 数
}

/** 单 Profile 统计卡片数据 */
export interface ProfileStats {
  total: number
  success: number // 2xx
  errors: number // 4xx + 5xx
  redirect: number // 3xx
  successRate: number // 0..1
  peakBucket: string | null // 调用量最高的时间桶（按日桶）
  peakCount: number
}
