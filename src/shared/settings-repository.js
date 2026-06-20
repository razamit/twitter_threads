/**
 * SettingsRepository — the single abstraction over chrome.storage.sync.
 * Always merges stored values onto DEFAULT_SETTINGS so callers get a complete
 * settings object. Injected into consumers rather than referenced ad hoc.
 */
(function (TN) {
  var STORAGE_KEY = 'tn_settings';

  function withDefaults(stored) {
    return Object.assign({}, TN.DEFAULT_SETTINGS, stored || {});
  }

  function get() {
    return new Promise(function (resolve) {
      chrome.storage.sync.get(STORAGE_KEY, function (result) {
        resolve(withDefaults(result && result[STORAGE_KEY]));
      });
    });
  }

  function set(settings) {
    return new Promise(function (resolve) {
      var payload = {};
      payload[STORAGE_KEY] = settings;
      chrome.storage.sync.set(payload, function () {
        resolve(settings);
      });
    });
  }

  function onChange(callback) {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === 'sync' && changes[STORAGE_KEY]) {
        callback(withDefaults(changes[STORAGE_KEY].newValue));
      }
    });
  }

  TN.SettingsRepository = { get: get, set: set, onChange: onChange };
})(window.TN = window.TN || {});
