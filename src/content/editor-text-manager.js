/**
 * EditorTextManager (Manager) — writes text into a DraftJS contenteditable.
 *
 * Verified live in X's composer:
 *  1. `focus → selectAll → insertText(text)` reliably REPLACES all content, but
 *     any "\n" is stripped — insertText cannot make a line break.
 *  2. A synthetic `paste` (DataTransfer) IS handled by DraftJS and splits "\n"
 *     into separate blocks. Pasting into an EMPTY field drops the first line,
 *     but pasting AFTER inserted text keeps both — so we insertText the first
 *     line, then paste the remaining lines.
 *  3. DraftJS applies edits via async React state updates. Without a flush gap
 *     between insertText and paste (and between posts), the paste is dropped and
 *     the body text is LOST. So multi-line writes are async with FLUSH_MS waits.
 *
 * Naive `el.textContent = ...` is never used: DraftJS re-renders from its own
 * state and would discard it.
 *
 * A "batch" flag lets the Coordinator's observer ignore the churn we cause.
 */
(function (TN) {
  var FLUSH_MS = 150; // time for DraftJS to flush one edit before the next
  var inBatch = false;

  function setBatch(on) { inBatch = !!on; }
  function isProgrammatic() { return inBatch; }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /** Replace the field's content with newText. Returns a Promise that resolves
   *  once DraftJS has settled (important so the caller can move to the next
   *  field without racing the paste). */
  function replaceContent(editable, newText) {
    editable.focus();
    selectAll(editable);
    var text = newText == null ? '' : String(newText);
    if (!text.length) {
      document.execCommand('delete', false, null);
      return Promise.resolve();
    }
    var lines = text.split('\n');
    document.execCommand('insertText', false, lines[0]);
    if (lines.length === 1) {
      return Promise.resolve();
    }
    // Multi-line: let the insertText settle, then paste the remaining lines
    // (newlines become real blocks), then let that settle too.
    var rest = '\n' + lines.slice(1).join('\n');
    return delay(FLUSH_MS).then(function () {
      editable.focus();
      pasteText(editable, rest);
      return delay(FLUSH_MS);
    });
  }

  function selectAll(editable) {
    try {
      if (document.execCommand('selectAll', false, null)) return;
    } catch (e) { /* fall through to range selection */ }
    var range = document.createRange();
    range.selectNodeContents(editable);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /** Dispatch a paste DraftJS will handle, carrying our text. DraftJS reads
   *  clipboardData.getData('text') and splits on newlines into blocks. */
  function pasteText(editable, text) {
    var data = new DataTransfer();
    data.setData('text/plain', text);
    editable.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    }));
  }

  TN.EditorTextManager = {
    replaceContent: replaceContent,
    setBatch: setBatch,
    isProgrammatic: isProgrammatic,
  };
})(window.TN = window.TN || {});
