/**
 * Content script entry point. Wires the dependencies together
 * (SettingsRepository -> Service -> Button -> Coordinator) and starts.
 */
(function (TN) {
  function boot() {
    var service = new TN.ThreadNumberingService(TN.SettingsRepository);
    var button = new TN.ComposerButton(function () {
      return service.applyNumbering();
    });
    var coordinator = new TN.ComposerCoordinator(
      button,
      TN.ComposerScanner,
      TN.EditorTextManager
    );
    coordinator.start();
  }

  if (document.body) {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})(window.TN = window.TN || {});
