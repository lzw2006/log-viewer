import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import { useDataStore } from '../../store/useDataStore'
import { useECharts } from '../../hooks/useECharts'
import { aggregateProfileTrend, filterByDateRange } from '../../lib/aggregate'
import { STATUS_CLASS_COLORS, STATUS_CLASS_LABELS } from '../../constants'

/**
 * Profile 维度调用量趋势：堆叠柱状图 + dataZoom。
 * 未选择 Profile 时显示提示文案。
 */
export function ProfileTrendChart() {
  const parseResult = useDataStore((s) => s.parseResult)
  const rawRecords = parseResult?.records ?? []
  const selectedProfile = useDataStore((s) => s.selectedProfile)
  const profileGranularity = useDataStore((s) => s.profileGranularity)
  const hiddenClasses = useDataStore((s) => s.hiddenClasses)
  const profileDateRange = useDataStore((s) => s.profileDateRange)

  const data = useMemo(
    () => {
      if (!selectedProfile) return null
      const filteredRecords = filterByDateRange(rawRecords, profileDateRange)
      return aggregateProfileTrend(
        filteredRecords,
        selectedProfile,
        profileGranularity,
        new Set(hiddenClasses),
      )
    },
    [rawRecords, selectedProfile, profileGranularity, hiddenClasses, profileDateRange],
  )

  const option = useMemo<EChartsOption>(
    () =>
      data
        ? {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { top: 0 },
            grid: { left: 48, right: 24, top: 40, bottom: 80 },
            xAxis: {
              type: 'category',
              data: data.buckets,
              axisLabel: { rotate: 30 },
            },
            yAxis: { type: 'value', name: '调用量' },
            dataZoom: [
              {
                type: 'slider',
                start: 0,
                end: 100,
                height: 20,
                bottom: 10,
              },
              { type: 'inside' },
            ],
            series: data.series.map((s) => ({
              name: STATUS_CLASS_LABELS[s.class],
              type: 'bar',
              stack: 'total',
              itemStyle: { color: STATUS_CLASS_COLORS[s.class] },
              data: s.data,
            })),
          }
        : {},
    [data],
  )

  const ref = useECharts(option, [data])

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}
    >
      <h3 style={{ margin: '0 0 8px' }}>
        {selectedProfile ? `${selectedProfile} · 调用量趋势` : '调用量趋势'}
      </h3>

      {!selectedProfile ? (
        <div
          style={{
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
          }}
        >
          请在上方选择一个 Profile
        </div>
      ) : (
        <div ref={ref} style={{ height: '320px', width: '100%' }} />
      )}
    </div>
  )
}
