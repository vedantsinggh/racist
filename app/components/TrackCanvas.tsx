'use client'

import { useEffect, useRef } from 'react'
import { generateTrack } from '../simulator/track'
import { Point } from '../simulator/types'

function drawPolyline(ctx: CanvasRenderingContext2D, pts: Point[]) {
  if (!pts.length) return
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.stroke()
}

type TrackCanvasProps = {
  seed: number
  controlPoints: number
  minRadius: number
  maxRadius: number
  trackWidth: number
  obstacleCount: number
}

export function TrackCanvas({
  seed,
  controlPoints,
  minRadius,
  maxRadius,
  trackWidth,
  obstacleCount
}: TrackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const track = generateTrack(seed, {
      controlPoints,
      minRadius,
      maxRadius,
      trackWidth,
      obstacleCount
    })

    if (track.leftEdge.length < 3 || track.rightEdge.length < 3) {
      console.warn('Invalid track edges')
      return
    }

    ctx.fillStyle = '#5A7863'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = Math.random() > 0.5
        ? 'rgba(52,103,81,0.13)'
        : 'rgba(52,103,81,0.22)'
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      ctx.beginPath()
      ctx.arc(x, y, Math.random() * 1.2 + 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = '#3B4953'
    ctx.beginPath()
    ctx.moveTo(track.leftEdge[0].x, track.leftEdge[0].y)
    for (let i = 1; i < track.leftEdge.length; i++) {
      ctx.lineTo(track.leftEdge[i].x, track.leftEdge[i].y)
    }
    ctx.closePath()
    ctx.moveTo(track.rightEdge[0].x, track.rightEdge[0].y)
    for (let i = 1; i < track.rightEdge.length; i++) {
      ctx.lineTo(track.rightEdge[i].x, track.rightEdge[i].y)
    }
    ctx.closePath()
    ctx.fill('evenodd')

    ctx.strokeStyle = '#ECDBBA'
    ctx.lineWidth = 2.5
    drawPolyline(ctx, track.leftEdge)
    drawPolyline(ctx, track.rightEdge)

    ctx.setLineDash([10, 10])
    ctx.strokeStyle = '#ECDBBA'
    ctx.lineWidth = 1.2
    drawPolyline(ctx, track.centerLine)
    ctx.setLineDash([])

    ctx.save()
    ctx.strokeStyle = '#91C6BC'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(track.startLine.a.x, track.startLine.a.y)
    ctx.lineTo(track.startLine.b.x, track.startLine.b.y)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = '#B45253'
    for (const o of track.obstacles) {
      ctx.save()
      ctx.shadowColor = '#000'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(o.position.x, o.position.y, o.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }, [seed, controlPoints, minRadius, maxRadius, trackWidth, obstacleCount])

  return (
    <canvas
      ref={canvasRef}
      width={1600}
      height={1200}
      style={{
        border: '2px solid #3F0071',
        borderRadius: '16px',
        boxShadow: '0 4px 32px #000a',
        background: '#000000',
        display: 'block',
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  )
}
