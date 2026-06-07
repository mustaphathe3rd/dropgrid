// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pg uses native Node.js modules — exclude from edge/client bundle
  serverExternalPackages: ['pg', 'pg-native'],

  // Strict mode catches subtle React bugs early
  reactStrictMode: true,

  // Environment variables exposed to the browser must be prefixed NEXT_PUBLIC_
  // All NEXT_PUBLIC_ vars are embedded at build time — they are NOT secrets
  env: {
    NEXT_PUBLIC_GRID_WIDTH: process.env.NEXT_PUBLIC_GRID_WIDTH ?? '2000',
    NEXT_PUBLIC_GRID_HEIGHT: process.env.NEXT_PUBLIC_GRID_HEIGHT ?? '1000',
    NEXT_PUBLIC_CELL_LOCK_SECONDS: process.env.NEXT_PUBLIC_CELL_LOCK_SECONDS ?? '60',
    NEXT_PUBLIC_PLAYER_COOLDOWN_SECONDS:
      process.env.NEXT_PUBLIC_PLAYER_COOLDOWN_SECONDS ?? '30',
  },
}

export default nextConfig