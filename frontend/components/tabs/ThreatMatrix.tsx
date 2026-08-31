'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Types & Data ──────────────────────────────────────────────────────────────

interface Vector {
  id: string
  name: string
  target: string
  description: string
  severity: number
  model: string
  format: string
}

interface SurfaceDef {
  id: string
  label: string
  sub: string
  accentHex: string
  vectors: Vector[]
}

const SURFACES: SurfaceDef[] = [
  {
    id: '01', label: 'Protocol & Rail', sub: 'ISO 8583 · ISO 20022 · Sockets',
    accentHex: '#10B981',
    vectors: [
      { id: 'v01', name: 'ISO 20022 Prompt Injection', target: '<RmtInf><Ustrd>', description: 'Embeds adversarial instructions inside ISO 20022 payment message fields to hijack downstream AI processing pipelines.', severity: 9, model: 'DeBERTa-v3-base', format: 'ISO 20022 XML' },
      { id: 'v02', name: 'ISO 8583 RL Socket Fuzzing', target: 'DE 4, DE 22', description: 'Reinforcement learning agent generates edge-case ISO 8583 field values to exploit payment message parser vulnerabilities.', severity: 7, model: 'XGBoost', format: 'ISO 8583 Hex' },
      { id: 'v03', name: 'ISO 8583 Ghost Logging', target: 'MTI 0100 Socket', description: 'Crafts transactions that pass through payment processing without triggering audit log entries, creating invisible fraud paths.', severity: 6, model: 'XGBoost', format: 'ISO 8583 Hex' },
      { id: 'v04', name: 'Cross-Merchant IDOR Void', target: 'MTI 0400 / DE 37 RRN', description: 'Exploits insecure direct object references in void requests to reverse competitor merchant transactions via RRN collision.', severity: 8, model: 'XGBoost', format: 'ISO 8583 Hex' },
    ],
  },
  {
    id: '02', label: 'Endpoint & Auth', sub: 'Gateways · 3DS ACS · Biometrics',
    accentHex: '#22D3EE',
    vectors: [
      { id: 'v05', name: 'Synthetic Device Telemetry', target: 'Canvas / WebGL / IP', description: 'Generates statistically authentic device fingerprints including canvas hash, WebGL renderer, and IP reputation to bypass bot detection.', severity: 7, model: 'XGBoost', format: 'JSON' },
      { id: 'v06', name: 'Behavioral Micro-Mimicry', target: 'Biometric Cadence', description: 'Clones keystroke dynamics and mouse movement patterns from legitimate sessions to defeat behavioral biometric authentication systems.', severity: 8, model: 'XGBoost', format: 'JSON' },
      { id: 'v07', name: 'Deepfake Camera Injection', target: 'Mobile OS Camera API', description: 'Injects AI-generated face video stream into the camera API to defeat liveness detection during real-time KYC verification.', severity: 9, model: 'PyTorch CNN', format: 'JSON' },
      { id: 'v08', name: 'AP2 Agent DOM Hijack', target: 'Shopping Agent Prompt', description: 'Embeds adversarial prompt injection in merchant web pages to silently redirect AI-driven shopping agents to attacker accounts.', severity: 8, model: 'DeBERTa-v3-base', format: 'Text' },
    ],
  },
  {
    id: '03', label: 'Human & Social', sub: 'Vishing · BEC · Swarms',
    accentHex: '#F59E0B',
    vectors: [
      { id: 'v09', name: 'Real-Time Vishing / OTP Bot', target: 'SMS OTP / 3DS', description: 'AI voice agent calls victims in real-time, impersonating bank staff and intercepting one-time passwords during live 3DS challenges.', severity: 9, model: 'DeBERTa-v3-base', format: 'Text' },
      { id: 'v10', name: 'Autonomous Corporate BEC', target: 'ISO 20022 Invoices', description: 'LLM-driven agent conducts multi-turn spear-phishing email chains targeting finance teams, culminating in fraudulent wire transfers.', severity: 9, model: 'DeBERTa-v3-base', format: 'Text' },
      { id: 'v11', name: 'APP Romance / Investment Swarm', target: 'Real-Time Payments', description: 'Coordinated swarm of AI personas executing Authorised Push Payment fraud across multiple victims simultaneously at machine scale.', severity: 8, model: 'GraphSAGE', format: 'JSON' },
      { id: 'v12', name: 'Social Support Quishing', target: 'Public Support Threads', description: 'Deploys AI-generated QR code phishing replies in social media support threads, impersonating payment brand customer service.', severity: 7, model: 'PyTorch CNN', format: 'JSON' },
    ],
  },
  {
    id: '04', label: 'Post-Purchase & Dispute', sub: 'Refund Abuse · Bust-Outs',
    accentHex: '#F87171',
    vectors: [
      { id: 'v13', name: 'Photorealistic Damage Gen', target: 'Merchant Refund Portal', description: 'Diffusion model generates photorealistic product damage imagery at scale to fraudulently claim merchant chargebacks and refunds.', severity: 7, model: 'PyTorch CNN', format: 'JSON' },
      { id: 'v14', name: 'Autonomous Dispute Arbitrage', target: 'Acquirer Dispute System', description: 'AI agent files, iterates, and re-files chargeback disputes, automatically discovering and exploiting procedural arbitration loopholes.', severity: 8, model: 'XGBoost', format: 'JSON' },
      { id: 'v15', name: 'Synthetic Merchant Bust-Out', target: 'Acquirer Accounts', description: 'LLM-operated synthetic merchant personas build months of legitimate transaction history before executing coordinated bust-out fraud.', severity: 9, model: 'XGBoost', format: 'JSON' },
      { id: 'v16', name: 'GNN Graph Mule Poisoning', target: 'Network Graph Embeddings', description: 'Adversarially engineers money-mule network topology using gradient-based graph perturbations to evade GraphSAGE fraud ring detection.', severity: 10, model: 'GraphSAGE', format: 'JSON' },
    ],
  },
]

