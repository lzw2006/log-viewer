// 纯函数聚合层 —— 所有图表数据的来源。O(n) 累加，无副作用。
import type {
  LogRecord,
  Granularity,
  StatusCodeClass,
  TrendData,
  RankItem,
  ErrorRateItem,
  HistogramData,
  ProfileStats,
  DateRange,
} from '../types'
import { STATUS_CLASSES, classifyCode, isErrorClass, DEFAULT_TOPN } from '../constants'
import { bucketStart, buildTimeAxis, formatBucket } from './timeBuckets'
import { dayjs } from './dayjs'

/** 过滤掉被隐藏类别后的记录子集 */
function visibleRecords(records: LogRecord[], hidden: Set<StatusCodeClass>): LogRecord[] {
  if (hidden.size === 0) return records
  return records.filter((r) => {
    const c = classifyCode(r.httpCode)
    return c !== null && !hidden.has(c)
  })
}

/**
 * 趋势聚合：按时间桶 × 状态码类别累加，返回堆叠序列。
 * 被隐藏的类别整列不计入。
 */
export function aggregateTrend(
  records: LogRecord[],
  granularity: Granularity,
  hidden: Set<StatusCodeClass>,
): TrendData {
  const vis = visibleRecords(records, hidden)
  if (vis.length === 0) return { buckets: [], timestamps: [], series: [] }

  let minTs = Infinity
  let maxTs = -Infinity
  for (const r of vis) {
    if (r.timestamp < minTs) minTs = r.timestamp
    if (r.timestamp > maxTs) maxTs = r.timestamp
  }
  const axis = buildTimeAxis(minTs, maxTs, granularity)
  if (axis.length === 0) return { buckets: [], timestamps: [], series: [] }

  const idxByTs = new Map<number, number>()
  axis.forEach((b, i) => idxByTs.set(b.ts, i))

  const counts: Record<string, number[]> = {}
  for (const c of STATUS_CLASSES) counts[c] = new Array(axis.length).fill(0)

  for (const r of vis) {
    const c = classifyCode(r.httpCode)
    if (!c || hidden.has(c)) continue
    const bts = bucketStart(r.timestamp, granularity)
    const i = idxByTs.get(bts)
    if (i === undefined) continue
    counts[c][i]++
  }

  return {
    buckets: axis.map((b) => b.label),
    timestamps: axis.map((b) => b.ts),
    series: STATUS_CLASSES.filter((c) => !hidden.has(c)).map((c) => ({
      class: c,
      data: counts[c],
    })),
  }
}

