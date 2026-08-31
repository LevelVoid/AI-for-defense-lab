'use client'

export type TabId = 'threat-matrix' | 'generator-studio' | 'defender' | 'coevolution'

export interface Tab {
  id: TabId
  label: string
  tag: string
}

export const TABS: Tab[] = [
  { id: 'threat-matrix',    label: 'THREAT MATRIX',    tag: '01' },
  { id: 'generator-studio', label: 'GENERATOR STUDIO',  tag: '02' },
  { id: 'defender',         label: 'DEFENDER DASHBOARD', tag: '03' },
  { id: 'coevolution',      label: 'CO-EVOLUTION LOOP', tag: '04' },
]

interface TabBarProps {
  active: TabId
  onChange: (id: TabId) => void
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="flex border-b border-border overflow-x-auto shrink-0 bg-[#0a0f14]">
      {TABS.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'relative flex items-center gap-2.5 px-5 py-3 text-[11px] font-semibold tracking-widest',
              'border-r border-border last:border-r-0 whitespace-nowrap transition-colors focus:outline-none',
              isActive
                ? 'text-matrix bg-matrix/5'
                : 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.02]',
            ].join(' ')}
          >
            {/* Active indicator bar at bottom */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-matrix" />
            )}
            <span
              className={[
                'text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wider',
                isActive ? 'border-matrix/60 text-matrix' : 'border-slate-700 text-slate-700',
              ].join(' ')}
            >
              {tab.tag}
            </span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
