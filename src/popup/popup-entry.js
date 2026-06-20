/** Popup entry point — instantiate the view model once the DOM is ready. */
(function (TN) {
  document.addEventListener('DOMContentLoaded', function () {
    new TN.PopupViewModel(document, TN.SettingsRepository).init();
  });
})(window.TN = window.TN || {});
