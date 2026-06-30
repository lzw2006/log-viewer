// 共享 ECharts 包装 hook —— 统一 init / setOption / resize / dispose
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

export function useECharts(option: EChartsOption, deps: unknown[] = []) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  // setOption
  useEffect(() => {
    if (!containerRef.current) return
    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current)
    }
    chartRef.current.setOption(option, { notMerge: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // resize 监听
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 卸载销毁
  useEffect(() => {
    return () => {
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  return containerRef
}
