// types/player.ts
export interface Player {
    player_id: string          // UUID v4 — maps to NextAuth session user ID
    username: string
    color_hex: string          // "#RRGGBB" — player's territory color
    total_cells_owned: number  // denormalized, updated by cron sync
    cells_captured_all_time: number
    cells_lost_all_time: number
    streak_current: number     // consecutive days with at least one drop
    streak_best: number
    team_id: string | null
    capital_cell_id: string | null
    created_at: Date
    last_active_at: Date
}

/** Extended player data including team info — for profile pages */
export interface PlayerProfile extends Player {
    team_name?: string
    team_color?: string
    rank?: number              // current leaderboard rank (1 = most cells)
}

/** Player cooldown + raid token state stored in DynamoDB */
export interface PlayerCooldown {
    player_id: string          // PK
    cooldown_until: number     // epoch SECONDS (DynamoDB TTL)
    raid_tokens: number        // current token count (0–5)
    last_token_regen: number   // epoch milliseconds — checked by cron regen job
}