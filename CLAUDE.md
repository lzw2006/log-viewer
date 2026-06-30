# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **pure frontend** single-page application for visualizing web access logs from CSV files. All data processing (CSV parsing, aggregation, charting) happens client-side with no backend. Users drag-drop a CSV file and get multi-dimensional metrics with time-based filtering.

**Key constraint**: No backend, all data stays in the browser.

---

## Development Commands

```bash
# Start development server
npm run dev              # → http://localhost:5173 (Vite dev server with HMR)

# Build for production
npm run build            # → dist/ folder with static assets

# Preview production build
npm run preview         # → serves dist/ locally

# Lint code
npm run lint            # → runs oxlint (TypeScript-aware linter)

# TypeScript check (manual)
npx tsc --noEmit       # → type check without emitting files
```

---

## Architecture: Data Flow

**The core data pipeline spans 5 layers and must be understood when making changes:**

```
CSV Upload → parse.ts → useDataStore → aggregate.ts → Chart Components
   ↓            ↓              ↓              ↓
 raw bytes   ParseResult    filtered      EChartsOption
              records        records
```

### Layer 1: CSV Parsing (`lib/parse.ts`)

- **Auto-detects columns** by header keyword matching (fuzzy case-insensitive)
- **Fallback positions** if headers don't match keywords: profile=col0, time=col1, code=col2
- **Skips bad rows** (empty profile, invalid date, non-numeric status code) and collects reasons
- Throws `CsvParseError` if essential columns (profile/time) cannot be identified

**Keywords for column matching** (see `constants.ts`):
- Profile: `profile`, `user`, `client`, `pc`, `用户`, `客户`
- Time: `time`, `timestamp`, `date`, `datetime`, `访问时间`, `时间`
- Status Code: `http_code`, `code`, `status`, `http`, `返回码`, `状态码`

### Layer 2: Global State (`store/useDataStore.ts`)

Zustand store with **independent state per tab**:
- `overviewGranularity` vs `profileGranularity` (each tab tracks its own time dimension)
- `overviewDateRange` vs `profileDateRange` (each tab has independent date filters)
- `hiddenClasses`: shared status code filter across all charts
- `topN`: shared Top N limit for ranking charts
- `selectedProfile`: which profile is being analyzed in Profile tab

**Key pattern**: When adding new filter/selector state, decide if it should be:
- **Global** (shared across tabs) → single field in state
- **Per-tab** (independent) → separate fields with `GranularityScope` dispatch pattern

### Layer 3: Aggregation (`lib/aggregate.ts`)

**Pure functions** - no side effects, O(n) single-pass aggregation:

- `visibleRecords()`: filters out hidden status code classes
- `aggregateTrend()`: buckets records by time granularity × status code class, returns TrendData
- `filterByDateRange()`: pre-filters records before aggregation (date range filtering)
- `rankProfiles()`: Top N profiles by call volume
- `findLowTrafficPeriods()`: lowest-traffic time periods
- `errorRateRanking()`: profiles sorted by 4xx+5xx percentage
- `computeProfileStats()`: single profile statistics (success rate, peak hour, etc.)

**Critical**: All charts call `filterByDateRange(records, dateRange)` BEFORE passing to aggregation functions. This ensures date range filtering works correctly.

### Layer 4: Time Bucketing (`lib/timeBuckets.ts`)

- `bucketStart(ts, granularity)`: truncates timestamp to bucket start (dayjs startOf)
- `buildTimeAxis(minTs, maxTs, granularity)`: generates continuous time axis (fills gaps)
- `formatBucket(ts, granularity)`: converts bucket timestamp to display label

**Week starts Monday** (`isoWeek`), not configurable.

### Layer 5: Chart Components

**ECharts integration pattern**:
- Most charts use manual chart instance management (not `useECharts` hook) for dynamic resize support
- Pattern: `containerRef` + `chartRef` + `useEffect` for init + `useEffect` for resize on height change
- Charts with variable height (TopN, LowTraffic) need explicit `resize()` calls when `chartHeight` changes

**Example from TopNRankingChart**:
```tsx
const containerRef = useRef<HTMLDivElement>(null)
const chartRef = useRef<echarts.ECharts | null>(null)
const chartHeight = Math.max(400, items.length * 28)

// Init chart when data changes
useEffect(() => {
  if (!containerRef.current || items.length === 0) return
  if (!chartRef.current) {
    chartRef.current = echarts.init(containerRef.current)
  }
  chartRef.current.setOption(option, { notMerge: true })
}, [option, items.length])

// Resize when height changes
useEffect(() => {
  if (chartRef.current) {
    chartRef.current.resize()
  }
}, [chartHeight])
```

---

## Status Code Handling

**Status codes are always collapsed into 4 buckets** (`constants.ts`):
- `2xx`: 200-299 (success)
- `3xx`: 300-399 (redirect)
- `4xx`: 400-499 (client error)
- `5xx`: 500-599 (server error)

All trend charts stack by these classes. `classifyCode()` maps any number → bucket or null (if out of range). Non-200-599 codes are treated as parse errors (skipped rows).

**Filter chips**: `StatusFilterChips` component toggles visibility of each class in all trend charts by updating `hiddenClasses` in store.

---

## Time Granularity System

Supported granularities (see `types.ts`): `month | week | day | hour | minute`

