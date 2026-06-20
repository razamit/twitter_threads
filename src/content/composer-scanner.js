/**
 * ComposerScanner (Manager) — reads the composer DOM. Returns the active
 * composer's post fields in order and extracts their text.
 *
 * Robustness matters here: X keeps phantom/duplicate `tweetTextarea_`-prefixed
 * nodes and leaves the background timeline composer mounted behind the modal.
 * So we (1) scope to the active composer dialog when one is open, (2) resolve
 * each candidate to its real contenteditable, (3) de-duplicate by that resolved
 * element, and (4) keep only visible editable text boxes. This is what makes
 * the count correct (3 posts -> 1/3, 2/3, 3/3, not 2/6, 5/6, 6/6).
 */
(function (TN) {
  var S = TN.SELECTORS;

  /** The composer the user is in: the visible modal dialog if open, else the
   *  whole document (inline timeline composer). */
  function activeScope() {
    var dialogs = document.querySelectorAll('[role="dialog"]');
    for (var i = dialogs.length - 1; i >= 0; i--) {
      if (isVisible(dialogs[i]) && dialogs[i].querySelector(S.postField)) {
        return dialogs[i];
      }
    }
    return document;
  }

  /** { scope, fields } — scope is the dialog element (or null for inline). */
  function getActiveComposer() {
    var scope = activeScope();
    return {
      scope: scope === document ? null : scope,
      fields: collectFields(scope),
    };
  }

  function collectFields(scope) {
    var candidates = scope.querySelectorAll(S.postField);
    var seen = [];
    var entries = [];
    Array.prototype.forEach.call(candidates, function (candidate) {
      var editable = resolveEditable(candidate);
      if (!editable || seen.indexOf(editable) !== -1) return;
      if (!isEditable(editable) || !isVisible(editable)) return;
      seen.push(editable);
      entries.push({ el: editable, index: testidIndex(candidate) });
    });
    entries.sort(function (a, b) { return a.index - b.index; });
    return entries.map(function (entry) { return entry.el; });
  }

  function resolveEditable(container) {
    if (container.matches && container.matches(S.editableFallback)) return container;
    return container.querySelector(S.editableWithin) ||
      container.querySelector(S.editableFallback) ||
      container;
  }

  function isEditable(el) {
    return el.getAttribute('contenteditable') === 'true' ||
      el.getAttribute('role') === 'textbox';
  }

  function isVisible(el) {
    if (!el || !el.getClientRects().length) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  }

  function testidIndex(el) {
    var match = (el.getAttribute('data-testid') || '').match(/_(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /** Current plain text of a field, joining DraftJS blocks with newlines. */
  function readText(editable) {
    var blocks = editable.querySelectorAll(S.block);
    if (blocks.length) {
      return Array.prototype.slice.call(blocks).map(blockText).join('\n');
    }
    return editable.textContent || '';
  }

  function blockText(block) {
    var leaves = block.querySelectorAll(S.textLeaf);
    if (leaves.length) {
      return Array.prototype.slice.call(leaves)
        .map(function (leaf) { return leaf.textContent; })
        .join('');
    }
    return block.textContent || '';
  }

  TN.ComposerScanner = {
    getActiveComposer: getActiveComposer,
    readText: readText,
  };
})(window.TN = window.TN || {});