/** 每个 Profile 的调用量（排除隐藏类别），降序，取 Top N */
export function rankProfiles(
  records: LogRecord[],
  hidden: Set<StatusCodeClass>,
  n: number = DEFAULT_TOPN,
): RankItem[] {
  const vis = visibleRecords(records, hidden)
  const map = new Map<string, number>()
  for (const r of vis) {
    map.set(r.profile, (map.get(r.profile) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([profile, count]) => ({ profile, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

/** 按日期范围过滤记录（YYYY-MM-DD 字符串，空值表示无限制） */
export function filterByDateRange(records: LogRecord[], range: DateRange): LogRecord[] {
  if (!range.start && !range.end) return records

  const startMs = range.start ? dayjs(range.start, 'YYYY-MM-DD', true).startOf('day').valueOf() : -Infinity
  const endMs = range.end ? dayjs(range.end, 'YYYY-MM-DD', true).endOf('day').valueOf() : Infinity

  return records.filter((r) => r.timestamp >= startMs && r.timestamp <= endMs)
}

/** 错误率排行：按 4xx+5xx 占比降序 */
export function errorRateRanking(records: LogRecord[]): ErrorRateItem[] {
  const totals = new Map<string, number>()
  const errors = new Map<string, number>()
  for (const r of records) {
    const c = classifyCode(r.httpCode)
    if (!c) continue
    totals.set(r.profile, (totals.get(r.profile) ?? 0) + 1)
    if (isErrorClass(c)) errors.set(r.profile, (errors.get(r.profile) ?? 0) + 1)
  }
  return [...totals.entries()]
    .map(([profile, total]) => {
      const err = errors.get(profile) ?? 0
      return { profile, total, errors: err, errorRate: total > 0 ? err / total : 0 }
    })
    .sort((a, b) => b.errorRate - a.errorRate || b.errors - a.errors)
}

/**
 * 调用量分布直方图：统计每个 Profile 的调用量，分箱后统计落入各箱的 Profile 数。
 */
export function distributionHistogram(
  records: LogRecord[],
  hidden: Set<StatusCodeClass>,
  binCount: number = 10,
): HistogramData {
  const vis = visibleRecords(records, hidden)
  const counts: number[] = []
  const map = new Map<string, number>()
  for (const r of vis) map.set(r.profile, (map.get(r.profile) ?? 0) + 1)
  map.forEach((v) => counts.push(v))
  if (counts.length === 0) return { binLabels: [], counts: [] }

  const max = Math.max(...counts)
  if (max === 0) {
    return { binLabels: ['0'], counts: [counts.length] }
  }
  const step = Math.max(1, Math.ceil(max / binCount))
  const bins = new Array(binCount).fill(0)
  const labels: string[] = []
  for (let i = 0; i < binCount; i++) {
    const lo = i * step
    const hi = (i + 1) * step
    labels.push(hi >= max ? `${lo}+` : `${lo}-${hi - 1}`)
  }
  for (const c of counts) {
    let idx = Math.floor(c / step)
    if (idx >= binCount) idx = binCount - 1
    bins[idx]++
  }
  return { binLabels: labels, counts: bins }
}

/** 单个 Profile 的调用量趋势（复用趋势聚合） */
export function aggregateProfileTrend(
  records: LogRecord[],
  profile: string,
  granularity: Granularity,
  hidden: Set<StatusCodeClass>,
): TrendData {
  const filtered = records.filter((r) => r.profile === profile)
  return aggregateTrend(filtered, granularity, hidden)
}

/** 单 Profile 统计卡片数据 */
export function computeProfileStats(records: LogRecord[], profile: string): ProfileStats {
  let total = 0
  let success = 0
  let redirect = 0
  let errors = 0
  const byDay = new Map<number, number>() // 按日桶统计峰值

  for (const r of records) {
    if (r.profile !== profile) continue
    const c = classifyCode(r.httpCode)
    if (!c) continue
    total++
    if (c === '2xx') success++
    else if (c === '3xx') redirect++
    else errors++ // 4xx / 5xx
    const day = bucketStart(r.timestamp, 'day')
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }

  let peakBucket: string | null = null
  let peakCount = 0
  byDay.forEach((cnt, ts) => {
    if (cnt > peakCount) {
      peakCount = cnt
      peakBucket = formatBucket(ts, 'day')
    }
  })

  return {
    total,
    success,
    redirect,
    errors,
    successRate: total > 0 ? success / total : 0,
    peakBucket,
    peakCount,
  }
}

/** 全部 Profile 名列表（去重、升序），供搜索框使用 */
export function profileList(records: LogRecord[]): string[] {
  const set = new Set<string>()
  for (const r of records) set.add(r.profile)
  return [...set].sort((a, b) => a.localeCompare(b))
}

/**
 * 低峰时段分析：找出调用量最低的时间段。
 * 返回按调用量升序排列的时间段列表。
 */
export function findLowTrafficPeriods(
  records: LogRecord[],
  granularity: Granularity,
  hidden: Set<StatusCodeClass>,
  n: number = 10,
): { bucket: string; timestamp: number; count: number }[] {
  const trend = aggregateTrend(records, granularity, hidden)

  // 计算每个桶的总量（所有状态码类别之和）
  const bucketTotals: { bucket: string; timestamp: number; count: number }[] = []
  for (let i = 0; i < trend.buckets.length; i++) {
    const bucket = trend.buckets[i]
    const timestamp = trend.timestamps[i]
    let total = 0
    for (const series of trend.series) {
      total += series.data[i] || 0
    }
    bucketTotals.push({ bucket, timestamp, count: total })
  }

  return bucketTotals.sort((a, b) => a.count - b.count).slice(0, n)
}
