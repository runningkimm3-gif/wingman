(() => {
  const id = 'messenger';
  const urlPattern = /(?:messenger\.com|facebook\.com\/messages)/i;
  window.CupidAdapters[id] = {
    id, urlPattern,
    getPartnerName: () => { const el = document.querySelector('div[role="main"] header h2, header h1 span'); return el ? el.innerText.trim() : 'Unknown'; },
    getComposerAnchor: () => document.querySelector('div[role="main"] div[contenteditable="true"][role="textbox"]'),
    getRecentMessages: () => {
      const rows = document.querySelectorAll('div[role="main"] div[role="row"]');
      const msgs = [];
      Array.from(rows).slice(-15).forEach(row => {
        const textEl = row.querySelector('div[dir="auto"]');
        if (!textEl) return;
        const isMe = row.innerHTML.includes('outgoing') || row.innerHTML.includes('sent');
        msgs.push({ from: isMe ? 'me' : 'them', text: textEl.innerText.trim() });
      });
      return msgs;
    },
    getDraft: () => { const el = document.querySelector('div[role="main"] div[contenteditable="true"][role="textbox"]'); return el ? el.innerText.trim() : ''; },
    getLastImage: () => {
      const imgs = document.querySelectorAll('div[role="main"] img');
      for (let i = imgs.length - 1; i >= 0; i--) {
        const src = imgs[i].src;
        if (src && !src.includes('emoji') && !src.includes('avatar') && src.length > 50) return src;
      }
      return null;
    },
    insertReply: (text) => window.CupidUtils.insertText(document.querySelector('div[role="main"] div[contenteditable="true"][role="textbox"]'), text)
  };
})();