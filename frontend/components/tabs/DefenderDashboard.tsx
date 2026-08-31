'use client'

import { useCallback, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import Terminal from '@/components/Terminal'
import type { TerminalLine } from '@/components/Terminal'

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

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShapEntry { name: string; value: number }

interface LiveStats {
  model: string | null
  confidence: number | null
  latency: number | null
  isFraud: boolean | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _counter = 0
function mkLine(type: TerminalLine['type'], text: string): TerminalLine {
  return { id: `def-${_counter++}`, type, text }
}

function shapColor(value: number): string {
  if (value > 0.6) return '#f87171'  // rose-400
  if (value > 0.3) return '#fbbf24'  // amber-400
  return '#22d3ee'                   // cyan-400
}

// ─── Custom Recharts tooltip ──────────────────────────────────────────────────

interface TooltipPayloadEntry {
  value: number
  payload: ShapEntry
}

function ShapTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}) {
  if (!active || !payload?.length) return null
  const { value, payload: entry } = payload[0]
  return (
    <div className="bg-panel border border-border text-xs px-3 py-2 rounded-sm shadow-lg">
      <p className="text-slate-400 font-mono mb-1 max-w-[220px] truncate">{entry.name}</p>
      <p className="font-mono font-bold" style={{ color: shapColor(value) }}>
        SHAP {value.toFixed(4)}
      </p>
    </div>
  )
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  sub,
  valueClass,
  borderClass,
}: {
  label: string
  value: string
  sub: string
  valueClass: string
  borderClass: string
}) {
  return (
    <div className={`bg-panel border ${borderClass} rounded-sm px-4 py-3`}>
      <div className={`text-xl font-bold font-mono ${valueClass}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
      <div className="text-[10px] text-slate-700 mt-0.5">{sub}</div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

const INIT_LINES: TerminalLine[] = [
  mkLine('system', 'Blue-team defense stack — ONLINE'),
  mkLine('info',   'Layers: DeBERTa-v3-base · XGBoost-tabular · GraphSAGE · CNN'),
  mkLine('info',   'Select an attack vector and press Analyze.'),
]

export default function DefenderDashboard() {
  const [vectorId, setVectorId]   = useState('v01')
  const [shapData, setShapData]   = useState<ShapEntry[]>([])
  const [stats, setStats]         = useState<LiveStats>({ model: null, confidence: null, latency: null, isFraud: null })
  const [lines, setLines]         = useState<TerminalLine[]>(INIT_LINES)
  const [isRunning, setIsRunning] = useState(false)

  const append = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line])
  }, [])

  async function handleAnalyze() {
    if (isRunning) return
    setIsRunning(true)
    setShapData([])
    setStats({ model: null, confidence: null, latency: null, isFraud: null })

    const vec = VECTORS.find(v => v.id === vectorId)!
    append(mkLine('cmd',  `analyze ${vectorId.toUpperCase()} — ${vec.name}`))
    append(mkLine('info', `target: ${vec.target}`))

    try {
      const res = await fetch('http://localhost:8000/api/defender/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vector_id: vectorId }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const r = data.result

      const sorted: ShapEntry[] = Object.entries(r.shap_values as Record<string, number>)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }))

      setShapData(sorted)
      setStats({ model: r.model_used, confidence: r.confidence, latency: r.latency_ms, isFraud: r.is_fraud })

      const pct = (r.confidence * 100).toFixed(1)
      append(mkLine(
        r.is_fraud ? 'error' : 'success',
        r.is_fraud
          ? `FRAUD DETECTED — ${pct}% confidence`
          : `CLEAN — ${(100 - r.confidence * 100).toFixed(1)}% legitimate`,
      ))
      append(mkLine('info', `model: ${r.model_used} | latency: ${(r.latency_ms as number).toFixed(1)}ms`))
      append(mkLine('info', `↳ ${r.explanation}`))

      if (sorted.length) {
        const top3 = sorted.slice(0, 3).map(e => `${e.name}=+${e.value.toFixed(3)}`).join(' · ')
        append(mkLine('info', `SHAP top-3: ${top3}`))
      }
    } catch {
      append(mkLine('error', 'Backend unreachable — start: uvicorn app.main:app --reload'))
    } finally {
      setIsRunning(false)
    }
  }

  const selectedVec = VECTORS.find(v => v.id === vectorId)!
  const surfaceOrder: Surface[] = ['protocol', 'endpoint', 'human', 'post_purchase']
  const grouped = surfaceOrder.map(s => ({
    surface: s,
    vectors: VECTORS.filter(v => v.surface === s),
  }))

  // ── Live stat tile values ───────────────────────────────────────────────────
  const verdictLabel = stats.isFraud === null ? 'PENDING' : stats.isFraud ? 'FRAUD' : 'CLEAN'
  const verdictClass =
    stats.isFraud === null ? 'text-amber-400' :
    stats.isFraud          ? 'text-rose-400'  : 'text-matrix'
  const verdictBorder =
    stats.isFraud === null ? 'border-amber-500/30' :
    stats.isFraud          ? 'border-rose-500/30'  : 'border-matrix/30'

  const confidenceLabel = stats.confidence !== null
    ? `${(stats.confidence * 100).toFixed(1)}%`
    : '≥ 0.97'
  const latencyLabel = stats.latency !== null
    ? `${stats.latency.toFixed(0)}ms`
    : '< 100ms'
  const modelLabel = stats.model ?? '—'

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">

      {/* Header */}
      <div className="flex items-baseline justify-between shrink-0">
        <div>
          <h2 className="text-matrix text-sm font-semibold tracking-widest uppercase">
            Blue-Team Defender
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            SHAP explainability · tri-layer detection · alert log
          </p>
        </div>
        <span className="text-xs text-matrix border border-matrix/30 bg-matrix/5 px-2 py-1 rounded">
          ONLINE
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <StatTile
          label="Verdict"
          value={verdictLabel}
          sub={stats.isFraud === null ? 'awaiting analysis' : 'latest run'}
          valueClass={verdictClass}
          borderClass={verdictBorder}
        />
        <StatTile
          label="Confidence"
          value={confidenceLabel}
          sub={stats.confidence !== null ? 'ROC-AUC proxy' : 'target SLA'}
          valueClass="text-matrix"
          borderClass="border-matrix/30"
        />
        <StatTile
          label="Latency"
          value={latencyLabel}
          sub={stats.latency !== null ? 'p99 inference' : 'SLA ceiling'}
          valueClass="text-cyan-400"
          borderClass="border-cyan-500/30"
        />
        <StatTile
          label="Model"
          value={modelLabel}
          sub="active layer"
          valueClass="text-slate-300"
          borderClass="border-slate-600/40"
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* SHAP chart */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">
            SHAP Feature Importance
          </div>
          <div className="flex-1 bg-panel border border-border rounded-sm min-h-0 overflow-hidden">
            {shapData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="text-slate-700 text-3xl font-mono">≋</div>
                <p className="text-slate-600 text-xs">
                  {isRunning ? 'Running inference...' : 'Run an analysis to populate SHAP chart'}
                </p>
                <p className="text-slate-700 text-[10px]">DeBERTa · XGBoost · GraphSAGE layers</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shapData}
                  layout="vertical"
                  margin={{ top: 16, right: 24, bottom: 16, left: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1E2A38"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickCount={6}
                    tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }}
                    stroke="#1E2A38"
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={190}
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    stroke="#1E2A38"
                    tickFormatter={(v: string) => v.length > 24 ? `${v.slice(0, 22)}…` : v}
                  />
                  <Tooltip content={<ShapTooltip />} cursor={{ fill: '#1E2A38', fillOpacity: 0.5 }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={18}>
                    {shapData.map((entry, i) => (
                      <Cell key={i} fill={shapColor(entry.value)} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alert log */}
        <div className="w-72 flex flex-col gap-2 min-h-0 shrink-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">Alert Log</div>
          <Terminal title="defender.log" lines={lines} className="flex-1" />
        </div>
      </div>

      {/* Control bar */}
      <div className="shrink-0 flex gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] text-slate-600 tracking-widest uppercase">
            Attack Vector
          </label>
          <select
            value={vectorId}
            onChange={e => setVectorId(e.target.value)}
            disabled={isRunning}
            className="bg-panel border border-border text-slate-300 text-xs font-mono rounded-sm px-2 py-1.5 w-full
                       focus:outline-none focus:border-matrix/60 cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="flex flex-col justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isRunning}
            className="py-1.5 px-6 text-xs font-semibold tracking-widest uppercase rounded-sm border transition-colors
              disabled:border-border disabled:text-slate-700 disabled:cursor-not-allowed
              enabled:border-matrix/50 enabled:text-matrix enabled:bg-matrix/5
              enabled:hover:bg-matrix/15 enabled:hover:border-matrix"
          >
            {isRunning ? '⠸ Analyzing...' : `▶  Analyze ${vectorId.toUpperCase()}`}
          </button>
        </div>
      </div>

    </div>
  )
}
