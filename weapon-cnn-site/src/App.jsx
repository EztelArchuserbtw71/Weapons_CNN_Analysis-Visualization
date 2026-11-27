import { useState } from 'react'
import { GITHUB_URL } from './config'
import { experiments, baseline, best, trainImages, testImages, pct, pp } from './lib/metrics'
import Leaderboard from './components/Leaderboard'
import GapChart from './components/GapChart'
import Explorer from './components/Explorer'
import AlertTable from './components/AlertTable'
import TryIt from './components/TryIt'
import { Moon, Sun } from './components/Icons'

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const t = document.documentElement.dataset.theme
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  function toggle() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* private mode */
    }
    setDark(!dark)
  }
  return (
    <button className="icon-btn" onClick={toggle} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
      {dark ? <Sun /> : <Moon />}
    </button>
  )
}

export default function App() {
  const [selected, setSelected] = useState(best.id)
  const select = (id) => {
    setSelected(id)
    document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const bestGain = best.testAcc - baseline.testAcc
  const mostCaught = Math.max(...experiments.map((e) => e.weaponsCaught))

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <a className="brand" href="#top"><img src="/favicon.svg" alt="" />Weapon-in-Hand CNN</a>
          <nav className="nav" aria-label="Sections">
            <a href="#results">Results</a>
            <a href="#overfitting">Overfitting</a>
            <a href="#explorer">Explorer</a>
            <a href="#alerts">Alerts</a>
            <a href="#try">Try it</a>
            <a href="#method">Method</a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="top">
        <div className="wrap hero">
          <div className="eyebrow">Data Science project · CNN image classification</div>
          <h1>Can a CNN tell a weapon in a hand from a harmless object?</h1>
          <p className="lede">
            We trained a convolutional neural network to sort school CCTV-style images into four classes:{' '}
            <b>student</b> (empty hand), <b>harmless object</b>, <b>melee weapon</b> and <b>ranged weapon</b>.
            Then we ran {experiments.length} experiments, changing one setting at a time, to see what actually makes it better.
          </p>
          <div className="tiles">
            <div className="tile hero-tile">
              <div className="label">Best test accuracy</div>
              <div className="value">{pct(best.testAcc)}</div>
              <div className="sub">{best.id} · {best.name}{best.id !== 'C1' && <> ({pp(bestGain)} vs baseline)</>}</div>
            </div>
            <div className="tile">
              <div className="label">Baseline (C1)</div>
              <div className="value">{pct(baseline.testAcc)}</div>
              <div className="sub">chance level is 25%</div>
            </div>
            <div className="tile">
              <div className="label">Experiments</div>
              <div className="value">{experiments.length}</div>
              <div className="sub">one change each</div>
            </div>
            <div className="tile">
              <div className="label">Images</div>
              <div className="value">{(trainImages + testImages).toLocaleString()}</div>
              <div className="sub">{trainImages.toLocaleString()} train · {testImages} test</div>
            </div>
          </div>
        </div>

        <section id="results" className="wrap">
          <div className="section-head">
            <div className="eyebrow">Results</div>
            <h2>Which change helped the most?</h2>
            <p className="lede">
              Accuracy on 880 test images the model never trained on, best first. Click a bar to open that experiment.
            </p>
          </div>
          <div className="card"><Leaderboard selected={selected} onSelect={select} /></div>
        </section>

        <section id="overfitting" className="wrap">
          <div className="section-head">
            <div className="eyebrow">Overfitting</div>
            <h2>Memorising vs. learning</h2>
            <p className="lede">
              When training accuracy (orange) runs far ahead of test accuracy (blue), the model is memorising the training
              photos instead of learning features that work on new ones. A short line means it generalises.
            </p>
          </div>
          <div className="card"><GapChart selected={selected} onSelect={select} /></div>
        </section>

        <section id="explorer" className="wrap">
          <div className="section-head">
            <div className="eyebrow">Experiment explorer</div>
            <h2>Look inside each run</h2>
            <p className="lede">Training curves, headline numbers and the model’s answers on 16 photos it never saw.</p>
          </div>
          <Explorer selected={selected} onSelect={setSelected} />
        </section>

        <section id="alerts" className="wrap">
          <div className="section-head">
            <div className="eyebrow">Safety view</div>
            <h2>Would it raise the alarm?</h2>
            <p className="lede">
              For a school, overall accuracy is not the whole story. A missed weapon is far worse than a false alarm that a
              guard dismisses. The best run flagged {mostCaught} of 8 weapon photos.
            </p>
          </div>
          <AlertTable selected={selected} onSelect={select} />
        </section>

        <section id="try" className="wrap">
          <div className="section-head">
            <div className="eyebrow">Try it</div>
            <h2>Classify your own photo</h2>
            <p className="lede">The trained network runs directly in your browser. Nothing is uploaded.</p>
          </div>
          <TryIt />
        </section>

        <section id="method" className="wrap">
          <div className="section-head">
            <div className="eyebrow">Method</div>
            <h2>How the experiments were run</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="n">1 · DATA</div>
              <h3>Four balanced classes</h3>
              <p>{trainImages.toLocaleString()} training images (about 3,950 per class) and {testImages} test images (220 per class), resized to 150×150 and scaled to 0–1.</p>
            </div>
            <div className="step">
              <div className="n">2 · MODEL</div>
              <h3>A small CNN</h3>
              <p>Three convolution + max-pooling blocks learn edges, shapes and objects; a dense layer and softmax output give a probability per class.</p>
            </div>
            <div className="step">
              <div className="n">3 · EXPERIMENTS</div>
              <h3>One change at a time</h3>
              <p>C1 is the baseline. C2–C12 each change a single setting (optimizer, epochs, batch size, image size, layers, dropout, augmentation, pooling or transfer learning) so the effect can be attributed to it.</p>
            </div>
            <div className="step">
              <div className="n">4 · EVALUATION</div>
              <h3>Accuracy + real photos</h3>
              <p>Each model is scored on the 880 test images, then checked by hand on 8 typical test photos and 8 of our own photos.</p>
            </div>
          </div>
          <div className="card" style={{ marginTop: 18 }}>
            <h3>Baseline architecture (C1)</h3>
            <div className="arch" aria-label="Model layers">
              <span>Input 150×150×3</span><i>→</i>
              <span>Conv2D 32</span><i>→</i><span>MaxPool</span><i>→</i>
              <span>Conv2D 64</span><i>→</i><span>MaxPool</span><i>→</i>
              <span>Conv2D 128</span><i>→</i><span>MaxPool</span><i>→</i>
              <span>Flatten</span><i>→</i><span>Dense 128 ReLU</span><i>→</i><span>Dense 4 softmax</span>
            </div>
            <p className="muted" style={{ fontSize: '0.88rem', marginTop: 10 }}>
              Adam optimizer · categorical cross-entropy · batch size 32 · 4 epochs · Keras / TensorFlow
            </p>
          </div>
          <div className="grid-2" style={{ marginTop: 18 }}>
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Limitations</h3>
              <ul className="list">
                <li>Each configuration was trained once; results can shift a few points between runs.</li>
                <li>The test set was also used as validation data during training, so a separate hold-out set is needed for a final estimate.</li>
                <li>Most runs use only 4 epochs, so slower optimizers had less chance to converge.</li>
                <li>Whole images are shrunk to 150×150, so a small object in a hand may cover only a few pixels.</li>
                <li>The hand-checked sample is only 16 photos per run.</li>
              </ul>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Responsible use</h3>
              <ul className="list">
                <li>The system only <b>flags</b> frames for a human to review. It never decides on its own.</li>
                <li>Recall on the weapon classes matters more than overall accuracy: a missed weapon is the worst error.</li>
                <li>Our own test photos show real students, so they are not published here; only the model’s answers are shown.</li>
                <li>This is a classroom prototype, not a security product.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="wrap">
        CNN-Based Weapon-in-Hand Detection System for School CCTV · Data Science class project
        {GITHUB_URL && <> · <a href={GITHUB_URL}>Source on GitHub</a></>}
      </footer>
    </>
  )
}
