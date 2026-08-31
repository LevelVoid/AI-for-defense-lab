'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Terminal from '@/components/Terminal'
import type { TerminalLine } from '@/components/Terminal'
import { createWsClient } from '@/lib/ws'
import type { WsClient, WsEvent } from '@/lib/ws'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

// ─── Vector registry ────────────────────────────────────────────────────────

type Surface = 'protocol' | 'endpoint' | 'human' | 'post_purchase'

interface Vector { id: string; name: string; surface: Surface; target: string }

const VECTORS: Vector[] = [
  { id: 'v01', name: 'ISO 20022 Prompt Injection',   surface: 'protocol',      target: 'RmtInf/Ustrd' },
  { id: 'v02', name: 'ISO 8583 RL Socket Fuzzing',   surface: 'protocol',      target: 'DE 4, DE 22' },
  { id: 'v03', name: 'ISO 8583 Ghost Logging',       surface: 'protocol',      target: 'MTI 0100 Socket' },
  { id: 'v04', name: 'Cross-Merchant IDOR Void',     surface: 'protocol',      target: 'MTI 0400 / DE 37 RRN' },
  { id: 'v05', name: 'Synthetic Device Telemetry',   surface: 'endpoint',      target: 'Canvas/WebGL/IP' },
  { id: 'v06', name: 'Behavioral Micro-Mimicry',     surface: 'endpoint',      target: 'Biometric Cadence' },
  { id: 'v07', name: 'Deepfake Camera Injection',    surface: 'endpoint',      target: 'Mobile OS Camera API' },
  { id: 'v08', name: 'AP2 Agent DOM Hijack',         surface: 'endpoint',      target: 'Shopping Agent Prompt' },
  { id: 'v09', name: 'Real-Time Vishing / OTP Bot',  surface: 'human',         target: 'SMS OTP / 3DS' },
  { id: 'v10', name: 'Autonomous Corporate BEC',     surface: 'human',         target: 'ISO 20022 Invoices' },
  { id: 'v11', name: 'APP Romance/Investment Swarm', surface: 'human',         target: 'Real-Time Payments' },
  { id: 'v12', name: 'Social Support Quishing',      surface: 'human',         target: 'Public Threads' },
  { id: 'v13', name: 'Photorealistic Damage Gen',    surface: 'post_purchase', target: 'Merchant Refund Portal' },
  { id: 'v14', name: 'Autonomous Dispute Arbitrage', surface: 'post_purchase', target: 'Acquirer Dispute System' },
  { id: 'v15', name: 'Synthetic Merchant Bust-Out',  surface: 'post_purchase', target: 'Acquirer Accounts' },
  { id: 'v16', name: 'GNN Graph Mule Poisoning',     surface: 'post_purchase', target: 'Network Graph Embeddings' },
]

const SURFACE_LABELS: Record<Surface, string> = {
  protocol:      'Surface 01 — Protocol & Rail',
  endpoint:      'Surface 02 — Endpoint & Auth',
  human:         'Surface 03 — Human & Social',
  post_purchase: 'Surface 04 — Post-Purchase & Dispute',
}

