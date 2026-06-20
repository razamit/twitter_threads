/**
 * Format definitions, positions, and default settings shared by the content
 * script (applies numbering) and the popup (renders the live preview).
 */
(function (TN) {
  TN.FORMAT_TYPES = {
    COUNT_TOTAL: 'count-total', // 1/5
    COUNT_OPEN: 'count-open',   // 1/
    ORDINAL_DOT: 'ordinal-dot', // 1.
    CUSTOM: 'custom',           // user template with {n} / {total}
  };

  // Drives the format picker in the popup.
  TN.FORMAT_PRESETS = [
    { id: 'count-total', label: 'Number / Total', hint: '1/5' },
    { id: 'count-open', label: 'Number /', hint: '1/' },
    { id: 'ordinal-dot', label: 'Number .', hint: '1.' },
    { id: 'custom', label: 'Custom template', hint: '{n}/{total}' },
  ];

  TN.POSITIONS = {
    PREFIX: 'prefix', // "1/5 text"
    SUFFIX: 'suffix', // "text 1/5"
  };

  TN.DEFAULT_SETTINGS = {
    position: 'prefix',
    formatType: 'count-total',
    customTemplate: '{n}/{total}',
    lineBreak: true, // put the number on its own line, body starts on the next row
    separator: ' ', // spacing used between number and body when lineBreak is off
  };
})(window.TN = window.TN || {});
