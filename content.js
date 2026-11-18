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
      position: fixed; bottom: 90px; right: 28px; width: 48px; height: 48px; border-radius: 50%; 
      background: linear-gradient(135deg, #ffffff 0%, #f0f0f5 100%);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.9); 
      box-shadow: 0 8px 25px rgba(200, 200, 255, 0.4), inset 0 0 10px rgba(255,255,255,1); 
      cursor: pointer; display: flex; align-items: center; justify-content: center; 
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
      animation: pearl-breathe 4s infinite ease-in-out;
      pointer-events: auto;
    }
    .dock:hover { transform: scale(1.1) translateY(-3px); box-shadow: 0 12px 35px rgba(200, 200, 255, 0.6); }
    
    @keyframes pearl-breathe { 
      0% { box-shadow: 0 6px 20px rgba(200, 200, 255, 0.2), inset 0 0 10px rgba(255,255,255,1); } 
      50% { box-shadow: 0 8px 30px rgba(236, 72, 153, 0.3), inset 0 0 15px rgba(255,255,255,1); } 
      100% { box-shadow: 0 6px 20px rgba(200, 200, 255, 0.2), inset 0 0 10px rgba(255,255,255,1); } 
    }

    @keyframes load-flash {
      0% { transform: scale(0); opacity: 0; box-shadow: 0 0 50px rgba(255, 255, 255, 1); }
      50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 40px rgba(236, 72, 153, 0.6); }
      100% { transform: scale(1); opacity: 1; }
    }
    .dock.load-flash { animation: load-flash 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    
    @keyframes active-glow {
      0% { box-shadow: 0 0 15px rgba(236, 72, 153, 0.5), 0 0 30px rgba(168, 85, 247, 0.3); border-color: rgba(236, 72, 153, 0.8); transform: scale(1); }
      100% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.8), 0 0 60px rgba(168, 85, 247, 0.5); border-color: #ec4899; transform: scale(1.05); }
    }
    .dock.active-glow { animation: active-glow 0.6s infinite alternate; }

    .panel { 
      position: fixed; bottom: 155px; right: 28px; width: 340px; 
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 250, 0.85) 100%);
      backdrop-filter: blur(40px) saturate(150%); -webkit-backdrop-filter: blur(40px) saturate(150%);
      border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 24px; padding: 20px; 
      box-shadow: 0 25px 70px rgba(0,0,0,0.1), 0 0 40px rgba(236, 72, 153, 0.1), inset 0 0 20px rgba(255,255,255,0.8); 
      display: none; flex-direction: column; gap: 14px; font-family: -apple-system, system-ui, sans-serif; color: #1A1A1A; 
      pointer-events: auto;
    }
    .panel.open { display: flex; animation: pearl-slide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes pearl-slide { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    
    .header { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.5px; }
    .header span { background: linear-gradient(135deg, #ec4899, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    
    .setting-label { font-size: 10px; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block;}
    
    input { 
      width: 100%; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.08); 
      color: #1A1A1A; padding: 12px 14px; border-radius: 12px; font-size: 13px; 
      box-sizing: border-box; outline: none; pointer-events: auto; transition: all 0.2s;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    input:focus { border-color: #ec4899; background: #fff; box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.1); }
    
    .groq-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      margin-top: 8px; font-size: 11px; font-weight: 700; color: #ec4899; 
      text-decoration: none; cursor: pointer; transition: opacity 0.2s;
    }
    .groq-btn:hover { opacity: 0.7; text-decoration: underline; }

    .toggle-row { display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.4); padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(0,0,0,0.04); box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);}
    .toggle-label { font-size: 13px; font-weight: 600; color: #333; }
    .toggle-switch { position: relative; width: 42px; height: 24px; background: rgba(0,0,0,0.1); border-radius: 12px; cursor: pointer; transition: 0.3s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
    .toggle-switch.active { background: linear-gradient(135deg, #ec4899, #a855f7); }
    .toggle-switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
    .toggle-switch.active::after { transform: translateX(18px); }

    .vibe-container { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
    .vibe-container::-webkit-scrollbar { display: none; }
    .vibe-pill { 
      padding: 8px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; 
      text-align: center; cursor: pointer; white-space: nowrap; transition: all 0.2s;
      background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.06); color: #666;
      box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    }
    .vibe-pill:hover { background: #fff; }
    .vibe-pill.active { background: #1A1A1A; color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    
    .btn-row { display: flex; gap: 10px; margin-top: 4px; }
    .generate-btn { flex: 1; background: linear-gradient(135deg, #ec4899, #a855f7); color: white; border: none; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 20px rgba(236, 72, 153, 0.3); pointer-events: auto; letter-spacing: 0.5px; }
    .generate-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(236, 72, 153, 0.4); }
    
    .refresh-btn { width: 48px; height: 48px; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; pointer-events: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.02);}
    .refresh-btn:hover { background: #fff; }
    .refresh-btn svg { width: 20px; height: 20px; fill: #555; transition: transform 0.5s; }
    .refresh-btn.spin svg { animation: spin 0.8s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .terminal-box { 
      background: #0f0f13; 
      border: 1px solid rgba(255,255,255,0.1); 
      border-radius: 12px; padding: 12px 14px; 
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; 
      font-size: 11px; line-height: 1.5; color: #a78bfa; 
      box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 4px 15px rgba(0,0,0,0.1);
      margin-bottom: 4px;
      position: relative;
      overflow: hidden;
    }
    .terminal-text { margin: 0; white-space: pre-wrap; color: #e5e7eb; }
    .terminal-text span.prompt { color: #10b981; font-weight: bold; }
    .terminal-text span.highlight { color: #f472b6; }

    .card { background: linear-gradient(180deg, #ffffff 0%, #f9f9fb 100%); border-radius: 16px; padding: 14px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: transform 0.2s; }
    .card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.05); }
    .card-title { font-size: 9px; text-transform: uppercase; color: #ec4899; margin-bottom: 8px; font-weight: 800; letter-spacing: 1px; }
    .card-text { font-size: 13px; line-height: 1.5; margin-bottom: 12px; color: #1A1A1A; }
    
    .actions { display: flex; gap: 8px; }
    .btn { flex: 1; background: #F3F4F6; border: none; color: #4B5563; padding: 8px; border-radius: 10px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; pointer-events: auto; }
    .btn:hover { background: #E5E7EB; color: #1A1A1A; }
    .btn.use { background: #1A1A1A; color: white; }
    .btn.use:hover { background: #333; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  `;
  shadow.appendChild(style);

  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="url(#pearlGradient)" stroke="none"><defs><linearGradient id="pearlGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ec4899"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

  dock.classList.add('load-flash');
  setTimeout(() => dock.classList.remove('load-flash'), 800);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="header"><span>CUPID OS</span><span class="close" style="cursor:pointer;color:#999;font-size:18px;">✕</span></div>
    
    <div>
      <span class="setting-label">Authentication</span>
      <input type="password" id="api-key" placeholder="gsk_..." autocomplete="off" />
      <a href="https://console.groq.com/keys" target="_blank" class="groq-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
        Get Groq API Key ↗
      </a>
    </div>
    
    <div class="toggle-row"><span class="toggle-label">Auto-Pilot Protocol</span><div class="toggle-switch" id="auto-toggle"></div></div>
    
    <div>
      <span class="setting-label">Directive (Optional)</span>
      <input type="text" id="auto-direction" placeholder="e.g. Ask her out for coffee" autocomplete="off" />
    </div>

    <div>
      <span class="setting-label">Response Matrix</span>
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

    <div id="results" style="display:flex; flex-direction:column; gap:10px; max-height: 250px; overflow-y: auto;"></div>
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
    if (res.autoDirection) autoDirectionInput.value = res.autoDirection; 
    toggleBtn.classList.remove('active'); 
    chrome.storage.local.set({ autoReply: false }); 
  });

  apiKeyInput.addEventListener('input', () => chrome.storage.local.set({ apiKey: apiKeyInput.value }));
  autoDirectionInput.addEventListener('input', () => chrome.storage.local.set({ autoDirection: autoDirectionInput.value })); 
  
  // REMOVED THE 10-MESSAGE LIMIT HERE
  toggleBtn.addEventListener('click', () => {
    toggleBtn.classList.toggle('active');
    chrome.storage.local.set({ autoReply: toggleBtn.classList.contains('active') });
  });

  dock.addEventListener('click', () => panel.classList.toggle('open'));
  shadow.querySelector('.close').addEventListener('click', () => panel.classList.remove('open'));

  // SAVE USER'S TYPING STYLE GLOBALLY
  async function updateGlobalStyle() {
    try {
      const messages = adapter.getRecentMessages() || [];
      const myMsgs = messages.filter(m => m.from === 'me').map(m => m.text);
      if (myMsgs.length === 0) return;
      
      const res = await chrome.storage.local.get(['cupid_global_style']);
      let globalStyle = res.cupid_global_style || [];
      
      // Merge new messages and deduplicate, keep last 50
      globalStyle = [...new Set([...myMsgs, ...globalStyle])].slice(0, 50);
      chrome.storage.local.set({ cupid_global_style: globalStyle });
    } catch(e) {}
  }
  setInterval(updateGlobalStyle, 10000); // Save every 10 seconds

  async function fetchReplies() {
    const key = apiKeyInput.value.trim();
    if (!key) return null;

    dock.classList.add('active-glow');
    genBtn.innerText = 'Processing...';
    refreshBtn.classList.add('spin');

    const partnerName = adapter.getPartnerName() || 'Unknown';
    const messages = adapter.getRecentMessages() || [];
    
    let voiceNote = null;
    if (adapter.getVoiceNote) {
      voiceNote = await adapter.getVoiceNote();
    }

    // Get the global style from storage
    const res = await chrome.storage.local.get(['cupid_global_style']);
    const globalStyle = res.cupid_global_style || [];

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        type: 'GENERATE_REPLIES', 
        payload: { 
          apiKey: key, 
          partnerName, 
          messages, 
          voiceNote, 
          replyStyle: currentStyle,
          autoDirection: autoDirectionInput.value,
          globalStyle: globalStyle // Pass the global style
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
    resultsDiv.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;padding:20px;font-family:monospace;">[SYSTEM] INITIALIZING AI...</div>';
    const response = await fetchReplies();
    
    if (!response) {
      resultsDiv.innerHTML = '<div style="color:#ef4444;font-size:12px;text-align:center;padding:20px;font-family:monospace;">[ERROR] UNABLE TO GENERATE</div>';
      return;
    }

    resultsDiv.innerHTML = '';
    
    if (response.vibe_review) {
      const terminalDiv = document.createElement('div');
      terminalDiv.className = 'terminal-box';
      terminalDiv.innerHTML = `
        <p class="terminal-text"><span class="prompt">cupid@ai:~$</span> analyze_vibe</p>
        <p class="terminal-text"><span class="highlight">></span> ${response.vibe_review}</p>
      `;
      resultsDiv.appendChild(terminalDiv);
    }

    ['playful', 'warm', 'bold'].forEach(tone => {
      const text = response[tone];
      if (!text) return;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-title">${tone} matrix</div>
        <div class="card-text">${text}</div>
        <div class="actions">
          <button class="btn use">Execute</button>
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
