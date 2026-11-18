(() => {
  if (document.querySelector('[data-cupid-mounted]')) return;
  if (!window.CupidAdapters) return;

  const adapters = Object.values(window.CupidAdapters);
  const adapter = adapters.find(a => a?.urlPattern?.test(location.href));
  if (!adapter) return;

  const host = document.createElement('div');
  host.setAttribute('data-cupid-mounted', 'true');
  host.style.cssText = 'position:fixed; inset:0; z-index:2147483647; pointer-events:none;';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .dock { 
      position: fixed; bottom: 90px; right: 28px; width: 46px; height: 46px; border-radius: 50%; 
      background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
      border: 1px solid rgba(251, 207, 232, 0.8); 
      box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15), 0 2px 8px rgba(0,0,0,0.05); 
      cursor: pointer; display: flex; align-items: center; justify-content: center; 
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
      animation: breathe 3s infinite ease-in-out;
      pointer-events: auto;
    }
    .dock:hover { transform: scale(1.1) translateY(-2px); box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3); }
    @keyframes load-flash {
      0% { transform: scale(0); opacity: 0; box-shadow: 0 0 40px rgba(251, 207, 232, 1); }
      50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 30px rgba(233, 213, 255, 0.8); }
      100% { transform: scale(1); opacity: 1; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15); }
    }
    .dock.load-flash { animation: load-flash 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    @keyframes breathe { 
      0% { box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15); } 
      50% { box-shadow: 0 6px 20px rgba(244, 114, 182, 0.35); } 
      100% { box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15); } 
    }
    @keyframes active-glow {
      0% { box-shadow: 0 0 15px rgba(244, 114, 182, 0.4), 0 0 30px rgba(216, 180, 254, 0.2); border-color: rgba(244, 114, 182, 0.5); transform: scale(1); }
      100% { box-shadow: 0 0 25px rgba(244, 114, 182, 0.6), 0 0 50px rgba(216, 180, 254, 0.4); border-color: #f472b6; transform: scale(1.05); }
    }
    .dock.active-glow { animation: active-glow 0.8s infinite alternate; }
    
    .panel { 
      position: fixed; bottom: 150px; right: 28px; width: 320px; 
      background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(35px) saturate(120%); -webkit-backdrop-filter: blur(35px) saturate(120%);
      border: 1px solid rgba(255, 255, 255, 0.6); border-radius: 22px; padding: 18px; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 30px rgba(251, 207, 232, 0.3); 
      display: none; flex-direction: column; gap: 12px; font-family: -apple-system, system-ui, sans-serif; color: #1A1A1A; 
      pointer-events: auto;
    }
    .panel.open { display: flex; animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    
    .header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; color: #1A1A1A; }
    .header span { background: linear-gradient(135deg, #f472b6, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    
    .setting-label { font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block;}
    .helper-text { font-size: 10px; color: #888; margin-top: 4px; line-height: 1.3; }
    
    input { 
      width: 100%; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0,0,0,0.1); 
      color: #1A1A1A; padding: 10px 12px; border-radius: 12px; font-size: 13px; 
      box-sizing: border-box; outline: none; pointer-events: auto;
    }
    input:focus { border-color: #f472b6; background: #fff; box-shadow: 0 0 0 3px rgba(244, 114, 182, 0.1); }
    
    .groq-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 4px;
      margin-top: 6px; font-size: 11px; font-weight: 600; color: #f55036; 
      text-decoration: none; cursor: pointer; transition: opacity 0.2s;
    }
    .groq-btn:hover { opacity: 0.7; text-decoration: underline; }

    .toggle-row { display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.5); padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); margin-top: 4px;}
    .toggle-label { font-size: 13px; font-weight: 500; color: #333; }
    .toggle-switch { position: relative; width: 38px; height: 20px; background: rgba(0,0,0,0.15); border-radius: 12px; cursor: pointer; transition: 0.3s; }
    .toggle-switch.active { background: linear-gradient(135deg, #f472b6, #c084fc); }
    .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    .toggle-switch.active::after { transform: translateX(18px); }

    .vibe-container { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
    .vibe-container::-webkit-scrollbar { display: none; }
    .vibe-pill { 
      padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; 
      text-align: center; cursor: pointer; white-space: nowrap; transition: all 0.2s;
      background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.08); color: #666;
    }
    .vibe-pill:hover { background: #fff; }
    .vibe-pill.active { background: linear-gradient(135deg, #f472b6, #c084fc); color: white; border-color: transparent; box-shadow: 0 2px 8px rgba(244, 114, 182, 0.3); }
    
    .btn-row { display: flex; gap: 8px; margin-top: 4px; }
    .generate-btn { flex: 1; background: linear-gradient(135deg, #f472b6, #c084fc); color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(244, 114, 182, 0.3); pointer-events: auto; }
    .generate-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(244, 114, 182, 0.4); }
    
    .refresh-btn { width: 44px; height: 44px; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; pointer-events: auto; }
    .refresh-btn:hover { background: #fff; }
    .refresh-btn svg { width: 18px; height: 18px; fill: #888; transition: transform 0.5s; }
    .refresh-btn.spin svg { animation: spin 0.8s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .vibe-box { background: rgba(244, 114, 182, 0.15); border: 1px solid rgba(244, 114, 182, 0.3); border-radius: 12px; padding: 10px 12px; font-size: 12px; color: #9d174d; font-weight: 500; display: flex; gap: 6px; align-items: flex-start; margin-bottom: 4px; }
    .vibe-box span { font-size: 14px; }

    .card { background: rgba(255, 255, 255, 0.85); border-radius: 14px; padding: 12px; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
    .card-title { font-size: 9px; text-transform: uppercase; color: #f472b6; margin-bottom: 6px; font-weight: 800; letter-spacing: 1px; }
    .card-text { font-size: 13px; line-height: 1.5; margin-bottom: 10px; color: #333; }
    .actions { display: flex; gap: 8px; }
    .btn { flex: 1; background: rgba(0,0,0,0.05); border: none; color: #4B5563; padding: 6px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s; pointer-events: auto; }
    .btn:hover { background: rgba(0,0,0,0.1); }
    .btn.use { background: linear-gradient(135deg, #f472b6, #c084fc); color: white; }
    .btn.use:hover { opacity: 0.9; box-shadow: 0 4px 12px rgba(244, 114, 182, 0.3); }
  `;
  shadow.appendChild(style);

  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="url(#pinkGradient)" stroke="none"><defs><linearGradient id="pinkGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f472b6"/><stop offset="100%" stop-color="#c084fc"/></linearGradient></defs><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

  dock.classList.add('load-flash');
  setTimeout(() => dock.classList.remove('load-flash'), 800);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="header"><span>Cupid AI</span><span class="close" style="cursor:pointer;color:#999;font-size:18px;">✕</span></div>
    
    <div>
      <span class="setting-label">API Key</span>
      <input type="password" id="api-key" placeholder="gsk_..." autocomplete="off" />
      <a href="https://console.groq.com/keys" target="_blank" class="groq-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
        Get Groq API Key ↗
      </a>
    </div>
    
    <div class="toggle-row"><span class="toggle-label">Auto-Pilot</span><div class="toggle-switch" id="auto-toggle"></div></div>
    
    <div>
      <span class="setting-label">Auto-Pilot Direction</span>
      <input type="text" id="auto-direction" placeholder="e.g. Ask her out for coffee" autocomplete="off" />
      <div class="helper-text">Auto-Pilot only sends when she texts you first.</div>
    </div>

    <div>
      <span class="setting-label">Reply Vibe</span>
      <div class="vibe-container" id="vibe-container">
        <div class="vibe-pill" data-vibe="normal">Normal</div>
        <div class="vibe-pill active" data-vibe="tease">🌶️ Tease</div>
        <div class="vibe-pill" data-vibe="chill">🧊 Chill</div>
        <div class="vibe-pill" data-vibe="flirty">💖 Flirty</div>
        <div class="vibe-pill" data-vibe="argue">🗣️ Argue</div>
        <div class="vibe-pill" data-vibe="persuade">🧠 Persuade</div>
      </div>
    </div>

    <div class="btn-row">
      <button class="generate-btn" id="gen-btn">Generate</button>
      <button class="refresh-btn" id="refresh-btn" title="Refresh Suggestions">
        <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
      </button>
    </div>

    <div id="results" style="display:flex; flex-direction:column; gap:8px; max-height: 250px; overflow-y: auto;"></div>
  `;

  shadow.appendChild(dock);
  shadow.appendChild(panel);

  const apiKeyInput = shadow.getElementById('api-key');
  const toggleBtn = shadow.getElementById('auto-toggle');
  const resultsDiv = shadow.getElementById('results');
  const genBtn = shadow.getElementById('gen-btn');
  const refreshBtn = shadow.getElementById('refresh-btn');
  const vibeContainer = shadow.getElementById('vibe-container');
  const autoDirectionInput = shadow.getElementById('auto-direction');

  let currentStyle = "tease"; 
  vibeContainer.addEventListener('click', (e) => {
    if (!e.target.classList.contains('vibe-pill')) return;
    vibeContainer.querySelectorAll('.vibe-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    currentStyle = e.target.getAttribute('data-vibe');
  });

  chrome.storage.local.get(['apiKey', 'autoDirection'], (res) => {
    if (res.apiKey) apiKeyInput.value = res.apiKey;
    if (res.autoDirection) autoDirectionInput.value = res.autoDirection; // Load saved direction
    toggleBtn.classList.remove('active'); 
    chrome.storage.local.set({ autoReply: false }); 
  });

  apiKeyInput.addEventListener('input', () => chrome.storage.local.set({ apiKey: apiKeyInput.value }));
  autoDirectionInput.addEventListener('input', () => chrome.storage.local.set({ autoDirection: autoDirectionInput.value })); // Save direction
  
  toggleBtn.addEventListener('click', () => {
    if (!toggleBtn.classList.contains('active')) {
      const messages = adapter.getRecentMessages() || [];
      const myMsgCount = messages.filter(m => m.from === 'me').length;
      
      if (myMsgCount < 10) {
        alert(`Cupid needs to learn your vibe first! Please send at least 10 messages manually.\n\n(You have sent ${myMsgCount}/10)`);
        return; 
      }
    }
    toggleBtn.classList.toggle('active');
    chrome.storage.local.set({ autoReply: toggleBtn.classList.contains('active') });
  });

  dock.addEventListener('click', () => panel.classList.toggle('open'));
  shadow.querySelector('.close').addEventListener('click', () => panel.classList.remove('open'));

  async function fetchReplies() {
    const key = apiKeyInput.value.trim();
    if (!key) return null;

    dock.classList.add('active-glow');
    genBtn.innerText = 'Thinking...';
    refreshBtn.classList.add('spin');

    const partnerName = adapter.getPartnerName() || 'Unknown';
    const messages = adapter.getRecentMessages() || [];
    
    let voiceNote = null;
    if (adapter.getVoiceNote) {
      voiceNote = await adapter.getVoiceNote();
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        type: 'GENERATE_REPLIES', 
        payload: { 
          apiKey: key, 
          partnerName, 
          messages, 
          voiceNote, 
          replyStyle: currentStyle,
          autoDirection: autoDirectionInput.value 
        } 
      }, (response) => {
        dock.classList.remove('active-glow');
        genBtn.innerText = 'Generate';
        refreshBtn.classList.remove('spin');
        resolve(response && !response.error ? response : null);
      });
    });
  }

  async function handleGenerate() {
    resultsDiv.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;padding:10px;">Reading vibe...</div>';
    const response = await fetchReplies();
    
    if (!response) {
      resultsDiv.innerHTML = '<div style="color:#ef4444;font-size:12px;text-align:center;">Error generating.</div>';
      return;
    }

    resultsDiv.innerHTML = '';
    
    if (response.vibe_review) {
      const vibeDiv = document.createElement('div');
      vibeDiv.className = 'vibe-box';
      vibeDiv.innerHTML = `<span>✨</span> <div><b>Vibe Check:</b> ${response.vibe_review}</div>`;
      resultsDiv.appendChild(vibeDiv);
    }

    ['playful', 'warm', 'bold'].forEach(tone => {
      const text = response[tone];
      if (!text) return;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-title">${tone}</div>
        <div class="card-text">${text}</div>
        <div class="actions">
          <button class="btn use">Use</button>
          <button class="btn copy">Copy</button>
        </div>
      `;
      card.querySelector('.use').addEventListener('click', () => {
        adapter.insertReply(text);
        panel.classList.remove('open');
      });
      card.querySelector('.copy').addEventListener('click', () => navigator.clipboard.writeText(text));
      resultsDiv.appendChild(card);
    });
  }

  genBtn.addEventListener('click', handleGenerate);
  refreshBtn.addEventListener('click', handleGenerate);

  // AUTO-REPLY ENGINE
  let lastProcessedText = "";
  let isSending = false;

  setInterval(async () => {
    if (!toggleBtn.classList.contains('active') || isSending) return;
    
    const messages = adapter.getRecentMessages() || [];
    if (messages.length === 0) return;
    
    const lastMsg = messages[messages.length - 1];

    if (lastMsg.from === 'them' && lastMsg.text !== lastProcessedText) {
      lastProcessedText = lastMsg.text; 
      isSending = true;
      dock.classList.add('active-glow'); 
      
      const response = await fetchReplies();
      
      if (response && response.auto_reply) {
        setTimeout(() => {
          adapter.insertReply(response.auto_reply);
          setTimeout(() => {
            adapter.sendMessage(); 
            isSending = false;
          }, 1500);
        }, 2000);
      } else {
        dock.classList.remove('active-glow');
        isSending = false;
      }
    }
  }, 3000); 

})();
