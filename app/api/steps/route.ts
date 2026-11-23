import { ownerId, rateHit, readJson, tooMany, json } from '@/lib/http';
import { parseStepBody } from '@/lib/validate';
import { setStep } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const owner = await ownerId();
  const body = await readJson(req);
  if (!body.ok) return body.res;
  const input = parseStepBody(body.body);
  if (!input) return json({ error: 'Provide step and done' }, 400);
  const lim = await rateHit(owner, 'steps', 120);
  if (!lim.ok) return tooMany(lim.retryAfter);
  await setStep(owner, input.step, input.done, 'you');
  return json({ ok: true });
}
