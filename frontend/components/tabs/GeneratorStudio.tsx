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

interface Vector {
  id: string
  name: string
  surface: Surface
  target: string
}

const VECTORS: Vector[] = [
  { id: 'v01', name: 'ISO 20022 Prompt Injection',     surface: 'protocol',      target: 'RmtInf/Ustrd' },
  { id: 'v02', name: 'ISO 8583 RL Socket Fuzzing',     surface: 'protocol',      target: 'DE 4, DE 22' },
  { id: 'v03', name: 'ISO 8583 Ghost Logging',         surface: 'protocol',      target: 'MTI 0100 Socket' },
  { id: 'v04', name: 'Cross-Merchant IDOR Void',       surface: 'protocol',      target: 'MTI 0400 / DE 37 RRN' },
  { id: 'v05', name: 'Synthetic Device Telemetry',     surface: 'endpoint',      target: 'Canvas/WebGL/IP' },
  { id: 'v06', name: 'Behavioral Micro-Mimicry',       surface: 'endpoint',      target: 'Biometric Cadence' },
  { id: 'v07', name: 'Deepfake Camera Injection',      surface: 'endpoint',      target: 'Mobile OS Camera API' },
  { id: 'v08', name: 'AP2 Agent DOM Hijack',           surface: 'endpoint',      target: 'Shopping Agent Prompt' },
  { id: 'v09', name: 'Real-Time Vishing / OTP Bot',    surface: 'human',         target: 'SMS OTP / 3DS' },
  { id: 'v10', name: 'Autonomous Corporate BEC',       surface: 'human',         target: 'ISO 20022 Invoices' },
  { id: 'v11', name: 'APP Romance/Investment Swarm',   surface: 'human',         target: 'Real-Time Payments' },
  { id: 'v12', name: 'Social Support Quishing',        surface: 'human',         target: 'Public Threads' },
  { id: 'v13', name: 'Photorealistic Damage Gen',      surface: 'post_purchase', target: 'Merchant Refund Portal' },
  { id: 'v14', name: 'Autonomous Dispute Arbitrage',   surface: 'post_purchase', target: 'Acquirer Dispute System' },
  { id: 'v15', name: 'Synthetic Merchant Bust-Out',    surface: 'post_purchase', target: 'Acquirer Accounts' },
  { id: 'v16', name: 'GNN Graph Mule Poisoning',       surface: 'post_purchase', target: 'Network Graph Embeddings' },
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

const CLIENT_ID = `studio-${Math.random().toString(36).slice(2, 9)}`
const WS_URL    = `ws://localhost:8000/ws/stream/${CLIENT_ID}`

const PLACEHOLDER = `// Select an attack vector and press Generate
// The synthesized payload will appear here
// Formats: iso20022_xml · iso8583_hex · json · text`

// ─── Component ──────────────────────────────────────────────────────────────

export default function GeneratorStudio() {
  const [vectorId, setVectorId]         = useState('v01')
  const [payload, setPayload]           = useState('')
  const [language, setLanguage]         = useState<string>('plaintext')
  const [isConnected, setIsConnected]   = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lines, setLines]               = useState<TerminalLine[]>(() => [
    mkLine('system', 'Red-Team Generator Studio — M4 online'),
    mkLine('info',   `client_id: ${CLIENT_ID}`),
    mkLine('warn',   'Connecting to WebSocket hub...'),
  ])

  const wsRef      = useRef<WsClient | null>(null)
  const handlerRef = useRef<(evt: WsEvent) => void>(() => {})

  const append = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line])
  }, [])

  // keep handler ref current so the WS closure never goes stale
  handlerRef.current = (evt: WsEvent) => {
    if (evt.event === 'payload_generated') {
      const bytes = new TextEncoder().encode(evt.payload ?? '').length
      setPayload(evt.payload ?? '')
      setLanguage(payloadLanguage(evt.payload_format ?? ''))
      append(mkLine('success', `payload synthesized — format: ${evt.payload_format} | ${bytes} bytes`))
    } else if (evt.event === 'detection_result') {
      setIsGenerating(false)
      const pct = ((evt.confidence ?? 0) * 100).toFixed(1)
      if (evt.is_fraud) {
        append(mkLine('error', `FRAUD DETECTED — ${pct}% confidence | ${evt.model_used} | ${evt.latency_ms?.toFixed(1)}ms`))
      } else {
        const clean = ((1 - (evt.confidence ?? 0)) * 100).toFixed(1)
        append(mkLine('success', `CLEAN — ${clean}% legitimate | ${evt.model_used} | ${evt.latency_ms?.toFixed(1)}ms`))
      }
      if (evt.explanation) append(mkLine('info', `↳ ${evt.explanation}`))
      const top3 = Object.entries(evt.shap_values ?? {})
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 3)
      if (top3.length) {
        append(mkLine('info', `SHAP: ${top3.map(([k, v]) => `${k}=${v > 0 ? '+' : ''}${v.toFixed(3)}`).join(' · ')}`))
      }
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
        setIsGenerating(false)
        setLines(prev => [...prev, mkLine('error', 'WebSocket disconnected — reload to reconnect')])
      },
    )
    wsRef.current = client
    return () => client.close()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleGenerate() {
    if (!isConnected || isGenerating) return
    const vec = VECTORS.find(v => v.id === vectorId)!
    setIsGenerating(true)
    setPayload('')
    append(mkLine('cmd', `generate ${vectorId.toUpperCase()} — ${vec.name}`))
    wsRef.current?.send({ action: 'generate_and_detect', vector_id: vectorId, params: {} })
  }

  const selectedVec = VECTORS.find(v => v.id === vectorId)!
  const surfaceOrder: Surface[] = ['protocol', 'endpoint', 'human', 'post_purchase']
  const grouped = surfaceOrder.map(s => ({
    surface: s,
    vectors: VECTORS.filter(v => v.surface === s),
  }))

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-matrix text-sm font-semibold tracking-widest uppercase">
            Red-Team Generator Studio
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Select a vector · synthesize payload · stream detection results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${SURFACE_COLORS[selectedVec.surface]}`}>
            {selectedVec.target}
          </span>
          <span className={`text-xs px-2 py-1 rounded border ${
            isConnected
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
          }`}>
            {isConnected ? 'LIVE' : 'CONNECTING…'}
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Left: selector + editor + button */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">

          {/* Vector selector */}
          <div className="shrink-0 flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 tracking-widest uppercase">
              Attack Vector
            </label>
            <select
              value={vectorId}
              onChange={e => setVectorId(e.target.value)}
              className="bg-panel border border-border text-slate-300 text-xs font-mono rounded-sm px-2 py-1.5 w-full
                         focus:outline-none focus:border-matrix/60 cursor-pointer"
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

          {/* Monaco editor */}
          <div className="flex flex-col gap-1 flex-1 min-h-0">
            <div className="text-[10px] text-slate-600 tracking-widest uppercase">
              Payload Editor · {language}
            </div>
            <div className="flex-1 border border-border rounded-sm overflow-hidden min-h-0">
              <MonacoEditor
                height="100%"
                language={language}
                value={payload || PLACEHOLDER}
                theme="vs-dark"
                options={{
                  readOnly: false,
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

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!isConnected || isGenerating}
            className="shrink-0 w-full py-2 text-xs font-semibold tracking-widest uppercase rounded-sm border transition-colors
              disabled:border-border disabled:text-slate-700 disabled:cursor-not-allowed
              enabled:border-matrix/50 enabled:text-matrix enabled:bg-matrix/5
              enabled:hover:bg-matrix/15 enabled:hover:border-matrix"
          >
            {isGenerating ? '⠸ Synthesizing payload...' : `▶  Generate ${vectorId.toUpperCase()}`}
          </button>
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
