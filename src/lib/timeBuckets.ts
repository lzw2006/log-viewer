// 时间桶工具 —— 把时间戳归桶、生成连续时间轴并补空桶为 0
import { dayjs } from './dayjs'
import type { Dayjs } from 'dayjs'
import type { Granularity } from '../types'
import { GRANULARITY_FORMAT } from '../constants'

/** 桶起点（dayjs 对象，用字面量单位命中插件类型重载） */
function startOfBucket(ts: number, g: Granularity): Dayjs {
  const d = dayjs(ts)
  switch (g) {
    case 'month':
      return d.startOf('month')
    case 'week':
      return d.startOf('isoWeek') // 周一起始
    case 'day':
      return d.startOf('day')
    case 'hour':
      return d.startOf('hour')
    case 'minute':
      return d.startOf('minute')
  }
}

/** 桶递进一个单位 */
function nextBucket(d: Dayjs, g: Granularity): Dayjs {
  switch (g) {
    case 'month':
      return d.add(1, 'month')
    case 'week':
      return d.add(1, 'week') // +7 天，与 locale 起始无关
    case 'day':
      return d.add(1, 'day')
    case 'hour':
      return d.add(1, 'hour')
    case 'minute':
      return d.add(1, 'minute')
  }
}

/** 单个时间戳归属的桶起点（ms） */
export function bucketStart(ts: number, g: Granularity): number {
  return startOfBucket(ts, g).valueOf()
}

/** 桶起点 → 显示标签 */
export function formatBucket(ts: number, g: Granularity): string {
  const d = dayjs(ts)
  if (g === 'week') {
    return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`
  }
  return d.format(GRANULARITY_FORMAT[g])
}

/** 连续时间轴：从 minTs 到 maxTs，每个桶一个起点 + 标签 */
export function buildTimeAxis(
  minTs: number,
  maxTs: number,
  g: Granularity,
): { ts: number; label: string }[] {
  if (minTs > maxTs) return []
  const buckets: { ts: number; label: string }[] = []
  let cur = startOfBucket(minTs, g)
  const end = startOfBucket(maxTs, g)
  const MAX_BUCKETS = 5000 // 极端区间安全上限
  let guard = 0
  while (cur.isBefore(end) || cur.isSame(end)) {
    buckets.push({ ts: cur.valueOf(), label: formatBucket(cur.valueOf(), g) })
    cur = nextBucket(cur, g)
    if (++guard > MAX_BUCKETS) break
  }
  return buckets
}
