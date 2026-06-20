/**
 * Centralized DOM selectors and tuning constants for X/Twitter's composer.
 *
 * X obfuscates its CSS classes but keeps `data-testid` attributes stable.
 * These are still the single most likely thing to break when X changes its
 * DOM, so everything that touches the page reads from here — patch in one
 * place if selectors ever drift.
 */
(function (TN) {
  TN.SELECTORS = {
    // Each composing post is a DraftJS contenteditable carrying this testid:
    // tweetTextarea_0, tweetTextarea_1, ... (zero-indexed = thread position).
    // The `_label` variants wrap them and must be excluded.
    postField: 'div[data-testid^="tweetTextarea_"]:not([data-testid$="_label"])',

    // Resolve the actual editable element (in case the testid sits on a wrapper).
    editableWithin: '[contenteditable="true"][role="textbox"]',
    editableFallback: '[contenteditable="true"]',

    // DraftJS inner structure used when reading the current text of a field.
    block: 'div[data-block="true"]',
    textLeaf: '[data-text="true"]',
  };

  TN.CONFIG = {
    // Only treat the composer as a "thread" (and show the button) at/above this.
    minPostsForThread: 2,
  };
})(window.TN = window.TN || {});
