// types/team.ts
export type TeamRole = 'leader' | 'member'

export interface Team {
    team_id: string            // UUID v4
    name: string
    color_hex: string          // "#RRGGBB"
    created_by: string         // player_id of founder
    created_at: Date
}

export interface TeamMember {
    team_id: string
    player_id: string
    joined_at: Date
    role: TeamRole
}

export interface TeamInvite {
    invite_token: string       // UUID v4 — shared as a join link
    team_id: string
    invited_by: string         // player_id
    expires_at: Date           // invites expire after 48 hours
    accepted: boolean
}

export interface TeamWithStats extends Team {
    member_count: number
    total_cells_owned: number
    rank?: number
}

export interface Siege {
    siege_id: string           // UUID v4
    attacker_team_id: string
    defender_team_id: string
    started_at: Date
    ends_at: Date
    attacker_captures: number  // net cells captured during siege
    defender_captures: number
    status: 'active' | 'resolved'
}