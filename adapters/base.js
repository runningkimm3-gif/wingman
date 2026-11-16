window.CupidUtils = {
  insertText(composer, text) {
    if (!composer) return false;
    composer.focus();
    try {
      if (document.execCommand('insertText', false, text)) return true;
    } catch (e) {}
    try {
      const event = new InputEvent('beforeinput', {
        bubbles: true, cancelable: true, inputType: 'insertText', data: text
      });
      composer.dispatchEvent(event);
      if (!event.defaultPrevented) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const node = document.createTextNode(text);
          range.insertNode(node);
          range.collapse(false);
        } else {
          composer.textContent += text;
        }
        composer.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
      }
      return true;
    } catch (e) { return false; }
  }
};
window.CupidAdapters = {};