'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, btn2 } from './ui';
import { money, fmtDate } from '@/lib/format';
import type { AuditEvent, BankTxn, Category, ChecklistStep, Exception, LedgerTxn } from '@/lib/types';
import { CATEGORIES } from '@/lib/validate';

type Row = LedgerTxn & { suggested: Category; rule: string | null; category: Category; overridden: boolean };
export type BoardState = {
  note: string;
  ledger: Row[];
  bank: BankTxn[];
  matchedCount: number;
  open: Exception[];
  resolvedList: { key: string; resolution: string }[];
  states: Record<ChecklistStep, boolean>;
  trail: AuditEvent[];
  uncategorized: number;
};

const STEP_LABELS: Record<ChecklistStep, string> = {
  reconcile: 'Reconcile bank feed to ledger',
  categorize: 'Review uncategorized transactions',
  accruals: 'Review accruals',
  lock: 'Lock the period',
};
const STEP_ORDER: ChecklistStep[] = ['reconcile', 'categorize', 'accruals', 'lock'];

function exKey(e: Exception): string {
  if (e.kind === 'amount-mismatch') return `mismatch:${e.ledger.id}:${e.bank.id}`;
  if (e.kind === 'bank-only') return `bank-only:${e.bank.id}`;
  return `ledger-only:${e.ledger.id}`;
}
function exText(e: Exception): string {
  if (e.kind === 'amount-mismatch')
    return `Ledger has ${e.ledger.vendor} at ${money(e.ledger.amount)} but the bank shows ${money(e.bank.amount)} (${money(e.diff)} difference).`;
  if (e.kind === 'bank-only') return `Bank shows "${e.bank.memo}" at ${money(e.bank.amount)} with no ledger entry.`;
  return `Ledger has ${e.ledger.vendor} at ${money(e.ledger.amount)} but nothing matching cleared the bank.`;
}
const RESOLUTIONS = [
  { id: 'matched-anyway', label: 'Match anyway' },
  { id: 'create-entry', label: 'Create entry' },
  { id: 'accepted', label: 'Accept difference' },
] as const;

export default function CloseBoard({ initial }: { initial: BoardState }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const post = (url: string, body: unknown) =>
    start(async () => {
      setErr(null);
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { setErr((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`); return; }
      router.refresh();
    });

  const done = STEP_ORDER.filter((s) => initial.states[s]).length;

  return (
    <div className="mt-6 grid gap-4 pb-10 lg:grid-cols-2">
      {err && <div className="rounded-card border border-red-200 bg-red-50 p-3 text-sm text-red-800 lg:col-span-2">{err}</div>}

      <Panel title={`Exception queue (${initial.open.length} open, ${initial.resolvedList.length} resolved)`}>
        {initial.open.length === 0 ? (
          <p className="text-sm text-mute">Queue clear. Every bank row matches the ledger or has a recorded resolution.</p>
        ) : (
          <ul className="space-y-3">
            {initial.open.map((e) => (
              <li key={exKey(e)} className="rounded-ctl border border-line p-3">
                <div className="text-sm text-ink">{exText(e)}</div>
                <div className="mt-1 text-xs text-mute">{e.kind === 'bank-only' ? `Cleared ${e.bank.date}` : e.kind === 'ledger-only' ? `Dated ${e.ledger.date}` : `Ledger ${e.ledger.date}, bank ${e.bank.date}`}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button key={r.id} disabled={pending} className={btn2}
                      onClick={() => post('/api/exceptions', { key: exKey(e), resolution: r.id })}>{r.label}</button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`Close checklist (${done} of ${STEP_ORDER.length})`}>
        <ul className="space-y-2">
          {STEP_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-3 rounded-ctl border border-line p-3">
              <input type="checkbox" checked={Boolean(initial.states[s])} disabled={pending}
                onChange={(ev) => post('/api/steps', { step: s, done: ev.target.checked })}
                className="h-4 w-4 accent-accent" />
              <span className={`text-sm ${initial.states[s] ? 'text-mute line-through' : 'text-ink'}`}>{STEP_LABELS[s]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-mute">Each check or uncheck is written to the audit trail below with a timestamp.</p>
      </Panel>

      <Panel title={`Ledger (${initial.uncategorized} uncategorized)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-mute"><th className="pb-2 pr-3">Date</th><th className="pb-2 pr-3">Vendor</th><th className="pb-2 pr-3 text-right">Amount</th><th className="pb-2">Category</th></tr></thead>
            <tbody>
              {initial.ledger.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="py-2 pr-3 text-mute">{t.date.slice(5)}</td>
                  <td className="py-2 pr-3 text-ink">{t.vendor}</td>
                  <td className={`py-2 pr-3 text-right tabular-nums ${t.amount < 0 ? 'text-ink' : 'text-green-700'}`}>{money(t.amount)}</td>
                  <td className="py-2">
                    <select value={t.category} disabled={pending}
                      onChange={(ev) => post('/api/categorize', { txnId: t.id, category: ev.target.value })}
                      className="w-full rounded-ctl border border-line bg-white px-2 py-1 text-xs text-ink">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="mt-0.5 text-[11px] text-mute">{t.overridden ? 'your override' : t.rule ? 'rule-based suggestion' : 'no rule matched'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Audit trail">
        {initial.trail.length === 0 ? (
          <p className="text-sm text-mute">Nothing recorded yet. Recategorize a transaction, resolve an exception, or check a step and it appears here.</p>
        ) : (
          <ul className="space-y-2">
            {initial.trail.map((a, i) => (
              <li key={i} className="text-sm">
                <span className="text-mute">{fmtDate(a.at)}</span> <span className="text-ink">{a.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
