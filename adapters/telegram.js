(() => {
  const id = 'telegram';
  const urlPattern = /(web\.telegram\.org|file)/i;

  window.CupidAdapters[id] = {
    id,
    urlPattern,
    getPartnerName: () => {
      try {
        const el = document.querySelector('.peer-title, .ChatInfo .title, .MiddleHeader h3');
        return el?.innerText?.trim() || 'Partner';
      } catch (e) { return 'Partner'; }
    },
    getComposerAnchor: () => {
      try {
        return document.querySelector('.input-message-input[contenteditable="true"], #editable-message-text[contenteditable="true"]');
      } catch (e) { return null; }
    },
    getRecentMessages: () => {
      try {
        const rows = document.querySelectorAll('.bubble, .Message');
        const msgs = [];
        Array.from(rows).slice(-20).forEach(row => {
          const textEl = row.querySelector('.text-content, .message-text, .translatable-message') || row;
          if (!textEl || !textEl.innerText) return;
          
          let text = textEl.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
          // Ignore call logs, photos, system joins
          if (!text || /^(joined|left|pinned|photo|video|outgoing call|incoming call|missed call|\d{1,2}:\d{2})/i.test(text)) return;

          const isMe = row.classList.contains('is-out') || row.classList.contains('own') || row.closest('.is-out, .own') !== null;
          msgs.push({ from: isMe ? 'me' : 'them', text: text });
        });
        return msgs;
      } catch (e) { return []; }
    },
    getDraft: () => {
      try {
        const el = document.querySelector('.input-message-input[contenteditable="true"], #editable-message-text[contenteditable="true"]');
        return el?.innerText?.trim() || '';
      } catch (e) { return ''; }
    },
    insertReply: (text) => {
      try {
        const composer = document.querySelector('.input-message-input[contenteditable="true"], #editable-message-text[contenteditable="true"]');
        return window.CupidUtils.insertText(composer, text);
      } catch (e) { return false; }
    },
    sendMessage: () => {
      try {
        const composer = document.querySelector('.input-message-input[contenteditable="true"], #editable-message-text[contenteditable="true"]');
        if (!composer) return false;
        const sendBtn = document.querySelector('.btn-send, button[aria-label="Send"], .send-button, button.icon-send');
        if (sendBtn) { sendBtn.click(); return true; }
        const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13, key: 'Enter', code: 'Enter' });
        composer.dispatchEvent(enterEvent);
        return true;
      } catch (e) { return false; }
    }
  };
})();
