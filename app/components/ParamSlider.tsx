type ParamSliderProps = {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  display: string | number
}

export function ParamSlider({
  label,
  value,
  min,
  max,
  onChange,
  display
}: ParamSliderProps) {
  return (
    <div>
      <div style={{
        fontSize: '12px',
        color: '#E4E4E4',
        fontWeight: 700,
        marginBottom: '4px',
        letterSpacing: '0.5px',
        fontFamily: 'inherit',
        textShadow: '0 1px 4px rgba(0,0,0,0.7)'
      }}>{label}</div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: '#7ADAA5',
            color: '#9CAFAA',
            height: '4px'
          }}
        />
        <span style={{
          minWidth: 48,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          color: '#9CAFAA',
          fontWeight: 500,
          fontFamily: 'inherit',
          textShadow: '0 1px 4px rgba(0,0,0,0.7)'
        }}>{display}</span>
      </div>
    </div>
  )
}
