(() => {
  const id = 'telegram';
  const urlPattern = /web\.telegram\.org/i;

  window.CupidAdapters[id] = {
    id,
    urlPattern,
    getPartnerName: () => {
      try {
        const el = document.querySelector('.peer-title, .ChatInfo .title, .MiddleHeader h3');
        return el?.innerText?.trim() || 'Unknown';
      } catch (e) { return 'Unknown'; }
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
        Array.from(rows).slice(-15).forEach(row => {
          const textEl = row.querySelector('.text-content, .message-text, .translatable-message') || row;
          if (!textEl || !textEl.innerText) return;
          
          const text = textEl.innerText.trim();
          
          // Filter out system messages, calls, and timestamps
          const isSystemMessage = /^(joined|left|pinned|photo|video|outgoing call|incoming call|missed call|\d{1,2}:\d{2})/i.test(text);
          if (text && !isSystemMessage) {
            const isMe = row.classList.contains('is-out') || row.classList.contains('own') || row.closest('.is-out, .own');
            msgs.push({ from: isMe ? 'me' : 'them', text: text });
          }
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
    getLastImage: () => null,
    insertReply: (text) => {
      try {
        const composer = document.querySelector('.input-message-input[contenteditable="true"], #editable-message-text[contenteditable="true"]');
        return window.CupidUtils.insertText(composer, text);
      } catch (e) { return false; }
    }
  };
})();
