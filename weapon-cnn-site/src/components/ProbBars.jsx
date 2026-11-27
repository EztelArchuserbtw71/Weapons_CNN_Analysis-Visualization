import { LABELS, PRETTY } from '../lib/metrics'

// The model's softmax output: one bar per class, the winning class emphasised.
export default function ProbBars({ probs, short }) {
  const top = probs.indexOf(Math.max(...probs))
  return (
    <div className={'probs' + (short ? ' short' : '')} role="list">
      {LABELS.map((l, i) => (
        <div key={l} className={'prob' + (i === top ? ' top' : '')} role="listitem"
          aria-label={`${PRETTY[l]}: ${(probs[i] * 100).toFixed(1)}%`}>
          <span>{short ? l.replace('_object', '') : PRETTY[l]}</span>
          <span className="track"><span className="fill" style={{ width: `${Math.max(probs[i] * 100, 0.5)}%` }} /></span>
          <span className="pct">{(probs[i] * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  )
}
