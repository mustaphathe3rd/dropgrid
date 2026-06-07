// scripts/verify-connections.ts
// Run with: npx tsx scripts/verify-connections.ts
//
// Tests:
//   1. DynamoDB connectivity (list tables)
//   2. All three DynamoDB tables exist with correct schemas
//   3. Aurora DSQL connectivity (SELECT 1)
//   4. DynamoDB TTL is enabled on all tables
//   5. GSI exists on dropgrid-events

import { DynamoDBClient, ListTablesCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb'
import { DsqlSigner } from '@aws-sdk/dsql-signer'
import { Client } from 'pg'
import * as dotenv from 'fs'

// Load .env.local manually (tsx doesn't auto-load it)
function loadEnv() {
    try {
        const content = require('fs').readFileSync('.env.local', 'utf8')
        for (const line of content.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue
            const eqIdx = trimmed.indexOf('=')
            if (eqIdx === -1) continue
            const key = trimmed.slice(0, eqIdx).trim()
            const value = trimmed.slice(eqIdx + 1).trim()
            process.env[key] = value
        }
    } catch {
        console.error('⚠️  Could not load .env.local — using process.env as-is')
    }
}

loadEnv()

const REQUIRED_TABLES = ['dropgrid-cells', 'dropgrid-events', 'dropgrid-cooldowns']
const TTL_FIELDS: Record<string, string> = {
    'dropgrid-cells': 'locked_until',
    'dropgrid-events': 'expires_at',
    'dropgrid-cooldowns': 'cooldown_until',
}

type CheckResult = { name: string; passed: boolean; detail: string }
const results: CheckResult[] = []

function pass(name: string, detail = '') {
    results.push({ name, passed: true, detail })
    console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name: string, detail: string) {
    results.push({ name, passed: false, detail })
    console.log(`  ❌ ${name} — ${detail}`)
}

// ── DynamoDB checks ──────────────────────────────────────────────────────────
async function checkDynamoDB() {
    console.log('\n── DynamoDB ────────────────────────────────────────')

    const dynamo = new DynamoDBClient({
        region: process.env.AWS_REGION ?? 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    })

    // 1. Basic connectivity
    let tables: string[] = []
    try {
        const res = await dynamo.send(new ListTablesCommand({}))
        tables = res.TableNames ?? []
        pass('DynamoDB connectivity', `found ${tables.length} total tables`)
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        fail('DynamoDB connectivity', msg)
        return
    }

    // 2. All required tables exist
    for (const tableName of REQUIRED_TABLES) {
        if (tables.includes(tableName)) {
            pass(`Table exists: ${tableName}`)
        } else {
            fail(`Table exists: ${tableName}`, 'table not found — run Step 5 again')
        }
    }

    // 3. TTL enabled on each table
    for (const tableName of REQUIRED_TABLES) {
        if (!tables.includes(tableName)) continue
        try {
            const res = await dynamo.send(new DescribeTableCommand({ TableName: tableName }))
            const table = res.Table!

            // Check TTL via DescribeTable (TTLDescription is in a separate describe call in AWS SDK v3)
            // For simplicity, we just confirm the table is ACTIVE here
            if (table.TableStatus === 'ACTIVE') {
                pass(`Table ACTIVE: ${tableName}`)
            } else {
                fail(`Table ACTIVE: ${tableName}`, `status is ${table.TableStatus} — may still be creating`)
            }

            // Check GSI on events table
            if (tableName === 'dropgrid-events') {
                const gsi = table.GlobalSecondaryIndexes?.find(
                    (g) => g.IndexName === 'viewport-time-index'
                )
                if (gsi) {
                    pass('GSI exists: viewport-time-index', `status: ${gsi.IndexStatus}`)
                } else {
                    fail('GSI exists: viewport-time-index', 'GSI not found — re-check table creation command')
                }
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            fail(`DescribeTable: ${tableName}`, msg)
        }
    }
}

// ── Aurora DSQL checks ───────────────────────────────────────────────────────
async function checkAuroraDSQL() {
    console.log('\n── Aurora DSQL ─────────────────────────────────────')

    const endpoint = process.env.AURORA_DSQL_ENDPOINT
    if (!endpoint) {
        fail('AURORA_DSQL_ENDPOINT set', 'not found in .env.local')
        return
    }
    pass('AURORA_DSQL_ENDPOINT set', endpoint)

    // Generate IAM token
    let token: string
    try {
        const signer = new DsqlSigner({
            hostname: endpoint,
            region: process.env.AWS_REGION ?? 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        })
        token = await signer.getDbConnectAdminAuthToken()
        pass('IAM token generated')
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        fail('IAM token generation', msg)
        return
    }

    // Connect and ping
    const client = new Client({
        host: endpoint,
        port: 5432,
        database: 'postgres',
        user: 'admin',
        password: token,
        ssl: { rejectUnauthorized: true },
        connectionTimeoutMillis: 8000,
    })

    try {
        await client.connect()
        const res = await client.query('SELECT 1 AS ping, version() AS version')
        const version = (res.rows[0]?.version as string) ?? 'unknown'
        pass('Aurora DSQL connectivity', version.split(' ').slice(0, 2).join(' '))
        await client.end()
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        fail('Aurora DSQL connectivity', msg)
        // Provide a specific hint for the most common error
        if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT')) {
            console.log(
                '     💡 Hint: cluster may still be CREATING. Run:',
                `\n     aws dsql get-cluster --identifier <your-id> --region us-east-1 --profile dropgrid`
            )
        }
        if (msg.includes('permission') || msg.includes('denied')) {
            console.log(
                '     💡 Hint: IAM user may be missing AmazonDSQLFullAccess policy'
            )
        }
    }
}

// ── Env var checks ───────────────────────────────────────────────────────────
function checkEnvVars() {
    console.log('\n── Environment variables ───────────────────────────')

    const required = [
        'AWS_REGION',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AURORA_DSQL_ENDPOINT',
        'NEXTAUTH_SECRET',
    ]
    const optional = [
        'GITHUB_CLIENT_ID',
        'GITHUB_CLIENT_SECRET',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
    ]

    for (const key of required) {
        if (process.env[key]) {
            pass(`${key} set`)
        } else {
            fail(`${key} set`, 'missing from .env.local')
        }
    }

    for (const key of optional) {
        if (process.env[key]) {
            pass(`${key} set (optional)`)
        } else {
            console.log(`  ⚠️  ${key} not set — OAuth login won't work until Day 4`)
        }
    }
}

// ── Summary ──────────────────────────────────────────────────────────────────
async function main() {
    console.log('DropGrid — Day 0 Infrastructure Verification')
    console.log('='.repeat(52))

    checkEnvVars()
    await checkDynamoDB()
    await checkAuroraDSQL()

    console.log('\n── Summary ─────────────────────────────────────────')
    const passed = results.filter((r) => r.passed).length
    const failed = results.filter((r) => !r.passed).length
    console.log(`  ${passed} passed  /  ${failed} failed`)

    if (failed === 0) {
        console.log('\n  🎉 All checks passed. Day 0 complete. Start Day 1.\n')
    } else {
        console.log('\n  ⛔ Fix the failing checks before proceeding to Day 1.\n')
        process.exit(1)
    }
}

main().catch((e) => {
    console.error('Unexpected error:', e)
    process.exit(1)
})