**Bucket formats**:
- Month: `YYYY-MM`
- Week: `YYYY-Www` (ISO week, Monday start)
- Day: `YYYY-MM-DD`
- Hour: `YYYY-MM-DD HH:00`
- Minute: `YYYY-MM-DD HH:mm`

**Each tab maintains independent granularity state**. Switching granularity in Overview Tab does NOT affect Profile Tab.

---

## Tab Structure

### Overview Tab (`tabs/OverviewTab.tsx`)

**Dashboard layout** (4 main components):
1. `TotalTrendChart` - stacked bar chart by time × status code, with dataZoom slider
2. `TopNRankingChart` - horizontal bar chart, highest-volume profiles, fixed height (400px) with scroll
3. `ErrorRateTable` - table sorted by 4xx+5xx rate, fixed height (400px) with scroll, sticky header
4. `LowTrafficPeriods` - horizontal bar chart, lowest-traffic time periods, fixed height (400px) with scroll

**Removed**: DistributionHistogram (per user request), Heatmap (unsuitable for hundreds of profiles).

### Profile Tab (`tabs/ProfileTab.tsx`)

**Flow**:
1. User searches/autocompletes a profile (`ProfileSearch.tsx`)
2. Stats cards show: total calls, success rate, errors, peak hour
3. Trend chart shows that profile's volume over time × status code

**Key**: Search uses `profileList()` from `aggregate.ts` which returns sorted unique profiles from all records.

---

## CSV Format Expectations

**Expected columns** (auto-detected, case-insensitive):
- One `profile` column (user identifier)
- One `time`/`timestamp`/`date` column (visit time)
- One `code`/`status`/`http_code` column (HTTP response code)

**Row format**:
- Header row required (auto-detection uses headers)
- Empty rows skipped
- Invalid dates → row skipped with reason
- Non-numeric status codes → row skipped
- Empty profile → row skipped

**Supported date formats** (`parse.ts`):
- `YYYY-MM-DD HH:mm:ss`
- `YYYY-MM-DD HH:mm`
- `YYYY-MM-DD`
- `YYYY/MM/DD HH:mm:ss`
- `YYYY/MM/DD HH:mm`
- `YYYY/MM/DD`
- Unix timestamps (seconds or milliseconds, 10-13 digits)

---

## Adding New Features

**When adding new chart types**:
1. Add aggregation function in `lib/aggregate.ts` (pure function, returns chart-specific data structure)
2. Create component in `components/charts/`
3. Wire up data in component using `useDataStore()` to get `parseResult?.records` + filter states
4. **Important**: Call `filterByDateRange(records, dateRange)` before aggregation if date range filtering should apply
5. Add to `OverviewTab.tsx` or `ProfileTab.tsx`
6. For variable-height charts, use manual chart instance pattern with resize on height change

**When adding new filter controls**:
- Add state field to `useDataStore.ts`
- Add action/setter following existing patterns
- Decide: global (single field) or per-tab (dispatch by `GranularityScope`)
- Update all aggregation functions to accept the new filter parameter

---

## Code Patterns to Follow

### Pure Function Aggregation

All aggregation in `lib/aggregate.ts` are pure functions:
- No side effects
- Return new objects/arrays
- Use `Set<StatusCodeClass>` for hidden classes (more efficient than array includes)
- Memoize results in components using `useMemo` with all dependencies

### Zustand Pattern

Store updates follow this pattern:
```ts
// Action
setSomeField: (value) => set({ someField: value })

// Action with dispatch by scope
setByScope: (scope, value) =>
  set(scope === 'overview' ? { overviewField: value } : { profileField: value })

// Toggle pattern
toggleSomething: (item) =>
  set((s) => ({
    items: s.items.includes(item)
      ? s.items.filter((x) => x !== item)
      : [...s.items, item],
  }))
```

### Chart Component Pattern

For charts that need dynamic heights:
```tsx
const containerRef = useRef<HTMLDivElement>(null)
const chartRef = useRef<echarts.ECharts | null>(null)

// Dynamic height based on data count
const chartHeight = Math.max(400, data.length * 28)

// Init on data change
useEffect(() => {
  if (!containerRef.current || data.length === 0) return
  if (!chartRef.current) {
    chartRef.current = echarts.init(containerRef.current)
  }
  chartRef.current.setOption(option, { notMerge: true })
}, [option, data.length])

// Resize on height change
useEffect(() => {
  if (chartRef.current) {
    chartRef.current.resize()
  }
}, [chartHeight])

// Cleanup
useEffect(() => {
  return () => {
    chartRef.current?.dispose()
    chartRef.current = null
  }
}, [])
```

### Fixed Height Scroll Containers

For ranking tables/periods:
```tsx
<div style={{
  height: 400,              // Fixed container height
  overflowY: 'auto',         // Enable scroll
  overflowX: 'hidden',
  border: '1px solid #f0f0f0',
  borderRadius: 4,
}}>
  <div ref={containerRef} style={{ height: chartHeight }} />
</div>
```

---

## Dependencies and Versions

- React 19.2.7
- ECharts 6.1.0
- PapaParse 5.5.4
- dayjs 1.11.21
- Zustand 5.0.14
- TypeScript 6.x
- Vite 8.x

**Total bundle**: ~1.3MB (450KB gzipped), entirely self-contained, no CDN dependencies at runtime.
