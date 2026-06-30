import { GranularitySwitch } from '../components/GranularitySwitch'
import { StatusFilterChips } from '../components/StatusFilterChips'
import { DateRangePicker } from '../components/DateRangePicker'
import { ProfileSearch } from '../components/ProfileSearch'
import { StatCards } from '../components/StatCards'
import { ProfileTrendChart } from '../components/charts/ProfileTrendChart'

export function ProfileTab() {
  return (
    <div>
      <ProfileSearch />

      <div style={controlsRow}>
        <GranularitySwitch scope="profile" />
        <DateRangePicker scope="profile" />
        <StatusFilterChips />
      </div>

      <StatCards />

      <div style={{ marginTop: 16 }}>
        <ProfileTrendChart />
      </div>
    </div>
  )
}

const controlsRow: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  flexWrap: 'wrap',
  alignItems: 'center',
  marginTop: 16,
  marginBottom: 16,
  background: '#fff',
  borderRadius: 8,
  padding: '12px 16px',
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
}
