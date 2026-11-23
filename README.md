# Close Desk

Independent demo: run a November close for a fictional 14-person SaaS company with rule-based transaction categorization, bank-to-ledger reconciliation with an exception queue, and a close checklist with an audit trail, the monthly-close problem a spend and cash-flow platform automates.

- Rule-based categorizer with transparent keyword rules you can extend; no ML, no black box
- Automatic matching of ledger rows to the bank feed; unmatched items park in an exception queue you resolve by hand
- Close checklist with per-step sign-off and a persisted audit trail of every action
- Real persisted state per anonymous browser cookie: categories, resolutions, checklist steps, audit log
- Sample books are fictional; the ledger and bank feed are seeded demo data, not real company financials

Stack: Next.js 15, drizzle-orm, SQLite locally, Postgres (Neon) in production via DATABASE_URL.

## Run

```
npm install
npm run dev        # http://localhost:3000
npm test           # engine unit tests
npm run typecheck
BASE_URL=http://localhost:3000 npm run e2e   # with the dev server running
```

## Deployment

Production deploys run on Vercel from the main branch, with the database on Neon Postgres connected through the Vercel integration.

Demo built by Vinil Polepalli. Not affiliated with or endorsed by Billow.
