// Headless unit tests for the pure NumberingManager logic.
// Run with:  node test/numbering.test.js
//
// NumberingManager has no DOM/Chrome dependencies, so we load the shared
// browser modules into a fake `window` (they each do window.TN = window.TN || {}).
const fs = require('fs');
const path = require('path');

const window = {};
const base = path.join(__dirname, '..', 'src', 'shared');
for (const f of ['defaults.js', 'numbering-manager.js']) {
  eval(fs.readFileSync(path.join(base, f), 'utf8'));
}
const NM = window.TN.NumberingManager;

let pass = 0, fail = 0;
function eq(actual, expected, name) {
  if (actual === expected) { pass++; }
  else { fail++; console.error(`FAIL ${name}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`); }
}

const PREFIX_CT = { position: 'prefix', formatType: 'count-total', separator: ' ', customTemplate: '{n}/{total}', lineBreak: false };
const SUFFIX_CT = Object.assign({}, PREFIX_CT, { position: 'suffix' });
const PREFIX_OPEN = Object.assign({}, PREFIX_CT, { formatType: 'count-open' });
const PREFIX_DOT = Object.assign({}, PREFIX_CT, { formatType: 'ordinal-dot' });
const PREFIX_CUSTOM = Object.assign({}, PREFIX_CT, { formatType: 'custom', customTemplate: '{n} of {total}' });

// format()
eq(NM.format(3, 5, PREFIX_CT), '3/5', 'format count-total');
eq(NM.format(3, 5, PREFIX_OPEN), '3/', 'format count-open');
eq(NM.format(3, 5, PREFIX_DOT), '3.', 'format ordinal-dot');
eq(NM.format(2, 4, PREFIX_CUSTOM), '2 of 4', 'format custom');

// applyPosition()
eq(NM.applyPosition('hello', '1/5', PREFIX_CT), '1/5 hello', 'apply prefix');
eq(NM.applyPosition('hello', '1/5', SUFFIX_CT), 'hello 1/5', 'apply suffix');
eq(NM.applyPosition('', '1/5', PREFIX_CT), '1/5', 'apply prefix empty body');
eq(NM.applyPosition('', '1/5', SUFFIX_CT), '1/5', 'apply suffix empty body');
eq(NM.applyPosition('line1\nline2', '1/2', PREFIX_CT), '1/2 line1\nline2', 'apply prefix preserves newline');

// stripExisting()
eq(NM.stripExisting('1/5 hello', PREFIX_CT), 'hello', 'strip prefix count-total');
eq(NM.stripExisting('hello 1/5', SUFFIX_CT), 'hello', 'strip suffix count-total');
eq(NM.stripExisting('1/ hello', PREFIX_CT), 'hello', 'strip prefix open under count-total settings');
eq(NM.stripExisting('3. hello', PREFIX_CT), 'hello', 'strip prefix dot under count-total settings');
eq(NM.stripExisting('2 of 4 hello', PREFIX_CUSTOM), 'hello', 'strip prefix custom');
eq(NM.stripExisting('plain text', PREFIX_CT), 'plain text', 'strip leaves clean text');

// Re-apply must not stack numbering (the add/remove-post scenario).
function renumber(bodies, settings) {
  const total = bodies.length;
  return bodies.map((b, i) =>
    NM.applyPosition(NM.stripExisting(b, settings), NM.format(i + 1, total, settings), settings));
}
let r1 = renumber(['a', 'b', 'c'], PREFIX_CT);
eq(r1.join('|'), '1/3 a|2/3 b|3/3 c', 'first numbering pass');
let r2 = renumber(r1.concat(['d']), PREFIX_CT); // added a 4th post
eq(r2.join('|'), '1/4 a|2/4 b|3/4 c|4/4 d', 'reapply after add updates totals, no stacking');
let r3 = renumber([r2[0], r2[2], r2[3]], PREFIX_CT); // removed the 2nd post
eq(r3.join('|'), '1/3 a|2/3 c|3/3 d', 'reapply after remove re-sequences');

// Line-break behavior: number on its own line, body on the next row.
const PREFIX_LB = Object.assign({}, PREFIX_CT, { lineBreak: true });
const SUFFIX_LB = Object.assign({}, PREFIX_CT, { position: 'suffix', lineBreak: true });
eq(NM.applyPosition('hello', '1/5', PREFIX_LB), '1/5\nhello', 'lineBreak prefix joins with newline');
eq(NM.applyPosition('hello', '1/5', SUFFIX_LB), 'hello\n1/5', 'lineBreak suffix joins with newline');
eq(NM.applyPosition('', '1/5', PREFIX_LB), '1/5', 'lineBreak empty body -> just token');
eq(NM.applyPosition('line1\nline2', '1/2', PREFIX_LB), '1/2\nline1\nline2', 'lineBreak preserves body newlines');
// Re-number a line-break post: strip must remove the number AND its newline.
eq(NM.stripExisting('1/5\nhello', PREFIX_LB), 'hello', 'lineBreak strip removes token + newline (prefix)');
eq(NM.stripExisting('hello\n1/5', SUFFIX_LB), 'hello', 'lineBreak strip removes token + newline (suffix)');
function renumberLB(bodies, settings) {
  const total = bodies.length;
  return bodies.map((b, i) =>
    NM.applyPosition(NM.stripExisting(b, settings), NM.format(i + 1, total, settings), settings));
}
let lb1 = renumberLB(['a', 'b'], PREFIX_LB);
eq(lb1.join('|'), '1/2\na|2/2\nb', 'lineBreak first pass');
let lb2 = renumberLB(lb1.concat(['c']), PREFIX_LB);
eq(lb2.join('|'), '1/3\na|2/3\nb|3/3\nc', 'lineBreak reapply after add — no stacking, newline kept');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
