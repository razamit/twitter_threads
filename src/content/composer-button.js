/**
 * ComposerButton (View) — the on-demand "Number thread" button, injected into
 * X's own composer top bar (next to "Drafts") so it's easy to find. Styled to
 * adapt to X's light/dark theme via `color: inherit` and a neutral translucent
 * border. Falls back to a fixed top-center button if no header is found
 * (e.g. the inline timeline composer). Calls the injected `onClick` (the
 * numbering service) and flashes a brief status.
 */
(function (TN) {
  var DEFAULT_LABEL = 'Number thread';
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
    ' width="16" height="16" aria-hidden="true">' +
    '<line x1="10" x2="21" y1="6" y2="6"/>' +
    '<line x1="10" x2="21" y1="12" y2="12"/>' +
    '<line x1="10" x2="21" y1="18" y2="18"/>' +
    '<path d="M4 6h1v4"/><path d="M4 10h2"/>' +
    '<path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>';

  function ComposerButton(onClick) {
    this.onClick = onClick;
    this.button = buildButton(this.handleClick.bind(this));
    this.labelNode = this.button.querySelector('.tn-label');
    this.resetTimer = null;
    injectHoverStyle();
  }

  /** Ensure the button lives in the given composer scope's top bar. */
  ComposerButton.prototype.ensureMounted = function (scope) {
    if (this.button.isConnected && (!scope || scope.contains(this.button))) return;
    var anchor = scope ? headerAnchor(scope) : null;
    if (anchor) {
      this.button.style.position = '';
      this.button.style.transform = '';
      if (anchor.before) anchor.parent.insertBefore(this.button, anchor.before);
      else anchor.parent.appendChild(this.button);
    } else {
      applyFixedFallback(this.button);
      document.body.appendChild(this.button);
    }
  };

  ComposerButton.prototype.unmount = function () {
    if (this.button.isConnected) this.button.remove();
  };

  ComposerButton.prototype.handleClick = function (event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.onClick || this.button.disabled) return;
    var self = this;
    this.setBusy(true);
    Promise.resolve(this.onClick())
      .then(function (result) {
        self.flash(result && result.applied
          ? 'Numbered ' + result.applied + ' ✓'
          : DEFAULT_LABEL);
      })
      .catch(function () { self.flash('Failed'); })
      .then(function () { self.setBusy(false); });
  };

  ComposerButton.prototype.setBusy = function (busy) {
    this.button.disabled = busy;
  };

  ComposerButton.prototype.flash = function (message) {
    var self = this;
    this.labelNode.textContent = message;
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(function () {
      self.labelNode.textContent = DEFAULT_LABEL;
    }, 1600);
  };

  function buildButton(onClick) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'tn-compose-btn';
    button.setAttribute('aria-label', DEFAULT_LABEL);
    button.style.cssText =
      'display:inline-flex;align-items:center;align-self:center;gap:6px;' +
      'margin:0 8px;padding:6px 14px;border-radius:9999px;' +
      'border:1px solid rgba(127,127,127,.5);background:transparent;' +
      'color:inherit;font:inherit;font-size:14px;font-weight:600;' +
      'line-height:1;white-space:nowrap;flex-shrink:0;cursor:pointer;';
    button.innerHTML = ICON + '<span class="tn-label">' + DEFAULT_LABEL + '</span>';
    button.addEventListener('click', onClick);
    return button;
  }

  function applyFixedFallback(button) {
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.left = '50%';
    button.style.transform = 'translateX(-50%)';
    button.style.zIndex = '2147483646';
  }

  /** Find the composer header (the bar with the close button + "Drafts") and a
   *  point to insert before, so the button sits at the top of the composer. */
  function headerAnchor(scope) {
    var closeBtn = scope.querySelector('[data-testid="app-bar-close"]');
    if (!closeBtn) return null;
    var header = closeBtn.parentElement;
    var hops = 0;
    while (header && hops < 4) {
      var draftsChild = directChildContaining(header, 'Drafts');
      if (draftsChild) return { parent: header, before: draftsChild };
      header = header.parentElement;
      hops++;
    }
    return { parent: closeBtn.parentElement, before: null };
  }

  function directChildContaining(container, text) {
    var nodes = container.querySelectorAll('span, div, a, button');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].textContent.trim() === text) {
        return directChildOf(container, nodes[i]);
      }
    }
    return null;
  }

  function directChildOf(parent, node) {
    var current = node;
    while (current && current.parentElement !== parent) {
      current = current.parentElement;
    }
    return current;
  }

  function injectHoverStyle() {
    if (document.getElementById('tn-compose-btn-style')) return;
    var style = document.createElement('style');
    style.id = 'tn-compose-btn-style';
    style.textContent =
      '.tn-compose-btn:hover{background:rgba(127,127,127,.15);}' +
      '.tn-compose-btn:disabled{opacity:.6;cursor:default;}';
    (document.head || document.documentElement).appendChild(style);
  }

  TN.ComposerButton = ComposerButton;
})(window.TN = window.TN || {});
