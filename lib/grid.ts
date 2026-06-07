// lib/grid.ts
// Pure utility functions for grid coordinate math.
// No I/O - safe to import in both server and client contexts.

import { format } from 'path';
import { BUCKET_SIZE, GRID_WIDTH, GRID_HEIGHT } from './constants'

/** Parse "x:y" cell_id into numeric coordinates */
export function parseCellId(cellId: string): { x: number; y: number } {
    const [x, y] = cellId.split(':').map(Number)
    if (isNaN(x) || isNaN(y)) throw new Error(`Invalid cellId: ${cellId}`)
    return { x, y }
}

/** Format numeric coordinates into a cell_id string */
export function formatCellId(x: number, y: number): string {
    return `${x}:${y}`
}

/** Derive the GSI x_bucket from a cell_id */
export function xBucket(cellId: string): number {
    return Math.floor(parseCellId(cellId).x / BUCKET_SIZE)
}

/** Derive the GSI y_bucket from a cell_id */
export function yBucket(cellId: string): number {
    return Math.floor(parseCellId(cellId).y / BUCKET_SIZE)
}

/** Return all x_bucket values that overlap a viewport x-range */
export function xBucketsInRange(x1: number, x2: number): number[] {
    const start = Math.floor(x1 / BUCKET_SIZE)
    const end = Math.floor(x2 / BUCKET_SIZE)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/** Return all y_bucket values that overlap a viewport y-range */
export function yBucketsInRange(y1: number, y2: number): number[] {
    const start = Math.floor(y1 / BUCKET_SIZE)
    const end = Math.floor(y2 / BUCKET_SIZE)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/** Check if a cell_id is within grid bounds */
export function isValidCell(cellId: string): boolean {
    try {
        const { x, y } = parseCellId(cellId)
        return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT
    } catch {
        return false
    }
}

/** Return the 4 orthogonally adjacent cell IDs (excludes out-of-bounds) */
export function adjacentCells(cellId: string): string[] {
    const { x, y } = parseCellId(cellId)
    return [
        formatCellId(x, y - 1),
        formatCellId(x, y + 1),
        formatCellId(x - 1, y),
        formatCellId(x + 1, y),
    ].filter(isValidCell)
}