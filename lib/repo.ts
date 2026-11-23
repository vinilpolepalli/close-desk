import { and, desc, eq } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from './db';
import { categorize, reconcile } from './engine';
import type { AuditEvent, BankTxn, Category, ChecklistStep, LedgerTxn } from './types';

export type Books = { note: string; ledger: LedgerTxn[]; bank: BankTxn[] };

let booksCache: Books | null = null;
export function books(): Books {
  if (!booksCache) booksCache = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/ledger.json'), 'utf8')) as Books;
  return booksCache;
}

export async function categoryOverrides(ownerId: string): Promise<Record<string, Category>> {
  const db = await getDb();
  const rows = await db.orm.select().from(db.t.categories).where(eq(db.t.categories.ownerId, ownerId)).orderBy(desc(db.t.categories.id));
  const out: Record<string, Category> = {};
  for (const r of rows) if (!(r.txnId in out)) out[r.txnId] = r.category as Category; // newest first wins
  return out;
}

export async function setCategory(ownerId: string, txnId: string, category: Category, actor: string): Promise<void> {
  const db = await getDb();
  const txn = books().ledger.find((t) => t.id === txnId);
  if (!txn) throw new Error('unknown transaction');
  await db.tx(async (c) => {
    await c.orm.insert(c.t.categories).values({ ownerId, txnId, category, createdAt: new Date().toISOString() });
    await c.orm.insert(c.t.audit).values({ ownerId, step: 'categorize', actor, detail: `Recategorized ${txn.vendor} to ${category}`, createdAt: new Date().toISOString() });
  });
}

export function exceptionKey(e: { kind: string; bank?: BankTxn; ledger?: LedgerTxn }): string {
  if (e.kind === 'amount-mismatch') return `mismatch:${e.ledger!.id}:${e.bank!.id}`;
  if (e.kind === 'bank-only') return `bank-only:${e.bank!.id}`;
  return `ledger-only:${e.ledger!.id}`;
}

export async function resolvedKeys(ownerId: string): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.orm.select().from(db.t.resolutions).where(eq(db.t.resolutions.ownerId, ownerId)).orderBy(desc(db.t.resolutions.id));
  const out: Record<string, string> = {};
  for (const r of rows) if (!(r.exKey in out)) out[r.exKey] = r.resolution;
  return out;
}

export async function resolveException(ownerId: string, key: string, resolution: string, actor: string): Promise<void> {
  const db = await getDb();
  await db.tx(async (c) => {
    await c.orm.insert(c.t.resolutions).values({ ownerId, exKey: key, resolution, createdAt: new Date().toISOString() });
    await c.orm.insert(c.t.audit).values({ ownerId, step: 'reconcile', actor, detail: `Resolved exception ${key} as ${resolution}`, createdAt: new Date().toISOString() });
  });
}

export async function stepStates(ownerId: string): Promise<Record<ChecklistStep, boolean>> {
  const db = await getDb();
  const rows = await db.orm.select().from(db.t.steps).where(eq(db.t.steps.ownerId, ownerId)).orderBy(desc(db.t.steps.id));
  const out: Record<string, boolean> = {};
  for (const r of rows) if (!(r.step in out)) out[r.step] = r.done !== 0;
  return out as Record<ChecklistStep, boolean>;
}

export async function setStep(ownerId: string, step: ChecklistStep, done: boolean, actor: string): Promise<void> {
  const db = await getDb();
  await db.tx(async (c) => {
    await c.orm.insert(c.t.steps).values({ ownerId, step, done: done ? 1 : 0, createdAt: new Date().toISOString() });
    await c.orm.insert(c.t.audit).values({ ownerId, step, actor, detail: `${done ? 'Completed' : 'Reopened'} checklist step "${step}"`, createdAt: new Date().toISOString() });
  });
}

export async function auditTrail(ownerId: string, limit = 30): Promise<AuditEvent[]> {
  const db = await getDb();
  const rows = await db.orm.select().from(db.t.audit).where(and(eq(db.t.audit.ownerId, ownerId))).orderBy(desc(db.t.audit.id)).limit(limit);
  return rows.map((r) => ({ step: r.step, actor: r.actor, at: r.createdAt, detail: r.detail }));
}

/** Full board state for one owner: categorized ledger, live exceptions (unresolved only), checklist, audit. */
export async function board(ownerId: string) {
  const b = books();
  const [overrides, resolved, states, trail] = await Promise.all([
    categoryOverrides(ownerId), resolvedKeys(ownerId), stepStates(ownerId), auditTrail(ownerId),
  ]);
  const ledger = b.ledger.map((t) => {
    const sug = categorize(t.vendor);
    const chosen = overrides[t.id];
    return { ...t, suggested: sug.category, rule: sug.rule, category: chosen ?? sug.category, overridden: Boolean(chosen) };
  });
  const { matched, exceptions } = reconcile(b.ledger, b.bank);
  const open = exceptions.filter((e) => !resolved[exceptionKey(e)]);
  const resolvedList = exceptions.filter((e) => resolved[exceptionKey(e)]).map((e) => ({ key: exceptionKey(e), resolution: resolved[exceptionKey(e)] }));
  return { note: b.note, ledger, bank: b.bank, matchedCount: matched.length, open, resolvedList, states, trail, uncategorized: ledger.filter((t) => t.category === 'Uncategorized').length };
}

export { categorize, reconcile };
