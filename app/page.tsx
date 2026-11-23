import CloseBoard from '@/components/CloseBoard';
import { board } from '@/lib/repo';
import { ownerId } from '@/lib/http';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const owner = await ownerId();
  const b = await board(owner);
  const spend = b.ledger.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const revenue = b.ledger.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  return (
    <main>
      <div className="mt-6 max-w-3xl">
        <h1 className="text-2xl font-semibold sm:text-3xl">Close November without the spreadsheet archaeology.</h1>
        <p className="mt-2 text-sm text-mute">
          Fictional books for an imaginary 14-person SaaS company: {money(revenue)} in revenue against {money(spend)} in spend.
          The desk matched {b.matchedCount} of {b.ledger.length} ledger rows to the bank feed and parked the rest in an exception queue.
          Categorization is rule-based and labeled as such; every change you make lands in the audit trail. {b.note}
        </p>
      </div>
      <CloseBoard initial={b} />
    </main>
  );
}
