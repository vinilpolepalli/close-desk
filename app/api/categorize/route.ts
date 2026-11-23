import { ownerId, rateHit, readJson, tooMany, json } from '@/lib/http';
import { parseCategoryBody } from '@/lib/validate';
import { setCategory } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const owner = await ownerId();
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const input = parseCategoryBody(body.body);
  if (!input) return json({ error: 'Provide txnId and a valid category' }, 400);
  const lim = await rateHit(owner, 'categorize', 120);
  if (!lim.ok) return tooMany(lim.retryAfter);
  try {
    await setCategory(owner, input.txnId, input.category, 'you');
  } catch {
    return json({ error: 'Unknown transaction' }, 404);
  }
  return json({ ok: true });
}
