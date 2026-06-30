import { useDataStore, type GranularityScope } from '../store/useDataStore'
import { dayjs } from '../lib/dayjs'

interface DateRangePickerProps {
  scope: GranularityScope
}

/**
 * 日期范围选择器：每个 Tab 独立，只统计选定时间段的数据。
 * 使用 HTML5 date input 自带日历选择器。
 */
export function DateRangePicker({ scope }: DateRangePickerProps) {
  const { parseResult, getDateRange, setDateRange } = useDataStore()

  const range = getDateRange(scope)

  // 数据的全局时间范围（用于 min/max 约束）
  const globalRange = parseResult
    ? (() => {
        const timestamps = parseResult.records.map((r) => r.timestamp)
        const min = Math.min(...timestamps)
        const max = Math.max(...timestamps)
        return {
          min: dayjs(min).format('YYYY-MM-DD'),
          max: dayjs(max).format('YYYY-MM-DD'),
        }
      })()
    : { min: '', max: '' }

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null
    setDateRange(scope, { ...range, start: value })
  }

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || null
    setDateRange(scope, { ...range, end: value })
  }

  const handleReset = () => {
    setDateRange(scope, { start: null, end: null })
  }

  const hasFilter = range.start || range.end

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ color: '#595959', fontSize: 13 }}>日期范围</span>

      <input
        type="date"
        min={globalRange.min || undefined}
        max={globalRange.max || undefined}
        value={range.start || ''}
        onChange={handleStartChange}
        style={{
          padding: '4px 8px',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          fontSize: 13,
          cursor: 'pointer',
        }}
      />

      <span style={{ color: '#8c8c8c' }}>至</span>

      <input
        type="date"
        min={globalRange.min || undefined}
        max={globalRange.max || undefined}
        value={range.end || ''}
        onChange={handleEndChange}
        style={{
          padding: '4px 8px',
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          fontSize: 13,
          cursor: 'pointer',
        }}
      />

      <button
        onClick={handleReset}
        disabled={!hasFilter}
        style={{
          padding: '4px 12px',
          border: '1px solid #d9d9d9',
          background: '#fff',
          color: '#595959',
          borderRadius: 4,
          cursor: hasFilter ? 'pointer' : 'not-allowed',
          fontSize: 13,
          opacity: hasFilter ? 1 : 0.5,
        }}
      >
        重置
      </button>

      {parseResult && globalRange.min && globalRange.max && (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
          数据范围: {globalRange.min} ~ {globalRange.max}
        </span>
      )}
    </div>
  )
}
