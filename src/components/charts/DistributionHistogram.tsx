import { useMemo } from 'react'
import { useDataStore } from '../../store/useDataStore'
import { distributionHistogram, filterByDateRange } from '../../lib/aggregate'
import { useECharts } from '../../hooks/useECharts'
import { CHART_PRIMARY_COLOR } from '../../constants'
import type { EChartsOption } from 'echarts'

export function DistributionHistogram() {
  const parseResult = useDataStore((s) => s.parseResult)
  const rawRecords = parseResult?.records ?? []
  const hiddenClasses = useDataStore((s) => s.hiddenClasses ?? [])
  const overviewDateRange = useDataStore((s) => s.overviewDateRange)

  const data = useMemo(
    () => {
      const filteredRecords = filterByDateRange(rawRecords, overviewDateRange)
      return distributionHistogram(filteredRecords, new Set(hiddenClasses), 10)
    },
    [rawRecords, hiddenClasses, overviewDateRange],
  )

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: { left: 48, right: 24, top: 32, bottom: 48 },
    xAxis: {
      type: 'category',
      name: '调用量区间',
      data: data.binLabels,
      axisLabel: { rotate: 20 },
    },
    yAxis: {
      type: 'value',
      name: 'Profile 数量',
    },
    series: [
      {
        type: 'bar',
        data: data.counts,
        itemStyle: { color: CHART_PRIMARY_COLOR },
        label: { show: true, position: 'top' },
      },
    ],
  }

  const ref = useECharts(option, [data])

  const isEmpty = rawRecords.length === 0

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}
    >
      <h3>调用量分布（每个区间的 Profile 数）</h3>
      {isEmpty ? (
        <div
          style={{
            height: '320px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
          }}
        >
          请先上传日志数据
        </div>
      ) : (
        <div ref={ref} style={{ height: '320px', width: '100%' }} />
      )}
    </div>
  )
}
