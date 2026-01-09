import { ParamSlider } from './ParamSlider'

type TrackSidebarProps = {
  seed: number
  setSeed: (v: number) => void
  controlPoints: number
  setControlPoints: (v: number) => void
  minRadius: number
  setMinRadius: (v: number) => void
  maxRadius: number
  setMaxRadius: (v: number) => void
  trackWidth: number
  setTrackWidth: (v: number) => void
  obstacleCount: number
  setObstacleCount: (v: number) => void
}

export function TrackSidebar({
  seed,
  setSeed,
  controlPoints,
  setControlPoints,
  minRadius,
  setMinRadius,
  maxRadius,
  setMaxRadius,
  trackWidth,
  setTrackWidth,
  obstacleCount,
  setObstacleCount
}: TrackSidebarProps) {
  return (
    <aside className="track-sidebar" style={{
      background: '#222222',
      boxShadow: '-2px 0 16px rgba(0,0,0,0.7)',
      padding: '32px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      borderTopLeftRadius: '24px',
      borderBottomLeftRadius: '24px',
      fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif',
      borderLeft: '4px solid #045757'
    }}>
      <h2 style={{
        margin: 0,
        fontSize: '2rem',
        fontWeight: 800,
        letterSpacing: '-1px',
        color: '#E4E4E4',
        fontFamily: 'inherit',
        textShadow: '0 2px 6px rgba(0,0,0,0.7)'
      }}>Track Designer</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', marginTop: '8px' }}>
        <ParamSlider
          label="Random Seed"
          value={seed}
          min={0}
          max={1000000}
          onChange={setSeed}
          display={seed}
        />
        <ParamSlider
          label="Spline Complexity"
          value={controlPoints}
          min={8}
          max={32}
          onChange={setControlPoints}
          display={`${controlPoints} Points`}
        />
        <ParamSlider
          label="Minimum Radius"
          value={minRadius}
          min={100}
          max={400}
          onChange={setMinRadius}
          display={`${minRadius} units`}
        />
        <ParamSlider
          label="Maximum Radius"
          value={maxRadius}
          min={400}
          max={800}
          onChange={setMaxRadius}
          display={`${maxRadius} units`}
        />
        <ParamSlider
          label="Road Width"
          value={trackWidth}
          min={30}
          max={200}
          onChange={setTrackWidth}
          display={`${trackWidth} units`}
        />
        <ParamSlider
          label="Obstacles"
          value={obstacleCount}
          min={0}
          max={50}
          onChange={setObstacleCount}
          display={`${obstacleCount} Total`}
        />
      </div>
      <div style={{
        marginTop: 'auto',
        fontSize: '13px',
        color: '#E4E4E4',
        background: '#044343',
        borderRadius: '10px',
        padding: '16px 14px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.6)',
        border: '1.5px solid #045757',
        fontFamily: 'inherit'
      }}>
        <b style={{ color: '#E4E4E4', letterSpacing: '1px' }}>Parameter Guide</b>
        <ul style={{ margin: '10px 0 0 18px', padding: 0, lineHeight: 1.7 }}>
          <li><b style={{ color: '#E4E4E4' }}>Random Seed:</b> Changes track layout</li>
          <li><b style={{ color: '#E4E4E4' }}>Spline Complexity:</b> Track complexity (more = complex)</li>
          <li><b style={{ color: '#E4E4E4' }}>Road Width:</b> Road width in units</li>
          <li><b style={{ color: '#E4E4E4' }}>Min/Max Track Radius:</b> Track curvature range</li>
          <li><b style={{ color: '#E4E4E4' }}>Obstacles:</b> Number of obstacles</li>
        </ul>
      </div>
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: '#E4E4E4',
        marginTop: '10px',
        fontFamily: 'inherit',
        letterSpacing: '1.5px',
        textShadow: '0 1px 4px rgba(0,0,0,0.7)'
      }}>
        Racist UGV
      </div>
    </aside>
  )
}
