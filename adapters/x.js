(() => {
  const id = 'x';
  const urlPattern = /x\.com\/messages|twitter\.com\/messages/i;
  window.CupidAdapters[id] = {
    id, urlPattern,
    getPartnerName: () => { const el = document.querySelector('h2[role="heading"]'); return el ? el.innerText.trim() : 'Unknown'; },
    getComposerAnchor: () => document.querySelector('div[data-testid="dmComposerTextInput"][contenteditable="true"]'),
    getRecentMessages: () => {
      const rows = document.querySelectorAll('[data-testid="cellInnerDiv"]');
      const msgs = [];
      Array.from(rows).slice(-15).forEach(row => {
        const textEl = row.querySelector('[data-testid="tweetText"], div[dir="auto"]');
        if (!textEl) return;
        const text = textEl.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        if (!text) return;
        const isMe = row.querySelector('div[style*="justify-content: flex-end"]') !== null;
        msgs.push({ from: isMe ? 'me' : 'them', text });
      });
      return msgs;
    },
    getDraft: () => {
      const el = document.querySelector('div[data-testid="dmComposerTextInput"][contenteditable="true"]');
      return el ? el.innerText.trim() : '';
    },
    getLastImage: () => {
      const imgs = document.querySelectorAll('[data-testid="cellInnerDiv"] img');
      for (let i = imgs.length - 1; i >= 0; i--) {
        const src = imgs[i].src;
        if (src && src.includes('profile_images') === false && src.length > 50) return src;
      }
      return null;
    },
    insertReply: (text) => window.CupidUtils.insertText(document.querySelector('div[data-testid="dmComposerTextInput"][contenteditable="true"]'), text),
    sendMessage: () => {
      try {
        const composer = document.querySelector('div[data-testid="dmComposerTextInput"][contenteditable="true"]');
        if (!composer) return false;
        const sendBtn = document.querySelector('button[data-testid="dmComposerSendButton"]');
        if (sendBtn) { sendBtn.click(); return true; }
        const enterEvent = new KeyboardEvent('keydown', {
          bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter'
        });
        composer.dispatchEvent(enterEvent);
        return true;
      } catch (e) { return false; }
    }
  };
})();
