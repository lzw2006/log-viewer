import { useMemo } from 'react'
import { useDataStore } from '../store/useDataStore'
import { computeProfileStats, filterByDateRange } from '../lib/aggregate'

/**
 * Profile 统计卡片：总调用量 / 成功率 / 错误数 / 峰值时段。
 * 未选择 Profile 时不渲染。
 */
export function StatCards() {
  const parseResult = useDataStore((s) => s.parseResult)
  const rawRecords = parseResult?.records ?? []
  const selectedProfile = useDataStore((s) => s.selectedProfile)
  const profileDateRange = useDataStore((s) => s.profileDateRange)

  const stats = useMemo(
    () => {
      if (!selectedProfile) return null
      const filteredRecords = filterByDateRange(rawRecords, profileDateRange)
      return computeProfileStats(filteredRecords, selectedProfile)
    },
    [rawRecords, selectedProfile, profileDateRange],
  )

  if (!selectedProfile || !stats) return null

  const peakText = stats.peakBucket ? `${stats.peakBucket}（${stats.peakCount} 次）` : '—'

  const cards: { label: string; value: string; valueColor?: string }[] = [
    { label: '总调用量', value: stats.total.toLocaleString() },
    { label: '成功率', value: `${(stats.successRate * 100).toFixed(1)}%` },
    { label: '错误数 (4xx+5xx)', value: stats.errors.toLocaleString(), valueColor: '#cf1322' },
    { label: '峰值时段', value: peakText },
  ]

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            flex: 1,
            background: '#fff',
            borderRadius: 8,
            padding: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,.08)',
          }}
        >
          <div style={{ color: '#888', fontSize: 13 }}>{c.label}</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: c.valueColor }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  )
}
