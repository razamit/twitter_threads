/**
 * NumberingManager — pure numbering logic. No DOM, no chrome APIs, so it can
 * be reused unchanged by the popup (preview) and the content script (apply),
 * and unit-tested in isolation.
 */
(function (TN) {
  /** Render the numbering token for one post, e.g. "3/5", "3/", "3.". */
  function format(index, total, settings) {
    const n = String(index);
    const t = String(total);
    switch (settings.formatType) {
      case TN.FORMAT_TYPES.COUNT_OPEN:
        return n + '/';
      case TN.FORMAT_TYPES.ORDINAL_DOT:
        return n + '.';
      case TN.FORMAT_TYPES.CUSTOM:
        return renderTemplate(settings.customTemplate, n, t);
      case TN.FORMAT_TYPES.COUNT_TOTAL:
      default:
        return n + '/' + t;
    }
  }

  function renderTemplate(template, n, t) {
    return String(template || '')
      .replace(/\{n\}/g, n)
      .replace(/\{total\}/g, t);
  }

  /** Attach the token to the body at the configured position, preserving the
   *  body's internal content and trimming only the join boundary. */
  function applyPosition(body, token, settings) {
    const separator = settings.separator != null ? settings.separator : ' ';
    if (!token) return body;
    if (settings.position === TN.POSITIONS.SUFFIX) {
      const left = body.replace(/\s+$/, '');
      return left ? left + separator + token : token;
    }
    const right = body.replace(/^\s+/, '');
    return right ? token + separator + right : token;
  }

  /** Remove a previously-inserted numbering token at the configured position
   *  so re-applying never stacks (e.g. avoids "1/4 1/5"). The union covers all
   *  formats so switching format still cleans up the old one. */
  function stripExisting(text, settings) {
    const union = tokenPatterns(settings).join('|');
    if (settings.position === TN.POSITIONS.SUFFIX) {
      return text.replace(new RegExp('\\s*(?:' + union + ')\\s*$'), '');
    }
    return text.replace(new RegExp('^\\s*(?:' + union + ')\\s*'), '');
  }

  function tokenPatterns(settings) {
    const patterns = [
      '\\d+\\s*\\/\\s*\\d+', // 1/5
      '\\d+\\s*\\/',          // 1/
      '\\d+\\s*\\.',          // 1.
      '\\(\\s*\\d+\\s*\\)',   // (1) — tolerated extra style
    ];
    if (settings.formatType === TN.FORMAT_TYPES.CUSTOM && settings.customTemplate) {
      patterns.unshift(customToPattern(settings.customTemplate));
    }
    return patterns;
  }

  function customToPattern(template) {
    const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped
      .replace(/\\\{n\\\}/g, '\\d+')
      .replace(/\\\{total\\\}/g, '\\d+');
  }

  /** Sample string for the popup preview. */
  function example(settings) {
    return applyPosition('Your post text', format(1, 5, settings), settings);
  }

  TN.NumberingManager = {
    format: format,
    renderTemplate: renderTemplate,
    applyPosition: applyPosition,
    stripExisting: stripExisting,
    example: example,
  };
})(window.TN = window.TN || {});
