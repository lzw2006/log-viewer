// 总览 - 错误率排行表格（4xx + 5xx 占比，按错误率降序）
import { useMemo, useState } from 'react'
import { useDataStore } from '../../store/useDataStore'
import { errorRateRanking, filterByDateRange } from '../../lib/aggregate'
import type { ErrorRateItem } from '../../types'

/** 按错误率强度返回错误率单元格的内联样式 */
function rateCellStyle(errorRate: number): React.CSSProperties {
  if (errorRate >= 0.5) {
    return { background: '#fff1f0', color: '#cf1322' }
  }
  if (errorRate >= 0.2) {
    return { background: '#fff7e6', color: '#d46b08' }
  }
  return { background: '#feffe0', color: '#d4b106' }
}

export function ErrorRateTable() {
  const parseResult = useDataStore((s) => s.parseResult)
  const setSelectedProfile = useDataStore((s) => s.setSelectedProfile)
  const setActiveTab = useDataStore((s) => s.setActiveTab)
  const overviewDateRange = useDataStore((s) => s.overviewDateRange)

  const records = parseResult?.records ?? []

  const items: ErrorRateItem[] = useMemo(() => {
    const filteredRecords = filterByDateRange(records, overviewDateRange)
    return errorRateRanking(filteredRecords)
  }, [records, overviewDateRange])

  // 空数据占位
  if (records.length === 0) {
    return (
      <div style={cardStyle}>
        <h3 style={titleStyle}>错误率排行（4xx + 5xx 占比）</h3>
        <div style={{ color: '#999', padding: '24px 0', textAlign: 'center' }}>
          请先上传日志数据
        </div>
      </div>
    )
  }

  const visible = items.slice(0, 50)

  // hover 行背景：内联 style 无法表达 :hover，用状态模拟
  const [hoverProfile, setHoverProfile] = useState<string | null>(null)

  const handleRowClick = (profile: string) => {
    setSelectedProfile(profile)
    setActiveTab('profile')
  }

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>错误率排行（4xx + 5xx 占比）</h3>

      <div
        style={{
          height: 400,
          overflowY: 'auto',
          overflowX: 'hidden',
          border: '1px solid #f0f0f0',
          borderRadius: 4,
        }}
      >
        <table style={tableStyle}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#fff' }}>
            <tr>
              <th style={thStyle}>Profile</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>总调用量</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>错误量(4xx+5xx)</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>错误率</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr
                key={item.profile}
                onClick={() => handleRowClick(item.profile)}
                onMouseEnter={() => setHoverProfile(item.profile)}
                onMouseLeave={() => setHoverProfile(null)}
                style={{
                  cursor: 'pointer',
                  background: hoverProfile === item.profile ? '#f5faff' : undefined,
                }}
              >
                <td style={tdStyle}>{item.profile}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.total.toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.errors.toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right', ...rateCellStyle(item.errorRate) }}>
                  {(item.errorRate * 100).toFixed(1) + '%'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > 50 && (
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          仅显示错误率最高的 50 / 共 {items.length} 个
        </div>
      )}
    </div>
  )
}

// ---- 样式 ----
const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 16,
  fontWeight: 600,
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#fafafa',
  borderBottom: '1px solid #f0f0f0',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 13,
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #f0f0f0',
  fontSize: 13,
}
