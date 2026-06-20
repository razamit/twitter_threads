/**
 * PopupViewModel — binds the popup controls to the stored settings and renders
 * a live preview. UI logic only: it owns no numbering rules (delegates to
 * NumberingManager) and no storage details (delegates to SettingsRepository).
 */
(function (TN) {
  function PopupViewModel(doc, settingsRepository) {
    this.doc = doc;
    this.settingsRepository = settingsRepository;
    this.settings = Object.assign({}, TN.DEFAULT_SETTINGS);
    this.els = {};
  }

  PopupViewModel.prototype.init = function () {
    var self = this;
    this.cacheElements();
    this.renderFormatOptions();
    this.bindEvents();
    return this.settingsRepository.get().then(function (settings) {
      self.settings = settings;
      self.syncControls();
      self.renderPreview();
    });
  };

  PopupViewModel.prototype.cacheElements = function () {
    var d = this.doc;
    this.els = {
      position: d.getElementById('tn-position'),
      formats: d.getElementById('tn-formats'),
      customRow: d.getElementById('tn-custom-row'),
      custom: d.getElementById('tn-custom'),
      separator: d.getElementById('tn-separator'),
      preview: d.getElementById('tn-preview'),
    };
  };

  PopupViewModel.prototype.renderFormatOptions = function () {
    this.els.formats.innerHTML = TN.FORMAT_PRESETS.map(function (preset) {
      return '<label class="option" data-format="' + preset.id + '">' +
        '<input type="radio" name="tn-format" value="' + preset.id + '" />' +
        '<span class="option-label">' + preset.label + '</span>' +
        '<span class="option-hint">' + preset.hint + '</span>' +
        '</label>';
    }).join('');
  };

  PopupViewModel.prototype.bindEvents = function () {
    var self = this;
    this.els.position.addEventListener('click', function (event) {
      var segment = event.target.closest('.segment');
      if (segment) self.update({ position: segment.getAttribute('data-position') });
    });
    this.els.formats.addEventListener('change', function (event) {
      if (event.target.name === 'tn-format') {
        self.update({ formatType: event.target.value });
      }
    });
    this.els.custom.addEventListener('input', function () {
      self.update({ customTemplate: self.els.custom.value });
    });
    this.els.separator.addEventListener('input', function () {
      self.update({ separator: self.els.separator.value });
    });
  };

  PopupViewModel.prototype.update = function (patch) {
    this.settings = Object.assign({}, this.settings, patch);
    this.syncControls();
    this.renderPreview();
    this.settingsRepository.set(this.settings);
  };

  PopupViewModel.prototype.syncControls = function () {
    setActive(this.els.position.querySelectorAll('.segment'), 'data-position',
      this.settings.position);
    var options = this.els.formats.querySelectorAll('.option');
    setActive(options, 'data-format', this.settings.formatType);
    Array.prototype.forEach.call(options, function (option) {
      option.querySelector('input').checked =
        option.getAttribute('data-format') === this.settings.formatType;
    }, this);

    this.els.customRow.hidden = this.settings.formatType !== TN.FORMAT_TYPES.CUSTOM;
    setInputValue(this.els.custom, this.settings.customTemplate || '');
    setInputValue(this.els.separator, this.settings.separator);
  };

  PopupViewModel.prototype.renderPreview = function () {
    this.els.preview.textContent = TN.NumberingManager.example(this.settings);
  };

  function setActive(nodes, attribute, value) {
    Array.prototype.forEach.call(nodes, function (node) {
      node.classList.toggle('is-active', node.getAttribute(attribute) === value);
    });
  }

  function setInputValue(input, value) {
    if (input.value !== value) input.value = value;
  }

  TN.PopupViewModel = PopupViewModel;
})(window.TN = window.TN || {});
