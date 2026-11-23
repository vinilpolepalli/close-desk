import type { Db } from './index';

/**
 * Shared sample books (ledger + bank feed) ship as static JSON in data/ledger.json, not in the DB.
 * Per-owner state (category overrides, exception resolutions, checklist, audit trail) starts empty.
 * Nothing to seed.
 */
export async function seedIfEmpty(_db: Db): Promise<void> {}
