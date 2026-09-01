'use client'

import { useCallback, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import Terminal from '@/components/Terminal'
import type { TerminalLine } from '@/components/Terminal'

// ─── Vector metadata ──────────────────────────────────────────────────────────

const VECTOR_NAMES: Record<string, string> = {
  v01: 'ISO 20022 Prompt Inj', v02: 'ISO 8583 RL Fuzzing',
  v03: 'Ghost Logging',        v04: 'IDOR Void',
  v05: 'Device Telemetry',     v06: 'Behavioral Mimicry',
  v07: 'Deepfake Camera',      v08: 'DOM Hijack',
  v09: 'Vishing / OTP Bot',    v10: 'Corporate BEC',
  v11: 'Romance Swarm',        v12: 'Quishing',
  v13: 'Damage Gen',           v14: 'Dispute Arbitrage',
  v15: 'Merchant Bust-Out',    v16: 'Mule Poisoning',
}

const SURFACE_BY_VECTOR: Record<string, { label: string; color: string }> = {
  v01: { label: 'Protocol', color: 'text-cyan-400' },
  v02: { label: 'Protocol', color: 'text-cyan-400' },
  v03: { label: 'Protocol', color: 'text-cyan-400' },
  v04: { label: 'Protocol', color: 'text-cyan-400' },
  v05: { label: 'Endpoint', color: 'text-violet-400' },
  v06: { label: 'Endpoint', color: 'text-violet-400' },
  v07: { label: 'Endpoint', color: 'text-violet-400' },
  v08: { label: 'Endpoint', color: 'text-violet-400' },
  v09: { label: 'Human',    color: 'text-amber-400' },
  v10: { label: 'Human',    color: 'text-amber-400' },
  v11: { label: 'Human',    color: 'text-amber-400' },
  v12: { label: 'Human',    color: 'text-amber-400' },
  v13: { label: 'Post-Purch', color: 'text-rose-400' },
  v14: { label: 'Post-Purch', color: 'text-rose-400' },
  v15: { label: 'Post-Purch', color: 'text-rose-400' },
  v16: { label: 'Post-Purch', color: 'text-rose-400' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShapEntry { name: string; value: number }

interface VectorResult {
  vector_id: string
  payload_format: string
  is_fraud: boolean
  confidence: number
  model_used: string
  shap_values: Record<string, number>
  latency_ms: number
  explanation: string
}

interface BatchStats {
  total: number
  detected: number
  evasion_rate: number
  avg_confidence: number
  avg_latency_ms: number
  aggregate_shap: Record<string, number>
  results: VectorResult[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _counter = 0
function mkLine(type: TerminalLine['type'], text: string): TerminalLine {
  return { id: `def-${_counter++}`, type, text }
}

function shapColor(value: number): string {
  if (value > 1.2) return '#f87171'
  if (value > 0.6) return '#fbbf24'
  return '#22d3ee'
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipEntry { value: number; payload: ShapEntry }

function ShapTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
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
  label, value, sub, valueClass, borderClass,
}: { label: string; value: string; sub: string; valueClass: string; borderClass: string }) {
  return (
    <div className={`bg-panel border ${borderClass} rounded-sm px-4 py-3`}>
      <div className={`text-xl font-bold font-mono ${valueClass}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
      <div className="text-[10px] text-slate-700 mt-0.5">{sub}</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const INIT_LINES: TerminalLine[] = [
  mkLine('system', 'Blue-team defense stack — ONLINE'),
  mkLine('info',   'Layers: DeBERTa-v3-base · XGBoost · GraphSAGE · CNN'),
  mkLine('info',   'Press "Analyze All 16 Threats" to run the full batch.'),
]

export default function DefenderDashboard() {
  const [shapData,        setShapData]        = useState<ShapEntry[]>([])
  const [allResults,      setAllResults]      = useState<VectorResult[]>([])
  const [stats,           setStats]           = useState<BatchStats | null>(null)
  const [lines,           setLines]           = useState<TerminalLine[]>(INIT_LINES)
  const [isRunning,       setIsRunning]       = useState(false)
  const [selectedVecId,   setSelectedVecId]   = useState<string | null>(null)

  const append = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line])
  }, [])

  async function handleAnalyzeBatch() {
    if (isRunning) return
    setIsRunning(true)
    setAllResults([])
    setShapData([])
    setStats(null)
    append(mkLine('cmd', 'analyze_batch — all 16 attack vectors'))

    try {
      const API = process.env.NEXT_PUBLIC_API_URL!;
      const res = await fetch(`${API}/api/defender/analyze_batch`, {method: "POST",});
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: BatchStats = await res.json()

      setAllResults(data.results)
      setStats(data)
      setSelectedVecId(null)

      const sortedShap: ShapEntry[] = Object.entries(data.aggregate_shap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))
      setShapData(sortedShap)

      append(mkLine('system',
        `━━ ${data.total} vectors · ${data.detected} DETECTED · ${data.total - data.detected} EVADED ━━`))
      append(mkLine('info',
        `avg confidence: ${(data.avg_confidence * 100).toFixed(1)}% · avg latency: ${data.avg_latency_ms.toFixed(0)}ms`))

      data.results.forEach((r) => {
        const pct = (r.confidence * 100).toFixed(0)
        append(mkLine(
          r.is_fraud ? 'error' : 'success',
          `${r.is_fraud ? '✗' : '✓'} ${r.vector_id.toUpperCase()} · ${r.model_used} · ${pct}% · ${r.latency_ms.toFixed(0)}ms`,
        ))
      })
    } catch {
      append(mkLine('error', 'Backend unreachable — start: uvicorn app.main:app --reload'))
    } finally {
      setIsRunning(false)
    }
  }

  // ── Row click: switch SHAP chart to selected vector ──────────────────────────
  function handleSelectVector(r: VectorResult) {
    if (selectedVecId === r.vector_id) {
      // Second click → deselect, go back to aggregate
      setSelectedVecId(null)
      if (stats) {
        const sortedShap: ShapEntry[] = Object.entries(stats.aggregate_shap)
          .sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }))
        setShapData(sortedShap)
      }
    } else {
      setSelectedVecId(r.vector_id)
      const sorted: ShapEntry[] = Object.entries(r.shap_values)
        .sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
      setShapData(sorted)
    }
  }

  // ── Derived stat tile values ────────────────────────────────────────────────
  const detectionPct = stats ? `${stats.detected}/${stats.total}` : '—'
  const detectionSub = stats ? `${(stats.detected / stats.total * 100).toFixed(0)}% detection rate` : 'awaiting batch'
  const avgConfLabel  = stats ? `${(stats.avg_confidence * 100).toFixed(1)}%`  : '≥ 0.97'
  const avgLatLabel   = stats ? `${stats.avg_latency_ms.toFixed(0)}ms`         : '< 100ms'
  const evasionLabel  = stats ? `${(stats.evasion_rate * 100).toFixed(1)}%`    : '—'

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">

      {/* Header */}
      <div className="flex items-baseline justify-between shrink-0">
        <div>
          <h2 className="text-matrix text-sm font-semibold tracking-widest uppercase">
            Blue-Team Defender
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            16-vector batch analysis · SHAP explainability · tri-layer detection
          </p>
        </div>
        <span className="text-xs text-matrix border border-matrix/30 bg-matrix/5 px-2 py-1 rounded">
          ONLINE
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <StatTile
          label="Detected"
          value={detectionPct}
          sub={detectionSub}
          valueClass={stats && stats.detected === stats.total ? 'text-matrix' : 'text-rose-400'}
          borderClass={stats && stats.detected === stats.total ? 'border-matrix/30' : 'border-rose-500/30'}
        />
        <StatTile
          label="Evasion Rate"
          value={evasionLabel}
          sub={stats ? 'threats that bypassed' : 'target: 0%'}
          valueClass={stats && stats.evasion_rate === 0 ? 'text-matrix' : 'text-amber-400'}
          borderClass="border-amber-500/30"
        />
        <StatTile
          label="Avg Confidence"
          value={avgConfLabel}
          sub={stats ? 'across all vectors' : 'target SLA'}
          valueClass="text-matrix"
          borderClass="border-matrix/30"
        />
        <StatTile
          label="Avg Latency"
          value={avgLatLabel}
          sub={stats ? 'p99 inference' : 'SLA ceiling'}
          valueClass="text-cyan-400"
          borderClass="border-cyan-500/30"
        />
      </div>

      {/* Middle: SHAP + terminal */}
      <div className="flex gap-4 shrink-0" style={{ height: '220px' }}>

        {/* Aggregate SHAP chart */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase flex items-center gap-2">
            {selectedVecId
              ? <><span className="text-matrix">{selectedVecId.toUpperCase()}</span><span>— SHAP feature importance</span><span className="text-slate-700">(click row again to deselect)</span></>
              : <span>SHAP Feature Importance — aggregate across all 16 vectors</span>
            }
          </div>
          <div className="flex-1 bg-panel border border-border rounded-sm overflow-hidden">
            {shapData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <div className="text-slate-700 text-3xl font-mono">≋</div>
                <p className="text-slate-600 text-xs">
                  {isRunning ? 'Running 16-vector batch...' : 'Run batch to populate SHAP chart'}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shapData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A38" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace' }}
                    stroke="#1E2A38"
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={180}
                    tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                    stroke="#1E2A38"
                    tickFormatter={(v: string) => v.length > 22 ? `${v.slice(0, 20)}…` : v}
                  />
                  <Tooltip content={<ShapTooltip />} cursor={{ fill: '#1E2A38', fillOpacity: 0.5 }} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={14}>
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
        <div className="w-72 flex flex-col gap-1 shrink-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">Alert Log</div>
          <Terminal title="defender.log" lines={lines} className="flex-1" />
        </div>
      </div>

      {/* Results grid */}
      <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden">
        <div className="text-[10px] text-slate-600 tracking-widest uppercase shrink-0 flex items-center gap-2">
          <span>Threat Results — {allResults.length > 0 ? `${allResults.length} vectors analyzed` : 'awaiting batch run'}</span>
          {allResults.length > 0 && <span className="text-slate-700">· click any row to inspect SHAP</span>}
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 border border-border rounded-sm">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-[#080d12] z-10">
              <tr className="border-b border-border">
                {['Vector', 'Surface', 'Model', 'Confidence', 'Verdict', 'Latency', 'Top Feature'].map(h => (
                  <th key={h} className="px-3 py-2 text-[10px] text-slate-600 tracking-widest uppercase font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-slate-700 text-xs text-center">
                    {isRunning ? 'Analyzing 16 vectors...' : 'No results yet — press Analyze All 16 Threats'}
                  </td>
                </tr>
              ) : (
                allResults.map((r) => {
                  const surf = SURFACE_BY_VECTOR[r.vector_id]
                  const topFeat = Object.entries(r.shap_values).sort((a, b) => b[1] - a[1])[0]
                  return (
                    <tr
                      key={r.vector_id}
                      onClick={() => handleSelectVector(r)}
                      className={[
                        'border-b border-border/40 cursor-pointer transition-colors',
                        selectedVecId === r.vector_id
                          ? 'bg-matrix/10 border-matrix/30'
                          : 'hover:bg-matrix/5',
                      ].join(' ')}
                    >
                      <td className="px-3 py-1.5 font-mono text-matrix font-semibold">
                        {r.vector_id.toUpperCase()}
                        <span className="text-slate-600 font-normal ml-1.5 text-[10px]">
                          {VECTOR_NAMES[r.vector_id]}
                        </span>
                      </td>
                      <td className={`px-3 py-1.5 text-[10px] font-mono ${surf?.color ?? 'text-slate-400'}`}>
                        {surf?.label ?? '—'}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-slate-400 text-[10px]">
                        {r.model_used}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-matrix">
                        {(r.confidence * 100).toFixed(1)}%
                      </td>
                      <td className={`px-3 py-1.5 font-semibold ${r.is_fraud ? 'text-rose-400' : 'text-matrix'}`}>
                        {r.is_fraud ? 'FRAUD' : 'CLEAN'}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-slate-400">
                        {r.latency_ms.toFixed(0)}ms
                      </td>
                      <td className="px-3 py-1.5 font-mono text-slate-500 text-[10px] max-w-[160px] truncate">
                        {topFeat ? `${topFeat[0]}=+${topFeat[1].toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analyze button */}
      <div className="shrink-0">
        <button
          onClick={handleAnalyzeBatch}
          disabled={isRunning}
          className="w-full py-2 text-xs font-semibold tracking-widest uppercase rounded-sm border transition-colors
            disabled:border-border disabled:text-slate-700 disabled:cursor-not-allowed
            enabled:border-matrix/50 enabled:text-matrix enabled:bg-matrix/5
            enabled:hover:bg-matrix/15 enabled:hover:border-matrix"
        >
          {isRunning
            ? '⠸ Analyzing 16 vectors...'
            : '▶  Analyze All 16 Threats'}
        </button>
      </div>

    </div>
  )
}
