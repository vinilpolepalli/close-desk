import { ownerId, rateHit, readJson, tooMany, json } from '@/lib/http';
import { parseExceptionBody } from '@/lib/validate';
import { resolveException } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const owner = await ownerId();
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const input = parseExceptionBody(body.body);
  if (!input) return json({ error: 'Provide key and resolution (matched-anyway|create-entry|accepted)' }, 400);
  const lim = await rateHit(owner, 'exceptions', 120);
  if (!lim.ok) return tooMany(lim.retryAfter);
  await resolveException(owner, input.key, input.resolution, 'you');
  return json({ ok: true });
}
