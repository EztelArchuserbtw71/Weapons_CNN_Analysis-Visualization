"""Collapse Keras progress-bar spam in executed notebooks.

For every code cell, merge consecutive stream outputs of the same name, then
simulate the terminal: '\\r' returns to line start, '\\b' deletes a char.
Keep only the final state of each line. ANSI colour codes are stripped.
Rich outputs (images, execute_result) are left untouched.
"""
import json, re, sys

ANSI = re.compile(r'\x1b\[[0-9;]*m')


def render(text):
    out_lines = []
    for raw in text.split('\n'):
        line = []
        cur = 0
        for ch in ANSI.sub('', raw):
            if ch == '\r':
                cur = 0
                line = []          # keras rewrites the whole line after \r
            elif ch == '\b':
                if cur > 0:
                    cur -= 1
                    line = line[:cur]
            else:
                line[cur:cur + 1] = [ch]
                cur += 1
        out_lines.append(''.join(line).rstrip())
    return '\n'.join(out_lines)


def clean(path):
    nb = json.load(open(path, encoding='utf-8'))
    changed = 0
    for c in nb['cells']:
        if c['cell_type'] != 'code' or not c.get('outputs'):
            continue
        merged = []
        for o in c['outputs']:
            if (o['output_type'] == 'stream' and merged and merged[-1]['output_type'] == 'stream'
                    and merged[-1]['name'] == o['name']):
                merged[-1]['text'] += ''.join(o['text'])
            else:
                if o['output_type'] == 'stream':
                    o = dict(o, text=''.join(o['text']))
                merged.append(o)
        for o in merged:
            if o['output_type'] == 'stream':
                t = render(o['text'])
                # drop blank lines and the CPU-only GPU warning
                t = '\n'.join(l for l in t.split('\n')
                              if l.strip() and 'GPU support is not available' not in l)
                t = t + '\n' if t else ''
                o['text'] = t.splitlines(True)
        merged = [o for o in merged if not (o['output_type'] == 'stream' and not o['text'])]
        if merged != c['outputs']:
            changed += 1
        c['outputs'] = merged
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1, ensure_ascii=False)
    return changed


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(p, 'cells cleaned:', clean(p))