// ─── Canvas layout constants ───────────────────────────────────────────────────

const CANVAS_W = 1800
const CANVAS_H = 1000
const CENTER: [number, number] = [900, 500]

// Surface hub card centers
const S_CTR: [number, number][] = [
  [350, 250],
  [1450, 250],
  [350, 750],
  [1450, 750],
]

// Vector chip centers (4 per surface)
const V_CTR: [number, number][][] = [
  [[165, 90],  [535, 90],  [165, 410],  [535, 410]],
  [[1265, 90], [1635, 90], [1265, 410], [1635, 410]],
  [[165, 580], [535, 580], [165, 900],  [535, 900]],
  [[1265, 580],[1635, 580],[1265, 900], [1635, 900]],
]

const HUB_W = 210
const HUB_H = 100
const VEC_W = 200
const VEC_H = 108

// ─── Severity helpers ──────────────────────────────────────────────────────────

function sevColor(s: number): string {
  if (s >= 10) return '#EF4444'
  if (s >= 9)  return '#F97316'
  if (s >= 8)  return '#F59E0B'
  if (s >= 7)  return '#EAB308'
  return '#84CC16'
}

function sevLabel(s: number): string {
  if (s >= 9)  return 'CRITICAL'
  if (s >= 7)  return 'HIGH'
  return 'MEDIUM'
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Transform { zoom: number; x: number; y: number }

export default function ThreatMatrix() {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<Transform>({ zoom: 0.5, x: 0, y: 0 })
  const [transform, _setTransform] = useState<Transform>({ zoom: 0.5, x: 0, y: 0 })
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selected, setSelected] = useState<{ vector: Vector; surface: SurfaceDef } | null>(null)

  const setTransform = (t: Transform | ((prev: Transform) => Transform)) => {
    const next = typeof t === 'function' ? t(transformRef.current) : t
    transformRef.current = next
    _setTransform(next)
  }

  // Auto-fit on mount
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const zoom = Math.min(width / CANVAS_W, height / CANVAS_H) * 0.92
    const x = (width - CANVAS_W * zoom) / 2
    const y = (height - CANVAS_H * zoom) / 2
    setTransform({ zoom, x, y })
  }, [])

  // Wheel zoom toward cursor — must be non-passive to preventDefault
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const t = transformRef.current
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      const next = Math.min(2.5, Math.max(0.2, t.zoom * factor))
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      setTransform({
        zoom: next,
        x: cx - (cx - t.x) * (next / t.zoom),
        y: cy - (cy - t.y) * (next / t.zoom),
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const t = transformRef.current
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: t.x, py: t.y }
    setIsDragging(true)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return
    const d = dragRef.current
    setTransform(prev => ({
      ...prev,
      x: d.px + (e.clientX - d.sx),
      y: d.py + (e.clientY - d.sy),
    }))
  }

  const onMouseUp = () => {
    dragRef.current = null
    setIsDragging(false)
  }

  const resetView = () => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const zoom = Math.min(width / CANVAS_W, height / CANVAS_H) * 0.92
    setTransform({ zoom, x: (width - CANVAS_W * zoom) / 2, y: (height - CANVAS_H * zoom) / 2 })
  }

  const { zoom, x: panX, y: panY } = transform

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Canvas ──────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab', background: '#090A0F' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Dot-grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <pattern id="grid-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#1E2A38" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-dots)" />
        </svg>

        {/* ── Transform layer ─────────────────────────────────────────────── */}
        <div
          className="absolute top-0 left-0"
          style={{ width: CANVAS_W, height: CANVAS_H, transform: `translate(${panX}px,${panY}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          {/* SVG: connection lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ overflow: 'visible' }}
          >
            {/* Center → surface hub */}
            {SURFACES.map((surf, si) => (
              <line
                key={`cs${si}`}
                x1={CENTER[0]} y1={CENTER[1]}
                x2={S_CTR[si][0]} y2={S_CTR[si][1]}
                stroke={surf.accentHex} strokeOpacity={0.22} strokeWidth={1.5} strokeDasharray="8 5"
              />
            ))}
            {/* Surface hub → vector chips */}
            {SURFACES.map((surf, si) =>
              surf.vectors.map((_, vi) => (
                <line
                  key={`sv${si}-${vi}`}
                  x1={S_CTR[si][0]} y1={S_CTR[si][1]}
                  x2={V_CTR[si][vi][0]} y2={V_CTR[si][vi][1]}
                  stroke={surf.accentHex} strokeOpacity={0.15} strokeWidth={1} strokeDasharray="4 4"
                />
              ))
            )}
            {/* Glow circles at surface hubs */}
            {SURFACES.map((surf, si) => (
              <circle key={`halo${si}`} cx={S_CTR[si][0]} cy={S_CTR[si][1]} r={72}
                fill="none" stroke={surf.accentHex} strokeOpacity={0.06} strokeWidth={1} />
            ))}
          </svg>

          {/* Center node */}
          <div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{ left: CENTER[0] - 70, top: CENTER[1] - 70, width: 140, height: 140 }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-28 h-28 rounded-full border border-matrix/10" style={{ animation: 'ping 3s cubic-bezier(0,0,0.2,1) infinite' }} />
              <div className="absolute w-20 h-20 rounded-full border border-matrix/15" />
              <div className="w-14 h-14 rounded-full border border-matrix/35 bg-matrix/5 flex flex-col items-center justify-center">
                <span className="text-matrix text-sm font-bold leading-none">16</span>
                <span className="text-matrix/60 text-[8px] tracking-widest leading-none mt-0.5">VEC</span>
              </div>
            </div>
          </div>

          {/* Surface hubs + vector chips */}
          {SURFACES.map((surf, si) => (
            <div key={surf.id}>

              {/* Surface hub card */}
              <div
                className="absolute rounded-sm bg-panel flex flex-col justify-center pointer-events-none"
                style={{
                  left: S_CTR[si][0] - HUB_W / 2,
                  top: S_CTR[si][1] - HUB_H / 2,
                  width: HUB_W,
                  height: HUB_H,
                  border: `1px solid ${surf.accentHex}55`,
                  boxShadow: `0 0 20px ${surf.accentHex}12`,
                  padding: '10px 14px',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm border tracking-widest shrink-0"
                    style={{ color: surf.accentHex, borderColor: `${surf.accentHex}55`, background: `${surf.accentHex}14` }}
                  >
                    S{surf.id}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200 leading-tight">{surf.label}</span>
                </div>
                <div className="text-[9px] text-slate-600 leading-none">{surf.sub}</div>
              </div>

              {/* Vector chips */}
              {surf.vectors.map((vec, vi) => {
                const isSelected = selected?.vector.id === vec.id
                const sc = sevColor(vec.severity)
                return (
                  <div
                    key={vec.id}
                    className="absolute rounded-sm bg-panel transition-all"
                    style={{
                      left: V_CTR[si][vi][0] - VEC_W / 2,
                      top: V_CTR[si][vi][1] - VEC_H / 2,
                      width: VEC_W,
                      height: VEC_H,
                      border: isSelected ? `1px solid ${sc}` : `1px solid #1E2A38`,
                      boxShadow: isSelected ? `0 0 14px ${sc}44` : 'none',
                      cursor: 'pointer',
                      padding: '9px 11px',
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelected({ vector: vec, surface: surf }) }}
                  >
                    {/* Severity accent stripe */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-sm" style={{ background: sc, opacity: 0.7 }} />

                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] text-slate-700 font-mono">{vec.id.toUpperCase()}</span>
                      <span
                        className="text-[8px] font-bold px-1 py-0.5 rounded-sm"
                        style={{ color: sc, background: `${sc}18`, border: `1px solid ${sc}44` }}
                      >
                        {sevLabel(vec.severity)}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-300 font-medium leading-tight line-clamp-2 mb-2">
                      {vec.name}
                    </div>

                    <div className="text-[9px] text-slate-600 truncate">{vec.target}</div>
                  </div>
                )
              })}

            </div>
          ))}
        </div>

        {/* ── Overlays ────────────────────────────────────────────────────────── */}

        {/* Severity legend */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-3 bg-panel/90 border border-border px-3 py-2 rounded-sm backdrop-blur-sm">
          <span className="text-[9px] text-slate-600 tracking-widest uppercase">Severity</span>
          <span className="text-slate-800">|</span>
          {([['CRITICAL', '#F97316'], ['HIGH', '#F59E0B'], ['MEDIUM', '#84CC16']] as [string, string][]).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[9px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Vector / surface count */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-panel/90 border border-border px-3 py-2 rounded-sm backdrop-blur-sm">
          <span className="text-[10px] text-slate-600">4 SURFACES</span>
          <span className="text-slate-700">·</span>
          <span className="text-[10px] text-matrix font-semibold">16 VECTORS</span>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
          {([
            ['+', () => setTransform(t => ({ ...t, zoom: Math.min(2.5, t.zoom * 1.2) }))],
            ['−', () => setTransform(t => ({ ...t, zoom: Math.max(0.2, t.zoom * 0.8) }))],
            ['⊙', resetView],
          ] as [string, () => void][]).map(([label, fn]) => (
            <button
              key={label}
              className="w-7 h-7 bg-panel border border-border text-slate-400 hover:text-matrix hover:border-matrix/40 flex items-center justify-center rounded-sm transition-colors text-sm font-mono"
              onClick={fn}
            >{label}</button>
          ))}
        </div>

        {/* Zoom level */}
        <div className="absolute bottom-3 left-3 z-10 text-[10px] text-slate-700 font-mono">
          {Math.round(zoom * 100)}%
        </div>

        {/* Hint */}
        {!selected && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[9px] text-slate-700 font-mono tracking-widest pointer-events-none">
            SCROLL TO ZOOM · DRAG TO PAN · CLICK VECTOR TO INSPECT
          </div>
        )}
      </div>

      {/* ── Detail drawer ───────────────────────────────────────────────────── */}
      {selected && (
        <div className="w-80 shrink-0 bg-panel border-l border-border flex flex-col overflow-hidden">

          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm border"
                style={{
                  color: selected.surface.accentHex,
                  borderColor: `${selected.surface.accentHex}55`,
                  background: `${selected.surface.accentHex}14`,
                }}
              >
                {selected.vector.id.toUpperCase()}
              </span>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest">Vector Detail</span>
            </div>
            <button
              className="text-slate-600 hover:text-slate-200 text-lg leading-none px-1 transition-colors"
              onClick={() => setSelected(null)}
            >×</button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">

            <div>
              <Label>Attack Name</Label>
              <div className="text-sm text-slate-100 font-semibold leading-snug">{selected.vector.name}</div>
            </div>

            <div>
              <Label>Surface</Label>
              <div className="text-xs font-mono" style={{ color: selected.surface.accentHex }}>
                S{selected.surface.id} — {selected.surface.label}
              </div>
            </div>

            <div>
              <Label>Target</Label>
              <code className="text-xs text-slate-300 bg-surface border border-border rounded-sm px-2.5 py-1.5 block font-mono">
                {selected.vector.target}
              </code>
            </div>

            <div>
              <Label>Severity</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${selected.vector.severity * 10}%`, background: sevColor(selected.vector.severity) }}
                  />
                </div>
                <span className="text-xs font-bold font-mono shrink-0" style={{ color: sevColor(selected.vector.severity) }}>
                  {selected.vector.severity}/10
                </span>
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm shrink-0"
                  style={{
                    color: sevColor(selected.vector.severity),
                    background: `${sevColor(selected.vector.severity)}18`,
                    border: `1px solid ${sevColor(selected.vector.severity)}44`,
                  }}
                >
                  {sevLabel(selected.vector.severity)}
                </span>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <p className="text-xs text-slate-400 leading-relaxed">{selected.vector.description}</p>
            </div>

            <div>
              <Label>Detection Model</Label>
              <div className="text-xs text-cyan-400 font-mono">{selected.vector.model}</div>
            </div>

            <div>
              <Label>Payload Format</Label>
              <div className="text-xs text-matrix font-mono">{selected.vector.format}</div>
            </div>

          </div>

          {/* Drawer footer */}
          <div className="px-4 py-3 border-t border-border shrink-0">
            <div className="text-[9px] text-slate-700 text-center tracking-widest uppercase">
              {SURFACES.flatMap(s => s.vectors).findIndex(v => v.id === selected.vector.id) + 1} / 16 vectors
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">{children}</div>
  )
}
