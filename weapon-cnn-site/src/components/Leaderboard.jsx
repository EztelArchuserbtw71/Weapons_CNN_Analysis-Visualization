import { useState } from 'react'
import { experiments, baseline, pct, pp } from '../lib/metrics'
import { useWidth } from '../lib/useWidth'
import { barPath } from '../lib/svg'

// Horizontal bars: test accuracy of every experiment, sorted high → low.
// Reference lines: chance level (25%) and the C1 baseline.
export default function Leaderboard({ selected, onSelect }) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState(null)
  const rows = [...experiments].sort((a, b) => b.testAcc - a.testAcc)
  const narrow = width < 520
  const labelW = narrow ? 118 : 200
  const right = 56
  const rowH = 34
  const top = 26
  const h = top + rows.length * rowH + 8
  const plotW = width - labelW - right
  const x = (v) => labelW + v * plotW
  const ticks = narrow ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="chart" ref={ref}>
      <div className="legend" aria-hidden="true">
        <span><i className="key-dot" style={{ background: 'var(--series-test)', borderRadius: 3 }} />Test accuracy (880 images)</span>
        <span><i className="key-line" style={{ background: 'var(--ink-2)' }} />C1 baseline</span>
        <span><i className="key-line" style={{ background: 'var(--axis)' }} />Chance (25%)</span>
      </div>
      <svg width={width} height={h} role="img" aria-label="Test accuracy for each experiment, sorted from best to worst">
        {ticks.map((t) => (
          <g key={t}>
            <line className="gridline" x1={x(t)} x2={x(t)} y1={top - 6} y2={h - 8} />
            <text className="tick" x={x(t)} y={top - 12} textAnchor="middle">{t * 100}%</text>
          </g>
        ))}
        <line x1={x(0.25)} x2={x(0.25)} y1={top - 4} y2={h - 8} stroke="var(--axis)" strokeWidth={2} />
        <line x1={x(baseline.testAcc)} x2={x(baseline.testAcc)} y1={top - 4} y2={h - 8} stroke="var(--ink-2)" strokeWidth={1.5} />
        {rows.map((e, i) => {
          const y = top + i * rowH
          const bw = Math.max(0, x(e.testAcc) - labelW)
          const isSel = e.id === selected
          return (
            <g
              key={e.id}
              className="bar-row"
              onClick={() => onSelect(e.id)}
              onMouseEnter={() => setHover({ e, x: x(e.testAcc), y: y + 4 })}
              onMouseLeave={() => setHover(null)}
              tabIndex={0}
              role="button"
              aria-pressed={isSel}
              aria-label={`${e.id} ${e.name}: ${pct(e.testAcc)} test accuracy. Show details.`}
              onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && (ev.preventDefault(), onSelect(e.id))}
              onFocus={() => setHover({ e, x: x(e.testAcc), y: y + 4 })}
              onBlur={() => setHover(null)}
            >
              <rect className="bar-hit" x={0} y={y} width={width} height={rowH} rx={6}
                style={isSel ? { fill: 'color-mix(in srgb, var(--accent) 10%, transparent)' } : undefined} />
              <text x={8} y={y + rowH / 2 + 4} className={isSel ? 'label-strong' : 'label-2'}>
                <tspan fontWeight="650">{e.id}</tspan>
                <tspan dx={6}>{narrow && e.name.length > 12 ? e.name.slice(0, 11) + '…' : e.name}</tspan>
              </text>
              {/* bar: square at baseline, 4px rounded data end */}
              <path
                d={barPath(labelW, y + (rowH - 18) / 2, bw, 18)}
                fill="var(--series-test)"
                opacity={selected && !isSel ? 0.55 : 1}
              />
              <text x={labelW + bw + 6} y={y + rowH / 2 + 4} className="tick label-2 halo">{pct(e.testAcc)}</text>
            </g>
          )
        })}
        <line className="baseline" x1={labelW} x2={labelW} y1={top - 6} y2={h - 8} />
      </svg>
      {hover && (
        <div className="tooltip" style={{ left: Math.min(Math.max(hover.x, 90), width - 90), top: hover.y }}>
          <div className="t-title">{hover.e.id} · {hover.e.name}</div>
          <div className="t-row"><span>Test accuracy</span><b className="num">{pct(hover.e.testAcc)}</b></div>
          {hover.e.id !== 'C1' && (
            <div className="t-row"><span>vs C1 baseline</span><b className="num">{pp(hover.e.testAcc - baseline.testAcc)}</b></div>
          )}
          <div className="t-row"><span>Test loss</span><b className="num">{hover.e.testLoss.toFixed(3)}</b></div>
        </div>
      )}
      <details className="table-toggle">
        <summary>Show as table</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Run</th><th>Change from C1</th><th className="n">Test acc.</th><th className="n">vs C1</th><th className="n">Test loss</th></tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.id}</b> {e.name}</td>
                  <td className="ink2">{e.change}</td>
                  <td className="n">{pct(e.testAcc)}</td>
                  <td className="n">{e.id === 'C1' ? '–' : pp(e.testAcc - baseline.testAcc)}</td>
                  <td className="n">{e.testLoss.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

