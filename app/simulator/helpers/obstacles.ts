import { Point, Obstacle } from '../types'

// Magic constants
const OBSTACLE_MIN_DIST = 80
const OBSTACLE_RADIUS_MIN = 12
const OBSTACLE_RADIUS_MAX = 20
const OBSTACLE_LATERAL_FACTOR = 0.4
const OBSTACLE_ATTEMPTS_FACTOR = 50

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function generateObstacles(
  rand: () => number,
  centerLine: Point[],
  trackWidth: number,
  count: number
): Obstacle[] {
  const obstacles: Obstacle[] = []
  let attempts = 0
  while (obstacles.length < count && attempts < count * OBSTACLE_ATTEMPTS_FACTOR) {
    attempts++
    const i = Math.floor(rand() * (centerLine.length - 20)) + 10
    const p = centerLine[i]
    const next = centerLine[(i + 1) % centerLine.length]
    const dx = next.x - p.x
    const dy = next.y - p.y
    const len = Math.hypot(dx, dy)
    const nx = -dy / len
    const ny = dx / len
    const lateral = (rand() * 2 - 1) * trackWidth * OBSTACLE_LATERAL_FACTOR
    const pos = { x: p.x + nx * lateral, y: p.y + ny * lateral }
    const radius = OBSTACLE_RADIUS_MIN + rand() * (OBSTACLE_RADIUS_MAX - OBSTACLE_RADIUS_MIN)

    if (obstacles.some(o => dist(o.position, pos) < OBSTACLE_MIN_DIST)) continue
    obstacles.push({ position: pos, radius })
  }
  return obstacles
}
