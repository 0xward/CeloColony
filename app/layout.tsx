import type { Metadata }  from 'next'
import './globals.css'
import Providers           from '@/components/providers'

export const metadata: Metadata = {
  title:       'Celo Colony — Space City Tycoon',
  description: 'Build your colony, power the economy, and grow the future of onchain civilization on Celo.',
  openGraph: {
    title:       'Celo Colony',
    description: 'Space city tycoon on Celo',
    type:        'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
