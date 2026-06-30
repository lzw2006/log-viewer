import { GRANULARITY_OPTIONS, CHART_PRIMARY_COLOR } from '../constants'
import { useDataStore, type GranularityScope } from '../store/useDataStore'
import type { Granularity } from '../types'

/**
 * 时间维度切换器：月/周/日/时/分。
 * 根据 scope 读写 overviewGranularity 或 profileGranularity。
 */
export function GranularitySwitch({ scope }: { scope: GranularityScope }) {
  const current = useDataStore((s) =>
    scope === 'overview' ? s.overviewGranularity : s.profileGranularity,
  )
  const setGranularity = useDataStore((s) => s.setGranularity)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#595959', fontSize: 13 }}>时间维度</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {GRANULARITY_OPTIONS.map((opt) => {
          const active = current === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setGranularity(scope, opt.value as Granularity)}
              style={{
                padding: '4px 12px',
                border: `1px solid ${active ? CHART_PRIMARY_COLOR : '#d9d9d9'}`,
                background: active ? CHART_PRIMARY_COLOR : '#fff',
                color: active ? '#fff' : '#595959',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
