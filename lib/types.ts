export type LedgerTxn = { id: string; date: string; vendor: string; amount: number; account: string };
export type BankTxn = { id: string; date: string; memo: string; amount: number };
export type Category =
  | 'Revenue' | 'Payroll' | 'Cloud Infrastructure' | 'Rent' | 'Software'
  | 'Travel' | 'Professional Services' | 'Bank Fees' | 'Uncategorized';
export type Exception =
  | { kind: 'amount-mismatch'; ledger: LedgerTxn; bank: BankTxn; diff: number }
  | { kind: 'bank-only'; bank: BankTxn }
  | { kind: 'ledger-only'; ledger: LedgerTxn };
export type ChecklistStep = 'reconcile' | 'categorize' | 'accruals' | 'lock';
export type AuditEvent = { step: string; actor: string; at: string; detail: string };
