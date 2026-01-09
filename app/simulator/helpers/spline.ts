import { line, curveCardinalClosed } from 'd3-shape'
import { Point } from '../types'

export function generateControlPoints(rand: () => number, count: number, cx: number, cy: number, minR: number, maxR: number) {
  const pts: Point[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const radius = minR + rand() * (maxR - minR)
    pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  return pts
}

export function sampleSpline(control: Point[], samples: number): Point[] {
  const spline = line<Point>().x(d => d.x).y(d => d.y).curve(curveCardinalClosed.tension(0.5))
  const points: Point[] = []
  const n = control.length
  for (let i = 0; i < samples; i++) {
    const t = (i / samples) * n
    const i0 = Math.floor(t) % n
    const i1 = (i0 + 1) % n
    const f = t - i0
    points.push({
      x: control[i0].x * (1 - f) + control[i1].x * f,
      y: control[i0].y * (1 - f) + control[i1].y * f
    })
  }
  return points
}
