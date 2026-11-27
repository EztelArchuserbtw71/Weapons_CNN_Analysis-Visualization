import { experiments, pct } from '../lib/metrics'

function Pips({ n, total, kind, label }) {
  return (
    <span className="score" aria-label={label}>
      <span className="pips" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={'pip' + (i < n ? ' on-' + kind : '')} />
        ))}
      </span>
      <span className="num">{n}/{total}</span>
    </span>
  )
}

// What matters for a school alert system: weapons caught vs false alarms.
export default function AlertTable({ selected, onSelect }) {
  const rows = [...experiments].sort(
    (a, b) => b.weaponsCaught - a.weaponsCaught || a.falseAlerts - b.falseAlerts || b.testAcc - a.testAcc,
  )
  return (
    <div className="card table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Run</th>
            <th>Weapon photos flagged</th>
            <th>False alerts on safe photos</th>
            <th className="n">All 16 correct</th>
            <th className="n">Test acc.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className={e.id === selected ? 'is-selected' : ''}>
              <td>
                <button className="chip" style={{ padding: '3px 10px' }} onClick={() => onSelect(e.id)} aria-label={`Show ${e.id} details`}>
                  <b>{e.id}</b>{e.name}
                </button>
              </td>
              <td><Pips n={e.weaponsCaught} total={e.weaponTotal} kind="good" label={`${e.weaponsCaught} of ${e.weaponTotal} weapon photos flagged`} /></td>
              <td><Pips n={e.falseAlerts} total={e.safeTotal} kind="bad" label={`${e.falseAlerts} false alerts on ${e.safeTotal} safe photos`} /></td>
              <td className="n">{e.sampleCorrect}/16</td>
              <td className="n">{pct(e.testAcc)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 12 }}>
        “Flagged” means the model predicted <i>melee</i> or <i>ranged</i> for a photo that really shows a weapon
        (even if it picked the wrong weapon type). Based on 8 weapon and 8 safe photos per run, so treat these as
        indicative, not final.
      </p>
    </div>
  )
}
