import { useState, useRef, useEffect, type KeyboardEvent, type CSSProperties, type ReactNode } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type FileNode = {
  id: string
  name: string
  type: 'folder' | 'model' | 'ui' | 'flow' | 'test'
  modified?: boolean
  children?: FileNode[]
}

type Msg = { role: 'user' | 'assistant'; text: string; time: string }
type Device = 'mobile' | 'desktop'
type RunState = 'idle' | 'checking' | 'running'
type Toast = { text: string; kind: 'ok' | 'warn' | 'err' } | null

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:   '#0c0c0e',
  s1:   '#111113',
  s2:   '#17171b',
  s3:   '#1d1d22',
  b1:   '#1c1c22',
  b2:   '#272730',
  t1:   '#ccccd8',
  t2:   '#52526a',
  t3:   '#2e2e3c',
  acc:  '#5b7fff',
  accA: 'rgba(91,127,255,.10)',
  accB: 'rgba(91,127,255,.22)',
  grn:  '#3ecf8e',
  ora:  '#f5a520',
  pur:  '#b47eff',
  mono: '"JetBrains Mono", monospace',
  sans: '"DM Sans", system-ui, sans-serif',
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FILES: FileNode[] = [
  { id: 'models', name: 'models', type: 'folder', children: [
    { id: 'student.model',    name: 'student.model',    type: 'model', modified: true },
    { id: 'curriculum.model', name: 'curriculum.model', type: 'model' },
    { id: 'session.model',    name: 'session.model',    type: 'model' },
  ]},
  { id: 'interfaces', name: 'interfaces', type: 'folder', children: [
    { id: 'chat-tutor.ui', name: 'chat-tutor.ui', type: 'ui' },
    { id: 'quiz-flow.ui',  name: 'quiz-flow.ui',  type: 'ui' },
  ]},
  { id: 'tests', name: 'tests', type: 'folder', children: [
    { id: 'tutor-eval.test', name: 'tutor-eval.test', type: 'test' },
  ]},
]

function initMessages(): Msg[] {
  return [
    { role: 'user',      text: 'Добавь индикатор набора текста под последним сообщением', time: '14:23' },
    { role: 'assistant', text: 'Добавляю компонент `Typing` в конец диалога. Анимация — три точки с задержкой 150 мс.\n\nНастроить цвет и размер под текущую тему?', time: '14:23' },
  ]
}

const PALETTE_GROUPS = [
  { group: 'Layout',  items: ['Container', 'Row', 'Column', 'Divider', 'Spacer'] },
  { group: 'Input',   items: ['TextField', 'Select', 'Toggle', 'Slider', 'Button'] },
  { group: 'Display', items: ['Text', 'Avatar', 'Badge', 'Progress', 'Card'] },
  { group: 'Dialog',  items: ['Bubble', 'Typing', 'QuickReply', 'Prompt'] },
]

