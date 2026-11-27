# Weapon-in-Hand CNN · Experiment Explorer

A Vite + React website that presents the 12 CNN experiments (C1–C12) from our Data Science
project *CNN-Based Weapon-in-Hand Detection System for School CCTV* and lets visitors try the
trained model in their own browser.

**What's on the page**

- **Results**: test accuracy of every experiment, sorted, with the C1 baseline and chance level marked
- **Overfitting**: training vs test accuracy for each run
- **Explorer**: per-run accuracy/loss curves, headline numbers and the 16 hand-checked predictions
- **Safety view**: weapon photos flagged vs false alerts for each run
- **Try it**: the best plain CNN runs in the browser with TensorFlow.js; uploaded photos never leave the device
- **Method**: dataset, architecture, limitations and responsible-use notes

Everything is static (no server, no database), so it deploys anywhere.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Deploy on Vercel

1. Push this folder to a GitHub repository (see below).
2. On vercel.com, choose **Add New → Project** and import the repository.
3. Vercel detects **Vite** automatically (build command `npm run build`, output `dist`).
   If this folder is *inside* a bigger repository, set **Root Directory** to `weapon-cnn-site`.
4. Click **Deploy**.

## Push to GitHub

```bash
cd weapon-cnn-site
git init
git add .
git commit -m "Weapon CNN experiment explorer"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

`public/model/weights.bin` is about 19 MB. That is fine for GitHub (limit 100 MB per file) and Vercel.

## Where the data comes from

`src/data/results.json`, `public/model/` and `public/samples/` are generated from the executed
notebooks by `scripts/prepare_data.py`. To rebuild them after re-running notebooks, run this from
the `Weapons_CNN` folder:

```bash
.venv\Scripts\python.exe weapon-cnn-site\scripts\prepare_data.py        # picks the best plain CNN for "Try it"
.venv\Scripts\python.exe weapon-cnn-site\scripts\prepare_data.py C6     # or choose the demo model
```

| Script | Job |
|---|---|
| `clean_outputs.py` | collapses Keras progress-bar output in the notebooks to one line per epoch |
| `extract_results.py` | reads curves, test scores and the 16 predictions from each notebook |
| `export_model.py` | converts a `.h5` model to `model.json` + `weights.bin` for TensorFlow.js |

The browser copies Keras' preprocessing exactly (Pillow nearest-neighbour resize, then ÷255), so
"Try it" gives the same probabilities as the notebook.

## Privacy

Our own test photos (`my_photos_test/`) show real students, so they are **not** published.
The site shows the model's predictions for them, with a placeholder instead of the image. To publish
them anyway, get everyone's consent, copy the photos to `public/own/`, and set `SHOW_OWN_PHOTOS = true`
in `src/config.js`.
