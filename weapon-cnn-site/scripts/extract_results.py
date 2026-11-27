"""Read executed Weapon_CNN_C*.ipynb notebooks and write results.json for the website."""
import json, re, sys, os

proj, out = sys.argv[1], sys.argv[2]
LABELS = ['harmless_object', 'melee', 'ranged', 'student']
NUM = r'([0-9.]+(?:e[-+]?\d+)?)'

META = {
    'C1': ('Baseline', 'Adam optimizer, the reference every other run is compared to', 'baseline'),
    'C2': ('Adagrad', 'Optimizer Adam → Adagrad', 'optimizer'),
    'C3': ('SGD', 'Optimizer Adam → SGD', 'optimizer'),
    'C4': ('RMSprop', 'Optimizer Adam → RMSprop', 'optimizer'),
    'C5': ('10 epochs', 'Training length 4 → 10 epochs', 'training'),
    'C6': ('Batch 64', 'Batch size 32 → 64', 'training'),
    'C7': ('224×224 input', 'Image size 150×150 → 224×224', 'data'),
    'C8': ('4th conv block', 'Adds a Conv2D(256) + MaxPooling block', 'architecture'),
    'C9': ('Dropout 0.5', 'Adds Dropout(0.5) before Dense 128', 'architecture'),
    'C10': ('Augmentation', 'Random rotate / shift / zoom / flip on training images', 'data'),
    'C11': ('Global avg pooling', 'GlobalAveragePooling2D replaces Flatten', 'architecture'),
    'C12': ('MobileNetV2 transfer', 'Frozen ImageNet MobileNetV2 replaces the conv layers', 'architecture'),
}


def text_of(cell):
    return ''.join(''.join(o.get('text', '')) for o in cell.get('outputs', []) if o['output_type'] == 'stream')


def metric(line, key):
    m = re.search(r'(?<![a-z_])' + key + r': ' + NUM, line)
    return float(m.group(1)) if m else None


def parse(tag):
    path = os.path.join(proj, f'Weapon_CNN_{tag}.ipynb')
    nb = json.load(open(path, encoding='utf-8'))
    cells = [c for c in nb['cells'] if c['cell_type'] == 'code']
    res = {'id': tag, 'name': META[tag][0], 'change': META[tag][1], 'group': META[tag][2],
           'epochs': [], 'test': None, 'predictions': []}
    for c in cells:
        src = ''.join(c['source'])
        txt = text_of(c)
        if 'model.fit(' in src:
            for line in txt.split('\n'):
                if 'val_' in line:
                    sec = re.search(r'(\d+)s \d+m?s/step', line)
                    res['epochs'].append({
                        'acc': metric(line, 'accuracy'), 'loss': metric(line, 'loss'),
                        'val_acc': metric(line, 'val_accuracy'), 'val_loss': metric(line, 'val_loss'),
                        'sec': int(sec.group(1)) if sec else None})
        elif 'model.evaluate(' in src:
            for o in c.get('outputs', []):
                if o['output_type'] == 'execute_result':
                    loss, acc = json.loads(''.join(o['data']['text/plain']))
                    res['test'] = {'loss': loss, 'acc': acc}
        elif 'load_img(' in src and 'model.predict' in src:
            p = re.search(r"load_img\('([^']+)'", src).group(1)
            arr = re.search(r'\[\[([^\]]+)\]\]', txt)
            if not arr:
                continue
            probs = [float(x) for x in arr.group(1).split()]
            fname = p.split('/')[-1]
            actual = fname.rsplit('_test', 1)[0] if p.startswith('my_photos_test') else p.split('/')[-2]
            res['predictions'].append({
                'file': fname, 'set': 'ours' if p.startswith('my_photos_test') else 'typical',
                'actual': actual, 'probs': probs, 'pred': LABELS[probs.index(max(probs))]})
        elif 'model.summary' in src:
            pass
    if res['test'] is None and res['epochs']:   # evaluate == last epoch's validation
        e = res['epochs'][-1]
        res['test'] = {'loss': e['val_loss'], 'acc': e['val_acc']}
    return res


results = []
for i in range(1, 13):
    tag = f'C{i}'
    try:
        r = parse(tag)
        ok = r['test'] is not None and len(r['predictions']) == 16
        print(tag, 'OK' if ok else 'INCOMPLETE', r['test'], len(r['epochs']), 'epochs', len(r['predictions']), 'preds')
        if ok:
            results.append(r)
    except Exception as e:
        print(tag, 'ERROR', e)

os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({'labels': LABELS, 'trainImages': 15803, 'testImages': 880, 'experiments': results},
          open(out, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print('wrote', out)
