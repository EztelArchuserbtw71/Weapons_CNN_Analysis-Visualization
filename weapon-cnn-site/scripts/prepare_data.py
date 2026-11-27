"""Build the website's data from the executed notebooks.

Run from the Weapons_CNN folder with the project venv:
    .venv\\Scripts\\python.exe weapon-cnn-site\\scripts\\prepare_data.py [DEMO_ID]

1. cleans the Keras progress-bar spam out of the notebooks' saved outputs
2. extracts results (curves, test scores, 16 predictions) -> src/data/results.json
3. exports the demo model (best plain CNN, or DEMO_ID) -> public/model/
4. copies the 8 typical test photos -> public/samples/
   (our own photos are NOT copied: see SHOW_OWN_PHOTOS in src/config.js)
"""
import glob, json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
PROJ = os.path.dirname(SITE)
PY = sys.executable
os.chdir(PROJ)

nbs = sorted(glob.glob('Weapon_CNN_C*.ipynb'))
subprocess.run([PY, os.path.join(HERE, 'clean_outputs.py'), *nbs], check=True)

results_path = os.path.join(SITE, 'src', 'data', 'results.json')
subprocess.run([PY, os.path.join(HERE, 'extract_results.py'), PROJ, results_path], check=True)
data = json.load(open(results_path, encoding='utf-8'))

# demo model: best test accuracy among plain CNNs (C12 uses MobileNetV2, not exportable here)
exportable = [e for e in data['experiments'] if e['id'] != 'C12' and os.path.exists(f"WeaponCNN_{e['id']}.h5")]
if len(sys.argv) > 1:
    demo = sys.argv[1]
else:
    demo = max(exportable, key=lambda e: e['test']['acc'])['id']
model_dir = os.path.join(SITE, 'public', 'model')
subprocess.run([PY, os.path.join(HERE, 'export_model.py'), f'WeaponCNN_{demo}.h5', model_dir, demo], check=True)
spec = json.load(open(os.path.join(model_dir, 'model.json')))
data['demoModel'] = {'id': demo, 'params': spec['params'],
                     'mb': round(os.path.getsize(os.path.join(model_dir, 'weights.bin')) / 1e6, 1)}
json.dump(data, open(results_path, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)

samples = os.path.join(SITE, 'public', 'samples')
os.makedirs(samples, exist_ok=True)
for p in data['experiments'][0]['predictions']:
    if p['set'] == 'typical':
        shutil.copy(os.path.join('dataset', 'test', p['actual'], p['file']), samples)
print('demo model:', demo, '| experiments:', [e['id'] for e in data['experiments']])