const EXT_MARK: Record<string, string> = {
  model: '⬡', ui: '◧', flow: '⤳', test: '◈', folder: '▾',
}
const EXT_COLOR: Record<string, string> = {
  model: C.acc, ui: C.grn, flow: C.ora, test: C.pur, folder: C.t2,
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function ToastBanner({ toast }: { toast: Toast }) {
  if (!toast) return null
  const bg = toast.kind === 'ok' ? C.grn : toast.kind === 'warn' ? C.ora : '#e05555'
  return (
    <div style={{
      position: 'fixed', top: 52, right: 16, zIndex: 100,
      background: C.s2, border: `1px solid ${bg}`,
      borderLeft: `3px solid ${bg}`,
      padding: '9px 14px', fontFamily: C.sans, fontSize: 12,
      color: C.t1, maxWidth: 340,
      boxShadow: '0 4px 20px rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <span style={{ color: bg, fontFamily: C.mono, fontSize: 11, marginTop: 1, flexShrink: 0 }}>
        {toast.kind === 'ok' ? '✓' : toast.kind === 'warn' ? '!' : '✕'}
      </span>
      <span style={{ lineHeight: 1.5 }}>{toast.text}</span>
    </div>
  )
}

// ── Settings panel ────────────────────────────────────────────────────────────

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [model, setModel] = useState('claude-sonnet-5')
  const [temp, setTemp] = useState('0.7')
  const [locale, setLocale] = useState('ru-RU')
  const [stream, setStream] = useState(true)

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,.5)' }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 91,
        width: 320, background: C.s1,
        borderLeft: `1px solid ${C.b2}`,
        display: 'flex', flexDirection: 'column',
        fontFamily: C.sans,
        boxShadow: '-8px 0 32px rgba(0,0,0,.4)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: `1px solid ${C.b1}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Настройки проекта</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.t2, fontSize: 16, cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        
          <Section label="Интерфейс">
            <SettingRow label="Язык">
              <select value={locale} onChange={e => setLocale(e.target.value)} style={selectStyle}>
                <option value="ru-RU">ru-RU</option>
                <option value="en-US">en-US</option>
                <option value="zh-CN">zh-CN</option>
              </select>
            </SettingRow>
            <SettingRow label="Тема">
              <select style={selectStyle} defaultValue="dark">
                <option value="dark">dark</option>
                <option value="light">light (soon)</option>
              </select>
            </SettingRow>
          </Section>

        </div>

        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.b1}`, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', background: C.acc, border: 'none', borderRadius: 3,
              padding: '8px', fontSize: 12, fontFamily: C.sans,
              color: '#fff', fontWeight: 500, cursor: 'pointer',
            }}
          >Сохранить</button>
        </div>
      </div>
    </>
  )
}

const inputStyle: CSSProperties = {
  background: C.s2, border: `1px solid ${C.b2}`, borderRadius: 2,
  padding: '4px 8px', fontSize: 11, fontFamily: C.mono,
  color: C.t1, outline: 'none',
}
const selectStyle: CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ padding: '8px 16px 4px', fontSize: 10, fontFamily: C.mono, color: C.t2, letterSpacing: '0.08em' }}>
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 16px', borderBottom: `1px solid ${C.b1}`,
      fontSize: 12, color: C.t1,
    }}>
      <span style={{ color: C.t2 }}>{label}</span>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 32, height: 18, borderRadius: 9,
        background: value ? C.acc : C.b2,
        position: 'relative', cursor: 'pointer',
        transition: 'background .15s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: value ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', transition: 'left .15s',
      }} />
    </div>
  )
}

// ── TopBar ────────────────────────────────────────────────────────────────────

function TbBtn({ label, accent, onClick, active }: {
  label: string; accent?: boolean; onClick?: () => void; active?: boolean
}) {
  const [h, setH] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: accent
          ? active ? '#3a5fd0' : (h ? '#4d70f0' : C.acc)
          : (h || active) ? C.s3 : 'transparent',
        border: accent ? 'none' : `1px solid ${(h || active) ? C.b2 : 'transparent'}`,
        borderRadius: 3,
        padding: '4px 11px',
        fontSize: 12,
        fontFamily: C.sans,
        fontWeight: 500,
        color: accent ? '#fff' : C.t1,
        transition: 'background .1s',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function TopBar({
  activeFile, runState, settingsOpen,
  onCheck, onRun, onSettings,
}: {
  activeFile: string
  runState: RunState
  settingsOpen: boolean
  onCheck: () => void
  onRun: () => void
  onSettings: () => void
}) {
  return (
    <div style={{
      gridArea: 'top',
      display: 'flex',
      alignItems: 'center',
      height: 44,
      background: C.s1,
      borderBottom: `1px solid ${C.b1}`,
      padding: '0 16px',
      fontFamily: C.sans,
    }}>
      <div style={{ flex: 1 }} />

      {runState === 'checking' && (
        <span style={{ fontSize: 11, fontFamily: C.mono, color: C.ora, marginRight: 12 }}>
          ⏳ проверка...
        </span>
      )}
      {runState === 'running' && (
        <span style={{ fontSize: 11, fontFamily: C.mono, color: C.grn, marginRight: 12 }}>
          ● сборка...
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <TbBtn
          label="Проверить"
          active={runState === 'checking'}
          onClick={onCheck}
        />
        <TbBtn
          label={runState === 'running' ? '◼  Стоп' : '▷  Запуск'}
          accent
          active={runState === 'running'}
          onClick={onRun}
        />
        <div style={{ width: 1, height: 18, background: C.b2, margin: '0 2px' }} />
        <TbBtn label="⚙" active={settingsOpen} onClick={onSettings} />
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    models: true, interfaces: true, tests: false,
  })

  return (
    <div style={{
      gridArea: 'sidebar',
      background: C.s1,
      borderRight: `1px solid ${C.b1}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: C.sans,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 8px',
        borderBottom: `1px solid ${C.b1}`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t2, letterSpacing: '0.08em' }}>ПРОЕКТЫ</span>
        <button style={{ background: 'none', border: 'none', color: C.t2, fontSize: 14, padding: 0, lineHeight: 1, cursor: 'pointer' }}>+</button>
      </div>

      <div style={{ padding: '8px 14px 6px', fontSize: 12, fontWeight: 600, color: C.t1, flexShrink: 0 }}>
        EduAssistant
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {FILES.map(folder => (
          <div key={folder.id}>
            <button
              onClick={() => setOpen(o => ({ ...o, [folder.id]: !o[folder.id] }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '4px 14px',
                fontSize: 11.5,
                color: C.t2,
                fontFamily: C.sans,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: 9,
                display: 'inline-block',
                transition: 'transform .12s',
                transform: open[folder.id] ? 'rotate(0deg)' : 'rotate(-90deg)',
                color: C.t3,
              }}>▾</span>
              <span>{folder.name}</span>
            </button>

            {open[folder.id] && folder.children?.map(file => (
              <button
                key={file.id}
                onClick={() => onSelect(file.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderLeft: `2px solid ${selected === file.id ? C.acc : 'transparent'}`,
                  background: selected === file.id ? C.accA : 'transparent',
                  padding: '3px 14px 3px 22px',
                  fontSize: 12,
                  fontFamily: C.sans,
                  color: selected === file.id ? C.t1 : C.t2,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 10, color: EXT_COLOR[file.type] }}>{EXT_MARK[file.type]}</span>
                <span style={{ flex: 1 }}>{file.name}</span>
                {file.modified && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.ora, flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.b1}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: C.mono, color: C.t3 }}>
          <span style={{ color: C.grn, fontSize: 8 }}>●</span>
          <span>2 интерфейса · 1 тест</span>
        </div>
      </div>
    </div>
  )
}

// ── Visual Constructor ────────────────────────────────────────────────────────

type PlacedComp = { id: string; type: string; x: number; y: number }

const COMP_META: Record<string, { w: number; h: number; color: string }> = {
  Container:  { w: 240, h: 140, color: C.t3  },
  Row:        { w: 240, h: 48,  color: C.t3  },
  Column:     { w: 100, h: 200, color: C.t3  },
  Divider:    { w: 240, h: 20,  color: C.t3  },
  Spacer:     { w: 120, h: 48,  color: C.t3  },
  TextField:  { w: 220, h: 40,  color: C.acc },
  Select:     { w: 180, h: 36,  color: C.acc },
  Toggle:     { w: 64,  h: 32,  color: C.acc },
  Slider:     { w: 220, h: 36,  color: C.acc },
  Button:     { w: 120, h: 36,  color: C.acc },
  Text:       { w: 200, h: 28,  color: C.t2  },
  Avatar:     { w: 48,  h: 48,  color: C.pur },
  Badge:      { w: 72,  h: 24,  color: C.pur },
  Progress:   { w: 220, h: 20,  color: C.pur },
  Card:       { w: 240, h: 160, color: C.t2  },
  Bubble:     { w: 220, h: 56,  color: C.grn },
  Typing:     { w: 80,  h: 36,  color: C.grn },
  QuickReply: { w: 180, h: 36,  color: C.grn },
  Prompt:     { w: 280, h: 48,  color: C.grn },
}

const SNAP = 20

function snapTo(v: number) { return Math.round(v / SNAP) * SNAP }

function CompPreview({ type }: { type: string }) {
  const color = COMP_META[type]?.color ?? C.t2
  const s = { fontFamily: C.sans, fontFamily2: C.mono }

  switch (type) {
    case 'Container': return (
      <div style={{ width: '100%', height: '100%', border: `1px dashed ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: C.mono, color }}>Container</span>
      </div>
    )
    case 'Row': return (
      <div style={{ width: '100%', height: '100%', border: `1px dashed ${color}`, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
        {[40, 60, 40].map((w, i) => <div key={i} style={{ width: w, height: 16, background: C.b2, borderRadius: 2 }} />)}
      </div>
    )
    case 'Column': return (
      <div style={{ width: '100%', height: '100%', border: `1px dashed ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 0' }}>
        {[0,1,2].map(i => <div key={i} style={{ width: '70%', height: 14, background: C.b2, borderRadius: 2 }} />)}
      </div>
    )
    case 'Divider': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, height: 1, background: C.b2 }} />
      </div>
    )
    case 'Spacer': return (
      <div style={{ width: '100%', height: '100%', border: `1px dashed ${C.t3}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: C.mono, color: C.t3 }}>↕ spacer</span>
      </div>
    )
    case 'TextField': return (
      <div style={{ width: '100%', height: '100%', background: C.s2, border: `1px solid ${C.b2}`, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <span style={{ fontSize: 11, color: C.t3, fontFamily: C.sans }}>Введите текст...</span>
      </div>
    )
    case 'Select': return (
      <div style={{ width: '100%', height: '100%', background: C.s2, border: `1px solid ${C.b2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
        <span style={{ fontSize: 11, color: C.t3, fontFamily: C.sans }}>Выбрать...</span>
        <span style={{ fontSize: 9, color: C.t2 }}>▾</span>
      </div>
    )
    case 'Toggle': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 20, background: C.acc, borderRadius: 10, position: 'relative' }}>
          <div style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff' }} />
        </div>
      </div>
    )
    case 'Slider': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6 }}>
        <div style={{ flex: 1, height: 3, background: C.b2, borderRadius: 2, position: 'relative' }}>
          <div style={{ width: '60%', height: '100%', background: C.acc, borderRadius: 2 }} />
          <div style={{ position: 'absolute', left: '60%', top: '50%', transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', background: C.acc }} />
        </div>
      </div>
    )
    case 'Button': return (
      <div style={{ width: '100%', height: '100%', background: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: '#fff', fontWeight: 500, fontFamily: C.sans }}>Кнопка</span>
      </div>
    )
    case 'Text': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: C.t1, fontFamily: C.sans }}>Текстовый элемент</span>
      </div>
    )
    case 'Avatar': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accA, border: `1px solid ${C.accB}`, display: 'grid', placeItems: 'center', fontSize: 12, color: C.acc }}>A</div>
      </div>
    )
    case 'Badge': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: `${C.pur}22`, border: `1px solid ${C.pur}55`, borderRadius: 10, padding: '2px 10px', fontSize: 10, color: C.pur, fontFamily: C.mono }}>badge</div>
      </div>
    )
    case 'Progress': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
        <div style={{ flex: 1, height: 4, background: C.b2, borderRadius: 2 }}>
          <div style={{ width: '45%', height: '100%', background: C.pur, borderRadius: 2 }} />
        </div>
      </div>
    )
    case 'Card': return (
      <div style={{ width: '100%', height: '100%', background: C.s2, border: `1px solid ${C.b2}`, display: 'flex', flexDirection: 'column', padding: 12, gap: 8 }}>
        <div style={{ width: '60%', height: 10, background: C.b2, borderRadius: 2 }} />
        <div style={{ width: '90%', height: 8, background: C.b1, borderRadius: 2 }} />
        <div style={{ width: '75%', height: 8, background: C.b1, borderRadius: 2 }} />
        <div style={{ marginTop: 'auto', width: 60, height: 24, background: C.acc, borderRadius: 2 }} />
      </div>
    )
    case 'Bubble': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
        <div style={{ background: C.s2, border: `1px solid ${C.b2}`, padding: '6px 10px', fontSize: 11, color: C.t1, fontFamily: C.sans, maxWidth: '85%' }}>
          Сообщение ассистента...
        </div>
      </div>
    )
    case 'Typing': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <div style={{ display: 'flex', gap: 4, background: C.s2, border: `1px solid ${C.b2}`, padding: '8px 12px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.t2 }} />)}
        </div>
      </div>
    )
    case 'QuickReply': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
        {['Да', 'Нет', 'Далее'].map(t => (
          <div key={t} style={{ background: C.s2, border: `1px solid ${C.b2}`, padding: '4px 10px', fontSize: 10, color: C.t1, fontFamily: C.sans }}>{t}</div>
        ))}
      </div>
    )
    case 'Prompt': return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
        <div style={{ flex: 1, background: C.s2, border: `1px solid ${C.b2}`, height: 32, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: 11, color: C.t3, fontFamily: C.sans }}>Задайте вопрос...</span>
        </div>
        <div style={{ width: 32, height: 32, background: C.acc, display: 'grid', placeItems: 'center', fontSize: 13, color: '#fff' }}>→</div>
      </div>
    )
    default: return (
      <div style={{ width: '100%', height: '100%', border: `1px dashed ${color}`, display: 'grid', placeItems: 'center' }}>
        <span style={{ fontSize: 10, fontFamily: C.mono, color }}>{type}</span>
      </div>
    )
  }
}

