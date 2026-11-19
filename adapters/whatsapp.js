(() => {
  const id = 'whatsapp';
  const urlPattern = /web\.whatsapp\.com/i;
  window.CupidAdapters[id] = {
    id, urlPattern,
    getPartnerName: () => { const el = document.querySelector('#main header span[title]'); return el ? el.getAttribute('title').trim() : 'Unknown'; },
    getComposerAnchor: () => document.querySelector('#main footer div[contenteditable="true"]'),
    getRecentMessages: () => {
      const rows = document.querySelectorAll('.message-in, .message-out');
      const msgs = [];
      Array.from(rows).slice(-15).forEach(row => {
        const textEl = row.querySelector('.selectable-text span');
        if (!textEl) return;
        const text = textEl.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        if (!text) return;
        const isMe = row.classList.contains('message-out');
        msgs.push({ from: isMe ? 'me' : 'them', text });
      });
      return msgs;
    },
    getDraft: () => {
      const el = document.querySelector('#main footer div[contenteditable="true"]');
      return el ? el.innerText.trim() : '';
    },
    getLastImage: () => {
      const imgs = document.querySelectorAll('#main .message-in img, #main .message-out img');
      for (let i = imgs.length - 1; i >= 0; i--) {
        const src = imgs[i].src;
        if (src && src.includes('blob:') === false && src.length > 50) return src;
      }
      return null;
    },
    insertReply: (text) => window.CupidUtils.insertText(document.querySelector('#main footer div[contenteditable="true"]'), text),
    sendMessage: () => {
      try {
        const composer = document.querySelector('#main footer div[contenteditable="true"]');
        if (!composer) return false;
        const sendBtn = document.querySelector('#main footer button[aria-label="Send"], #main footer span[data-icon="send"]');
        if (sendBtn) {
          const btn = sendBtn.closest('button') || sendBtn;
          btn.click();
          return true;
        }
        const enterEvent = new KeyboardEvent('keydown', {
          bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter'
        });
        composer.dispatchEvent(enterEvent);
        return true;
      } catch (e) { return false; }
    }
  };
})();
