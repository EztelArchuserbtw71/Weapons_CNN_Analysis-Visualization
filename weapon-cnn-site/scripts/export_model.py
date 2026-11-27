"""Export a simple Keras Sequential CNN (.h5) as layer spec JSON + float32 weights .bin
so the website can rebuild it with TensorFlow.js layers and run it in the browser.

usage: python export_model.py WeaponCNN_C1.h5 out_dir tag
"""
import json, os, sys
import numpy as np
import keras

src, out_dir, tag = sys.argv[1:4]
model = keras.models.load_model(src)
spec, chunks, offset = [], [], 0
for layer in model.layers:
    kind = layer.__class__.__name__
    cfg = {'type': kind}
    if kind == 'Conv2D':
        cfg.update(filters=layer.filters, kernelSize=list(layer.kernel_size), activation=layer.get_config()['activation'])
    elif kind == 'MaxPooling2D':
        cfg.update(poolSize=list(layer.pool_size))
    elif kind == 'Dense':
        cfg.update(units=layer.units, activation=layer.get_config()['activation'])
    elif kind == 'Dropout':
        cfg.update(rate=layer.rate)
    elif kind not in ('Flatten', 'GlobalAveragePooling2D'):
        raise SystemExit(f'unsupported layer {kind}')
    ws = []
    for w in layer.get_weights():
        a = np.asarray(w, dtype='<f4')
        ws.append({'shape': list(a.shape), 'offset': offset, 'size': int(a.size)})
        chunks.append(a.tobytes())
        offset += a.size
    cfg['weights'] = ws
    spec.append(cfg)

os.makedirs(out_dir, exist_ok=True)
size = model.input_shape[1]
json.dump({'id': tag, 'inputSize': size, 'labels': ['harmless_object', 'melee', 'ranged', 'student'],
           'layers': spec, 'params': int(offset)},
          open(os.path.join(out_dir, 'model.json'), 'w'), indent=1)
open(os.path.join(out_dir, 'weights.bin'), 'wb').write(b''.join(chunks))
print('exported', tag, offset, 'params', round(offset * 4 / 1e6, 1), 'MB')

# reference prediction on a test image, to verify the JS port gives the same numbers
img = keras.utils.load_img('dataset/test/melee/melee_0107.jpg', target_size=(size, size))
x = keras.utils.img_to_array(img).reshape(1, size, size, 3) / 255
print('reference melee_0107:', model.predict(x, verbose=0)[0].round(5).tolist())
