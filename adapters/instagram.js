(() => {
  const id = 'instagram';
  const urlPattern = /instagram\.com\/direct/i;
  window.CupidAdapters[id] = {
    id, urlPattern,
    getPartnerName: () => { const el = document.querySelector('header h2, header a[href^="/"] span'); return el ? el.innerText.trim() : 'Unknown'; },
    getComposerAnchor: () => document.querySelector('div[contenteditable="true"][role="textbox"]'),
    getRecentMessages: () => {
      const rows = document.querySelectorAll('div[role="listbox"] > div[role="button"]');
      const msgs = [];
      Array.from(rows).slice(-15).forEach(row => {
        const textEl = row.querySelector('div[dir="auto"]');
        if (!textEl) return;
        const isMe = row.querySelector('div[style*="justify-content: flex-end"]') !== null;
        msgs.push({ from: isMe ? 'me' : 'them', text: textEl.innerText.trim() });
      });
      return msgs;
    },
    getDraft: () => { const el = document.querySelector('div[contenteditable="true"][role="textbox"]'); return el ? el.innerText.trim() : ''; },
    getLastImage: () => {
      const imgs = document.querySelectorAll('div[role="listbox"] img');
      for (let i = imgs.length - 1; i >= 0; i--) {
        const src = imgs[i].src;
        if (src && src.includes('cdninstagram') && src.length > 50) return src;
      }
      return null;
    },
    insertReply: (text) => window.CupidUtils.insertText(document.querySelector('div[contenteditable="true"][role="textbox"]'), text)
  };
})();