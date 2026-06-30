import { STATUS_CLASSES, STATUS_CLASS_COLORS, STATUS_CLASS_LABELS } from '../constants'
import { useDataStore } from '../store/useDataStore'

/**
 * 状态码筛选 chips：点击切换某类别的显示/隐藏。
 * chip 激活 = 不在 hiddenClasses 中（显示中）。
 */
export function StatusFilterChips() {
  const hiddenClasses = useDataStore((s) => s.hiddenClasses)
  const toggleClass = useDataStore((s) => s.toggleClass)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ color: '#595959', fontSize: 13 }}>状态码</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STATUS_CLASSES.map((c) => {
          const active = !hiddenClasses.includes(c)
          const color = STATUS_CLASS_COLORS[c]
          return (
            <button
              key={c}
              onClick={() => toggleClass(c)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                border: `1px solid ${active ? color : '#d9d9d9'}`,
                background: active ? `${color}1a` : 'transparent',
                color: '#595959',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: 13,
                opacity: active ? 1 : 0.4,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  display: 'inline-block',
                }}
              />
              {STATUS_CLASS_LABELS[c]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
