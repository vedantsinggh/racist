export type Point = { x: number; y: number }
export interface Obstacle { position: Point; radius: number }
export interface StartLine { a: Point; b: Point }
export interface Track {
  centerLine: Point[]
  width: number
  length: number
  leftEdge: Point[]
  rightEdge: Point[]
  obstacles: Obstacle[]
  startLine: StartLine
}
export interface TrackConfig {
  controlPoints?: number
  minRadius?: number
  maxRadius?: number
  trackWidth?: number
  obstacleCount?: number
}
