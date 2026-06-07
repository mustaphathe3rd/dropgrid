// app/page.tsx
// Day 0 placeholder — replaced with the real game UI in Phase 3.
// Confirms the Vercel deploy is live and shows the stack being used.

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        gap: '24px',
        padding: '24px',
      }}
    >
      <div style={{ fontSize: '48px', letterSpacing: '-2px', fontWeight: 700 }}>
        DropGrid
      </div>

      <div
        style={{
          color: '#64748b',
          fontSize: '16px',
          textAlign: 'center',
          maxWidth: '480px',
          lineHeight: 1.6,
        }}
      >
        Real-time global territory game. Millions of cells. One world.
        <br />
        Backend provisioned. Frontend coming soon.
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { label: 'DynamoDB', color: '#FF9900' },
          { label: 'Aurora DSQL', color: '#FF9900' },
          { label: 'Vercel', color: '#ffffff' },
          { label: 'Next.js 14', color: '#ffffff' },
        ].map(({ label, color }) => (
          <span
            key={label}
            style={{
              padding: '4px 12px',
              border: `1px solid ${color}33`,
              borderRadius: '20px',
              fontSize: '12px',
              color: color,
              background: `${color}11`,
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div style={{ color: '#334155', fontSize: '12px' }}>
        H0 Hackathon — Track 3: Million-Scale Global App
      </div>
    </main>
  )
}