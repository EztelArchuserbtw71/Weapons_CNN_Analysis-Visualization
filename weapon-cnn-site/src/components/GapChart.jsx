import { useState } from 'react'
import { experiments, pct } from '../lib/metrics'
import { useWidth } from '../lib/useWidth'
import { niceTicks } from '../lib/svg'

// Dumbbell: final-epoch training accuracy vs test accuracy per experiment.
// A long connector = the model memorised training images (overfitting).
export default function GapChart({ selected, onSelect }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const rows = experiments
  const vals = rows.flatMap((e) => [e.trainAcc, e.testAcc])
  const ticks = niceTicks(Math.max(0, Math.min(...vals) - 0.03), Math.min(1, Math.max(...vals) + 0.02), 5)
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const narrow = width < 520
  const labelW = narrow ? 44 : 170
  const gapW = 64
  const rowH = 30
  const top = 24
  const h = top + rows.length * rowH + 6
  const pw = width - labelW - gapW - 10
  const x = (v) => labelW + ((v - lo) / (hi - lo)) * pw

  return (
    <div className="chart" ref={ref}>
      <div className="legend">
        <span><i className="key-dot" style={{ background: 'var(--series-train)' }} />Training accuracy (last epoch)</span>
        <span><i className="key-dot" style={{ background: 'var(--series-test)' }} />Test accuracy</span>
      </div>
      <svg width={width} height={h} role="img" aria-label="Training versus test accuracy for each experiment">
        {ticks.map((t) => (
          <g key={t}>
            <line className="gridline" x1={x(t)} x2={x(t)} y1={top - 6} y2={h - 6} />
            <text className="tick" x={x(t)} y={top - 11} textAnchor="middle">{Math.round(t * 100)}%</text>
          </g>
        ))}
        <text className="tick" x={width - 4} y={top - 11} textAnchor="end">gap</text>
        {rows.map((e, i) => {
          const cy = top + i * rowH + rowH / 2
          const isSel = e.id === selected
          const show = () => setHover({ e, x: x(Math.max(e.trainAcc, e.testAcc)), y: cy - 6 })
          return (
            <g
              key={e.id}
              className="bar-row"
              onClick={() => onSelect(e.id)}
              onMouseEnter={show}
              onMouseLeave={() => setHover(null)}
              onFocus={show}
              onBlur={() => setHover(null)}
              tabIndex={0}
              role="button"
              aria-label={`${e.id}: training ${pct(e.trainAcc)}, test ${pct(e.testAcc)}. Show details.`}
              onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), onSelect(e.id))}
            >
              <rect className="bar-hit" x={0} y={cy - rowH / 2} width={width} height={rowH} rx={6}
                style={isSel ? { fill: 'color-mix(in srgb, var(--accent) 10%, transparent)' } : undefined} />
              <text x={6} y={cy + 4} className={isSel ? 'label-strong' : 'label-2'}>
                <tspan fontWeight="650">{e.id}</tspan>
                {!narrow && <tspan dx={6}>{e.name}</tspan>}
              </text>
              <line x1={x(e.testAcc)} x2={x(e.trainAcc)} y1={cy} y2={cy} stroke="var(--axis)" strokeWidth={2} />
              <circle cx={x(e.trainAcc)} cy={cy} r={5} fill="var(--series-train)" stroke="var(--surface)" strokeWidth={2} />
              <circle cx={x(e.testAcc)} cy={cy} r={5} fill="var(--series-test)" stroke="var(--surface)" strokeWidth={2} />
              <text x={width - 4} y={cy + 4} textAnchor="end" className="tick label-2">
                {e.gap >= 0 ? '+' : '−'}{Math.abs(e.gap * 100).toFixed(0)} pp
              </text>
            </g>
          )
        })}
      </svg>
      {hover && (
        <div className="tooltip" style={{ left: Math.min(Math.max(hover.x, 100), width - 100), top: hover.y }}>
          <div className="t-title">{hover.e.id} · {hover.e.name}</div>
          <div className="t-row"><span><i className="key-dot" style={{ background: 'var(--series-train)' }} />Training</span><b className="num">{pct(hover.e.trainAcc)}</b></div>
          <div className="t-row"><span><i className="key-dot" style={{ background: 'var(--series-test)' }} />Test</span><b className="num">{pct(hover.e.testAcc)}</b></div>
          <div className="t-row"><span>Gap</span><b className="num">{(hover.e.gap * 100).toFixed(1)} pp</b></div>
        </div>
      )}
    </div>
  )
}
