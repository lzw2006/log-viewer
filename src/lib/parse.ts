// CSV 解析：PapaParse header 模式 + 列名自动识别 + 坏行收集
import Papa from 'papaparse'
import { dayjs } from './dayjs'
import type { LogRecord, ParseResult, ParsedColumns, SkippedRow } from '../types'
import { PROFILE_KEYWORDS, TIME_KEYWORDS, CODE_KEYWORDS } from '../constants'

const TIME_FORMATS = [
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY/MM/DD HH:mm',
  'YYYY/MM/DD',
]

/** 在 headers 中按关键词模糊匹配；未命中则回退到指定位置列 */
function findColumn(headers: string[], keywords: string[], fallbackIdx: number): string | null {
  for (const kw of keywords) {
    const k = kw.toLowerCase()
    const hit = headers.find((h) => h.toLowerCase().includes(k))
    if (hit) return hit
  }
  return headers[fallbackIdx] ?? null
}

/** 解析时间戳字符串 → Unix ms；失败返回 null */
function parseTimestamp(raw: string): number | null {
  const s = raw.trim()
  if (!s) return null
  const d1 = dayjs(s)
  if (d1.isValid()) return d1.valueOf()
  for (const f of TIME_FORMATS) {
    const d = dayjs(s, f)
    if (d.isValid()) return d.valueOf()
  }
  // epoch（秒 / 毫秒）
  const n = Number(s)
  if (Number.isFinite(n) && /^\d{10,13}$/.test(s)) {
    return s.length >= 13 ? n : n * 1000
  }
  return null
}

/** 解析 HTTP 状态码；非 1-3 位数字返回 null */
function parseHttpCode(raw: string): number | null {
  const s = raw.trim()
  if (!/^\d{1,3}$/.test(s)) return null
  const n = Number(s)
  return n >= 100 && n <= 599 ? n : null
}

export class CsvParseError extends Error {}

/** 解析 CSV 文本 → ParseResult；列无法识别时抛 CsvParseError */
export function parseCsvText(text: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  })

  const headers = result.meta.fields ?? []

  // 列识别
  const profileCol = findColumn(headers, PROFILE_KEYWORDS, 0)
  const timeCol = findColumn(headers, TIME_KEYWORDS, 1)
  const codeCol = findColumn(headers, CODE_KEYWORDS, 2)

  if (!profileCol || !timeCol) {
    throw new CsvParseError(
      '无法识别必要的列：至少需要「Profile」与「时间」两列。请检查表头或列顺序。',
    )
  }

  const columns: ParsedColumns = {
    profileCol,
    timeCol,
    codeCol: codeCol ?? '',
  }

  const rows = result.data
  const records: LogRecord[] = []
  const skipped: SkippedRow[] = []

  rows.forEach((row, i) => {
    // 源文件行号：表头(1) + 数据偏移 +1
    const srcRow = i + 2

    const profileRaw = row[profileCol]
    const profile = profileRaw?.trim()
    const timeRaw = row[timeCol] ?? ''
    const codeRaw = codeCol ? row[codeCol] ?? '' : '200' // 无状态码列 → 默认 200

    if (!profile) {
      skipped.push({ row: srcRow, reason: 'Profile 为空' })
      return
    }
    const ts = parseTimestamp(timeRaw)
    if (ts === null) {
      skipped.push({ row: srcRow, reason: `时间格式无法解析：「${timeRaw}」` })
      return
    }
    const code = parseHttpCode(codeRaw)
    if (code === null) {
      skipped.push({ row: srcRow, reason: `状态码无效：「${codeRaw}」` })
      return
    }

    records.push({ profile, timestamp: ts, httpCode: code })
  })

  return { records, skipped, columns, totalRows: rows.length }
}

/** 从 File 对象解析 */
export async function parseCsvFile(file: File): Promise<ParseResult> {
  const text = await file.text()
  return parseCsvText(text)
}
