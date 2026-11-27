import { SHOW_OWN_PHOTOS } from '../config'
import { WEAPONS, PRETTY } from '../lib/metrics'
import ProbBars from './ProbBars'
import { Alert, Check, Cross, Lock } from './Icons'

const BASE = import.meta.env.BASE_URL

function PredCard({ p }) {
  const ok = p.pred === p.actual
  const alert = WEAPONS.has(p.pred)
  const own = p.set === 'ours'
  const src = own ? `${BASE}own/${p.file}` : `${BASE}samples/${p.file}`
  return (
    <article className={'pred' + (ok ? '' : ' is-wrong')}>
      <div className="thumb">
        {own && !SHOW_OWN_PHOTOS ? (
          <div className="withheld"><div><Lock />Photo withheld for privacy<br />(our own test photo)</div></div>
        ) : (
          <img src={src} alt={`Test photo: ${PRETTY[p.actual]}`} loading="lazy" width="300" height="225" />
        )}
      </div>
      <div className="body">
        <div className="row1">
          <span>Actual: <b style={{ color: 'var(--ink)' }}>{p.actual.replace('_object', '')}</b></span>
          <span className={'verdict ' + (ok ? 'ok' : 'bad')}>
            {ok ? <Check width={13} height={13} /> : <Cross width={13} height={13} />}
            {ok ? 'Correct' : 'Wrong'}
          </span>
        </div>
        {alert && (
          <span className="alert-badge"><Alert width={14} height={14} />ALERT: {p.pred} weapon</span>
        )}
        <ProbBars probs={p.probs} short />
      </div>
    </article>
  )
}

export default function Predictions({ exp }) {
  const typical = exp.predictions.filter((p) => p.set === 'typical')
  const ours = exp.predictions.filter((p) => p.set === 'ours')
  const correct = (arr) => arr.filter((p) => p.pred === p.actual).length
  return (
    <div>
      <div className="subhead">
        <h3>Typical photos from the test set</h3>
        <span className="muted num">{correct(typical)} / {typical.length} correct</span>
      </div>
      <div className="pred-grid">{typical.map((p) => <PredCard key={p.file} p={p} />)}</div>
      <div className="subhead">
        <h3>Our own photos (never seen in training)</h3>
        <span className="muted num">{correct(ours)} / {ours.length} correct</span>
      </div>
      <div className="pred-grid">{ours.map((p) => <PredCard key={p.file} p={p} />)}</div>
    </div>
  )
}
