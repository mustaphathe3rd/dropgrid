// scripts/debug-aurora.ts
// Run with: npx tsx scripts/debug-aurora.ts
// Tries three connection modes and prints the exact error for each.

import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { Client } from 'pg'
import { readFileSync } from 'fs'

// Load .env.local
try {
    const env = readFileSync('.env.local', 'utf8')
    for (const line of env.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq < 1) continue
        process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
    }
} catch {
    console.error('Could not load .env.local')
    process.exit(1)
}

const ENDPOINT = process.env.AURORA_DSQL_ENDPOINT!

async function tryConnect(
    label: string,
    ssl: object | boolean
): Promise<boolean> {
    console.log(`\n─── ${label} ${'─'.repeat(40 - label.length)}`)

    let token: string
    try {
        const signer = new DsqlSigner({
            hostname: ENDPOINT,
            region: process.env.AWS_REGION ?? 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        })
        token = await signer.getDbConnectAdminAuthToken()
        console.log(`  Token: generated (${token.length} chars)`)
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.log(`  Token generation FAILED: ${msg}`)
        return false
    }

    const client = new Client({
        host: ENDPOINT,
        port: 5432,
        database: 'postgres',
        user: 'admin',
        password: token,
        ssl,
        connectionTimeoutMillis: 10_000,
    })

    try {
        await client.connect()
        const res = await client.query(
            "SELECT 1 AS ok, current_database() AS db, current_user AS usr"
        )
        console.log(`  ✅ CONNECTED:`, res.rows[0])
        await client.end()
        return true
    } catch (e: unknown) {
        // Print every property on the error — some pg errors use non-standard fields
        const err = e as Record<string, unknown>
        console.log(`  ❌ FAILED:`)
        for (const key of [
            'message', 'code', 'detail', 'hint', 'errno',
            'syscall', 'name', 'severity', 'routine',
        ]) {
            if (err[key] !== undefined && err[key] !== '') {
                console.log(`     .${key}: ${JSON.stringify(err[key])}`)
            }
        }
        if (!Object.keys(err).some(k => err[k])) {
            console.log(`     (no readable properties — raw:`, String(e), `)`)
        }
        return false
    }
}

async function main() {
    console.log('Aurora DSQL — Connection Diagnostics')
    console.log(`Endpoint: ${ENDPOINT}`)
    console.log(`Region:   ${process.env.AWS_REGION ?? 'us-east-1'}`)

    // Attempt 1: strict SSL (what aurora.ts currently uses)
    const a = await tryConnect('Strict SSL (rejectUnauthorized: true)', {
        rejectUnauthorized: true,
    })

    // Attempt 2: relaxed SSL
    const b = await tryConnect('Relaxed SSL (rejectUnauthorized: false)', {
        rejectUnauthorized: false,
    })

    // Attempt 3: no SSL object
    const c = await tryConnect('SSL: true (shorthand)', true)

    console.log('\n─── Verdict ' + '─'.repeat(38))
    if (a) console.log('  ✅ Strict SSL works — no changes needed in aurora.ts')
    else if (b) {
        console.log('  ✅ Relaxed SSL works — update aurora.ts: ssl: { rejectUnauthorized: false }')
        console.log('  ℹ️  This is safe for a hackathon; for production add the Amazon RDS CA bundle')
    } else if (c) {
        console.log('  ✅ ssl: true works — update aurora.ts ssl option to `true`')
    } else {
        console.log('  ❌ All three modes failed — likely IAM permissions or cluster status issue')
        console.log('  Run: aws dsql get-cluster --identifier <your-id> --region us-east-1 --profile dropgrid')
        console.log('  Expected: "status": "ACTIVE"')
    }
}

main().catch(e => {
    console.error('Script error:', e)
    process.exit(1)
})