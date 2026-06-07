'use client'
import { useGameStore } from '@/store/gameStore'

export default function Toast() {
  const { toasts, removeToast } = useGameStore()
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
