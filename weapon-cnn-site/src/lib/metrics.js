import data from '../data/results.json'

export const LABELS = data.labels
export const WEAPONS = new Set(['melee', 'ranged'])
export const PRETTY = {
  harmless_object: 'Harmless object',
  melee: 'Melee weapon',
  ranged: 'Ranged weapon',
  student: 'Student (empty hand)',
}

function enrich(e) {
  const last = e.epochs[e.epochs.length - 1] || {}
  const preds = e.predictions
  const weaponPhotos = preds.filter((p) => WEAPONS.has(p.actual))
  const safePhotos = preds.filter((p) => !WEAPONS.has(p.actual))
  return {
    ...e,
    trainAcc: last.acc,
    testAcc: e.test.acc,
    testLoss: e.test.loss,
    gap: last.acc - e.test.acc,
    epochCount: e.epochs.length,
    trainSeconds: e.epochs.reduce((s, x) => s + (x.sec || 0), 0),
    sampleCorrect: preds.filter((p) => p.pred === p.actual).length,
    weaponsCaught: weaponPhotos.filter((p) => WEAPONS.has(p.pred)).length,
    weaponTotal: weaponPhotos.length,
    falseAlerts: safePhotos.filter((p) => WEAPONS.has(p.pred)).length,
    safeTotal: safePhotos.length,
    bestValEpoch: e.epochs.reduce((b, x, i) => (x.val_loss < e.epochs[b].val_loss ? i : b), 0) + 1,
  }
}

export const experiments = data.experiments.map(enrich)
export const byId = Object.fromEntries(experiments.map((e) => [e.id, e]))
export const baseline = byId.C1
export const best = experiments.reduce((a, b) => (b.testAcc > a.testAcc ? b : a))
export const demoModel = data.demoModel || null
export const trainImages = data.trainImages
export const testImages = data.testImages

export const pct = (v, d = 1) => (v == null ? '–' : (v * 100).toFixed(d) + '%')
export const pp = (v, d = 1) => (v >= 0 ? '+' : '−') + Math.abs(v * 100).toFixed(d) + ' pp'
