# DropGrid — Architecture

> Placeholder. Full architecture diagram and description added on Day 23.

## Overview

DropGrid is a massively multiplayer real-time territory game built on:

- **Frontend**: Next.js 14 (App Router) deployed on Vercel
- **Primary write store**: Amazon DynamoDB (cells, events, cooldowns)
- **Relational store**: Amazon Aurora DSQL (players, teams, leaderboards, sieges)

## Databases

### DynamoDB Tables

| Table | PK | SK | Purpose |
|-------|----|----|---------|
| `dropgrid-cells` | `cell_id` | — | World grid: 2M cells, ownership, lock timers |
| `dropgrid-events` | `event_id` | `timestamp` | Event log: delta polling feed, 10 min TTL |
| `dropgrid-cooldowns` | `player_id` | — | Drop cooldowns and raid token state |

### Aurora DSQL Tables

| Table | Purpose |
|-------|---------|
| `players` | Profiles, streaks, stats |
| `teams` | Team info and color |
| `team_members` | Membership and roles |
| `team_invites` | Invite tokens |
| `sieges` | Active and resolved team wars |

## Architecture Diagram

> TODO: Add architecture.png on Day 23