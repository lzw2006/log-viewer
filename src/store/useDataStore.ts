// 全局状态（Zustand）—— 解析结果 + 各项选择 / 过滤状态
import { create } from 'zustand'
import type { ParseResult, Granularity, StatusCodeClass } from '../types'
import { DEFAULT_TOPN } from '../constants'

export type Tab = 'overview' | 'profile'
export type GranularityScope = 'overview' | 'profile'
export type ChartType = 'bar' | 'line'

export interface DateRange {
  start: string | null // YYYY-MM-DD 或 null 表示无限制
  end: string | null   // YYYY-MM-DD 或 null 表示无限制
}

interface DataState {
  parseResult: ParseResult | null
  fileName: string | null

  activeTab: Tab
  selectedProfile: string | null
  overviewGranularity: Granularity
  profileGranularity: Granularity

  hiddenClasses: StatusCodeClass[] // 被隐藏的类别；空数组 = 全显
  topN: number
  totalTrendChartType: ChartType // 总量趋势图类型：柱状图或折线图

  // 日期范围过滤（每个 Tab 独立）
  overviewDateRange: DateRange
  profileDateRange: DateRange

  // actions
  setParsedData: (result: ParseResult, fileName: string) => void
  reset: () => void
  setActiveTab: (tab: Tab) => void
  setSelectedProfile: (p: string | null) => void
  setGranularity: (scope: GranularityScope, g: Granularity) => void
  toggleClass: (c: StatusCodeClass) => void
  setTopN: (n: number) => void
  setTotalTrendChartType: (type: ChartType) => void
  setDateRange: (scope: GranularityScope, range: DateRange) => void
  getDateRange: (scope: GranularityScope) => DateRange
}

const initialState = {
  parseResult: null as ParseResult | null,
  fileName: null as string | null,
  activeTab: 'overview' as Tab,
  selectedProfile: null as string | null,
  overviewGranularity: 'day' as Granularity,
  profileGranularity: 'day' as Granularity,
  hiddenClasses: [] as StatusCodeClass[],
  topN: DEFAULT_TOPN,
  totalTrendChartType: 'bar' as ChartType,
  overviewDateRange: { start: null, end: null } as DateRange,
  profileDateRange: { start: null, end: null } as DateRange,
}

export const useDataStore = create<DataState>((set, get) => ({
  ...initialState,

  setParsedData: (result, fileName) =>
    set({ parseResult: result, fileName, selectedProfile: null }),

  reset: () => set({ ...initialState }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedProfile: (p) => set({ selectedProfile: p }),

  setGranularity: (scope, g) =>
    set(scope === 'overview' ? { overviewGranularity: g } : { profileGranularity: g }),

  toggleClass: (c) =>
    set((s) => ({
      hiddenClasses: s.hiddenClasses.includes(c)
        ? s.hiddenClasses.filter((x) => x !== c)
        : [...s.hiddenClasses, c],
    })),

  setTopN: (n) => set({ topN: n }),

  setTotalTrendChartType: (type) => set({ totalTrendChartType: type }),

  setDateRange: (scope, range) =>
    set(scope === 'overview' ? { overviewDateRange: range } : { profileDateRange: range }),

  getDateRange: (scope) =>
    scope === 'overview' ? get().overviewDateRange : get().profileDateRange,
}))
