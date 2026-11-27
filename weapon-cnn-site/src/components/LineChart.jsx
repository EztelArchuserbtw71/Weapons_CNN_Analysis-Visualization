import { useState } from 'react'
import { useWidth } from '../lib/useWidth'
import { niceTicks } from '../lib/svg'

// Per-epoch line chart (one y-axis) with a crosshair + tooltip.
// series: [{ key, label, color, values: number[] }]
export default function LineChart({ title, series, format, height = 230, domain, markEpoch }) {
  const [ref, width] = useWidth(420)
  const [hi, setHi] = useState(null)
  const n = Math.max(...series.map((s) => s.values.length))
  const all = series.flatMap((s) => s.values).filter((v) => v != null)
  let [lo, hiV] = domain || [Math.min(...all), Math.max(...all)]
  if (!domain) {
    const pad = (hiV - lo) * 0.12 || 0.05
    lo = Math.max(0, lo - pad)
    hiV = hiV + pad
  }
  const ticks = niceTicks(lo, hiV, 4)
  lo = ticks[0]
  hiV = ticks[ticks.length - 1]

  const m = { l: 46, r: 16, t: 10, b: 30 }
  const pw = width - m.l - m.r
  const ph = height - m.t - m.b
  const x = (i) => m.l + (n === 1 ? pw / 2 : (i / (n - 1)) * pw)
  const y = (v) => m.t + ph - ((v - lo) / (hiV - lo)) * ph

  function onMove(ev) {
    const r = ev.currentTarget.getBoundingClientRect()
    const px = ev.clientX - r.left
    const i = Math.round(((px - m.l) / pw) * (n - 1))
    setHi(Math.max(0, Math.min(n - 1, i)))
  }

  const xEvery = n > 8 ? 2 : 1

  return (
    <div className="chart" ref={ref}>
      <div className="legend">
        <b style={{ color: 'var(--ink)', marginRight: 4 }}>{title}</b>
        {series.map((s) => (
          <span key={s.key}><i className="key-line" style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
      <svg width={width} height={height} role="img" aria-label={`${title} per epoch`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="gridline" x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} />
            <text className="tick" x={m.l - 8} y={y(t) + 4} textAnchor="end">{format(t, true)}</text>
          </g>
        ))}
        <line className="baseline" x1={m.l} x2={width - m.r} y1={m.t + ph} y2={m.t + ph} />
        {Array.from({ length: n }, (_, i) =>
          i % xEvery === 0 || i === n - 1 ? (
            <text key={i} className="tick" x={x(i)} y={height - 10} textAnchor="middle">{i + 1}</text>
          ) : null,
        )}
        {markEpoch != null && (
          <g>
            <line x1={x(markEpoch - 1)} x2={x(markEpoch - 1)} y1={m.t} y2={m.t + ph} stroke="var(--axis)" strokeWidth={1} />
          </g>
        )}
        {series.map((s) => (
          <g key={s.key}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={hi === i ? 5 : 3.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </g>
        ))}
        {hi != null && <line x1={x(hi)} x2={x(hi)} y1={m.t} y2={m.t + ph} stroke="var(--muted)" strokeWidth={1} />}
        <rect
          x={m.l - 10}
          y={m.t}
          width={pw + 20}
          height={ph}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHi(null)}
        />
      </svg>
      <div className="sr-only">Epochs along the bottom, {title.toLowerCase()} on the left axis.</div>
      {hi != null && (
        <div
          className="tooltip"
          style={{ left: Math.min(Math.max(x(hi), 90), width - 90), top: Math.min(...series.map((s) => y(s.values[hi]))) }}
        >
          <div className="t-title">Epoch {hi + 1}</div>
          {series.map((s) => (
            <div className="t-row" key={s.key}>
              <span><i className="key-line" style={{ background: s.color }} />{s.label}</span>
              <b className="num">{format(s.values[hi])}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
