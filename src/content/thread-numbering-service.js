/**
 * ThreadNumberingService (Manager) — orchestrates one renumber pass:
 * scan fields -> for each, strip old numbering, compute new, write it back.
 * Wraps the whole pass in a batch so the Coordinator ignores our own edits,
 * and restores focus afterward.
 */
(function (TN) {
  var Scanner = TN.ComposerScanner;
  var Editor = TN.EditorTextManager;
  var Numbering = TN.NumberingManager;

  function ThreadNumberingService(settingsRepository) {
    this.settingsRepository = settingsRepository;
  }

  ThreadNumberingService.prototype.applyNumbering = function () {
    return this.settingsRepository.get().then(function (settings) {
      var fields = Scanner.getActiveComposer().fields;
      if (fields.length < TN.CONFIG.minPostsForThread) {
        return { applied: 0, reason: 'not-a-thread' };
      }
      return numberFields(fields, settings);
    });
  };

  function numberFields(fields, settings) {
    var total = fields.length;
    var previousFocus = document.activeElement;
    Editor.setBatch(true);

    // Edit fields one at a time, awaiting each so DraftJS finishes applying a
    // post's text before we touch the next one. Doing them in parallel drops
    // the paste and loses body text on all but the last post.
    var chain = Promise.resolve();
    fields.forEach(function (field, index) {
      chain = chain.then(function () {
        return Editor.replaceContent(field, numberedText(field, index, total, settings));
      });
    });

    return chain
      .then(function () { restoreFocus(previousFocus); })
      .catch(function () { /* leave whatever applied; surfaced as best-effort */ })
      .then(function () {
        setTimeout(function () { Editor.setBatch(false); }, 0);
        return { applied: total };
      });
  }

  function numberedText(field, index, total, settings) {
    var body = Scanner.readText(field);
    var stripped = Numbering.stripExisting(body, settings);
    var token = Numbering.format(index + 1, total, settings);
    return Numbering.applyPosition(stripped, token, settings);
  }

  function restoreFocus(previousFocus) {
    if (previousFocus && previousFocus.focus && document.contains(previousFocus)) {
      try { previousFocus.focus(); } catch (e) { /* ignore */ }
    }
  }

  TN.ThreadNumberingService = ThreadNumberingService;
})(window.TN = window.TN || {});
