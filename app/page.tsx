export const dynamic = 'force-dynamic'
import Link           from 'next/link'
import StarCanvas      from '@/components/landing/StarCanvas'

const STATS = [
  { label: 'Colonies Built',    value: '12K+' },
  { label: 'Commanders',        value: '45K+' },
  { label: 'Buildings',         value: '3.2M+' },
  { label: 'CELO on-chain',     value: '180K+' },
]

const FEATURES = [
  { icon: '⚡', title: 'BUILD',   desc: 'Construct real Celo protocol buildings. Every structure is an on-chain transaction.' },
  { icon: '🔗', title: 'OWN',    desc: 'Buildings are NFTs. Trade, upgrade, and truly own your colony assets.' },
  { icon: '🌐', title: 'EARN',   desc: 'Colony income accumulates as claimable CELO. Active play compounds rewards.' },
  { icon: '⚔️', title: 'COMPETE', desc: 'Leaderboards, raids, alliances. The galaxy is contested — dominate it.' },
]

const PROTOCOLS = [
  'MiniPay', 'Mento', 'Ubeswap', 'GoodDollar', 'Valora', 'Opera',
]

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: '#070A0F', color: '#DFF0E8' }}>
      <StarCanvas />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--green)', color: '#000' }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: 13 }}>CC</span>
          </div>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 17, letterSpacing: '0.08em' }}>
            CELO COLONY
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://celoscan.io" target="_blank" rel="noopener noreferrer"
            className="text-sm hidden md:block" style={{ color: 'var(--text2)' }}>
            Celoscan
          </a>
          <Link href="/game"
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--green)', color: '#000', fontFamily: 'var(--font-title)' }}>
            Launch App →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[88vh] px-6 text-center gap-6">

        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs"
          style={{ borderColor: 'rgba(53,208,127,0.3)', background: 'rgba(53,208,127,0.06)', color: 'var(--green)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
          A SPACE CITY TYCOON · LIVE ON CELO MAINNET
        </div>

        {/* Headline */}
        <h1 className="landing-hero-text text-white" style={{ fontSize: 'clamp(52px, 10vw, 110px)' }}>
          BUILD.<br />
          EXPAND.<br />
          <span style={{ color: 'var(--green)', WebkitTextStroke: '1px rgba(53,208,127,0.3)' }}>PROSPER.</span>
        </h1>

        <p className="max-w-md text-base leading-relaxed" style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
          Construct your colony, power the on-chain economy, and grow the future
          of decentralized civilization — one building at a time.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/game"
            className="px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105 active:scale-95 glow-green"
            style={{ background: 'var(--green)', color: '#000', fontFamily: 'var(--font-title)', letterSpacing: '0.05em' }}>
            ⚡ LAUNCH APP
          </Link>
          <a href="https://celoscan.io" target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 rounded-xl font-bold text-base border transition-all hover:border-[var(--green)]"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'var(--text2)', fontFamily: 'var(--font-title)' }}>
            View Contract ↗
          </a>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 py-16 px-6 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-glow-green" style={{ fontFamily: 'var(--font-title)', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: 'var(--green)' }}>
                {s.value}
              </div>
              <div className="text-xs mt-1 uppercase tracking-widest" style={{ color: 'var(--text2)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Protocols ── */}
      <section className="relative z-10 py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-xs uppercase tracking-widest mb-6" style={{ color: 'var(--text2)' }}>Built on Celo ecosystem protocols</div>
          <div className="flex flex-wrap justify-center gap-3">
            {PROTOCOLS.map((p) => (
              <div key={p} className="px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'var(--text2)' }}>
                {p}
              </div>
            ))}
            <div className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'var(--text3)' }}>
              + more
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center mb-12 text-xl md:text-2xl font-bold" style={{ fontFamily: 'var(--font-title)', letterSpacing: '0.1em' }}>
            HOW IT WORKS
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="panel p-6 hover:border-[var(--green)] transition-colors"
                style={{ transition: 'border-color 0.2s' }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <div className="font-bold mb-2 text-sm tracking-widest" style={{ fontFamily: 'var(--font-title)', color: 'var(--green)' }}>
                  {f.title}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bottom ── */}
      <section className="relative z-10 py-20 px-6 text-center">
        <h2 className="mb-4" style={{ fontFamily: 'var(--font-title)', fontWeight: 900, fontSize: 'clamp(32px, 6vw, 64px)', color: 'var(--green)' }}>
          YOUR COLONY AWAITS.
        </h2>
        <p className="mb-8 text-base" style={{ color: 'var(--text2)' }}>Connect your Celo wallet and start building in 30 seconds.</p>
        <Link href="/game"
          className="inline-flex px-10 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 glow-green"
          style={{ background: 'var(--green)', color: '#000', fontFamily: 'var(--font-title)' }}>
          ⚡ LAUNCH NOW
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t py-8 px-6 text-center text-xs"
        style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text3)' }}>
        CELO COLONY · BUILT ON CELO · POWERED BY COMMUNITY
      </footer>
    </main>
  )
}
