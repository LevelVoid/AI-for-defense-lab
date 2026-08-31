'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import Terminal from '@/components/Terminal'
import type { TerminalLine } from '@/components/Terminal'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EpochRow {
  epoch:      number
  evasion:    number  // 0–1 fraction from backend
  auc:        number
  fpr:        number
  detection:  number
  newSamples: number
}

interface ChartPoint {
  epoch:    number
  evasion:  number  // percentage (0–100)
  auc:      number
}

// ─── Constants ───────────────────────────────────────────────────────────────

function epochLabel(epoch: number): string {
  if (epoch === 1) return 'Baseline — initial model deployment'
  if (epoch === 2) return 'Red-team adapts; evasion spike detected'
  if (epoch === 3) return 'Blue-team retrain triggered on new samples'
  if (epoch === 4) return 'Evasion rate collapses post-retrain'
  if (epoch === 5) return 'System hardened — new equilibrium'
  if (epoch <= 8)  return `Continued hardening — evasion converging`
  return `Deep equilibrium — system stabilized`
}

const STEP_LABELS: Record<string, string> = {
  generating: 'Red-team synthesizing payloads — 16 vectors × 3 samples (48 total)',
  evading:    'Evasion test: probing classifier decision boundary',
  detecting:  'Blue-team classifying 48-sample batch',
  retraining: 'Blue-team retrain triggered — absorbing evaded samples',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _ctr = 0
function mkLine(type: TerminalLine['type'], text: string): TerminalLine {
  return { id: `coe-${_ctr++}`, type, text }
}

const INIT_LINES: TerminalLine[] = [
  mkLine('system', 'Co-evolution engine — ONLINE'),
  mkLine('info',   'Red-team: adversarial payload synthesis ready'),
  mkLine('info',   'Blue-team: retrain scheduler on standby'),
  mkLine('info',   'Press "Run Loop" to start 5-epoch simulation.'),
]

// ─── Tooltips ────────────────────────────────────────────────────────────────

interface RechartsTTProps {
  active?:  boolean
  payload?: Array<{ value: number; color: string; name: string }>
  label?:   number
  unit?:    string
}

function MiniTooltip({ active, payload, label, unit = '' }: RechartsTTProps) {
  if (!active || !payload?.length) return null
  const { value, color } = payload[0]
  return (
    <div className="bg-panel border border-border text-xs px-2 py-1.5 rounded-sm shadow-lg font-mono">
      <span className="text-slate-500">E{label}  </span>
      <span style={{ color }}>{typeof value === 'number' ? value.toFixed(3) : value}{unit}</span>
    </div>
  )
}

// ─── Mini chart ───────────────────────────────────────────────────────────────

function MiniChart({
  title, data, dataKey, color, domain, refY, unit, tickFmt,
}: {
  title:   string
  data:    ChartPoint[]
  dataKey: keyof ChartPoint
  color:   string
  domain:  [number, number]
  refY:    number
  unit:    string
  tickFmt: (v: number) => string
}) {
  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className="text-[10px] tracking-widest uppercase shrink-0" style={{ color }}>
        {title}
      </div>
      <div className="flex-1 bg-panel border border-border rounded-sm overflow-hidden min-h-0">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-slate-700 text-xs font-mono">awaiting epochs</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A38" />
              <XAxis
                dataKey="epoch"
                tickFormatter={(v) => `E${v}`}
                tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }}
                stroke="#1E2A38"
              />
              <YAxis
                domain={domain}
                tickFormatter={tickFmt}
                tick={{ fontSize: 10, fill: '#475569', fontFamily: 'monospace' }}
                stroke="#1E2A38"
                width={36}
              />
              <Tooltip content={<MiniTooltip unit={unit} />} />
              <ReferenceLine
                y={refY}
                stroke={color}
                strokeDasharray="4 4"
                strokeOpacity={0.35}
              />
              <Line
                dataKey={dataKey as string}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CoEvolutionLoop() {
  const [epochs,      setEpochs]      = useState<EpochRow[]>([])
  const [lines,       setLines]       = useState<TerminalLine[]>(INIT_LINES)
  const [isRunning,   setIsRunning]   = useState(false)
  const [phase,       setPhase]       = useState<string | null>(null)
  const [epochCount,  setEpochCount]  = useState(5)
  const [customInput, setCustomInput] = useState('')

  const wsRef          = useRef<WebSocket | null>(null)
  const epochQueueRef  = useRef<number[]>([])
  const onMsgRef       = useRef<(data: string) => void>(() => {})
  const clientId       = useRef(`coevo-${Math.random().toString(36).slice(2, 9)}`)
  const isRunningRef   = useRef(false)

  // Keep isRunningRef in sync so stable WS callbacks can read it
  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])

  const append = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line])
  }, [])

  const sendNextEpoch = useCallback(() => {
    const queue = epochQueueRef.current
    if (!queue.length || !wsRef.current) return
    const next = queue[0]
    setPhase(`epoch ${next}`)
    append(mkLine('cmd', `run_epoch ${next} — initiating...`))
    wsRef.current.send(JSON.stringify({ action: 'run_epoch', epoch: next }))
  }, [append])

  // Keep onMsgRef current so the stable WS handler sees latest closures
  useEffect(() => {
    onMsgRef.current = (raw: string) => {
      const msg = JSON.parse(raw) as Record<string, unknown>

      const eventType = msg.event_type as string | undefined

      // Per-vector detection result streamed during the detecting step
      if (eventType === 'vector_result') {
        const d = msg.data as { vector_id: string; model: string; conf: number; detected: boolean; samples: number }
        const confPct = (d.conf * 100).toFixed(0)
        const sampleTag = d.samples ? ` (${d.samples}×)` : ''
        append(mkLine(
          d.detected ? 'info' : 'error',
          `  ${d.detected ? '✓' : '✗'} ${d.vector_id.toUpperCase()} · ${d.model} · conf=${confPct}%${sampleTag} · ${d.detected ? 'DETECTED' : 'EVADED'}`,
        ))
        return
      }

      if (eventType && STEP_LABELS[eventType]) {
        setPhase(`${eventType} (epoch ${msg.epoch})`)
        const evasionPct =
          typeof (msg.data as Record<string, number>)?.evasion_rate === 'number'
            ? ` [evasion=${((msg.data as Record<string, number>).evasion_rate * 100).toFixed(1)}%]`
            : ''
        append(mkLine(
          eventType === 'retraining' ? 'warn' : 'info',
          `E${msg.epoch} · ${STEP_LABELS[eventType]}${evasionPct}`,
        ))
        return
      }

      if (msg.event === 'epoch_error') {
        append(mkLine('error', `E${msg.epoch} — backend error: ${msg.error}`))
        epochQueueRef.current = []
        setIsRunning(false)
        setPhase(null)
        return
      }

      if (msg.event === 'epoch_complete') {
        const row: EpochRow = {
          epoch:      msg.epoch      as number,
          evasion:    msg.evasion_rate as number,
          auc:        msg.auc         as number,
          fpr:        msg.false_positive_rate as number,
          detection:  msg.detection_rate as number,
          newSamples: msg.new_samples as number,
        }
        setEpochs(prev => [...prev, row])

        append(mkLine(
          row.auc >= 0.97 ? 'success' : 'warn',
          `E${row.epoch} complete — AUC ${row.auc.toFixed(3)} · evasion ${(row.evasion * 100).toFixed(1)}% · +${row.newSamples} samples`,
        ))

        epochQueueRef.current = epochQueueRef.current.slice(1)
        if (epochQueueRef.current.length > 0) {
          setTimeout(sendNextEpoch, 200)
        } else {
          setIsRunning(false)
          setPhase(null)
          append(mkLine('success', `Co-evolution loop complete — ${row.epoch} epochs run · system hardened.`))
        }
      }
    }
  })

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/stream/${clientId.current}`)
    ws.onmessage = (e) => onMsgRef.current(e.data)
    ws.onerror = () => {
      if (!isRunningRef.current) return
      epochQueueRef.current = []
      setIsRunning(false)
      setPhase(null)
      setLines(prev => [...prev, mkLine('error', 'WebSocket error — run aborted.')])
    }
    ws.onclose = () => {
      if (!isRunningRef.current) return
      epochQueueRef.current = []
      setIsRunning(false)
      setPhase(null)
      setLines(prev => [...prev, mkLine('error', 'WebSocket closed — run aborted.')])
    }
    wsRef.current = ws
    return () => ws.close()
  }, [])

  function handleRun() {
    if (isRunning) return
    setEpochs([])
    setLines(INIT_LINES)
    setIsRunning(true)
    epochQueueRef.current = Array.from({ length: epochCount }, (_, i) => i + 1)
    sendNextEpoch()
  }

  function handlePreset(n: number) {
    if (!isRunning) { setEpochCount(n); setCustomInput('') }
  }

  function handleCustomBlur() {
    const n = parseInt(customInput, 10)
    if (!isRunning && n >= 1 && n <= 50) setEpochCount(n)
    else setCustomInput('')
  }

  // ── Chart data (two separate single-series charts — no dual axis) ───────────
  const chartData: ChartPoint[] = epochs.map(e => ({
    epoch:   e.epoch,
    evasion: parseFloat((e.evasion * 100).toFixed(2)),
    auc:     e.auc,
  }))

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">

      {/* Header */}
      <div className="flex items-baseline justify-between shrink-0">
        <div>
          <h2 className="text-matrix text-sm font-semibold tracking-widest uppercase">
            Co-Evolution Loop
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Adversarial AI red/blue co-evolution — 16 vectors · real pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          {phase && (
            <span className="text-[10px] text-amber-400 font-mono animate-pulse">
              {phase}
            </span>
          )}
          <span className={`text-xs border px-2 py-1 rounded ${
            isRunning
              ? 'text-amber-400 border-amber-500/30 bg-amber-500/5'
              : 'text-matrix border-matrix/30 bg-matrix/5'
          }`}>
            {isRunning ? 'RUNNING' : `${epochs.length}/${epochCount} EPOCHS`}
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Left: charts + table + button */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">

          {/* Two side-by-side single-series charts */}
          <div className="h-44 flex gap-3 shrink-0">
            <MiniChart
              title="Evasion Rate %"
              data={chartData}
              dataKey="evasion"
              color="#f87171"
              domain={[0, 50]}
              refY={30}
              unit="%"
              tickFmt={(v) => `${v}%`}
            />
            <MiniChart
              title="AUC Score"
              data={chartData}
              dataKey="auc"
              color="#22d3ee"
              domain={[0.92, 1.0]}
              refY={0.97}
              unit=""
              tickFmt={(v) => v.toFixed(2)}
            />
          </div>

          {/* Epoch table */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Epoch', 'Evasion %', 'AUC', 'FPR', 'Samples', 'Event'].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 text-[10px] text-slate-600 tracking-widest uppercase font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {epochs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-slate-700 text-xs text-center">
                      No epochs yet — press Run Loop to start
                    </td>
                  </tr>
                ) : (
                  epochs.map((ep) => {
                    const evasionPct  = ep.evasion * 100
                    const evasionHigh = evasionPct > 30
                    const aucOk       = ep.auc >= 0.97
                    const fprOk       = ep.fpr <= 0.001
                    return (
                      <tr
                        key={ep.epoch}
                        className="border-b border-border/40 hover:bg-matrix/5 transition-colors"
                      >
                        <td className="py-2 pr-4 text-matrix font-semibold">E{ep.epoch}</td>
                        <td className={`py-2 pr-4 font-mono ${evasionHigh ? 'text-red-400' : 'text-amber-400'}`}>
                          {evasionPct.toFixed(1)}%
                        </td>
                        <td className={`py-2 pr-4 font-mono ${aucOk ? 'text-matrix' : 'text-red-400'}`}>
                          {ep.auc.toFixed(3)}
                        </td>
                        <td className={`py-2 pr-4 font-mono ${fprOk ? 'text-matrix' : 'text-amber-400'}`}>
                          {(ep.fpr * 100).toFixed(3)}%
                        </td>
                        <td className="py-2 pr-4 font-mono text-slate-400">+{ep.newSamples}</td>
                        <td className="py-2 text-slate-500 text-[10px]">
                          {epochLabel(ep.epoch)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Epoch count selector */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[10px] text-slate-600 tracking-widest uppercase">Epochs</span>
            {[5, 10, 20].map(n => (
              <button
                key={n}
                onClick={() => handlePreset(n)}
                disabled={isRunning}
                className={`px-2 py-0.5 text-xs font-mono rounded-sm border transition-colors
                  disabled:cursor-not-allowed
                  ${epochCount === n && !customInput
                    ? 'border-matrix text-matrix bg-matrix/10'
                    : 'border-border text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={50}
              placeholder="N"
              value={customInput}
              disabled={isRunning}
              onChange={e => { setCustomInput(e.target.value) }}
              onBlur={handleCustomBlur}
              onKeyDown={e => { if (e.key === 'Enter') handleCustomBlur() }}
              className={`w-12 px-2 py-0.5 text-xs font-mono rounded-sm border bg-transparent text-center outline-none
                disabled:cursor-not-allowed
                ${customInput
                  ? 'border-matrix text-matrix'
                  : 'border-border text-slate-500 focus:border-slate-500'
                }`}
            />
          </div>

          {/* Run button */}
          <div className="shrink-0">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full py-1.5 px-6 text-xs font-semibold tracking-widest uppercase rounded-sm border transition-colors
                disabled:border-border disabled:text-slate-700 disabled:cursor-not-allowed
                enabled:border-matrix/50 enabled:text-matrix enabled:bg-matrix/5
                enabled:hover:bg-matrix/15 enabled:hover:border-matrix"
            >
              {isRunning ? '⠸ Running...' : `▶  Run Co-Evolution Loop (${epochCount} Epochs)`}
            </button>
          </div>
        </div>

        {/* Right: loop log */}
        <div className="w-72 flex flex-col gap-2 min-h-0 shrink-0">
          <div className="text-[10px] text-slate-600 tracking-widest uppercase">Loop Log</div>
          <Terminal title="coevolution.log" lines={lines} className="flex-1" />
        </div>
      </div>
    </div>
  )
}
