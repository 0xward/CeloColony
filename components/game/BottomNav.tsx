'use client'
import { useGameStore } from '@/store/gameStore'

interface Props {
  activeTab: string
  onTab:     (t: string) => void
}

const TABS = [
  { id: 'colony',   icon: '🏙️', label: 'Colony'   },
  { id: 'manage',   icon: '⚙️', label: 'Manage'   },
  { id: 'explore',  icon: '🔭', label: 'Explore'  },
  { id: 'market',   icon: '📈', label: 'Market'   },
  { id: 'profile',  icon: '👤', label: 'Profile'  },
]

export default function BottomNav({ activeTab, onTab }: Props) {
  const { buildings, activeEvent } = useGameStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center border-t"
      style={{ background: 'var(--panel)', borderColor: 'var(--border)', height: 56, backdropFilter: 'blur(20px)' }}>
      {TABS.map((t) => {
        const active = activeTab === t.id
        const badge  = t.id === 'explore' && activeEvent && !activeEvent.responded ? 1 : 0
        return (
          <button key={t.id} onClick={() => onTab(t.id)}
            className="flex-1 flex flex-col items-center justify-center h-full gap-0.5 relative transition-colors"
            style={{ color: active ? 'var(--green)' : 'var(--text2)' }}>
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="text-xs" style={{ fontFamily: 'var(--font-title)', fontSize: 9, letterSpacing: '0.05em' }}>
              {t.label.toUpperCase()}
            </span>
            {badge > 0 && (
              <span className="absolute top-2 right-1/4 w-4 h-4 rounded-full text-xs flex items-center justify-center"
                style={{ background: '#EF4444', color: '#fff', fontSize: 9 }}>
                {badge}
              </span>
            )}
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: 'var(--green)' }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
