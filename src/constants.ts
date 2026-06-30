// 全局常量 —— 列名匹配规则、状态码类别、颜色、粒度选项

import type { Granularity, StatusCodeClass } from './types'

/* ------------------------------------------------------------------ *
 * CSV 列名自动识别（不区分大小写，关键词命中即用；多列命中取第一个）
 * ------------------------------------------------------------------ */
export const PROFILE_KEYWORDS = ['profile', 'user', 'client', 'pc', '用户', '客户']
export const TIME_KEYWORDS = ['time', 'timestamp', 'date', 'datetime', '访问时间', '时间']
export const CODE_KEYWORDS = ['http_code', 'httpcode', 'code', 'status', 'http', '返回码', '状态码']

/* ------------------------------------------------------------------ *
 * 状态码类别
 * ------------------------------------------------------------------ */
export const STATUS_CLASSES: StatusCodeClass[] = ['2xx', '3xx', '4xx', '5xx']

/** 类别 → 显示色（ECharts 兼容） */
export const STATUS_CLASS_COLORS: Record<StatusCodeClass, string> = {
  '2xx': '#52c41a', // 绿 成功
  '3xx': '#1677ff', // 蓝 重定向
  '4xx': '#fa8c16', // 橙 客户端错误
  '5xx': '#f5222d', // 红 服务端错误
}

/** 类别 → 中文标签 */
export const STATUS_CLASS_LABELS: Record<StatusCodeClass, string> = {
  '2xx': '2xx 成功',
  '3xx': '3xx 重定向',
  '4xx': '4xx 客户端错误',
  '5xx': '5xx 服务端错误',
}

/**
 * 把具体 HTTP 码归并到类别；非 2xx-5xx 范围返回 null（视为坏行）。
 */
export function classifyCode(code: number): StatusCodeClass | null {
  if (!Number.isFinite(code)) return null
  if (code >= 200 && code < 300) return '2xx'
  if (code >= 300 && code < 400) return '3xx'
  if (code >= 400 && code < 500) return '4xx'
  if (code >= 500 && code < 600) return '5xx'
  return null
}

/** 判断是否为错误类（4xx / 5xx） */
export const isErrorClass = (c: StatusCodeClass): boolean => c === '4xx' || c === '5xx'

/* ------------------------------------------------------------------ *
 * 粒度选项
 * ------------------------------------------------------------------ */
export const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'month', label: '月' },
  { value: 'week', label: '周' },
  { value: 'day', label: '日' },
  { value: 'hour', label: '时' },
  { value: 'minute', label: '分' },
]

/** Top N 可选值 */
export const TOPN_OPTIONS = [10, 20, 50, 100]
export const DEFAULT_TOPN = 20

/** dayjs 桶截断单位（startOf 用） */
export const GRANULARITY_STARTOF: Record<Granularity, string> = {
  month: 'month',
  week: 'week', // dayjs isoWeek 插件下 week 起始为周一
  day: 'day',
  hour: 'hour',
  minute: 'minute',
}

/** 桶标签显示格式 */
export const GRANULARITY_FORMAT: Record<Granularity, string> = {
  month: 'YYYY-MM',
  week: 'YYYY-[W]WW', // ISO 周
  day: 'YYYY-MM-DD',
  hour: 'YYYY-MM-DD HH:00',
  minute: 'YYYY-MM-DD HH:mm',
}

/** ECharts 通用配色（非状态码场景：排行/直方图） */
export const CHART_PRIMARY_COLOR = '#1677ff'
