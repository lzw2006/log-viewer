import { useMemo, useState, useEffect, useRef } from 'react'
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts'
import { useDataStore } from '../../store/useDataStore'
import { findLowTrafficPeriods, filterByDateRange } from '../../lib/aggregate'
import { TOPN_OPTIONS } from '../../constants'

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

/**
 * 低峰时段分析：显示调用量最低的时间段。
 * 帮助发现系统的低谷时段，可用于维护窗口规划等。
 */
export function LowTrafficPeriods() {
  const { parseResult, hiddenClasses, overviewGranularity, overviewDateRange } = useDataStore()
  const rawRecords = parseResult?.records ?? []

  const [limit, setLimit] = useState(10) // 可选择的显示数量
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  const lowTraffic = useMemo(
    () => {
      const filteredRecords = filterByDateRange(rawRecords, overviewDateRange)
      return findLowTrafficPeriods(filteredRecords, overviewGranularity, new Set(hiddenClasses), limit)
    },
    [rawRecords, overviewGranularity, hiddenClasses, overviewDateRange, limit],
  )

  // 倒序显示（最低的在上面）
  const displayData = useMemo(() => [...lowTraffic].reverse(), [lowTraffic])

  const chartHeight = Math.max(400, displayData.length * 28)

  const option: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 120, right: 48, top: 16, bottom: 16 },
      xAxis: { type: 'value', name: '调用量' },
      yAxis: {
        type: 'category',
        data: displayData.map((d) => d.bucket),
        axisLabel: {
          width: 100,
          overflow: 'truncate',
          ellipsis: '...',
        },
      },
      series: [
        {
          type: 'bar',
          data: displayData.map((d) => d.count),
          itemStyle: { color: '#52c41a' },
          label: { show: true, position: 'right' },
        },
      ],
    }),
    [displayData],
  )

  // 初始化图表
  useEffect(() => {
    if (!containerRef.current || displayData.length === 0) return
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current)
    }
    chartRef.current.setOption(option, { notMerge: true })
  }, [option, displayData.length])

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

  if (rawRecords.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>低峰时段分析（调用量最低的时间段）</h3>
        </div>
        <div style={placeholderStyle}>请先上传日志数据</div>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>低峰时段分析（调用量最低）</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {TOPN_OPTIONS.map((n) => (
              <option key={n} value={n}>
                最低 {n} 个
              </option>
            ))}
          </select>
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>
            粒度：{overviewGranularity === 'month' ? '月' : overviewGranularity === 'week' ? '周' : overviewGranularity === 'day' ? '日' : overviewGranularity === 'hour' ? '时' : '分'}
          </span>
        </div>
      </div>
      {displayData.length === 0 ? (
        <div style={placeholderStyle}>暂无数据</div>
      ) : (
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
      )}
      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
        💡 提示：调用量最低的时段适合进行系统维护、部署等操作
      </div>
    </div>
  )
}

export default LowTrafficPeriods
