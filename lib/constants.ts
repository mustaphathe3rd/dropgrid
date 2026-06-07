// lib/constants.ts
// Central location for all game constants.
// NEXT_PUBLIC_ prefix exposes them to the browser bundle.

export const GRID_WIDTH = Number(process.env.NEXT_PUBLIC_GRID_WIDTH ?? 2000)
export const GRID_HEIGHT = Number(process.env.NEXT_PUBLIC_GRID_HEIGHT ?? 1000)

// Cell coordinates are bucketed for efficient GSI queries.
// Each bucket covers BUCKET_SIZE cells in each dimension.
// Lower = more precise queries, more GSI partitions.
// Higher = cheaper queries, larger delta payloads per poll.
export const BUCKET_SIZE = 100

// Seconds a cell stays locked after being claimed (base, 0 fortification stacks)
export const CELL_LOCK_SECONDS = Number(
    process.env.NEXT_PUBLIC_CELL_LOCK_SECONDS ?? 60
)

// Seconds a player must wait between drops
export const PLAYER_COOLDOWN_SECONDS = Number(
    process.env.NEXT_PUBLIC_PLAYER_COOLDOWN_SECONDS ?? 30
)

// Event log TTL — events older than this are deleted by DynamoDB
export const EVENT_TTL_SECONDS = 600 // 10 minutes

// Fortification lock multipliers (index = stack count)
export const FORT_LOCK_MULTIPLIERS = [1, 1.5, 2, 3] as const

// Raid token constants
export const MAX_RAID_TOKENS = 5
export const RAID_TOKEN_REGEN_MINUTES = 10

// Siege detection threshold
export const SIEGE_ATTACK_THRESHOLD = 10     // cross-team attacks to trigger
export const SIEGE_DETECTION_WINDOW = 300    // seconds (5 minutes)
export const SIEGE_DURATION_SECONDS = 600    // 10 minutes
export const SIEGE_LOCK_MULTIPLIER = 0.5     // halves lock timers during siege

export const TABLES = {
    CELLS: 'dropgrid-cells',
    EVENTS: 'dropgrid-events',
    COOLDOWNS: 'dropgrid-cooldowns',
} as const