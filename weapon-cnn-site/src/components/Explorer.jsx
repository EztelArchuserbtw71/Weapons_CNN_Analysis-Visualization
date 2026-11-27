import { experiments, byId, baseline, pct, pp } from '../lib/metrics'
import LineChart from './LineChart'
import Predictions from './Predictions'

const GROUP = { baseline: 'Baseline', optimizer: 'Optimizer', training: 'Training setup', data: 'Input data', architecture: 'Architecture' }

function verdictText(e) {
  if (e.id === 'C1') return 'The reference model. Every other run changes exactly one thing from this setup.'
  const d = e.testAcc - baseline.testAcc
  const parts = []
  if (Math.abs(d) < 0.01) parts.push('Test accuracy is about the same as the baseline')
  else parts.push(`Test accuracy is ${Math.abs(d * 100).toFixed(1)} points ${d > 0 ? 'higher' : 'lower'} than the baseline`)
  if (e.gap > 0.15) parts.push(`it fits the training images much better than new ones (${(e.gap * 100).toFixed(0)}-point gap), a sign of overfitting`)
  else if (e.gap < 0) parts.push('training accuracy is still below test accuracy, so it was still underfitting and could train longer')
  else parts.push(`the train/test gap is small (${(e.gap * 100).toFixed(0)} points), so it generalises well`)
  return parts.join('; ') + '.'
}

export default function Explorer({ selected, onSelect }) {
  const e = byId[selected]
  const d = e.testAcc - baseline.testAcc
  const minutes = Math.round(e.trainSeconds / 60)
  return (
    <div>
      <div className="chips" role="group" aria-label="Choose an experiment">
        {experiments.map((x) => (
          <button key={x.id} className="chip" aria-pressed={x.id === selected} onClick={() => onSelect(x.id)}>
            <b>{x.id}</b>{x.name}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="exp-head">
          <h3 style={{ fontSize: '1.35rem' }}>{e.id} · {e.name}</h3>
          <span className="tag">{GROUP[e.group]}</span>
        </div>
        <p className="ink2">{e.change}. {verdictText(e)}</p>

        <div className="mini-tiles">
          <div className="tile">
            <div className="label">Test accuracy</div>
            <div className="value">{pct(e.testAcc)}</div>
            <div className="sub">
              {e.id === 'C1' ? 'baseline' : <span className={d >= 0 ? 'delta-up' : 'delta-down'}>{d >= 0 ? '▲' : '▼'} {pp(d)} vs C1</span>}
            </div>
          </div>
          <div className="tile">
            <div className="label">Test loss</div>
            <div className="value">{e.testLoss.toFixed(3)}</div>
            <div className="sub">lower is better</div>
          </div>
          <div className="tile">
            <div className="label">Train − test gap</div>
            <div className="value">{(e.gap * 100).toFixed(1)} pp</div>
            <div className="sub">overfitting indicator</div>
          </div>
          <div className="tile">
            <div className="label">Weapons flagged</div>
            <div className="value">{e.weaponsCaught} / {e.weaponTotal}</div>
            <div className="sub">{e.falseAlerts} false alert{e.falseAlerts === 1 ? '' : 's'} on {e.safeTotal} safe photos</div>
          </div>
          <div className="tile">
            <div className="label">Training time</div>
            <div className="value">{minutes} min</div>
            <div className="sub">{e.epochCount} epochs on CPU</div>
          </div>
        </div>

        <div className="grid-2">
          <LineChart
            title="Accuracy"
            format={(v, tick) => (tick ? Math.round(v * 100) + '%' : pct(v))}
            series={[
              { key: 'acc', label: 'Training', color: 'var(--series-train)', values: e.epochs.map((x) => x.acc) },
              { key: 'val', label: 'Test (validation)', color: 'var(--series-test)', values: e.epochs.map((x) => x.val_acc) },
            ]}
          />
          <LineChart
            title="Loss"
            format={(v, tick) => (tick ? v.toFixed(1) : v.toFixed(3))}
            series={[
              { key: 'loss', label: 'Training', color: 'var(--series-train)', values: e.epochs.map((x) => x.loss) },
              { key: 'vloss', label: 'Test (validation)', color: 'var(--series-test)', values: e.epochs.map((x) => x.val_loss) },
            ]}
            markEpoch={e.bestValEpoch}
          />
        </div>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>
          X-axis: epoch. The thin vertical line on the loss chart marks the epoch with the lowest test loss
          (epoch {e.bestValEpoch}). If test loss rises after it while training loss keeps falling, the model is overfitting.
        </p>

        <Predictions exp={e} />
      </div>
    </div>
  )
}
