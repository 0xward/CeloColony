import { type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary:   'bg-celo text-black font-bold hover:bg-celo/90 active:scale-95',
  secondary: 'border border-[var(--border)] text-[var(--text)] hover:border-[var(--green)] hover:text-[var(--green)]',
  danger:    'bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20',
  ghost:     'text-[var(--text2)] hover:text-[var(--text)]',
}
const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2   text-sm rounded-lg',
  lg: 'px-6 py-3   text-base rounded-xl',
}

export default function Button({
  variant = 'primary', size = 'md', loading, children, className, disabled, ...rest
}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 transition-all font-mono cursor-pointer select-none',
        variants[variant], sizes[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="tx-spinner" style={{ width: 14, height: 14 }} />}
      {children}
    </button>
  )
}
