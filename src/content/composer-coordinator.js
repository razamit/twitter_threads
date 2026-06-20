/**
 * ComposerCoordinator — owns navigation/state flow. X is a SPA, so the content
 * script runs once and is never re-injected on in-app navigation. We stay
 * resident and watch document.body with a debounced MutationObserver, mounting
 * the button into the composer's top bar whenever a thread composer appears and
 * removing it when it's gone (X re-renders and may drop our node, so we
 * re-assert it). It never inserts numbering itself — that's the button's job.
 */
(function (TN) {
  function ComposerCoordinator(button, scanner, editor) {
    this.button = button;
    this.scanner = scanner;
    this.editor = editor;
    this.observer = null;
    this.scheduled = false;
  }

  ComposerCoordinator.prototype.start = function () {
    this.evaluate();
    var self = this;
    this.observer = new MutationObserver(function () { self.schedule(); });
    this.observer.observe(document.body, { childList: true, subtree: true });
  };

  ComposerCoordinator.prototype.schedule = function () {
    if (this.editor.isProgrammatic()) return; // ignore our own text edits
    if (this.scheduled) return;
    this.scheduled = true;
    var self = this;
    requestAnimationFrame(function () {
      self.scheduled = false;
      self.evaluate();
    });
  };

  ComposerCoordinator.prototype.evaluate = function () {
    var composer = this.scanner.getActiveComposer();
    if (composer.fields.length >= TN.CONFIG.minPostsForThread) {
      this.button.ensureMounted(composer.scope);
    } else {
      this.button.unmount();
    }
  };

  TN.ComposerCoordinator = ComposerCoordinator;
})(window.TN = window.TN || {});
