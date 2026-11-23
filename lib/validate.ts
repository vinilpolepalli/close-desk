import type { Category, ChecklistStep } from './types';

export const CATEGORIES: Category[] = ['Revenue', 'Payroll', 'Cloud Infrastructure', 'Rent', 'Software', 'Travel', 'Professional Services', 'Bank Fees', 'Uncategorized'];

export function parseCategoryBody(body: unknown): { txnId: string; category: Category } | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.txnId !== 'string' || b.txnId.length > 80) return null;
  return CATEGORIES.includes(b.category as Category) ? { txnId: b.txnId, category: b.category as Category } : null;
}

export function parseExceptionBody(body: unknown): { key: string; resolution: 'matched-anyway' | 'create-entry' | 'accepted' } | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  const rs = ['matched-anyway', 'create-entry', 'accepted'] as const;
  if (typeof b.key !== 'string' || b.key.length > 120) return null;
  const resolution = (rs as readonly string[]).includes(b.resolution as string) ? (b.resolution as (typeof rs)[number]) : null;
  return resolution ? { key: b.key, resolution } : null;
}

export function parseStepBody(body: unknown): { step: ChecklistStep; done: boolean } | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  const steps: ChecklistStep[] = ['reconcile', 'categorize', 'accruals', 'lock'];
  if (!steps.includes(b.step as ChecklistStep) || typeof b.done !== 'boolean') return null;
  return { step: b.step as ChecklistStep, done: b.done };
}
