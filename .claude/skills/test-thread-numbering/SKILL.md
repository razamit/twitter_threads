---
name: test-thread-numbering
description: End-to-end browser test for the Thread Numberer for X extension. Builds a thread in X's composer, clicks the extension's "Number thread" button, and verifies BOTH the numbers AND that each post's body text is preserved, then adds a 4th post, re-numbers, and verifies again. Use when asked to test the extension, run the thread numbering test, verify numbering works, or check that numbering doesn't delete post text. Drafts only — never posts.
---

# Test: Thread Numberer for X

End-to-end test driven through the `claude-in-chrome` browser tools. It exercises
the on-demand **Number thread** button and asserts, after every numbering pass,
that each post shows the right number **and still contains its original body
text** (the regression this guards against: numbering deleting the post body).

## Absolute rules

- **DRAFTS ONLY. NEVER post.** Do not click **Post** / **Post all**. Finish by
  closing the composer (✕) and choosing **Save** (or **Discard**) — never post.
- The extension uses the default config for this test: **position = prefix,
  format = n/total, "Start text on a new line" = ON**. Expected per post:
  block 0 = `"i/total"`, remaining blocks = the original body lines.

## Before running — make sure the latest code is loaded

If the extension code changed since it was last loaded, the test will run against
stale code. Ask the user to **reload the extension** in `chrome://extensions`
(↻ on "Thread Numberer for X") if you're not sure. The content script is only
re-injected on a **page load**, so this test always navigates fresh (step 1),
which is enough after a reload — but a reload in `chrome://extensions` is still
required for the new files to be active. The manifest `version` (e.g. 1.0.2) is a
quick way to confirm which build is loaded.

## Load tools

```
ToolSearch select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__javascript_tool
```

## Fixed test data (bodies)

- P1: `First post about my topic`
- P2: `Second post continuing the thread`
- P3: `Third and final post here`
- P4: `A fourth post added later`

## Locating buttons (don't hardcode pixels)

Coordinates shift with window size. Get a button's click point at the moment you
need it with this helper (replace `SELECTOR`), then `computer left_click` its x/y:

```js
(() => { const el = document.querySelector(`SELECTOR`); if (!el) return 'NOT FOUND';
  const r = el.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })();
```

- **Number thread** button: `SELECTOR` = `.tn-compose-btn`
- **Add post (+)**: locate it visually from a screenshot (the blue circular **+**
  just left of the **Post** / **Post all** button) and click its center. (The
  `[data-testid="addButton"]` rect can be slightly off, so prefer the screenshot.)

## Verification snippet (run after every numbering pass)

Replace `EXPECTED` with the array of expected body strings for the current state
(in post order). Returns `allOk` plus a per-post breakdown with `numberOk` and
`bodyOk`. **The body text must be preserved — `bodyOk` must be true for every post.**

```js
(() => {
  const EXPECTED = ["__FILL_ME__"]; // e.g. ["First post about my topic", ...]
  const S = { f:'div[data-testid^="tweetTextarea_"]:not([data-testid$="_label"])', w:'[contenteditable="true"][role="textbox"]', e:'[contenteditable="true"]' };
  const vis = el => { if (!el || !el.getClientRects().length) return false; const r = el.getBoundingClientRect(); return r.width>1 && r.height>1; };
  const resolve = c => (c.matches && c.matches(S.e)) ? c : (c.querySelector(S.w) || c.querySelector(S.e) || c);
  const dialogs = [...document.querySelectorAll('[role="dialog"]')]; let scope = document;
  for (let i=dialogs.length-1;i>=0;i--){ if (vis(dialogs[i]) && dialogs[i].querySelector(S.f)) { scope = dialogs[i]; break; } }
  const seen=[], fields=[];
  scope.querySelectorAll(S.f).forEach(c => { const ed=resolve(c); if (ed && seen.indexOf(ed)===-1 && ed.getAttribute('contenteditable')==='true' && vis(ed)) { seen.push(ed); fields.push(ed); } });
  const total = fields.length;
  const checks = fields.map((ed,i) => {
    const blocks = [...ed.querySelectorAll('div[data-block="true"]')].map(b=>b.textContent);
    const bodyLines = String(EXPECTED[i] ?? '').split('\n');
    const want = [(i+1)+'/'+total, ...bodyLines];
    return { post:i+1, blocks, want,
      numberOk: blocks[0] === (i+1)+'/'+total,
      bodyOk: JSON.stringify(blocks.slice(1)) === JSON.stringify(bodyLines),
      ok: JSON.stringify(blocks) === JSON.stringify(want) };
  });
  return JSON.stringify({ count: total, countOk: total === EXPECTED.length,
    allOk: total === EXPECTED.length && checks.every(c=>c.ok), checks }, null, 2);
})();
```

## Procedure

### 1. Fresh page
- `tabs_context_mcp` to get the tab. If none usable, create one.
- `navigate` the tab to `https://x.com/home` (forces a fresh content-script
  injection). If a "Leave site?" / unsaved-changes dialog blocks it, close any
  open composer first (✕ → Save) then retry.

### 2. Open the composer and build 3 posts
- Click the sidebar **Post** button to open the modal composer, then click into
  the "What's happening?" field.
- Type **P1**.
- Screenshot, click the **+** (just left of Post), type **P2**.
- Screenshot, click the **+** again, type **P3**.
- Screenshot to confirm 3 posts and that the **Number thread** button is in the
  top bar.

### 3. Number → verify (expect 1/3, 2/3, 3/3)
- Get `.tn-compose-btn` coordinate, click it.
- Wait ~1s (numbering is sequential with flush delays), then run the verification
  snippet with `EXPECTED = ["First post about my topic","Second post continuing the thread","Third and final post here"]`.
- **Require `allOk: true`.** If any `bodyOk` is false → FAIL (body was deleted).

### 4. Add a 4th post → re-number → verify (expect 1/4 … 4/4)
- Click **+**, type **P4**.
- Click **Number thread**, wait ~1s, run the verifier with
  `EXPECTED = [P1, P2, P3, P4]`.
- Require `allOk: true`. Confirm no stacking (e.g. block 0 is `4/4`, not `3/3 4/4`).

### 5. Clean up (no posting)
- Click the composer **✕**. If "Save post?" appears, click **Save** (draft) or
  **Discard** — your choice; **never Post**.

## Report

Summarize a small table: each phase → expected numbers, `allOk`, and explicitly
whether body text was preserved. If any phase failed, include the failing post's
`blocks` vs `want` from the verifier output so the bug is actionable.
