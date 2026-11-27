import { useEffect, useRef, useState } from 'react'
import { loadClassifier } from '../lib/classifier'
import { byId, demoModel, LABELS, PRETTY, WEAPONS, pct } from '../lib/metrics'
import ProbBars from './ProbBars'
import { Alert, Info, Upload } from './Icons'

const BASE = import.meta.env.BASE_URL
const SAMPLES = byId.C1.predictions.filter((p) => p.set === 'typical').map((p) => p.file)

function initialSample() {
  const f = new URLSearchParams(window.location.search).get('try')
  return f && SAMPLES.includes(f) ? f : null
}

export default function TryIt() {
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState('')
  const [image, setImage] = useState(() => {
    const f = initialSample()
    return f ? { url: `${BASE}samples/${f}`, name: f, sample: true } : null
  }) // { url, name, sample }
  const [probs, setProbs] = useState(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const inputRef = useRef(null)
  const imgRef = useRef(null)
  const objectUrl = useRef(null)
  const exp = demoModel ? byId[demoModel.id] : null

  useEffect(() => () => objectUrl.current && URL.revokeObjectURL(objectUrl.current), [])

  // Deep link: ?try=melee_0107.jpg opens the demo with that sample loaded
  useEffect(() => {
    if (initialSample()) document.getElementById('try')?.scrollIntoView()
  }, [])

  async function ensureModel() {
    if (status === 'ready') return loadClassifier()
    setStatus('loading')
    try {
      const c = await loadClassifier()
      setStatus('ready')
      return c
    } catch (e) {
      setStatus('error')
      setError(String(e.message || e))
      throw e
    }
  }

  function pickFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    setProbs(null)
    setImage({ url: objectUrl.current, name: file.name })
  }

  function pickSample(f) {
    if (image?.name === f) return // same image: onLoad would not fire again
    setProbs(null)
    setImage({ url: `${BASE}samples/${f}`, name: f, sample: true })
  }

  async function onImgLoad() {
    setBusy(true)
    try {
      const c = await ensureModel()
      setProbs(await c.classify(imgRef.current))
    } catch {
      /* status already shows the error */
    } finally {
      setBusy(false)
    }
  }

  const top = probs ? probs.indexOf(Math.max(...probs)) : -1
  const label = top >= 0 ? LABELS[top] : null
  const isAlert = label && WEAPONS.has(label)
  const actual = image?.sample ? image.name.replace(/_\d+\.jpg$/, '') : null

  if (!demoModel) {
    return <div className="banner info"><Info />The in-browser demo model has not been exported yet.</div>
  }

  return (
    <div className="tryit">
      <div>
        <div
          className={'drop' + (over ? ' is-over' : '')}
          role="button"
          tabIndex={0}
          aria-label="Upload an image to classify"
          onClick={() => inputRef.current.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), inputRef.current.click())}
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            pickFile(e.dataTransfer.files[0])
          }}
        >
          {image ? (
            <img ref={imgRef} src={image.url} alt="Image being classified" onLoad={onImgLoad} />
          ) : (
            <div className="ink2">
              <Upload width={26} height={26} style={{ display: 'block', margin: '0 auto 8px' }} />
              <b>Drop a photo here</b> or click to choose one
              <div className="muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>JPG or PNG · stays on your device</div>
            </div>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pickFile(e.target.files[0])} />
        <div className="muted" style={{ fontSize: '0.85rem', marginTop: 14 }}>Or try a photo from the test set:</div>
        <div className="samples">
          {SAMPLES.map((f) => (
            <button key={f} onClick={() => pickSample(f)} aria-pressed={image?.name === f} aria-label={`Sample ${f}`}>
              <img src={`${BASE}samples/${f}`} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <div className="card result-box" aria-live="polite">
        <div className="muted" style={{ fontSize: '0.85rem' }}>
          Model: <b className="ink2">{demoModel.id} · {exp?.name}</b> ({pct(exp?.testAcc)} test accuracy,{' '}
          {(demoModel.params / 1e6).toFixed(1)}M parameters, runs in your browser with TensorFlow.js)
        </div>
        {status === 'error' && (
          <div className="banner critical"><Alert />Could not load the model: {error}</div>
        )}
        {(status === 'loading' || busy) && (
          <div className="score"><span className="spinner" />{status === 'loading' ? `Downloading model (${demoModel.mb} MB)…` : 'Classifying…'}</div>
        )}
        {!image && status !== 'loading' && (
          <p className="ink2">Choose a photo to see what the CNN thinks it shows. The model downloads the first time (about {demoModel.mb} MB).</p>
        )}
        {probs && (
          <>
            <div className="result-head">
              {PRETTY[label]}
              <span className="muted num" style={{ fontSize: '1rem', fontWeight: 500 }}>{pct(probs[top])} confidence</span>
            </div>
            {isAlert ? (
              <div className="banner critical">
                <Alert />
                <div><b>ALERT: {label} weapon detected.</b> In the proposed system this frame would be sent to a security
                  officer for human review, not acted on automatically.</div>
              </div>
            ) : (
              <div className="banner info"><Info />No alert: the model does not think this shows a weapon.</div>
            )}
            {actual && (
              <div className="muted" style={{ fontSize: '0.88rem' }}>
                Actual label of this test photo: <b className="ink2">{actual.replace('_', ' ')}</b>{' '}
                ({actual === label ? 'correct' : 'wrong'})
              </div>
            )}
            <ProbBars probs={probs} />
          </>
        )}
        <div className="banner info" style={{ fontSize: '0.82rem' }}>
          <Info />
          A student project with roughly {pct(exp?.testAcc, 0)} accuracy. It makes mistakes, and it is not a security product.
          Your image is processed only in this browser tab and is never uploaded.
        </div>
      </div>
    </div>
  )
}
