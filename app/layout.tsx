// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DropGrid — Claim the World',
  description:
    'A massively multiplayer real-time territory game. Claim grid squares, form alliances, and dominate the global leaderboard.',
  keywords: ['game', 'multiplayer', 'territory', 'real-time', 'strategy'],
  openGraph: {
    title: 'DropGrid — Claim the World',
    description: 'Real-time territory domination. Millions of players. One grid.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}