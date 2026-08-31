'use client'

import { useState } from 'react'
import TabBar, { TABS, type TabId } from '@/components/TabBar'
import ThreatMatrix from '@/components/tabs/ThreatMatrix'
import GeneratorStudio from '@/components/tabs/GeneratorStudio'
import DefenderDashboard from '@/components/tabs/DefenderDashboard'
import CoEvolutionLoop from '@/components/tabs/CoEvolutionLoop'
import type { ComponentType } from 'react'

const PANELS: Record<TabId, ComponentType> = {
  'threat-matrix':    ThreatMatrix,
  'generator-studio': GeneratorStudio,
  'defender':         DefenderDashboard,
  'coevolution':      CoEvolutionLoop,
}

export default function LabPage() {
  const [activeTab, setActiveTab] = useState<TabId>('threat-matrix')
  const Panel = PANELS[activeTab]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-3 border-b border-border bg-[#080d12] shrink-0">
        <span className="text-matrix font-semibold text-sm tracking-widest uppercase">
          ▣ AI Defense Lab
        </span>
        <span className="text-slate-700 text-xs select-none">|</span>
        <span className="text-slate-500 text-xs tracking-wide">
          Mastercard Innovation Challenge 2026
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-matrix animate-pulse" />
          <span className="text-matrix text-[10px] tracking-widest font-semibold">LIVE</span>
        </div>
      </header>

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Active tab panel */}
      <main className="flex-1 overflow-hidden">
        <Panel />
      </main>
    </div>
  )
}
