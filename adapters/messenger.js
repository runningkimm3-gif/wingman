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
    insertReply: (text) => window.CupidUtils.insertText(document.querySelector('div[role="main"] div[contenteditable="true"][role="textbox"]'), text),
    sendMessage: () => {
      try {
        const sendBtn = document.querySelector('div[aria-label="Press enter to send"]')?.closest('[role="button"]');
        if (sendBtn) { sendBtn.click(); return true; }
        const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter' });
        document.querySelector('div[role="main"] div[contenteditable="true"][role="textbox"]')?.dispatchEvent(enterEvent);
        return true;
      } catch (e) { return false; }
    }
  };
})();
