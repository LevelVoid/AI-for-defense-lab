'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ai_def_lab_v1_welcomed'

const SURFACES = [
  { tag: 'S01', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5', label: 'Protocol & Rail', sub: 'ISO 8583 · ISO 20022 · Sockets', vectors: 4 },
  { tag: 'S02', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',         label: 'Endpoint & Auth', sub: 'Gateways · 3DS ACS · Biometrics', vectors: 4 },
  { tag: 'S03', color: 'text-amber-400 border-amber-500/30 bg-amber-500/5',      label: 'Human & Social',  sub: 'Vishing · BEC · Swarms', vectors: 4 },
  { tag: 'S04', color: 'text-rose-400 border-rose-500/30 bg-rose-500/5',         label: 'Post-Purchase',   sub: 'Refund Abuse · Bust-Outs', vectors: 4 },
]

const TABS = [
  {
    tag: '01', label: 'Threat Matrix',
    desc: 'Zoomable canvas of all 16 GenAI attack vectors across 4 payment surfaces. Click any vector to open its detail drawer — target, model, severity, and description.',
  },
  {
    tag: '02', label: 'Generator Studio',
    desc: 'Select a vector and fire it at scale. Scale Attack probes 50 variants of one vector watching confidence drift. Broad Sweep fires all 16 once to check surface coverage.',
  },
  {
    tag: '03', label: 'Defender Dashboard',
    desc: 'Run all 16 threats at once. The blue-team\'s tri-layer stack (DeBERTa · XGBoost · GraphSAGE · CNN) analyzes each payload. Click any result row to inspect its SHAP feature breakdown.',
  },
  {
    tag: '04', label: 'Co-Evolution Loop',
    desc: 'Watch 5 epochs of adversarial co-evolution. The red team adapts each epoch; the blue team retrains on evaded samples. Evasion rate collapses as AUC climbs toward 0.97+.',
  },
]

export default function WelcomeModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={dismiss}
    >
      <div
        className="relative bg-[#080d12] border border-border rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#080d12] border-b border-border px-8 py-5">
          <div className="flex items-center gap-3">
            <span className="text-matrix font-bold text-base tracking-widest uppercase">▣ AI Defense Lab</span>
            <span className="text-slate-700 text-xs select-none">|</span>
            <span className="text-slate-500 text-xs tracking-wide">Mastercard Innovation Challenge 2026</span>
          </div>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            An autonomous closed-loop adversarial AI framework. The red team generates payment fraud at machine scale.
            The blue team defends with real ML inference. Each evasion becomes training data — the system hardens continuously.
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Threat Matrix legend */}
          <section>
            <h3 className="text-[10px] text-slate-600 tracking-widest uppercase mb-3">
              How to read the Threat Matrix
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SURFACES.map(s => (
                <div key={s.tag} className={`border rounded-sm px-3 py-2.5 ${s.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold border border-current rounded px-1 opacity-60">{s.tag}</span>
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className="ml-auto text-[10px] opacity-60">{s.vectors} vectors</span>
                  </div>
                  <p className="text-[10px] opacity-60">{s.sub}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-600 text-[10px] mt-2 leading-relaxed">
              Each surface contains 4 attack vectors (16 total). Severity 1–10 is shown as a heat intensity.
              The target field shows exactly which protocol field, API endpoint, or interaction channel is exploited.
              Zoom and pan with mouse — click any vector node to open its detail drawer.
            </p>
          </section>

          {/* Tab guide */}
          <section>
            <h3 className="text-[10px] text-slate-600 tracking-widest uppercase mb-3">
              The four tabs
            </h3>
            <div className="space-y-2">
              {TABS.map(t => (
                <div key={t.tag} className="flex gap-3 border border-border rounded-sm px-3 py-2.5 hover:border-matrix/30 transition-colors">
                  <span className="shrink-0 text-[9px] font-bold text-matrix border border-matrix/40 rounded px-1.5 py-0.5 self-start mt-0.5">
                    {t.tag}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-0.5">{t.label}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Metrics legend */}
          <section className="border border-border/50 rounded-sm px-4 py-3 bg-matrix/3">
            <h3 className="text-[10px] text-slate-600 tracking-widest uppercase mb-2">Key metrics</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
              <div><span className="text-matrix font-mono">AUC ≥ 0.97</span><span className="text-slate-600 ml-2">target detection quality</span></div>
              <div><span className="text-cyan-400 font-mono">FPR &lt; 0.1%</span><span className="text-slate-600 ml-2">max false alarm rate</span></div>
              <div><span className="text-amber-400 font-mono">Evasion %</span><span className="text-slate-600 ml-2">attacks that bypassed detection</span></div>
              <div><span className="text-slate-300 font-mono">&lt; 100ms</span><span className="text-slate-600 ml-2">inference latency SLA</span></div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#080d12] border-t border-border px-8 py-4 flex items-center justify-between">
          <p className="text-slate-700 text-[10px]">Click anywhere outside or press the button to dismiss. This won&apos;t show again.</p>
          <button
            onClick={dismiss}
            className="px-6 py-2 text-xs font-semibold tracking-widest uppercase rounded-sm border border-matrix/50 text-matrix bg-matrix/5 hover:bg-matrix/15 hover:border-matrix transition-colors"
          >
            Start Exploring →
          </button>
        </div>
      </div>
    </div>
  )
}
