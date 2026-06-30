import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { parseCsvFile, CsvParseError } from '../lib/parse'
import { useDataStore } from '../store/useDataStore'

/**
 * 拖拽 + 点击上传 CSV 的入口组件。
 * 已上传后顶部显示当前文件名与「重新上传」按钮。
 */
export function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { parseResult, fileName, setParsedData, reset } = useDataStore()
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const triggerInput = () => inputRef.current?.click()

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const result = await parseCsvFile(file)
      setParsedData(result, file.name)
    } catch (e) {
      const msg = e instanceof CsvParseError ? e.message : '解析失败，请检查文件内容。'
      setError(msg)
    } finally {
      setLoading(false)
      // 允许重复选择同一文件触发 change
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0])
  }

  const onReupload = () => {
    reset()
    setError(null)
    triggerInput()
  }

  const dashedStyle: React.CSSProperties = {
    border: `2px dashed ${dragOver ? '#1677ff' : '#d9d9d9'}`,
    borderRadius: 8,
    padding: 32,
    textAlign: 'center',
    cursor: loading ? 'default' : 'pointer',
    background: dragOver ? 'rgba(22,119,255,0.06)' : '#fafafa',
    transition: 'all .15s',
    color: '#8c8c8c',
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      {fileName && parseResult ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: '#262626' }}>
            当前文件：<strong>{fileName}</strong>
            <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 12 }}>
              （有效 {parseResult.records.length} 行 / 跳过 {parseResult.skipped.length} 行）
            </span>
          </span>
          <button
            onClick={onReupload}
            disabled={loading}
            style={btnStyle(loading)}
          >
            重新上传
          </button>
        </div>
      ) : (
        <div
          style={dashedStyle}
          onClick={loading ? undefined : triggerInput}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
        >
          {loading ? (
            <div>解析中…</div>
          ) : (
            <div>
              <div style={{ fontSize: 15, color: '#262626', marginBottom: 4 }}>
                点击或拖拽 CSV 文件到此处上传
              </div>
              <div style={{ fontSize: 12 }}>支持 .csv 格式</div>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={onChange}
        style={{ display: 'none' }}
      />

      {loading && !fileName && (
        <div style={{ textAlign: 'center', color: '#8c8c8c', marginTop: 8 }}>解析中…</div>
      )}

      {error && (
        <div style={{ color: '#f5222d', marginTop: 8, fontSize: 13 }}>{error}</div>
      )}
    </div>
  )
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '4px 12px',
    border: '1px solid #1677ff',
    background: disabled ? '#f5f5f5' : '#1677ff',
    color: disabled ? '#bfbfbf' : '#fff',
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
  }
}
