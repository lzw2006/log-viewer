import { useMemo, useEffect, useRef } from 'react'
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts'
import { useDataStore } from '../../store/useDataStore'
import { rankProfiles, filterByDateRange } from '../../lib/aggregate'
import { CHART_PRIMARY_COLOR, TOPN_OPTIONS } from '../../constants'

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
}

const placeholderStyle: React.CSSProperties = {
  color: '#999',
  textAlign: 'center',
  padding: '48px 0',
}

export function TopNRankingChart() {
  const { parseResult, hiddenClasses, topN, setTopN, overviewDateRange } = useDataStore()
  const records = parseResult?.records ?? []
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  const items = useMemo(
    () => {
      const filteredRecords = filterByDateRange(records, overviewDateRange)
      return rankProfiles(filteredRecords, new Set(hiddenClasses), topN)
    },
    [records, hiddenClasses, topN, overviewDateRange],
  )

  const reversed = useMemo(() => [...items].reverse(), [items])
  const chartHeight = Math.max(400, items.length * 28)

  const option: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 96, right: 48, top: 16, bottom: 16 },
      xAxis: { type: 'value', name: '调用量' },
      yAxis: {
        type: 'category',
        data: reversed.map((i) => i.profile),
      },
      series: [
        {
          type: 'bar',
          data: reversed.map((i) => i.count),
          itemStyle: { color: CHART_PRIMARY_COLOR },
          label: { show: true, position: 'right' },
        },
      ],
    }),
    [reversed],
  )

  // 初始化图表
  useEffect(() => {
    if (!containerRef.current || items.length === 0) return
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current)
    }
    chartRef.current.setOption(option, { notMerge: true })
  }, [option, items.length])

  // 高度变化时 resize
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.resize()
    }
  }, [chartHeight])

  // 清理
  useEffect(() => {
    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  if (records.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>调用量 Top {topN} 排行</h3>
        </div>
        <div style={placeholderStyle}>请先上传日志数据</div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>调用量 Top {topN} 排行</h3>
        <select
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
        >
          {TOPN_OPTIONS.map((n) => (
            <option key={n} value={n}>
              Top {n}
            </option>
          ))}
        </select>
      </div>
      <div
        style={{
          height: 400,
          overflowY: 'auto',
          overflowX: 'hidden',
          border: '1px solid #f0f0f0',
          borderRadius: 4,
        }}
      >
        <div ref={containerRef} style={{ height: chartHeight }} />
      </div>
    </div>
  )
}

export default TopNRankingChart
