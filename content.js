(() => {
  console.log('[Cupid] loaded', location.href);
  if (document.querySelector('[data-cupid-mounted]')) return;
  if (!window.CupidAdapters) return;

  let currentLang = 'en';
  let _shadowRoot = null;

  function localizeUI(lang) {
    currentLang = lang;
    try { chrome.storage.local.set({ cupid_lang: lang }); } catch (e) {}
    updateAllTranslatableElements();
  }

  function setupLanguageListener(shadow) {
    _shadowRoot = shadow;
    const select = shadow.getElementById('lang-select');
    if (select) select.addEventListener('change', (e) => localizeUI(e.target.value));
  }

  function updateAllTranslatableElements() {
    if (!_shadowRoot) return;
    const root = _shadowRoot;
    const apiInput = root.getElementById('api-key');
    if (apiInput) apiInput.placeholder = 'gsk_...';
    const langSelect = root.getElementById('lang-select');
    if (langSelect) langSelect.value = currentLang;
  }

  const adapters = Object.values(window.CupidAdapters || {});
  const adapter = adapters.find(a => a && a.urlPattern && a.urlPattern.test(location.href));
  if (!adapter) return;

  const host = document.createElement('div');
  host.setAttribute('data-cupid-mounted', 'true');
  host.style.cssText = 'position:fixed; inset:0; z-index:2147483647; pointer-events:none;';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
    :host { all: initial; font-family: 'Poppins', -apple-system, system-ui, sans-serif; }

    .dock {
      position: fixed; bottom: 90px; right: 28px;
      width: 54px; height: 70px; border-radius: 9px;
      background: linear-gradient(145deg, rgba(255,255,255,0.62) 0%, rgba(255,245,250,0.5) 100%);
      backdrop-filter: blur(22px) saturate(180%);
      -webkit-backdrop-filter: blur(22px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.8);
      box-shadow: 0 10px 34px rgba(236,72,153,0.28), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.95);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: auto; overflow: hidden;
    }
    .dock::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(circle at 50% 48%, rgba(252,231,243,0.85) 0%, transparent 70%);
      pointer-events: none; z-index: 1;
    }
    .dock:hover { transform: scale(1.08) translateY(-3px) rotate(-2deg); box-shadow: 0 16px 44px rgba(236,72,153,0.48); }
    .dock .heart {
      font-size: 30px; color: #ec4899; filter: drop-shadow(0 2px 4px rgba(236,72,153,0.45));
      position: relative; z-index: 2; font-family: 'Poppins', sans-serif;
    }
    .card-corner-top {
      position: absolute; top: 5px; left: 6px; font-size: 9px; font-weight: 900; color: #ec4899;
      z-index: 3; font-family: 'Poppins', sans-serif; line-height: 1; text-align: center; opacity: 0.9;
    }
    .card-corner-bot {
      position: absolute; bottom: 5px; right: 6px; font-size: 9px; font-weight: 900; color: #ec4899;
      z-index: 3; font-family: 'Poppins', sans-serif; line-height: 1; text-align: center;
      transform: rotate(180deg); opacity: 0.9;
    }
    .dock.load-flash { animation: flash 0.8s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes flash { 0% { transform: scale(0); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
    .dock.active-glow { animation: glow 0.8s infinite alternate; }
    @keyframes glow { from { box-shadow: 0 0 20px rgba(236,72,153,0.5); } to { box-shadow: 0 0 44px rgba(236,72,153,0.95); } }

    .panel {
      position: fixed; bottom: 170px; right: 28px;
      width: 370px; max-height: 78vh; overflow-y: auto;
      background: rgba(255,255,255,0.28);
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.55);
      border-radius: 22px; padding: 20px;
      box-shadow: 0 24px 60px rgba(236,72,153,0.18), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.85);
      display: none; flex-direction: column; gap: 14px;
      color: #1a1a1a; pointer-events: auto;
      scrollbar-width: thin; scrollbar-color: rgba(236,72,153,0.3) transparent;
    }
    .panel::-webkit-scrollbar { width: 5px; }
    .panel::-webkit-scrollbar-thumb { background: rgba(236,72,153,0.3); border-radius: 3px; }
    .panel.open { display: flex; animation: dealPanel 0.4s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes dealPanel { from { opacity: 0; transform: translateY(24px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .panel::before { content: '\u2665'; position: absolute; top: 8px; left: 11px; font-size: 13px; color: rgba(236,72,153,0.4); font-weight: 900; pointer-events: none; }
    .panel::after { content: '\u2665'; position: absolute; bottom: 8px; right: 11px; font-size: 13px; color: rgba(236,72,153,0.4); font-weight: 900; transform: rotate(180deg); pointer-events: none; }

    .header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 0 14px 0; border-bottom: 1px dashed rgba(236,72,153,0.28);
      position: sticky; top: -20px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      margin: -20px -20px 0; padding: 18px 20px 14px; z-index: 2;
      border-radius: 22px 22px 0 0;
    }
    .brand { font-size: 17px; font-weight: 800; color: #ec4899; display: flex; align-items: center; gap: 6px; letter-spacing: -0.3px; }
    .brand-icon { font-size: 16px; }
    .controls { display: flex; gap: 6px; align-items: center; }
    .controls select {
      padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.7);
      background: rgba(255,255,255,0.5);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      font-size: 10px; font-weight: 700; cursor: pointer; outline: none; color: #4b5563;
      font-family: 'Poppins', sans-serif;
    }
    .close-x { cursor: pointer; color: #9ca3af; font-size: 15px; line-height: 1; padding: 5px; border-radius: 6px; transition: all 0.15s; background: rgba(255,255,255,0.3); }
    .close-x:hover { color: #ec4899; background: rgba(255,255,255,0.6); }

    .label { font-size: 9px; color: rgba(107,114,128,0.9); font-weight: 800; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 7px; display: block; }
    input[type="password"], input[type="text"] {
      width: 100%; box-sizing: border-box;
      background: rgba(255,255,255,0.55);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.75);
      color: #1a1a1a; padding: 11px 13px; border-radius: 12px;
      font-size: 12px; font-family: 'Poppins', sans-serif; outline: none;
      transition: all 0.2s; box-shadow: inset 0 1px 1px rgba(255,255,255,0.6);
    }
    input:focus { border-color: #ec4899; background: rgba(255,255,255,0.75); box-shadow: 0 0 0 3px rgba(236,72,153,0.15); }
    input::placeholder { color: rgba(156,163,175,0.85); }
    .groq-link { display: inline-flex; align-items: center; gap: 4px; margin-top: 7px; font-size: 10px; font-weight: 700; color: #ec4899; text-decoration: none; transition: opacity 0.2s; font-family: 'Poppins', sans-serif; }
    .groq-link:hover { opacity: 0.75; text-decoration: underline; }

    .row-toggle { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 11px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.6); }
    .row-toggle label { font-size: 12px; font-weight: 700; color: #374151; font-family: 'Poppins', sans-serif; }
    .switch { position: relative; width: 40px; height: 22px; background: rgba(229,231,235,0.7); border-radius: 11px; cursor: pointer; transition: 0.3s; }
    .switch.active { background: linear-gradient(135deg, #ec4899, #a855f7); }
    .switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .switch.active::after { transform: translateX(18px); }

    .vibe-row { display: flex; gap: 6px; overflow-x: auto; padding: 2px; scrollbar-width: none; }
    .vibe-row::-webkit-scrollbar { display: none; }
    .vibe-pill { flex: 0 0 auto; padding: 7px 12px; border-radius: 14px; font-size: 10px; font-weight: 800; background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.65); color: #6b7280; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-family: 'Poppins', sans-serif; }
    .vibe-pill:hover { border-color: rgba(236,72,153,0.5); background: rgba(255,255,255,0.7); }
    .vibe-pill.active { background: linear-gradient(135deg, #ec4899, #a855f7); color: #fff; border-color: transparent; box-shadow: 0 4px 14px rgba(236,72,153,0.4); }

    .actions-row { display: flex; gap: 8px; }
    .btn-action { flex: 1; padding: 12px; border-radius: 13px; font-size: 12px; font-weight: 800; letter-spacing: 0.3px; cursor: pointer; transition: all 0.2s; border: none; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: 'Poppins', sans-serif; }
    .btn-rescan { background: rgba(255,255,255,0.55); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: #ec4899; border: 1px solid rgba(255,255,255,0.75); box-shadow: inset 0 1px 1px rgba(255,255,255,0.8); }
    .btn-rescan:hover { background: rgba(255,255,255,0.8); border-color: rgba(236,72,153,0.4); }
    .btn-deal { background: linear-gradient(135deg, #ec4899, #a855f7); color: #fff; box-shadow: 0 6px 18px rgba(236,72,153,0.4), inset 0 1px 1px rgba(255,255,255,0.3); }
    .btn-deal:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(236,72,153,0.55); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .results { display: flex; flex-direction: column; gap: 12px; }

    .vibe-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.58) 0%, rgba(252,231,243,0.45) 100%);
      backdrop-filter: blur(24px) saturate(170%);
      -webkit-backdrop-filter: blur(24px) saturate(170%);
      border: 1.5px solid rgba(236,72,153,0.45);
      border-radius: 16px; padding: 16px 18px;
      box-shadow: 0 10px 32px rgba(236,72,153,0.22), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.95);
      position: relative; overflow: hidden;
      animation: dealBubble 0.45s cubic-bezier(0.34,1.56,0.64,1);
    }
    .vibe-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #ec4899, #a855f7, #ec4899); }
    .vibe-card::after { content: '\u2665'; position: absolute; bottom: 6px; right: 10px; font-size: 48px; color: rgba(236,72,153,0.07); font-weight: 900; pointer-events: none; line-height: 1; }
    .vibe-title { font-size: 10px; letter-spacing: 1.7px; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-weight: 900; color: #ec4899; text-transform: uppercase; }
    .vibe-hearts { gap: 5px; margin-bottom: 12px; display: flex; }
    .vibe-heart { font-size: 23px; line-height: 1; }
    .vibe-heart.on { color: #ec4899; filter: drop-shadow(0 2px 5px rgba(236,72,153,0.55)); }
    .vibe-heart.off { color: rgba(251,207,232,0.6); }
    .vibe-desc { font-size: 12px; line-height: 1.6; font-weight: 500; color: #1a1a1a; padding-top: 10px; border-top: 1px solid rgba(236,72,153,0.2); }
    .vibe-insight { margin-top: 9px; padding-top: 8px; border-top: 1px dashed rgba(236,72,153,0.22); font-size: 11px; color: #6b7280; font-style: italic; line-height: 1.45; }

    .scam-card { background: rgba(254,242,242,0.65); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); border: 1.5px solid rgba(239,68,68,0.65); border-radius: 16px; padding: 14px 16px; animation: scamPulse 2s infinite, dealBubble 0.4s; }
    @keyframes scamPulse { 0%,100% { box-shadow: 0 4px 18px rgba(239,68,68,0.2); } 50% { box-shadow: 0 6px 28px rgba(239,68,68,0.45); } }
    .scam-header { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 900; color: #dc2626; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 9px; }
    .scam-confidence { font-size: 11px; color: #991b1b; font-weight: 800; margin-bottom: 9px; }
    .scam-flags { margin: 0 0 9px; padding-left: 18px; font-size: 11px; color: #7f1d1d; line-height: 1.6; font-weight: 500; }
    .scam-flags li { margin-bottom: 2px; }
    .scam-advice { background: rgba(254,202,202,0.7); padding: 9px 11px; border-radius: 10px; font-size: 11px; font-weight: 700; color: #7f1d1d; line-height: 1.45; }

    .bubble {
      position: relative; background: rgba(255,255,255,0.5);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid rgba(255,255,255,0.7);
      border-radius: 16px; padding: 13px 15px; margin-bottom: 14px;
      box-shadow: 0 6px 20px rgba(236,72,153,0.1), inset 0 1px 1px rgba(255,255,255,0.85);
      transition: all 0.25s;
      animation: dealBubble 0.5s cubic-bezier(0.34,1.56,0.64,1) backwards;
    }
    .bubble:nth-child(2) { transform: rotate(-0.7deg); }
    .bubble:nth-child(3) { transform: rotate(0deg); animation-delay: 0.08s; }
    .bubble:nth-child(4) { transform: rotate(0.7deg); animation-delay: 0.16s; }
    @keyframes dealBubble { from { opacity: 0; transform: translateY(-18px) rotate(-5deg) scale(0.88); } }
    .bubble:hover { transform: rotate(0deg) translateX(3px); border-color: rgba(236,72,153,0.5); box-shadow: 0 10px 30px rgba(236,72,153,0.22); }
    .bubble::after { content: ''; position: absolute; left: 26px; bottom: -9px; width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; border-top: 9px solid rgba(255,255,255,0.7); }
    .bubble::before { content: ''; position: absolute; left: 27px; bottom: -7px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid rgba(255,255,255,0.5); z-index: 1; }
    .bubble-tone { display: flex; align-items: center; gap: 6px; font-size: 9px; font-weight: 900; color: #ec4899; text-transform: uppercase; letter-spacing: 1.3px; margin-bottom: 8px; }
    .bubble-tone .suit { font-size: 12px; }
    .bubble-text { font-size: 13px; line-height: 1.55; color: #1a1a1a; margin-bottom: 11px; word-break: break-word; white-space: pre-wrap; font-weight: 500; }
    .bubble-actions { display: flex; gap: 6px; }
    .bubble-btn { flex: 1; padding: 8px; border-radius: 10px; font-size: 10px; font-weight: 800; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.75); background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #ec4899; letter-spacing: 0.4px; font-family: 'Poppins', sans-serif; }
    .bubble-btn:hover { background: rgba(255,255,255,0.85); border-color: rgba(236,72,153,0.4); }
    .bubble-btn.use { background: linear-gradient(135deg, #ec4899, #a855f7); color: #fff; border-color: transparent; box-shadow: 0 3px 10px rgba(236,72,153,0.35); }
    .bubble-btn.use:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(236,72,153,0.5); }

    .loading { padding: 22px 14px; text-align: center; font-size: 11px; color: rgba(107,114,128,0.9); font-weight: 600; }
    .error-msg { padding: 22px 14px; text-align: center; font-size: 11px; color: #ef4444; font-weight: 700; }
  `;
  shadow.appendChild(style);

  const dock = document.createElement('div');
  dock.className = 'dock load-flash';
  dock.innerHTML = '<span class="card-corner-top">A&hearts;</span><span class="heart">&hearts;</span><span class="card-corner-bot">&hearts;A</span>';
  setTimeout(() => dock.classList.remove('load-flash'), 800);
  shadow.appendChild(dock);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="header">
      <div class="brand"><span class="brand-icon">&hearts;</span><span>Cupid</span></div>
      <div class="controls">
        <select id="lang-select"><option value="en">EN</option><option value="my">မြန်မာ</option></select>
        <span class="close-x" id="close-x">✕</span>
      </div>
    </div>
    <div>
      <span class="label" id="api-label">Authentication</span>
      <input type="password" id="api-key" placeholder="gsk_..." autocomplete="off" />
      <a href="https://console.groq.com/keys" target="_blank" class="groq-link">🔑 Get Groq API Key ↗</a>
    </div>
    <div class="row-toggle">
      <label id="toggle-label">Auto-Pilot</label>
      <div class="switch" id="auto-toggle"></div>
    </div>
    <div>
      <span class="label">Directive</span>
      <input type="text" id="auto-direction" placeholder="e.g. ask her out for coffee" autocomplete="off" />
    </div>
    <div>
      <span class="label">Vibe</span>
      <div class="vibe-row" id="vibe-container">
        <div class="vibe-pill" data-vibe="normal">♠ Normal</div>
        <div class="vibe-pill active" data-vibe="tease">♥ Tease</div>
        <div class="vibe-pill" data-vibe="chill">♣ Chill</div>
        <div class="vibe-pill" data-vibe="flirty">♦ Flirty</div>
        <div class="vibe-pill" data-vibe="argue">🃏 Argue</div>
        <div class="vibe-pill" data-vibe="persuade">🎴 Persuade</div>
      </div>
    </div>
    <div class="actions-row">
      <button class="btn-action btn-rescan" id="rescan-btn"><span>↻</span> Rescan</button>
      <button class="btn-action btn-deal" id="deal-btn"><span>&hearts;</span> Deal</button>
    </div>
    <div class="results" id="results"></div>
  `;
  shadow.appendChild(panel);
  setupLanguageListener(shadow);

  const $ = (id) => shadow.getElementById(id);
  const apiKeyInput = $('api-key');
  const toggleBtn = $('auto-toggle');
  const resultsDiv = $('results');
  const dealBtn = $('deal-btn');
  const rescanBtn = $('rescan-btn');
  const vibeContainer = $('vibe-container');
  const autoDirectionInput = $('auto-direction');

  let currentStyle = 'tease';
  vibeContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.vibe-pill');
    if (!pill) return;
    vibeContainer.querySelectorAll('.vibe-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentStyle = pill.dataset.vibe;
  });

  chrome.storage.local.get(['apiKey', 'autoDirection', 'cupid_lang'], (res) => {
    if (res.apiKey) apiKeyInput.value = res.apiKey;
    if (res.autoDirection) autoDirectionInput.value = res.autoDirection;
    if (res.cupid_lang) localizeUI(res.cupid_lang);
    toggleBtn.classList.remove('active');
    chrome.storage.local.set({ autoReply: false });
  });

  apiKeyInput.addEventListener('input', () => chrome.storage.local.set({ apiKey: apiKeyInput.value }));
  autoDirectionInput.addEventListener('input', () => chrome.storage.local.set({ autoDirection: autoDirectionInput.value }));
  toggleBtn.addEventListener('click', () => {
    toggleBtn.classList.toggle('active');
    chrome.storage.local.set({ autoReply: toggleBtn.classList.contains('active') });
  });

  dock.addEventListener('click', () => panel.classList.toggle('open'));
  $('close-x').addEventListener('click', () => panel.classList.remove('open'));

  async function updateGlobalStyle() {
    try {
      const messages = adapter.getRecentMessages() || [];
      const myMsgs = messages.filter(m => m.from === 'me').map(m => m.text);
      if (myMsgs.length === 0) return;
      const res = await chrome.storage.local.get(['cupid_global_style']);
      let globalStyle = res.cupid_global_style || [];
      globalStyle = [...new Set([...myMsgs, ...globalStyle])].slice(0, 50);
      chrome.storage.local.set({ cupid_global_style: globalStyle });
    } catch (e) {}
  }
  setInterval(updateGlobalStyle, 10000);

  async function fetchReplies() {
    const key = apiKeyInput.value.trim();
    if (!key) return { error: 'MISSING_KEY', message: 'Please add your Groq API key.' };

    dock.classList.add('active-glow');
    dealBtn.disabled = true;
    rescanBtn.disabled = true;

    const partnerName = adapter.getPartnerName() || 'Unknown';
    const messages = adapter.getRecentMessages() || [];
    const res = await chrome.storage.local.get(['cupid_global_style']);
    const globalStyle = res.cupid_global_style || [];

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'GENERATE_REPLIES',
        payload: { apiKey: key, partnerName, messages, replyStyle: currentStyle, autoDirection: autoDirectionInput.value, globalStyle }
      }, (response) => {
        dock.classList.remove('active-glow');
        dealBtn.disabled = false;
        rescanBtn.disabled = false;
        if (chrome.runtime.lastError) resolve({ error: 'RUNTIME_ERROR', message: chrome.runtime.lastError.message });
        else if (!response) resolve({ error: 'NO_RESPONSE', message: 'Background script did not respond.' });
        else resolve(response);
      });
    });
  }

  function renderVibeCard(r) {
    const score = Math.max(1, Math.min(5, Math.round(r.vibe_score || 3)));
    let heartsHtml = '';
    for (let i = 0; i < 5; i++) {
      heartsHtml += '<span class="vibe-heart ' + (i < score ? 'on' : 'off') + '">' + (i < score ? '\u2665' : '\u2661') + '</span>';
    }
    const mood = (r.vibe_mood || 'neutral').toUpperCase();
    const card = document.createElement('div');
    card.className = 'vibe-card';
    card.innerHTML = '<div class="vibe-title">\u2665 VIBE CHECK \u00B7 ' + mood + '</div>' +
                     '<div class="vibe-hearts">' + heartsHtml + '</div>' +
                     '<div class="vibe-desc"></div>' +
                     '<div class="vibe-insight"></div>';
    card.querySelector('.vibe-desc').textContent = r.vibe_review || '';
    const ins = card.querySelector('.vibe-insight');
    if (r.chat_insight) { ins.textContent = '\uD83D\uDCAD ' + r.chat_insight; }
    else { ins.style.display = 'none'; }
    resultsDiv.appendChild(card);
  }

  function renderScamAlert(scam) {
    const card = document.createElement('div');
    card.className = 'scam-card';
    card.innerHTML = '<div class="scam-header"><span>\u26A0</span> SCAM ALERT</div>' +
                     '<div class="scam-confidence">Confidence: ' + (scam.confidence || 0) + '%</div>' +
                     '<ul class="scam-flags"></ul>' +
                     '<div class="scam-advice"></div>';
    const ul = card.querySelector('.scam-flags');
    (scam.red_flags || []).forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      ul.appendChild(li);
    });
    card.querySelector('.scam-advice').textContent = scam.advice || 'Exercise caution. Never send money or personal info.';
    resultsDiv.appendChild(card);
  }

  function renderBubble(tone, text) {
    const suits = { playful: '\u2660', warm: '\u2665', bold: '\u2666' };
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = '<div class="bubble-tone"><span class="suit">' + (suits[tone] || '\u2663') + '</span> ' + tone + '</div>' +
                       '<div class="bubble-text"></div>' +
                       '<div class="bubble-actions">' +
                       '<button class="bubble-btn use">\u2665 Use</button>' +
                       '<button class="bubble-btn copy">\uD83D\uDCCB Copy</button>' +
                       '</div>';
    bubble.querySelector('.bubble-text').textContent = text;
    bubble.querySelector('.use').addEventListener('click', () => {
      adapter.insertReply(text);
      panel.classList.remove('open');
    });
    bubble.querySelector('.copy').addEventListener('click', (e) => {
      navigator.clipboard.writeText(text);
      const btn = e.currentTarget;
      const orig = btn.textContent;
      btn.textContent = '\u2713 Copied';
      setTimeout(() => btn.textContent = orig, 1200);
    });
    resultsDiv.appendChild(bubble);
  }

  async function handleGenerate() {
    resultsDiv.innerHTML = '<div class="loading">Analyzing chat...</div>';
    dealBtn.disabled = true;
    rescanBtn.disabled = true;

    const response = await fetchReplies();
    dealBtn.disabled = false;
    rescanBtn.disabled = false;

    if (!response || response.error) {
      resultsDiv.innerHTML = '<div class="error-msg"></div>';
      resultsDiv.querySelector('.error-msg').textContent = (response && (response.message || response.error)) || 'Unknown error';
      return;
    }

    resultsDiv.innerHTML = '';
    if (response.vibe_review || response.vibe_score || response.vibe_mood) renderVibeCard(response);
    if (response.scam_alert && response.scam_alert.detected) renderScamAlert(response.scam_alert);
    ['playful', 'warm', 'bold'].forEach(tone => {
      if (response[tone]) renderBubble(tone, response[tone]);
    });
  }

  dealBtn.addEventListener('click', handleGenerate);
  rescanBtn.addEventListener('click', handleGenerate);

  const apState = { lastKey: null, pendingTimer: null, isProcessing: false, lastSentAt: 0 };

  setInterval(async () => {
    if (!toggleBtn.classList.contains('active')) return;
    if (apState.isProcessing) return;
    if (Date.now() - apState.lastSentAt < 10000) return;

    const messages = adapter.getRecentMessages() || [];
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.from !== 'them') return;

    const key = messages.length + '|' + lastMsg.text;
    if (key === apState.lastKey) return;
    apState.lastKey = key;

    if (apState.pendingTimer) clearTimeout(apState.pendingTimer);

    apState.pendingTimer = setTimeout(async () => {
      const nowMsgs = adapter.getRecentMessages() || [];
      if (nowMsgs.length === 0) return;
      const nowLast = nowMsgs[nowMsgs.length - 1];
      if (nowLast.from !== 'them') return;
      if ((nowMsgs.length + '|' + nowLast.text) !== key) return;

      apState.isProcessing = true;
      dock.classList.add('active-glow');

      const response = await fetchReplies();
      apState.isProcessing = false;

      if (!response || response.error) {
        dock.classList.remove('active-glow');
        return;
      }
      if (response.scam_alert && response.scam_alert.detected) {
        console.warn('[Cupid Auto-Pilot] BLOCKED - scam detected');
        dock.classList.remove('active-glow');
        return;
      }
      if (response.vibe_score && response.vibe_score <= 1) {
        console.warn('[Cupid Auto-Pilot] BLOCKED - vibe too cold');
        dock.classList.remove('active-glow');
        return;
      }
      if (!response.auto_reply) {
        dock.classList.remove('active-glow');
        return;
      }

      setTimeout(() => {
        adapter.insertReply(response.auto_reply);
        setTimeout(() => {
          adapter.sendMessage();
          dock.classList.remove('active-glow');
          apState.lastSentAt = Date.now();
        }, 1200);
      }, 1200);
    }, 4000);
  }, 2000);

})();
