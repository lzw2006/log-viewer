import { useDataStore } from '../store/useDataStore'

export function ChartTypeToggle() {
  const chartType = useDataStore((s) => s.totalTrendChartType)
  const setChartType = useDataStore((s) => s.setTotalTrendChartType)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, color: '#666' }}>图表类型:</span>
      <div
        style={{
          display: 'flex',
          background: '#f5f5f5',
          borderRadius: 4,
          padding: 2,
        }}
      >
        <button
          onClick={() => setChartType('bar')}
          style={{
            padding: '4px 12px',
            border: 'none',
            background: chartType === 'bar' ? '#1890ff' : 'transparent',
            color: chartType === 'bar' ? '#fff' : '#666',
            borderRadius: 3,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: chartType === 'bar' ? 500 : 400,
          }}
        >
          柱状图
        </button>
        <button
          onClick={() => setChartType('line')}
          style={{
            padding: '4px 12px',
            border: 'none',
            background: chartType === 'line' ? '#1890ff' : 'transparent',
            color: chartType === 'line' ? '#fff' : '#666',
            borderRadius: 3,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: chartType === 'line' ? 500 : 400,
          }}
        >
          折线图
        </button>
      </div>
    </div>
  )
}
