import type { CSSProperties } from 'react'
import { useDataStore, type Tab } from './store/useDataStore'
import { UploadZone } from './components/UploadZone'
import { SkipBanner } from './components/SkipBanner'
import { OverviewTab } from './tabs/OverviewTab'
import { ProfileTab } from './tabs/ProfileTab'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: '总览' },
  { key: 'profile', label: '单 Profile' },
]

export default function App() {
  const parseResult = useDataStore((s) => s.parseResult)
  const activeTab = useDataStore((s) => s.activeTab)
  const setActiveTab = useDataStore((s) => s.setActiveTab)

  return (
    <div style={page}>
      <header style={header}>
        <div style={titleBlock}>
          <span style={titleEmoji}>📊</span>
          <div>
            <h1 style={title}>Log Viewer</h1>
            <p style={subtitle}>日志访问指标可视化 · 多时间维度 × 状态码下钻</p>
          </div>
        </div>
      </header>

      <main style={main}>
        <UploadZone />
        <SkipBanner />

        {parseResult ? (
          <>
            <nav style={tabBar}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  style={activeTab === t.key ? tabButtonActive : tabButton}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            {activeTab === 'overview' ? <OverviewTab /> : <ProfileTab />}
          </>
        ) : (
          <div style={heroHint}>
            <p style={{ margin: 0, color: '#8a8f99' }}>
              👆 拖入或点击上传 CSV 日志文件即可开始。表头会自动识别 Profile / 时间 /
              状态码，脏行自动跳过并提示。
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

const page: CSSProperties = { minHeight: '100vh', background: '#f5f6f8' }

const header: CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #ececef',
  padding: '16px 24px',
}

const titleBlock: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 }

const titleEmoji: CSSProperties = { fontSize: 28 }

const title: CSSProperties = { margin: 0, fontSize: 20, fontWeight: 600 }

const subtitle: CSSProperties = { margin: '4px 0 0', fontSize: 13, color: '#8a8f99' }

const main: CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '24px 16px 64px' }

const tabBar: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 16,
  marginBottom: 16,
}

const tabButtonBase: CSSProperties = {
  border: '1px solid #e5e6eb',
  background: '#fff',
  padding: '8px 20px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
}

const tabButton: CSSProperties = { ...tabButtonBase, color: '#4e5969' }

const tabButtonActive: CSSProperties = {
  ...tabButtonBase,
  background: '#1677ff',
  borderColor: '#1677ff',
  color: '#fff',
}

const heroHint: CSSProperties = {
  marginTop: 24,
  background: '#fff',
  borderRadius: 8,
  padding: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,.08)',
  textAlign: 'center',
}
