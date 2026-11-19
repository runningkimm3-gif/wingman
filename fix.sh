#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

python3 - << 'PY'
import json, os, re

# ═══ manifest.json ═══
with open('manifest.json', encoding='utf-8') as f:
    m = json.load(f)

js = m['content_scripts'][0]['js']

# 3a. rewrite paths that live at repo root instead of adapters/
new_js = []
for p in js:
    if os.path.exists(p):
        new_js.append(p)
    elif os.path.exists(os.path.basename(p)):
        new_js.append(os.path.basename(p))
        print(f'  ↳ path fix: {p} -> {os.path.basename(p)}')
    else:
        new_js.append(p)
        print(f'  ⚠ missing file: {p}')

# 3b. ensure i18n.js loads FIRST (before content.js)
new_js = [x for x in new_js if x != 'i18n.js']
new_js.insert(0, 'i18n.js')
m['content_scripts'][0]['js'] = new_js

with open('manifest.json', 'w', encoding='utf-8') as f:
    json.dump(m, f, indent=2, ensure_ascii=False)
print('✓ manifest.json — i18n.js is now first, paths normalized')

# ═══ content.js ═══
with open('content.js', encoding='utf-8') as f:
    s = f.read()
orig = s

# 4a. ReferenceError: `adapters` is undefined
old = "const adapter = adapters.find(a => a?.urlPattern?.test(location.href));"
new = ("const adapters = Object.values(window.CupidAdapters || {});\n"
       "  const adapter = adapters.find(a => a?.urlPattern?.test(location.href));")
if old in s:
    s = s.replace(old, new, 1); print('✓ content.js — adapters ReferenceError fixed')
else:
    print('⚠ content.js — adapters line not found (already patched?)')

# 4b. broken placeholder attribute
if 'placeholder="placeholder="""' in s:
    s = s.replace('placeholder="placeholder="""', 'placeholder="e.g. ask her out"')
    print('✓ content.js — broken placeholder fixed')

# 4c. duplicate error <div>
bad = ('<div style="color:#ef4444;font-size:12px;text-align:center;padding:20px;font-family:monospace;">'
       '<div style="color:#ef4444;font-size:12px;text-align:center;padding:20px;font-family:monospace;">')
if bad in s:
    s = s.replace(bad, '<div style="color:#ef4444;font-size:12px;text-align:center;padding:20px;font-family:monospace;">')
    print('✓ content.js — duplicate error div fixed')

# 4d. localization block: shadow-aware + no listener leak
NEW = """let currentLang = 'en';
let _shadowRoot = null;
const availableLangs = ['en', 'my'];

function localizeUI(lang) {
    currentLang = lang;
    console.log(`[Cupid] Localizing UI to: ${lang}`);
    updateAllTranslatableElements();
}

function setupLanguageListener(shadow) {
    _shadowRoot = shadow;
    const select = shadow.getElementById('lang-select');
    if (select) {
        select.addEventListener('change', (e) => localizeUI(e.target.value));
    }
}

function updateAllTranslatableElements() {
    if (!_shadowRoot) return;
    const root = _shadowRoot;
    console.log(`[Localization] Updating elements for language ${currentLang}.`);

    const genBtn = root.getElementById('gen-btn');
    if (genBtn) genBtn.innerText = t(currentLang, 'generateBtnText');

    const headerTitle = root.querySelector('.header > span:first-child');
    if (headerTitle) headerTitle.textContent = t(currentLang, 'appName');

    const apiInput = root.getElementById('api-key');
    if (apiInput) apiInput.placeholder = t(currentLang, 'apiKeyPlaceholder');

    const settingLabels = root.querySelectorAll('.setting-label');
    if (settingLabels[0]) settingLabels[0].textContent = t(currentLang, 'apiTitle');

    const toggleLabel = root.querySelector('.toggle-label');
    if (toggleLabel) toggleLabel.textContent = t(currentLang, 'autoPilotLabel');

    const vibeKeys = { normal:'normalVibe', tease:'teaseVibe', chill:'chillVibe',
                       flirty:'flirtyVibe', argue:'argueVibe', persuade:'persuadeVibe' };
    root.querySelectorAll('.vibe-pill').forEach(p => {
        const k = vibeKeys[p.dataset.vibe];
        if (k) p.textContent = t(currentLang, k);
    });
}"""

pat = r"let currentLang = 'en';.*?setupLanguageListener\(\);\s*\n\}"
s2 = re.sub(pat, NEW, s, count=1, flags=re.DOTALL)
if s2 != s:
    s = s2; print('✓ content.js — localization block replaced (shadow-aware)')
else:
    print('⚠ content.js — localization block not matched')

# 4e. call the listener after the panel exists
if 'setupLanguageListener(shadow);' not in s:
    if 'shadow.appendChild(panel);' in s:
        s = s.replace('shadow.appendChild(panel);',
                      'shadow.appendChild(panel);\n  setupLanguageListener(shadow);', 1)
        print('✓ content.js — setupLanguageListener(shadow) called')
else:
    print('✓ content.js — setupLanguageListener already wired')

if s != orig:
    with open('content.js', 'w', encoding='utf-8') as f:
        f.write(s)
    print('✓ content.js saved')
PY
