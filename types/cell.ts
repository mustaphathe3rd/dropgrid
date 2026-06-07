// types/cell.ts
export interface Cell {
    cell_id: string           // "x:y" — e.g. "1024:512"
    owner_player_id: string | null
    owner_team_id: string | null
    claimed_at: number        // epoch milliseconds
    claim_count: number       // total ownership changes — used for activity feed drama
    locked_until: number      // epoch SECONDS (DynamoDB TTL attribute)
    fortification_stacks: number  // 0–3; each stack extends lock duration
    is_capital: boolean       // true if this cell is the owner's capital
}

/**
 * Minimal cell state sent in delta payloads.
 * Excludes claim_count and claimed_at to keep payloads small.
 */
export interface CellDelta {
    cell_id: string
    owner_player_id: string | null
    owner_team_id: string | null
    locked_until: number
    fortification_stacks: number
    is_capital: boolean
}

/** One item written to dropgrid-events on every successful claim */
export interface CellEvent {
    event_id: string          // UUID v4 — PK
    timestamp: number         // epoch milliseconds — SK and used for time filtering
    cell_id: string
    x_bucket: number          // Math.floor(x / BUCKET_SIZE) — GSI PK
    y_bucket: number          // Math.floor(y / BUCKET_SIZE) — GSI filter
    owner_player_id: string | null
    owner_team_id: string | null
    previous_owner_id: string | null   // for activity feed "PlayerX stole from PlayerY"
    expires_at: number        // epoch SECONDS (DynamoDB TTL — auto-delete after 10 min)
}

/** Drop request outcome */
export type DropResult =
    | { success: true; cell: CellDelta; cooldown_until: number }
    | {
        success: false
        error:
        | 'cell_locked'
        | 'already_owned'
        | 'cooldown_active'
        | 'not_adjacent'
        | 'insufficient_raid_tokens'
        | 'unauthorized'
        | 'invalid_cell'
    }