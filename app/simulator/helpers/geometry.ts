import ClipperLib from 'clipper-lib'
import { Point } from '../types'

// Magic constants
const CLIPPER_SCALE = 1000
const CLIPPER_MITER_LIMIT = 2
const DENSIFY_STEP = 3

export function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function toClipperPath(points: Point[], scale = CLIPPER_SCALE) {
  return points.map(p => ({ X: p.x * scale, Y: p.y * scale }))
}

function fromClipperPath(path: { X: number, Y: number }[], scale = CLIPPER_SCALE) {
  if (!path || path.length === 0) return []
  return path.map(p => ({ x: p.X / scale, y: p.Y / scale }))
}

function densify(points: Point[], step = DENSIFY_STEP): Point[] {
  if (points.length < 2) return points
  const dense: Point[] = []
  for (let i = 0; i < points.length; i++) {
    const p0 = points[i]
    const p1 = points[(i + 1) % points.length]
    dense.push(p0)
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const len = Math.hypot(dx, dy)
    if (len > step) {
      const n = Math.floor(len / step)
      for (let j = 1; j < n; j++) {
        const t = j / n
        dense.push({ x: p0.x + dx * t, y: p0.y + dy * t })
      }
    }
  }
  return dense
}

export function generateEdgeFromCenterline(centerLine: Point[], offset: number): Point[] {
  if (centerLine.length < 2) return []
  try {
    const path = toClipperPath(centerLine)
    const co = new ClipperLib.ClipperOffset(CLIPPER_MITER_LIMIT, ClipperLib.ClipperOffset.def_arc_tolerance)
    co.AddPath(path, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon)
    const result: any[] = []
    co.Execute(result, offset * CLIPPER_SCALE)
    if (result[0] && result[0].length > 2) {
      let edge = fromClipperPath(result[0])
      edge = densify(edge)
      if (dist(edge[0], edge[edge.length - 1]) > 1) edge.push({ ...edge[0] })
      return edge
    }
  } catch (e) {}
  // fallback: manual offset (copy from previous implementation if needed)
  return []
}