function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '4px 12px',
      borderBottom: `1px solid ${C.b1}`, fontSize: 11, fontFamily: C.mono,
    }}>
      <span style={{ color: C.t2, flexShrink: 0, minWidth: 68 }}>{label}</span>
      <span style={{ color: C.t1, flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

// Artboard position on the infinite canvas
const AB = { x: 160, y: 80, w: 390, h: 720 }

type DragCtx =
  | { kind: 'move'; mx0: number; my0: number; origins: { id: string; x: number; y: number }[] }
  | { kind: 'rubber'; x0: number; y0: number; x1: number; y1: number }

function VisualConstructor() {
  const [paletteSel, setPaletteSel] = useState<string | null>(null)
  const [placed, setPlaced] = useState<PlacedComp[]>([])
  const [selIds, setSelIds] = useState<string[]>([])
  const [drag, setDrag] = useState<DragCtx | null>(null)
  const [moved, setMoved] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const uidRef = useRef(0)

  const selSet = new Set(selIds)
  const firstSel = placed.find(p => selIds[0] === p.id) ?? null

  function canvasCoords(e: React.MouseEvent): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scroll = canvasRef.current!.parentElement!
    return {
      x: e.clientX - rect.left + scroll.scrollLeft,
      y: e.clientY - rect.top  + scroll.scrollTop,
    }
  }

  // Single click on palette → select tool
  function handlePaletteClick(item: string) {
    setPaletteSel(s => s === item ? null : item)
    setSelIds([])
  }

  // Double-click on canvas → place component
  function handleCanvasDblClick(e: React.MouseEvent) {
    if (!paletteSel) return
    e.stopPropagation()
    const { x, y } = canvasCoords(e)
    const meta = COMP_META[paletteSel] ?? { w: 120, h: 40 }
    const cx = snapTo(x - meta.w / 2)
    const cy = snapTo(y - meta.h / 2)
    const id = `${paletteSel}-${++uidRef.current}`
    setPlaced(p => [...p, { id, type: paletteSel, x: Math.max(0, cx), y: Math.max(0, cy) }])
    setSelIds([id])
  }

  // Mousedown on canvas background → start rubber band or deselect
  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    const { x, y } = canvasCoords(e)
    setDrag({ kind: 'rubber', x0: x, y0: y, x1: x, y1: y })
    setMoved(false)
  }

  // Mousedown on a component → start move drag
  function handleCompMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (e.button !== 0) return
    // Shift: toggle in selection; plain: ensure in selection
    let nextSel: string[]
    if (e.shiftKey) {
      nextSel = selSet.has(id) ? selIds.filter(s => s !== id) : [...selIds, id]
    } else {
      nextSel = selSet.has(id) ? selIds : [id]
    }
    setSelIds(nextSel)
    const selSet2 = new Set(nextSel)
    const origins = placed.filter(p => selSet2.has(p.id)).map(p => ({ id: p.id, x: p.x, y: p.y }))
    setDrag({ kind: 'move', mx0: e.clientX, my0: e.clientY, origins })
    setMoved(false)
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drag) return
    setMoved(true)

    if (drag.kind === 'move') {
      const dx = snapTo(e.clientX - drag.mx0)
      const dy = snapTo(e.clientY - drag.my0)
      setPlaced(p => p.map(c => {
        const orig = drag.origins.find(o => o.id === c.id)
        if (!orig) return c
        return { ...c, x: Math.max(0, orig.x + dx), y: Math.max(0, orig.y + dy) }
      }))
    }

    if (drag.kind === 'rubber') {
      const { x, y } = canvasCoords(e)
      setDrag({ ...drag, x1: x, y1: y })
    }
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (drag?.kind === 'rubber' && moved) {
      const rx0 = Math.min(drag.x0, drag.x1)
      const ry0 = Math.min(drag.y0, drag.y1)
      const rx1 = Math.max(drag.x0, drag.x1)
      const ry1 = Math.max(drag.y0, drag.y1)
      const hit = placed.filter(c => {
        const meta = COMP_META[c.type] ?? { w: 80, h: 40 }
        return c.x < rx1 && c.x + meta.w > rx0 && c.y < ry1 && c.y + meta.h > ry0
      })
      setSelIds(hit.map(c => c.id))
    } else if (drag?.kind === 'rubber' && !moved) {
      setSelIds([])
    }
    setDrag(null)
  }

  function deleteSelected() {
    if (!selIds.length) return
    setPlaced(p => p.filter(c => !selSet.has(c.id)))
    setSelIds([])
  }

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
      deleteSelected()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selIds, placed])

  const rubber = drag?.kind === 'rubber' ? drag : null

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.bg }}>

      {/* Palette */}
      <div style={{ width: 148, borderRight: `1px solid ${C.b1}`, background: C.s1, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '9px 12px 5px', fontSize: 10, fontFamily: C.mono, color: C.t2, letterSpacing: '0.08em' }}>КОМПОНЕНТЫ</div>
        {PALETTE_GROUPS.map(g => (
          <div key={g.group} style={{ marginBottom: 4 }}>
            <div style={{ padding: '6px 12px 2px', fontSize: 9, color: C.t3, fontFamily: C.mono, letterSpacing: '0.08em' }}>{g.group.toUpperCase()}</div>
            {g.items.map(item => (
              <button key={item} onClick={() => handlePaletteClick(item)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '4px 12px', border: 'none',
                borderLeft: `2px solid ${paletteSel === item ? C.acc : 'transparent'}`,
                background: paletteSel === item ? C.accA : 'transparent',
                fontSize: 11.5, fontFamily: C.mono,
                color: paletteSel === item ? C.acc : C.t2,
                cursor: 'pointer',
              }}>{item}</button>
            ))}
          </div>
        ))}
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: C.bg }}>
        {/* Toolbar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', background: `${C.bg}f0`,
          borderBottom: `1px solid ${C.b1}`,
          fontSize: 11, fontFamily: C.sans, color: C.t2,
        }}>
          <span style={{ fontFamily: C.mono, color: C.t1, fontSize: 11 }}>chat-tutor.ui</span>
          <span style={{ color: C.t3 }}>·</span>
          <span style={{ fontFamily: C.mono, fontSize: 10, color: paletteSel ? C.acc : C.t3 }}>
            {paletteSel ? `двойной клик → разместить ${paletteSel}` : `${placed.length} эл.`}
          </span>
          {selIds.length > 1 && <span style={{ fontFamily: C.mono, fontSize: 10, color: C.ora }}>выбрано: {selIds.length}</span>}
          <div style={{ flex: 1 }} />
          {selIds.length > 0 && (
            <button onClick={deleteSelected} style={{
              background: 'none', border: `1px solid ${C.b2}`, borderRadius: 2,
              padding: '2px 8px', fontSize: 10, fontFamily: C.mono,
              color: '#e05555', cursor: 'pointer',
            }}>удалить ({selIds.length}) ✕</button>
          )}
          {paletteSel && (
            <button onClick={() => setPaletteSel(null)} style={{
              background: 'none', border: `1px solid ${C.b2}`, borderRadius: 2,
              padding: '2px 8px', fontSize: 10, fontFamily: C.mono, color: C.t2, cursor: 'pointer',
            }}>✕ отмена</button>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onDoubleClick={handleCanvasDblClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setDrag(null)}
          style={{
            position: 'relative',
            width: 2000, height: 1600,
            backgroundImage: `radial-gradient(circle, ${C.b2} 1px, transparent 1px)`,
            backgroundSize: `${SNAP}px ${SNAP}px`,
            cursor: paletteSel ? 'crosshair' : drag?.kind === 'move' ? 'grabbing' : 'default',
            userSelect: 'none',
          }}
        >
          {/* Artboard */}
          <div style={{
            position: 'absolute',
            left: AB.x, top: AB.y,
            width: AB.w, height: AB.h,
            background: '#1a1a1f',
            border: `1px solid ${C.b2}`,
            boxShadow: '0 8px 40px rgba(0,0,0,.6)',
            pointerEvents: 'none',
          }}>
            {/* Artboard label */}
            <div style={{
              position: 'absolute', top: -22, left: 0,
              fontSize: 10, fontFamily: C.mono, color: C.t3,
              whiteSpace: 'nowrap',
            }}>chat-tutor.ui · 390 × 720</div>
            {/* Status bar mock */}
            <div style={{
              height: 28, background: '#141417',
              borderBottom: `1px solid ${C.b1}`,
              display: 'flex', alignItems: 'center',
              padding: '0 16px', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>9:41</span>
              <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>▮▮▮</span>
            </div>
          </div>

          {/* Rubber-band selection rect */}
          {rubber && moved && (
            <div style={{
              position: 'absolute',
              left: Math.min(rubber.x0, rubber.x1),
              top:  Math.min(rubber.y0, rubber.y1),
              width: Math.abs(rubber.x1 - rubber.x0),
              height: Math.abs(rubber.y1 - rubber.y0),
              border: `1px solid ${C.acc}`,
              background: C.accA,
              pointerEvents: 'none',
              zIndex: 20,
            }} />
          )}

          {/* Placed components */}
          {placed.map(comp => {
            const meta = COMP_META[comp.type] ?? { w: 120, h: 40, color: C.t2 }
            const isSel = selSet.has(comp.id)
            return (
              <div
                key={comp.id}
                onMouseDown={e => handleCompMouseDown(e, comp.id)}
                style={{
                  position: 'absolute',
                  left: comp.x, top: comp.y,
                  width: meta.w, height: meta.h,
                  cursor: drag?.kind === 'move' && isSel ? 'grabbing' : 'grab',
                  boxShadow: isSel ? `0 0 0 2px ${C.acc}, 0 4px 16px rgba(0,0,0,.4)` : '0 2px 8px rgba(0,0,0,.3)',
                  zIndex: isSel ? 5 : 2,
                }}
              >
                <CompPreview type={comp.type} />
                {isSel && (
                  <>
                    <div style={{
                      position: 'absolute', top: -18, left: 0,
                      fontSize: 9, fontFamily: C.mono, color: C.acc,
                      whiteSpace: 'nowrap', background: C.bg, padding: '1px 4px',
                      pointerEvents: 'none',
                    }}>
                      {comp.type} · {comp.x},{comp.y}
                    </div>
                    {/* Corner handles */}
                    {[[-3,-3],['auto',-3],[-3,'auto'],['auto','auto']].map((pos, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        top: pos[1] as number|'auto', bottom: pos[1] === 'auto' ? -3 : undefined,
                        left: pos[0] as number|'auto', right: pos[0] === 'auto' ? -3 : undefined,
                        width: 6, height: 6, background: C.acc,
                        pointerEvents: 'none',
                      }} />
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Properties */}
      <div style={{ width: 172, borderLeft: `1px solid ${C.b1}`, background: C.s1, flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '9px 12px 5px', fontSize: 10, fontFamily: C.mono, color: C.t2, letterSpacing: '0.08em' }}>СВОЙСТВА</div>
        {selIds.length > 1 ? (
          <>
            <PropRow label="выбрано" value={`${selIds.length} эл.`} />
            <div style={{ padding: '8px 12px', fontSize: 10.5, fontFamily: C.sans, color: C.t3, lineHeight: 1.5 }}>
              Перетащите для перемещения всех. Del — удалить.
            </div>
          </>
        ) : firstSel ? (
          <>
            <PropRow label="type"   value={firstSel.type} />
            <PropRow label="x"      value={`${firstSel.x}px`} />
            <PropRow label="y"      value={`${firstSel.y}px`} />
            <PropRow label="width"  value={`${COMP_META[firstSel.type]?.w ?? '—'}px`} />
            <PropRow label="height" value={`${COMP_META[firstSel.type]?.h ?? '—'}px`} />
          </>
        ) : paletteSel ? (
          <>
            <PropRow label="type"   value={paletteSel} />
            <PropRow label="width"  value={`${COMP_META[paletteSel]?.w ?? '—'}px`} />
            <PropRow label="height" value={`${COMP_META[paletteSel]?.h ?? '—'}px`} />
            <div style={{ padding: '8px 12px', fontSize: 10.5, fontFamily: C.sans, color: C.t3, lineHeight: 1.5 }}>
              Двойной клик на канвасе — разместить
            </div>
          </>
        ) : (
          <div style={{ padding: '10px 12px', fontSize: 10.5, fontFamily: C.sans, color: C.t3, lineHeight: 1.5 }}>
            Выберите компонент в палитре или кликните на объект
          </div>
        )}
      </div>
    </div>
  )
}

// ── LLM Panel ─────────────────────────────────────────────────────────────────

function renderText(text: string) {
  return text.split('`').map((part, i) =>
    i % 2 === 1
      ? <code key={i} style={{ fontFamily: C.mono, fontSize: 11, color: C.acc, background: C.accA, padding: '1px 4px', borderRadius: 2 }}>{part}</code>
      : part
  )
}

function LLMPanel() {
  const [msgs, setMsgs] = useState<Msg[]>(initMessages)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  function send() {
    const text = input.trim()
    if (!text) return
    const time = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    setMsgs(m => [...m, { role: 'user', text, time }])
    setInput('')
    setTimeout(() => {
      setMsgs(m => [...m, { role: 'assistant', text: 'Обрабатываю запрос...', time }])
    }, 700)
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{
      gridArea: 'dialog',
      display: 'flex',
      flexDirection: 'column',
      background: C.s1,
      borderLeft: `1px solid ${C.b1}`,
      fontFamily: C.sans,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 14px',
        borderBottom: `1px solid ${C.b1}`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t2, letterSpacing: '0.08em' }}>АССИСТЕНТ</span>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: C.s2,
          border: `1px solid ${C.b2}`,
          borderRadius: 2,
          padding: '3px 8px',
          fontSize: 10.5,
          color: C.t2,
          fontFamily: C.mono,
        }}>
          
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            padding: '5px 14px',
            marginBottom: 2,
            background: m.role === 'user' ? C.accA : 'transparent',
            borderLeft: `2px solid ${m.role === 'user' ? C.acc : 'transparent'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 10, fontFamily: C.mono, fontWeight: 600, color: m.role === 'user' ? C.acc : C.t2 }}>
                {m.role === 'user' ? 'Вы' : 'Ассистент'}
              </span>
              <span style={{ fontSize: 9, fontFamily: C.mono, color: C.t3 }}>{m.time}</span>
            </div>
            <div style={{ fontSize: 12.5, color: C.t1, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {renderText(m.text)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: '6px 14px',
        borderTop: `1px solid ${C.b1}`,
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {['chat-tutor.ui', 'onboarding.flow'].map(ctx => (
          <span key={ctx} style={{
            fontSize: 10,
            fontFamily: C.mono,
            color: C.t2,
            background: C.s2,
            border: `1px solid ${C.b2}`,
            padding: '2px 6px',
            borderRadius: 2,
          }}>{ctx}</span>
        ))}
      </div>

      <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.b1}`, flexShrink: 0 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Поставьте задачу... (Enter для отправки)"
          rows={3}
          style={{
            width: '100%',
            background: C.s2,
            border: `1px solid ${C.b2}`,
            padding: '8px 10px',
            fontSize: 12.5,
            fontFamily: C.sans,
            color: C.t1,
            lineHeight: 1.55,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>Shift+Enter — новая строка</span>
          <button
            onClick={send}
            style={{
              background: C.acc,
              border: 'none',
              borderRadius: 2,
              padding: '5px 14px',
              fontSize: 12,
              fontFamily: C.sans,
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Отправить ↵
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Preview Panel ─────────────────────────────────────────────────────────────

/*function PreviewPanel() {
  const [device, setDevice] = useState<Device>('mobile')

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: C.bg,
      borderTop: `1px solid ${C.b1}`,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 16px',
        borderBottom: `1px solid ${C.b1}`,
        flexShrink: 0,
        fontFamily: C.sans,
      }}>
        <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t2, letterSpacing: '0.08em' }}>ПРЕДПРОСМОТР</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {(['mobile', 'desktop'] as Device[]).map(d => (
            <button key={d} onClick={() => setDevice(d)} style={{
              background: device === d ? C.s2 : 'transparent',
              border: `1px solid ${device === d ? C.b2 : 'transparent'}`,
              borderRadius: 2,
              padding: '2px 9px',
              fontSize: 10,
              fontFamily: C.mono,
              color: device === d ? C.t1 : C.t2,
              cursor: 'pointer',
            }}>{d}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, fontFamily: C.mono, color: C.grn }}>● live</span>
        <button style={{
          background: 'none',
          border: `1px solid ${C.b2}`,
          borderRadius: 2,
          padding: '2px 9px',
          fontSize: 10,
          fontFamily: C.mono,
          color: C.t2,
          cursor: 'pointer',
        }}>⟳ обновить</button>
      </div>

      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 16px',
      }}>
        <div style={{
          height: '100%',
          width: device === 'mobile' ? 188 : '100%',
          maxWidth: device === 'desktop' ? 520 : 188,
          border: `1px solid ${C.b2}`,
          borderRadius: device === 'mobile' ? 10 : 0,
          background: C.s2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '7px 12px',
            borderBottom: `1px solid ${C.b1}`,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flexShrink: 0,
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.accA, display: 'grid', placeItems: 'center', fontSize: 9, color: C.acc }}>E</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>Куратор</span>
            <span style={{ marginLeft: 'auto', fontSize: 8, color: C.grn, fontFamily: C.mono }}>● онлайн</span>
          </div>
          <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 7, overflow: 'hidden' }}>
            <div style={{ alignSelf: 'flex-start', background: C.s1, border: `1px solid ${C.b1}`, padding: '5px 9px', fontSize: 10, color: C.t1, maxWidth: '85%', lineHeight: 1.45 }}>Что изучаем сегодня?</div>
            <div style={{ alignSelf: 'flex-end', background: C.acc, padding: '5px 9px', fontSize: 10, color: '#fff', maxWidth: '80%', lineHeight: 1.45 }}>Тригонометрия</div>
            <div style={{ alignSelf: 'flex-start', background: C.s1, border: `1px solid ${C.b1}`, padding: '5px 9px', fontSize: 10, color: C.t1, maxWidth: '85%', lineHeight: 1.45 }}>Начнём с единичной окружности...</div>
          </div>
          <div style={{ padding: '6px 10px', borderTop: `1px solid ${C.b1}`, display: 'flex', gap: 5, flexShrink: 0 }}>
            <div style={{ flex: 1, background: C.s1, border: `1px solid ${C.b2}`, padding: '4px 8px', fontSize: 9, color: C.t3 }}>Введите сообщение...</div>
            <div style={{ background: C.acc, padding: '4px 9px', fontSize: 9, color: '#fff' }}>→</div>
          </div>
        </div>
      </div>
    </div>
  )
}*/

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeFile, setActiveFile] = useState('chat-tutor.ui')
  const [runState, setRunState] = useState<RunState>('idle')
  const [toast, setToast] = useState<Toast>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(t: Toast) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(t)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  function handleCheck() {
    if (runState !== 'idle') return
    setRunState('checking')
    setTimeout(() => {
      setRunState('idle')
      showToast({ text: 'Проверка завершена: 4 компонента, 0 ошибок, 1 предупреждение (Typing.visible не привязан)', kind: 'warn' })
    }, 1600)
  }

  function handleRun() {
    if (runState === 'running') {
      setRunState('idle')
      showToast({ text: 'Сборка остановлена', kind: 'warn' })
      return
    }
    if (runState !== 'idle') return
    setRunState('running')
    setTimeout(() => {
      setRunState('idle')
      showToast({ text: 'Сборка успешна — chat-tutor.ui развёрнут на localhost:3000', kind: 'ok' })
    }, 2400)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateAreas: '"top top top" "sidebar center dialog"',
      gridTemplateColumns: '220px 1fr 300px',
      gridTemplateRows: '44px 1fr',
      height: '100dvh',
      background: C.bg,
      overflow: 'hidden',
    }}>
      <ToastBanner toast={toast} />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      <TopBar
        activeFile={activeFile}
        runState={runState}
        settingsOpen={settingsOpen}
        onCheck={handleCheck}
        onRun={handleRun}
        onSettings={() => setSettingsOpen(o => !o)}
      />
      <Sidebar selected={activeFile} onSelect={setActiveFile} />

      <div style={{ gridArea: 'center', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: C.s1,
          borderBottom: `1px solid ${C.b1}`,
          height: 36,
          padding: '0 16px',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: C.grn, fontFamily: C.mono }}>{EXT_MARK['ui']}</span>
          <span style={{ fontSize: 12, fontFamily: C.mono, color: C.t1, marginLeft: 6 }}>{activeFile}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, fontFamily: C.mono, color: C.t3 }}>Конструктор интерфейса</span>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            <VisualConstructor />
          </div>
        </div>
      </div>

      <LLMPanel />
    </div>
  )
}
