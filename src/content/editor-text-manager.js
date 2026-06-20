/**
 * EditorTextManager (Manager) — writes text into a DraftJS contenteditable.
 *
 * Naive `el.textContent = ...` does NOT work: DraftJS re-renders from its own
 * editorState and the posted tweet keeps the old text. The reliable path is to
 * drive a real browser edit (focus -> selectAll -> insertText) so DraftJS's own
 * input handlers fold the change into its state. execCommand is deprecated but
 * remains the only working route for contenteditable + native undo.
 *
 * A "batch" flag lets the Coordinator's observer ignore the DOM churn we cause.
 */
(function (TN) {
  var inBatch = false;

  function setBatch(on) {
    inBatch = !!on;
  }

  function isProgrammatic() {
    return inBatch;
  }

  function replaceContent(editable, newText) {
    editable.focus();
    selectAll(editable);
    if (newText && newText.length) {
      document.execCommand('insertText', false, newText);
    } else {
      document.execCommand('delete', false, null);
    }
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

  TN.EditorTextManager = {
    replaceContent: replaceContent,
    setBatch: setBatch,
    isProgrammatic: isProgrammatic,
  };
})(window.TN = window.TN || {});
