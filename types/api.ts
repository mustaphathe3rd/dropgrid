// types/api.ts
import type { CellDelta } from './cell'

export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = { success: false; error: string; code?: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── Request bodies ──────────────────────────────────────────────────────────

export interface DropRequest {
    cell_id: string
    use_raid_token?: boolean   // spend a Raid Token to bypass adjacency
}

export interface FortifyRequest {
    cell_id: string            // must be owned by the requesting player
}

export interface CreateTeamRequest {
    name: string               // max 32 chars
    color_hex: string          // "#RRGGBB"
}

export interface JoinTeamRequest {
    invite_token: string
}

export interface SetCapitalRequest {
    cell_id: string            // must be owned by the requesting player
}

// ── Response shapes ─────────────────────────────────────────────────────────

export interface GridDeltaResponse {
    cells: CellDelta[]         // cells that changed since `since` in the viewport
    server_timestamp: number   // epoch ms — use as `since` in next poll
    is_snapshot: boolean       // true if client's `since` was > 10 min ago (full sync)
}

export interface GridSnapshotResponse {
    cells: CellDelta[]
    server_timestamp: number
}

export interface LeaderboardEntry {
    player_id: string
    username: string
    color_hex: string
    team_id: string | null
    team_name: string | null
    total_cells_owned: number
    rank: number
}

export interface TeamLeaderboardEntry {
    team_id: string
    name: string
    color_hex: string
    member_count: number
    total_cells_owned: number
    rank: number
}