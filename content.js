(() => {
  if (document.querySelector('[data-cupid-mounted]')) return;
  if (!window.CupidAdapters) return console.warn('Cupid: Adapters not loaded');

  const adapters = Object.values(window.CupidAdapters);
  const adapter = adapters.find(a => a?.urlPattern?.test(location.href));
  if (!adapter) return;

  const host = document.createElement('div');
  host.setAttribute('data-cupid-mounted', 'true');
  host.style.cssText = 'position:fixed; bottom:0; right:0; width:0; height:0; z-index:2147483647;';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .dock { position: fixed; bottom: 85px; right: 24px; width: 44px; height: 44px; border-radius: 50%; background: rgba(20, 20, 25, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(236, 72, 153, 0.4); box-shadow: 0 4px 20px rgba(236, 72, 153, 0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; animation: breathe 3s infinite ease-in-out; }
    .dock:hover { transform: scale(1.1) translateY(-3px); background: rgba(30, 30, 35, 0.8); }
    @keyframes breathe { 0% { box-shadow: 0 4px 20px rgba(236, 72, 153, 0.2); } 50% { box-shadow: 0 4px 25px rgba(236, 72, 153, 0.5); } 100% { box-shadow: 0 4px 20px rgba(236, 72, 153, 0.2); } }
    
    .panel { position: fixed; bottom: 140px; right: 24px; width: 340px; background: rgba(26, 26, 26, 0.95); backdrop-filter: blur(20px); border: 1px solid #333; border-radius: 20px; padding: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); display: none; flex-direction: column; gap: 12px; font-family: system-ui, sans-serif; color: #fff; }
    .panel.open { display: flex; animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    
    .header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #A1A1AA; font-weight: 500; }
    .ghost-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: none; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
    
    .card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; border-left: 3px solid #ec4899; transition: background 0.2s; }
    .card:hover { background: rgba(255,255,255,0.08); }
    .card-title { font-size: 10px; text-transform: uppercase; color: #ec4899; margin-bottom: 4px; font-weight: 700; letter-spacing: 0.8px; }
    .card-text { font-size: 14px; line-height: 1.4; margin-bottom: 8px; color: #e4e4e7; }
    
    .actions { display: flex; gap: 8px; }
    .btn { background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; }
    .btn:hover { background: rgba(255,255,255,0.2); }
    .btn.use { background: #ec4899; color: white; }
    .btn.use:hover { background: #db2777; }
    
    .settings input { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid #444; color: #fff; padding: 10px; border-radius: 8px; font-size: 12px; box-sizing: border-box; outline: none; margin-bottom: 8px; }
    .settings input:focus { border-color: #ec4899; }
    
    .generate-btn { width: 100%; background: #ec4899; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
    .generate-btn:hover { background: #db2777; }
  `;
  shadow.appendChild(style);

  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="header">
      <span>Cupid v2.0</span>
      <div class="ghost-dot"></div>
      <span class="close" style="cursor:pointer;color:#888;font-size:16px;">✕</span>
    </div>
    <div class="settings">
      <input type="password" id="api-key" placeholder="Paste Groq API Key (gsk_...)" />
      <button class="generate-btn" id="gen-btn">Generate Replies</button>
    </div>
    <div id="results" style="display:flex; flex-direction:column; gap:8px; max-height: 300px; overflow-y: auto;"></div>
  `;

  shadow.appendChild(dock);
  shadow.appendChild(panel);

  const apiKeyInput = shadow.getElementById('api-key');
  const resultsDiv = shadow.getElementById('results');
  const ghostDot = shadow.querySelector('.ghost-dot');
  const genBtn = shadow.getElementById('gen-btn');

  chrome.storage.local.get(['apiKey'], (res) => {
    if (res && res.apiKey) apiKeyInput.value = res.apiKey;
  });

  // Save key on typing
  apiKeyInput.addEventListener('input', () => {
    chrome.storage.local.set({ apiKey: apiKeyInput.value });
  });

  // Open panel
  dock.addEventListener('click', () => {
    panel.classList.toggle('open');
  });

  // Close panel
  shadow.querySelector('.close').addEventListener('click', () => panel.classList.remove('open'));

  // Generate button click
  genBtn.addEventListener('click', generateReplies);

  async function generateReplies() {
    const key = apiKeyInput.value.trim();
    if (!key) {
      resultsDiv.innerHTML = '<div style="color:#fbbf24;font-size:12px;text-align:center;">Please paste your Groq API key first.</div>';
      return;
    }

    resultsDiv.innerHTML = '<div style="color:#888;font-size:12px;text-align:center;padding:10px 0;">Reading vibe...</div>';
    
    try {
      const messages = adapter.getRecentMessages() || [];
      const partnerName = adapter.getPartnerName() || 'Unknown';
      const draft = adapter.getDraft() || '';
      const imageUrl = adapter.getLastImage() || null;
      
      if (messages.length === 0) {
        resultsDiv.innerHTML = '<div style="color:#fbbf24;font-size:12px;text-align:center;">No messages found. Make sure you are inside a chat!</div>';
        return;
      }

      const memoryKey = `cupid_memory_${partnerName}`;
      const memoryRes = await chrome.storage.local.get([memoryKey]);
      const memory = (memoryRes && memoryRes[memoryKey]) ? memoryRes[memoryKey] : [];

      const payload = { apiKey: key, partnerName, messages, draft, imageUrl, memory };

      chrome.runtime.sendMessage({ type: 'GENERATE_REPLIES', payload }, (response) => {
        if (chrome.runtime.lastError) {
          resultsDiv.innerHTML = `<div style="color:#ef4444;font-size:12px;text-align:center;">Error: ${chrome.runtime.lastError.message}</div>`;
          return;
        }
        if (!response) {
          resultsDiv.innerHTML = `<div style="color:#ef4444;font-size:12px;text-align:center;">No response from background. Try reloading the extension.</div>`;
          return;
        }
        if (response.error) {
          resultsDiv.innerHTML = `<div style="color:#ef4444;font-size:12px;text-align:center;">${response.message || response.error}</div>`;
          return;
        }

        if (response.updated_memory) chrome.storage.local.set({ [memoryKey]: response.updated_memory });
        ghostDot.style.display = response.ghost_warning ? 'block' : 'none';

        resultsDiv.innerHTML = '';
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
          card.querySelector('.copy').addEventListener('click', () => {
            navigator.clipboard.writeText(text);
            card.querySelector('.copy').innerText = 'Copied!';
          });
          resultsDiv.appendChild(card);
        });
      });
    } catch (err) {
      resultsDiv.innerHTML = `<div style="color:#ef4444;font-size:12px;text-align:center;">UI Error: ${err.message}</div>`;
    }
  }
})();
