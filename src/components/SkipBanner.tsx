import { useState } from 'react'
import { useDataStore } from '../store/useDataStore'

/**
 * 顶部黄色提示横幅：展示被跳过的无效数据行。
 * skipped 为空时不渲染。
 */
export function SkipBanner() {
  const parseResult = useDataStore((s) => s.parseResult)
  const [open, setOpen] = useState(false)

  const skipped = parseResult?.skipped ?? []
  if (skipped.length === 0) return null

  const visible = skipped.slice(0, 50)
  const overflow = skipped.length - visible.length

  return (
    <div
      style={{
        background: '#fffbe6',
        border: '1px solid #ffe58f',
        borderRadius: 8,
        padding: '8px 12px',
        color: '#614700',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>⚠️ 已跳过 {skipped.length} 行无效数据</span>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#614700',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            fontSize: 13,
          }}
        >
          {open ? '收起' : '展开'}
        </button>
      </div>

      {open && (
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          {visible.map((s, i) => (
            <li key={i}>行 {s.row}：{s.reason}</li>
          ))}
          {overflow > 0 && <li>…共 {skipped.length} 条</li>}
        </ul>
      )}
    </div>
  )
}
