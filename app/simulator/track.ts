import { mulberry32 } from './rng'
import { Track, TrackConfig, Point } from './types'
import { generateControlPoints, sampleSpline } from './helpers/spline'
import { generateEdgeFromCenterline } from './helpers/geometry'
import { generateObstacles } from './helpers/obstacles'
const SPLINE_SAMPLES = 1200
const START_LINE_CLEARANCE = 120

function closestPoint(points: Point[], target: Point): Point {
  if (points.length === 0) return target
  let best = points[0]
  let bestDist = (best.x - target.x) * (best.x - target.x) + (best.y - target.y) * (best.y - target.y)
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    const d = (p.x - target.x) * (p.x - target.x) + (p.y - target.y) * (p.y - target.y)
    if (d < bestDist) {
      best = p
      bestDist = d
    }
  }
  return best
}

function computeStartLine(centerLine: Point[], leftEdge: Point[], rightEdge: Point[], rand: () => number) {
  const n = centerLine.length
  if (n === 0) {
    const p = leftEdge[0] ?? rightEdge[0] ?? { x: 0, y: 0 }
    return { a: p, b: p }
  }
  const i = Math.floor(rand() * n)
  const p = centerLine[i]
  const a = closestPoint(leftEdge, p)
  const b = closestPoint(rightEdge, p)
  return { a, b }
}

function distPointToSegment(p: Point, a: Point, b: Point) {
  const vx = b.x - a.x
  const vy = b.y - a.y
  const wx = p.x - a.x
  const wy = p.y - a.y
  const c1 = vx * wx + vy * wy
  if (c1 <= 0) return Math.hypot(p.x - a.x, p.y - a.y)
  const c2 = vx * vx + vy * vy
  if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y)
  const t = c1 / c2
  const projX = a.x + t * vx
  const projY = a.y + t * vy
  return Math.hypot(p.x - projX, p.y - projY)
}

export function generateTrack(seed: number, config: TrackConfig = {}): Track {
  const {
    controlPoints = 16,
    minRadius = 300,
    maxRadius = 520,
    trackWidth = 90,
    obstacleCount = 15
  } = config

  const rand = mulberry32(seed)
  const cx = 800, cy = 600
  const control = generateControlPoints(rand, controlPoints, cx, cy, minRadius, maxRadius)
  const centerLine = sampleSpline(control, SPLINE_SAMPLES)
  let leftEdge = generateEdgeFromCenterline(centerLine, trackWidth)
  let rightEdge = generateEdgeFromCenterline(centerLine, -trackWidth)

  const startLine = computeStartLine(centerLine, leftEdge, rightEdge, rand)

  const rawObstacles = generateObstacles(rand, centerLine, trackWidth, obstacleCount)
  const obstacles = rawObstacles.filter(o =>
    distPointToSegment(o.position, startLine.a, startLine.b) >= START_LINE_CLEARANCE + o.radius
  )

  const track = { centerLine, width: trackWidth * 2, length: centerLine.length, leftEdge, rightEdge, obstacles, startLine }

  function deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    // Reflect.ownKeys to include non-enumerable and symbol keys
    const props = Object.getOwnPropertyNames(obj) as (keyof T)[]
    for (const key of props) {
      const val = (obj as any)[key]
      if (val && typeof val === 'object') deepFreeze(val)
    }
    return Object.freeze(obj)
  }

  return deepFreeze(track)
}
