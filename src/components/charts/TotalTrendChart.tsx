import { useMemo } from 'react'
import type { EChartsOption } from 'echarts'
import { useDataStore } from '../../store/useDataStore'
import { useECharts } from '../../hooks/useECharts'
import { aggregateTrend, filterByDateRange } from '../../lib/aggregate'
import { STATUS_CLASS_COLORS, STATUS_CLASS_LABELS } from '../../constants'

export function TotalTrendChart() {
  const parseResult = useDataStore((s) => s.parseResult)
  const overviewGranularity = useDataStore((s) => s.overviewGranularity)
  const hiddenClasses = useDataStore((s) => s.hiddenClasses)
  const overviewDateRange = useDataStore((s) => s.overviewDateRange)

  const data = useMemo(() => {
    const rawRecords = parseResult?.records ?? []
    const filteredRecords = filterByDateRange(rawRecords, overviewDateRange)
    return aggregateTrend(
      filteredRecords,
      overviewGranularity,
      new Set(hiddenClasses ?? []),
    )
  }, [parseResult, overviewGranularity, hiddenClasses, overviewDateRange])

  const option = useMemo<EChartsOption>(
    () => ({
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
    }),
    [data],
  )

  const ref = useECharts(option, [data])

  const isEmpty = !parseResult || parseResult.records.length === 0

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}
    >
      <h3 style={{ margin: '0 0 8px' }}>总量趋势（按时间 × 状态码）</h3>
      {isEmpty ? (
        <div
          style={{
            height: '320px',
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
