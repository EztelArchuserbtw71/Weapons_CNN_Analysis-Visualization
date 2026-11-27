// Rebuilds the trained Keras CNN in TensorFlow.js from model.json + weights.bin
// (exported from the .h5 file) and classifies images entirely in the browser.
// Nothing the visitor uploads is sent anywhere.

// Source pixel for each output pixel, matching Pillow's NEAREST resize exactly
// (which is what Keras load_img uses). Pillow walks the source by repeated
// addition, so the floating-point rounding at exact boundaries matters:
// copy it step for step.
export function pilNearestIndex(n, s) {
  const a = n / s
  let v = a * 0.5
  const out = new Int32Array(s)
  for (let i = 0; i < s; i++) {
    out[i] = Math.min(n - 1, Math.trunc(v))
    v += a
  }
  return out
}

// Same preprocessing as the notebooks: nearest-neighbour resize, then / 255.
// `rgba` is RGBA pixel data (from canvas getImageData) of a w x h image.
export function toInputArray(rgba, w, h, s) {
  const xs = pilNearestIndex(w, s)
  const ys = pilNearestIndex(h, s)
  const out = new Float32Array(s * s * 3)
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const si = (ys[y] * w + xs[x]) * 4
      const di = (y * s + x) * 3
      out[di] = rgba[si] / 255
      out[di + 1] = rgba[si + 1] / 255
      out[di + 2] = rgba[si + 2] / 255
    }
  }
  return out
}

// Rebuild the Sequential model layer by layer and load the exported weights.
export function buildModel(tf, spec, buf) {
  const all = new Float32Array(buf)
  const model = tf.sequential()
  const s = spec.inputSize
  spec.layers.forEach((l, i) => {
    const first = i === 0 ? { inputShape: [s, s, 3] } : {}
    switch (l.type) {
      case 'Conv2D':
        model.add(tf.layers.conv2d({ ...first, filters: l.filters, kernelSize: l.kernelSize, activation: l.activation }))
        break
      case 'MaxPooling2D':
        model.add(tf.layers.maxPooling2d({ ...first, poolSize: l.poolSize }))
        break
      case 'Flatten':
        model.add(tf.layers.flatten(first))
        break
      case 'GlobalAveragePooling2D':
        model.add(tf.layers.globalAveragePooling2d(first))
        break
      case 'Dropout':
        model.add(tf.layers.dropout({ ...first, rate: l.rate }))
        break
      case 'Dense':
        model.add(tf.layers.dense({ ...first, units: l.units, activation: l.activation }))
        break
      default:
        throw new Error('Unsupported layer ' + l.type)
    }
  })
  spec.layers.forEach((l, i) => {
    if (!l.weights.length) return
    model.layers[i].setWeights(
      l.weights.map((w) => tf.tensor(all.subarray(w.offset, w.offset + w.size), w.shape)),
    )
  })
  return model
}

let cached = null

export function loadClassifier(base = import.meta.env.BASE_URL + 'model/') {
  if (cached) return cached
  cached = (async () => {
    const tf = await import('@tensorflow/tfjs')
    const [spec, buf] = await Promise.all([
      fetch(base + 'model.json').then((r) => {
        if (!r.ok) throw new Error('model.json ' + r.status)
        return r.json()
      }),
      fetch(base + 'weights.bin').then((r) => {
        if (!r.ok) throw new Error('weights.bin ' + r.status)
        return r.arrayBuffer()
      }),
    ])
    const model = buildModel(tf, spec, buf)
    const s = spec.inputSize

    async function classify(img) {
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      const rgba = ctx.getImageData(0, 0, w, h).data
      const x = tf.tensor4d(toInputArray(rgba, w, h, s), [1, s, s, 3])
      const y = model.predict(x)
      const probs = Array.from(await y.data())
      x.dispose()
      y.dispose()
      return probs
    }

    return { classify, spec }
  })()
  cached.catch(() => {
    cached = null
  })
  return cached
}
