import { useMemo, useState } from 'react'
import { useDataStore } from '../store/useDataStore'
import { profileList } from '../lib/aggregate'

/**
 * Profile 搜索选择器：
 * 受控输入 + 下拉候选列表（不区分大小写 includes 过滤，最多 20 条）。
 */
export function ProfileSearch() {
  const records = useDataStore((s) => s.parseResult?.records ?? [])
  const selectedProfile = useDataStore((s) => s.selectedProfile)
  const setSelectedProfile = useDataStore((s) => s.setSelectedProfile)

  const list = useMemo(() => profileList(records), [records])

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = q ? list.filter((item) => item.toLowerCase().includes(q)) : list
    return matched.slice(0, 20)
  }, [list, query])

  const disabled = records.length === 0

  const handleSelect = (item: string) => {
    setSelectedProfile(item)
    setQuery('')
    setOpen(false)
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}
    >
      <h3 style={{ margin: '0 0 8px' }}>选择 Profile</h3>

      <div style={{ position: 'relative' }}>
        <input
          value={query}
          placeholder={selectedProfile ? `当前：${selectedProfile}` : '输入 Profile 名称搜索'}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '8px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
            background: disabled ? '#f5f5f5' : '#fff',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        {open && !disabled && (
          <ul
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 10,
              margin: '4px 0 0',
              padding: 0,
              listStyle: 'none',
              background: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: 6,
              maxHeight: 240,
              overflowY: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,.12)',
            }}
          >
            {filtered.length === 0 ? (
              <li style={{ padding: '8px 12px', color: '#999', fontSize: 13 }}>无匹配项</li>
            ) : (
              filtered.map((item) => {
                const active = item === selectedProfile
                return (
                  <li
                    key={item}
                    onClick={() => handleSelect(item)}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      padding: '8px 12px',
                      fontSize: 13,
                      cursor: 'pointer',
                      background: active ? '#e6f4ff' : '#fff',
                      color: active ? '#1677ff' : '#333',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    {item}
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>

      {selectedProfile && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#595959' }}>
          当前：<span style={{ color: '#1677ff', fontWeight: 500 }}>{selectedProfile}</span>
        </div>
      )}
    </div>
  )
}
