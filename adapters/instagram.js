(() => {
  const id = 'instagram';
  const urlPattern = /instagram\.com\/direct/i;
  window.CupidAdapters[id] = {
    id, urlPattern,
    getPartnerName: () => { 
      const el = document.querySelector('header h2, header a[href^="/"] span'); 
      return el ? el.innerText.trim() : 'Unknown'; 
    },
    getComposerAnchor: () => document.querySelector('div[contenteditable="true"][role="textbox"]'),
    getRecentMessages: () => {
      const rows = document.querySelectorAll('div[role="listbox"] > div[role="button"]');
      const msgs = [];
      Array.from(rows).slice(-20).forEach(row => {
        const textEl = row.querySelector('div[dir="auto"]');
        if (!textEl || !textEl.innerText) return;
        
        let text = textEl.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
        // Ignore system messages like "Seen", "Active now"
        if (!text || /^(seen|delivered|active now|\d{1,2}:\d{2})$/i.test(text)) return;

        // IG right-aligns your messages
        const isMe = row.querySelector('div[style*="justify-content: flex-end"]') !== null;
        msgs.push({ from: isMe ? 'me' : 'them', text: text });
      });
      return msgs;
    },
    getDraft: () => { 
      const el = document.querySelector('div[contenteditable="true"][role="textbox"]'); 
      return el ? el.innerText.trim() : ''; 
    },
    insertReply: (text) => window.CupidUtils.insertText(document.querySelector('div[contenteditable="true"][role="textbox"]'), text),
    sendMessage: () => {
      try {
        const sendBtn = document.querySelector('button[type="submit"], div[role="button"]:has(svg[aria-label="Send"])');
        if (sendBtn) { sendBtn.click(); return true; }
        const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter' });
        document.querySelector('div[contenteditable="true"][role="textbox"]')?.dispatchEvent(enterEvent);
        return true;
      } catch (e) { return false; }
    }
  };
})();
