import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { categorize, reconcile } from '../lib/engine.ts';
import type { BankTxn, LedgerTxn } from '../lib/types.ts';

const { ledger, bank } = JSON.parse(readFileSync(new URL('../data/ledger.json', import.meta.url), 'utf8')) as { ledger: LedgerTxn[]; bank: BankTxn[] };

assert.equal(categorize('Stripe payout').category, 'Revenue');
assert.equal(categorize('Gusto payroll').category, 'Payroll');
assert.equal(categorize('OpenAI').category, 'Cloud Infrastructure');
assert.equal(categorize('Misc reimbursement - J. Chen').category, 'Uncategorized');
assert.equal(categorize('Misc reimbursement - J. Chen').rule, null);

const { matched, exceptions } = reconcile(ledger, bank);
assert.equal(matched.length, 12, `expected 12 exact matches, got ${matched.length}`);
const kinds = exceptions.map((e) => e.kind).sort();
assert.deepEqual(kinds, ['amount-mismatch', 'bank-only', 'ledger-only', 'ledger-only']);
const mm = exceptions.find((e) => e.kind === 'amount-mismatch');
assert.ok(mm && mm.kind === 'amount-mismatch' && mm.ledger.id === 'l-09' && mm.bank.id === 'b-09' && Math.abs(mm.diff - 10) < 0.001, 'stripe $10 mismatch found');
assert.ok(exceptions.some((e) => e.kind === 'bank-only' && e.bank.id === 'b-14'), 'wire fee bank-only');
assert.ok(exceptions.some((e) => e.kind === 'ledger-only' && e.ledger.id === 'l-12'), 'google workspace ledger-only (card, not this feed)');
// Matched bank rows are consumed: a duplicate-amount pair must not double-match one bank row.
const dup = reconcile(
  [{ id: 'x1', date: '2026-11-01', vendor: 'A', amount: -100, account: 'a' }, { id: 'x2', date: '2026-11-01', vendor: 'B', amount: -100, account: 'a' }],
  [{ id: 'y1', date: '2026-11-01', memo: 'A', amount: -100 }],
);
assert.equal(dup.matched.length, 1, 'one bank row matches at most one ledger row');
console.log('engine tests pass');