const SURFACE_COLORS: Record<Surface, string> = {
  protocol:      'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  endpoint:      'text-violet-400 border-violet-500/30 bg-violet-500/10',
  human:         'text-amber-400 border-amber-500/30 bg-amber-500/10',
  post_purchase: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let _counter = 0
function mkLine(type: TerminalLine['type'], text: string): TerminalLine {
  return { id: `gs-${_counter++}`, type, text }
}

function payloadLanguage(fmt: string): string {
  if (fmt === 'iso20022_xml') return 'xml'
  if (fmt === 'json') return 'json'
  return 'plaintext'
}

function pad(n: number, len = 3): string { return String(n).padStart(len, '0') }

const CLIENT_ID = `studio-${Math.random().toString(36).slice(2, 9)}`
const WS_URL    = `ws://localhost:8000/ws/stream/${CLIENT_ID}`

const PLACEHOLDER = `// Select an attack vector and choose an attack mode:
//
//  SCALE ATTACK  — fire the selected vector 50 times with increasing
//                  adversarial sophistication; watch confidence drift
//                  and evasions emerge as the attacker adapts.
//
//  BROAD SWEEP   — fire all 16 vectors once each to check surface
//                  coverage across Protocol · Endpoint · Human · Post-Purchase.`

// ─── Types ───────────────────────────────────────────────────────────────────

type AttackMode = 'idle' | 'scale' | 'sweep'

interface ScaleProgress { attempt: number; total: number; evaded: number }
interface SweepProgress { done: number; total: number }

// ─── Component ──────────────────────────────────────────────────────────────

export default function GeneratorStudio() {
  const [vectorId, setVectorId]       = useState('v01')
  const [payload, setPayload]         = useState('')
  const [language, setLanguage]       = useState<string>('plaintext')
  const [isConnected, setIsConnected] = useState(false)
  const [mode, setMode]               = useState<AttackMode>('idle')
  const [scaleProgress, setScaleProgress] = useState<ScaleProgress | null>(null)
  const [sweepProgress, setSweepProgress] = useState<SweepProgress | null>(null)
  const [lines, setLines] = useState<TerminalLine[]>(() => [
    mkLine('system', 'Red-Team Generator Studio — online'),
    mkLine('info',   `client_id: ${CLIENT_ID}`),
    mkLine('warn',   'Connecting to WebSocket hub...'),
  ])

  const wsRef      = useRef<WsClient | null>(null)
  const handlerRef = useRef<(evt: WsEvent) => void>(() => {})
  const modeRef    = useRef<AttackMode>('idle')

  const append = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line])
  }, [])

  handlerRef.current = (evt: WsEvent) => {
    const currentMode = modeRef.current

    // ── payload_generated: update Monaco editor ──────────────────────────────
    if (evt.event === 'payload_generated') {
      setPayload(evt.payload ?? '')
      setLanguage(payloadLanguage(evt.payload_format ?? ''))
      const bytes = new TextEncoder().encode(evt.payload ?? '').length
      const evtAny = evt as unknown as { attempt?: number; total?: number }
      if (currentMode === 'scale' && evtAny.attempt && evtAny.attempt > 1) {
        // Only log evasion payloads (attempt > 1 means it evaded)
        append(mkLine('warn',
          `  ⚡ [${pad(evtAny.attempt)}/${pad(evtAny.total ?? 50)}] EVASION PAYLOAD — ${evt.payload_format} · ${bytes}B`))
      }
      return
    }

    // ── detection_result ─────────────────────────────────────────────────────
    if (evt.event === 'detection_result') {
      const pct  = ((evt.confidence ?? 0) * 100).toFixed(1)
      const evtAny = evt as unknown as { attempt?: number; total?: number }

      if (currentMode === 'scale') {
        const attempt = evtAny.attempt ?? 0
        const total   = evtAny.total ?? 50
        setScaleProgress(prev => prev
          ? { ...prev, attempt, evaded: prev.evaded + (evt.is_fraud ? 0 : 1) }
          : null)

        if (!evt.is_fraud) {
          // Always log evasions — these are the important events
          append(mkLine('error',
            `  ⚡ [${pad(attempt)}/${pad(total)}] EVADED  conf=${pct}% · ${evt.model_used} · ${evt.latency_ms?.toFixed(0)}ms`))
        } else if (attempt % 10 === 0) {
          // Log every 10th detection to show the stream without flooding
          append(mkLine('info',
            `  ✓ [${pad(attempt)}/${pad(total)}] DETECTED conf=${pct}% · ${evt.model_used}`))
        }

      } else if (currentMode === 'sweep') {
        setSweepProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null)
        if (evt.is_fraud) {
          append(mkLine('error',
            `[${evt.vector_id?.toUpperCase()}] FRAUD ${pct}% · ${evt.model_used} · ${evt.latency_ms?.toFixed(0)}ms`))
        } else {
          append(mkLine('success',
            `[${evt.vector_id?.toUpperCase()}] CLEAN · ${evt.model_used} · ${evt.latency_ms?.toFixed(0)}ms`))
        }
      }
      return
    }

    // ── scale_complete ────────────────────────────────────────────────────────
    if (evt.event === 'scale_complete') {
      modeRef.current = 'idle'
      setMode('idle')
      setScaleProgress(null)
      const sc = evt as unknown as { total: number; detected: number; evaded: number }
      append(mkLine('system',
        `━━ SCALE ATTACK COMPLETE ━━ ${sc.total} attempts · ${sc.detected} DETECTED · ${sc.evaded} EVADED ━━`))
      return
    }

    // ── batch_complete (broad sweep) ──────────────────────────────────────────
    if (evt.event === 'batch_complete') {
      modeRef.current = 'idle'
      setMode('idle')
      setSweepProgress(null)
      const bc = evt as unknown as { total: number; detected: number; evaded: number }
      append(mkLine('system',
        `━━ BROAD SWEEP COMPLETE ━━ ${bc.total} vectors · ${bc.detected} DETECTED · ${bc.evaded} EVADED ━━`))
    }
  }

  useEffect(() => {
    const client = createWsClient(
      WS_URL,
      (evt) => handlerRef.current(evt),
      () => {
        setIsConnected(true)
        setLines(prev => [...prev, mkLine('success', `connected → ${WS_URL}`)])
      },
      () => {
        setIsConnected(false)
        modeRef.current = 'idle'
        setMode('idle')
        setScaleProgress(null)
        setSweepProgress(null)
        setLines(prev => [...prev, mkLine('error', 'WebSocket disconnected — reload to reconnect')])
      },
    )
    wsRef.current = client
    return () => client.close()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isRunning = mode !== 'idle'

  function handleScaleAttack() {
    if (!isConnected || isRunning) return
    const vec = VECTORS.find(v => v.id === vectorId)!
    modeRef.current = 'scale'
    setMode('scale')
    setPayload('')
    setScaleProgress({ attempt: 0, total: 50, evaded: 0 })
    append(mkLine('cmd',
      `scale_attack ${vectorId.toUpperCase()} — ${vec.name} · 50 attempts · probing for evasion`))
    append(mkLine('info', `target: ${vec.target} · logging every 10th detection + all evasions`))
    wsRef.current?.send({ action: 'scale_attack', vector_id: vectorId, count: 50 })
  }

  function handleBroadSweep() {
    if (!isConnected || isRunning) return
    modeRef.current = 'sweep'
    setMode('sweep')
    setPayload('')
    setSweepProgress({ done: 0, total: 16 })
    append(mkLine('cmd', 'broad_sweep — 16 vectors across all attack surfaces'))
    wsRef.current?.send({ action: 'batch_attack', params: {} })
  }

  const selectedVec = VECTORS.find(v => v.id === vectorId)!
  const surfaceOrder: Surface[] = ['protocol', 'endpoint', 'human', 'post_purchase']
  const grouped = surfaceOrder.map(s => ({
    surface: s,
    vectors: VECTORS.filter(v => v.surface === s),
  }))

  // ── Status badge ─────────────────────────────────────────────────────────────
  let badgeText = isConnected ? 'LIVE' : 'CONNECTING…'
  let badgeClass = isConnected
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : 'text-amber-400 border-amber-500/30 bg-amber-500/10'

  if (mode === 'scale' && scaleProgress) {
    badgeText = `${scaleProgress.attempt}/50 · ${scaleProgress.evaded}⚡`
    badgeClass = 'text-rose-400 border-rose-500/30 bg-rose-500/10'
  } else if (mode === 'sweep' && sweepProgress) {
    badgeText = `${sweepProgress.done}/16`
    badgeClass = 'text-amber-400 border-amber-500/30 bg-amber-500/10'
  }

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-matrix text-sm font-semibold tracking-widest uppercase">
            Red-Team Generator Studio
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Scale Attack — one vector × 50 attempts &nbsp;|&nbsp; Broad Sweep — 16 vectors × 1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${SURFACE_COLORS[selectedVec.surface]}`}>
            {selectedVec.target}
          </span>
          <span className={`text-xs px-2 py-1 rounded border font-mono ${badgeClass}`}>
            {badgeText}
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Left: selector + editor + buttons */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">

          {/* Vector selector */}
          <div className="shrink-0 flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 tracking-widest uppercase">
              Attack Vector
            </label>
            <select
              value={vectorId}
              onChange={e => setVectorId(e.target.value)}
              disabled={isRunning}
              className="bg-panel border border-border text-slate-300 text-xs font-mono rounded-sm px-2 py-1.5 w-full
                         focus:outline-none focus:border-matrix/60 cursor-pointer disabled:opacity-50"
            >
              {grouped.map(({ surface, vectors }) => (
                <optgroup key={surface} label={SURFACE_LABELS[surface]}>
                  {vectors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.id.toUpperCase()} — {v.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Monaco editor — shows current payload or evasion payload */}
          <div className="flex flex-col gap-1 flex-1 min-h-0">
            <div className="text-[10px] text-slate-600 tracking-widest uppercase flex items-center gap-2">
              <span>Payload · {language}</span>
              {mode === 'scale' && scaleProgress && scaleProgress.evaded > 0 && (
                <span className="text-rose-400 animate-pulse">
                  {scaleProgress.evaded} evasion{scaleProgress.evaded > 1 ? 's' : ''} captured
                </span>
              )}
            </div>
            <div className="flex-1 border border-border rounded-sm overflow-hidden min-h-0">
              <MonacoEditor
                height="100%"
                language={language}
                value={payload || PLACEHOLDER}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 11,
                  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 10, bottom: 10 },
                  folding: true,
                  renderLineHighlight: 'gutter',
                  contextmenu: false,
                  overviewRulerBorder: false,
                }}
              />
            </div>
          </div>

          {/* Attack mode buttons */}
          <div className="shrink-0 flex gap-2">
            {/* Primary: scale attack — one vector at depth */}
            <button
              onClick={handleScaleAttack}
              disabled={!isConnected || isRunning}
              className="flex-1 py-2 text-xs font-semibold tracking-widest uppercase rounded-sm border transition-colors
                disabled:border-border disabled:text-slate-700 disabled:cursor-not-allowed
                enabled:border-rose-500/50 enabled:text-rose-400 enabled:bg-rose-500/5
                enabled:hover:bg-rose-500/15 enabled:hover:border-rose-500"
            >
              {mode === 'scale'
                ? `⠸ probing ${scaleProgress?.attempt ?? 0}/50 · ${scaleProgress?.evaded ?? 0} evaded`
                : `⚡ Scale Attack ${vectorId.toUpperCase()} (50×)`}
            </button>

            {/* Secondary: broad sweep — all 16 vectors once */}
            <button
              onClick={handleBroadSweep}
              disabled={!isConnected || isRunning}
              className="flex-1 py-2 text-xs font-semibold tracking-widest uppercase rounded-sm border transition-colors
                disabled:border-border disabled:text-slate-700 disabled:cursor-not-allowed
                enabled:border-amber-500/40 enabled:text-amber-400 enabled:bg-amber-500/5
                enabled:hover:bg-amber-500/10 enabled:hover:border-amber-500"
            >
              {mode === 'sweep'
                ? `⠸ sweeping ${sweepProgress?.done ?? 0}/16`
                : '▶ Broad Sweep (16 Vectors)'}
            </button>
          </div>
        </div>

        {/* Right: terminal stream */}
        <div className="w-80 flex flex-col gap-2 min-h-0 shrink-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">Stream Output</div>
          <Terminal title="generator.log" lines={lines} className="flex-1" />
        </div>

      </div>
    </div>
  )
}
