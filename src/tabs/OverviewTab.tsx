import { GranularitySwitch } from '../components/GranularitySwitch'
import { StatusFilterChips } from '../components/StatusFilterChips'
import { DateRangePicker } from '../components/DateRangePicker'
import { ChartTypeToggle } from '../components/ChartTypeToggle'
import { TotalTrendChart } from '../components/charts/TotalTrendChart'
import { TopNRankingChart } from '../components/charts/TopNRankingChart'
import { ErrorRateTable } from '../components/charts/ErrorRateTable'
import { LowTrafficPeriods } from '../components/charts/LowTrafficPeriods'

export function OverviewTab() {
  return (
    <div>
      <div style={controlsRow}>
        <GranularitySwitch scope="overview" />
        <DateRangePicker scope="overview" />
        <StatusFilterChips />
        <ChartTypeToggle />
      </div>

      <TotalTrendChart />

      <div style={{ marginTop: 16 }}>
        <LowTrafficPeriods />
      </div>

      <div style={twoColGrid}>
        <TopNRankingChart />
        <ErrorRateTable />
      </div>
    </div>
  )
}

const controlsRow: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  flexWrap: 'wrap',
  alignItems: 'center',
  marginBottom: 16,
  background: '#fff',
  borderRadius: 8,
  padding: '12px 16px',
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
}

const twoColGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 16,
  marginTop: 16,
}
