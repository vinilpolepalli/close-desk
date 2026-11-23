import type { BankTxn, Category, Exception, LedgerTxn } from './types';

/** Explicit vendor rules, not ML. Every suggestion is labeled rule-based in the UI. */
export const RULES: { match: RegExp; category: Category }[] = [
  { match: /stripe payout/i, category: 'Revenue' },
  { match: /gusto/i, category: 'Payroll' },
  { match: /amazon web services|openai/i, category: 'Cloud Infrastructure' },
  { match: /wework/i, category: 'Rent' },
  { match: /figma|notion|google workspace/i, category: 'Software' },
  { match: /delta|united|hotel|airlines/i, category: 'Travel' },
  { match: /legal|llp|cpa|accounting/i, category: 'Professional Services' },
  { match: /bank fee/i, category: 'Bank Fees' },
];

export function categorize(vendor: string): { category: Category; rule: string | null } {
  const r = RULES.find((x) => x.match.test(vendor));
  return r ? { category: r.category, rule: String(r.match) } : { category: 'Uncategorized', rule: null };
}

const days = (a: string, b: string) => Math.abs((Date.parse(a) - Date.parse(b)) / 86400000);

/** Match bank feed to ledger: same amount within +-2 days. Amount mismatches and unmatched rows become exceptions. */
export function reconcile(ledger: LedgerTxn[], bank: BankTxn[]): { matched: { ledger: LedgerTxn; bank: BankTxn }[]; exceptions: Exception[] } {
  const matched: { ledger: LedgerTxn; bank: BankTxn }[] = [];
  const exceptions: Exception[] = [];
  const usedBank = new Set<string>();
  for (const l of ledger) {
    const exact = bank.find((b) => !usedBank.has(b.id) && b.amount === l.amount && days(b.date, l.date) <= 2);
    if (exact) { matched.push({ ledger: l, bank: exact }); usedBank.add(exact.id); continue; }
    const near = bank.find((b) => !usedBank.has(b.id) && days(b.date, l.date) <= 2 && Math.abs(Math.abs(b.amount) - Math.abs(l.amount)) <= Math.max(50, Math.abs(l.amount) * 0.02));
    if (near) { exceptions.push({ kind: 'amount-mismatch', ledger: l, bank: near, diff: Math.round((near.amount - l.amount) * 100) / 100 }); usedBank.add(near.id); continue; }
    exceptions.push({ kind: 'ledger-only', ledger: l });
  }
  for (const b of bank) if (!usedBank.has(b.id)) exceptions.push({ kind: 'bank-only', bank: b });
  return { matched, exceptions };
}

export const CHECKLIST: { id: 'reconcile' | 'categorize' | 'accruals' | 'lock'; label: string; hint: string }[] = [
  { id: 'reconcile', label: 'Reconcile bank feed to ledger', hint: 'All exceptions resolved or accepted' },
  { id: 'categorize', label: 'Review uncategorized transactions', hint: 'No transaction left uncategorized' },
  { id: 'accruals', label: 'Review accruals', hint: 'Month-end accrual entries reviewed' },
  { id: 'lock', label: 'Lock the period', hint: 'Only after the other three steps' },
];
