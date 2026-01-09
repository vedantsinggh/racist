declare module 'clipper-lib' {
  export interface Path {
    X: number
    Y: number
  }

  export class ClipperOffset {
    constructor(miterLimit?: number, arcTolerance?: number)
    static readonly def_arc_tolerance: number
    AddPath(path: Path[], joinType: number, endType: number): void
    Execute(output: Path[][], delta: number): void
    Clear(): void
  }

  export const JoinType: {
    jtRound: number
    jtSquare: number
    jtMiter: number
  }

  export const EndType: {
    etClosedPolygon: number
    etClosedLine: number
    etOpenSquare: number
    etOpenRound: number
    etOpenButt: number
  }

  export default { ClipperOffset, JoinType, EndType }
}
