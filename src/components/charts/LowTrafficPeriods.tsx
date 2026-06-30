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
 * 低峰时段分析：同时提供横向条形图和折线图两种视图。
 * 横向条形图：便于精确比较每个时间段的调用量
 * 折线图：便于观察调用量随时间的趋势
 */
export function LowTrafficPeriods() {
  const { parseResult, hiddenClasses, overviewGranularity, overviewDateRange } = useDataStore()
  const rawRecords = parseResult?.records ?? []

  const [limit, setLimit] = useState(10) // 可选择的显示数量
  const [viewType, setViewType] = useState<'bar' | 'line'>('bar') // 视图类型

  const barContainerRef = useRef<HTMLDivElement>(null)
  const lineChartContainerRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<echarts.ECharts | null>(null)
  const lineChartRef = useRef<echarts.ECharts | null>(null)

  const lowTraffic = useMemo(
    () => {
      const filteredRecords = filterByDateRange(rawRecords, overviewDateRange)
      return findLowTrafficPeriods(filteredRecords, overviewGranularity, new Set(hiddenClasses), limit)
    },
    [rawRecords, overviewGranularity, hiddenClasses, overviewDateRange, limit],
  )

  // 倒序显示（最低的在上面）
  const displayData = useMemo(() => [...lowTraffic].reverse(), [lowTraffic])

  // 横向条形图配置
  const barOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 140, right: 80, top: 16, bottom: 16 },
      xAxis: { type: 'value', name: '调用量' },
      yAxis: {
        type: 'category',
        data: displayData.map((d) => d.bucket),
        axisLabel: {
          width: 120,
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

  // 折线图配置
  const lineOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
      grid: { left: 60, right: 48, top: 16, bottom: 56 },
      xAxis: {
        type: 'category',
        data: displayData.map((d) => d.bucket),
        axisLabel: {
          rotate: 30,
          width: 120,
          overflow: 'truncate',
          ellipsis: '...',
        },
      },
      yAxis: { type: 'value', name: '调用量' },
      series: [
        {
          type: 'line',
          data: displayData.map((d) => d.count),
          itemStyle: { color: '#52c41a' },
          lineStyle: { color: '#52c41a', width: 2 },
          areaStyle: { color: '#52c41a', opacity: 0.2 },
          smooth: true,
        },
      ],
    }),
    [displayData],
  )

  const chartHeight = Math.max(400, displayData.length * 28)

  // 初始化条形图
  useEffect(() => {
    if (viewType !== 'bar' || !barContainerRef.current || displayData.length === 0) return
    if (!barChartRef.current) {
      barChartRef.current = echarts.init(barContainerRef.current)
    }
    barChartRef.current.setOption(barOption, { notMerge: true })
  }, [barOption, displayData.length, viewType])

  // 初始化折线图
  useEffect(() => {
    if (viewType !== 'line' || !lineChartContainerRef.current || displayData.length === 0) return
    if (!lineChartRef.current) {
      lineChartRef.current = echarts.init(lineChartContainerRef.current)
    }
    lineChartRef.current.setOption(lineOption, { notMerge: true })
  }, [lineOption, displayData.length, viewType])

  // 高度变化时 resize
  useEffect(() => {
    if (barChartRef.current) {
      barChartRef.current.resize()
    }
    if (lineChartRef.current) {
      lineChartRef.current.resize()
    }
  }, [chartHeight])

  // 清理
  useEffect(() => {
    return () => {
      barChartRef.current?.dispose()
      barChartRef.current = null
      lineChartRef.current?.dispose()
      lineChartRef.current = null
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
              border: '1px solid #d9d9d9d',
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f5f6f8',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            <button
              style={{
                padding: '4px 12px',
                border: `1px solid ${viewType === 'bar' ? '#1677ff' : '#d9d9d9'}`,
                background: viewType === 'bar' ? '#1677ff' : '#fff',
                color: viewType === 'bar' ? '#fff' : '#595959',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
              onClick={() => setViewType('bar')}
            >
              条形图
            </button>
            <button
              style={{
                padding: '4px 12px',
                border: `1px solid ${viewType === 'line' ? '#1677ff' : '#d9d9d9'}`,
                background: viewType === 'line' ? '#1677ff' : '#fff',
                color: viewType === 'line' ? '#fff' : '#595959',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
              onClick={() => setViewType('line')}
            >
              折线图
            </button>
          </div>
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
            height: 600,
            overflowY: 'auto',
            overflowX: 'hidden',
            border: '1px solid #f0f0f0',
            borderRadius: 4,
          }}
        >
          {viewType === 'bar' ? (
            <div ref={barContainerRef} style={{ height: chartHeight, width: '100%' }} />
          ) : (
            <div ref={lineChartContainerRef} style={{ height: chartHeight, width: '100%' }} />
          )}
        </div>
      )}
      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
        💡 提示：调用量最低的时段适合进行系统维护、部署等操作
      </div>
    </div>
  )
}

export default LowTrafficPeriods
