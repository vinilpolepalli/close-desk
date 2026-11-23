const base = process.env.BASE_URL ?? 'http://localhost:3000';
const jar: string[] = [];
async function call(path: string, init?: RequestInit) {
  const res = await fetch(base + path, { ...init, headers: { ...(init?.headers ?? {}), cookie: jar.join('; '), 'content-type': 'application/json' } });
  for (const c of res.headers.getSetCookie?.() ?? []) jar.push(c.split(';')[0]);
  return res;
}
const home = await call('/');
if (home.status !== 200) throw new Error(`home ${home.status}`);
const html = await home.text();
if (!html.includes('Close November')) throw new Error('home missing heading');
if (!html.includes('mismatch:l-09:b-09') === false && !html.includes('difference')) throw new Error('exception text missing');
const cat = await call('/api/categorize', { method: 'POST', body: JSON.stringify({ txnId: 'l-15', category: 'Travel' }) });
if (cat.status !== 200) throw new Error(`categorize ${cat.status}: ${await cat.text()}`);
const bad = await call('/api/categorize', { method: 'POST', body: JSON.stringify({ txnId: 'nope', category: 'Travel' }) });
if (bad.status !== 404) throw new Error(`expected 404, got ${bad.status}`);
const ex = await call('/api/exceptions', { method: 'POST', body: JSON.stringify({ key: 'mismatch:l-09:b-09', resolution: 'accepted' }) });
if (ex.status !== 200) throw new Error(`exception ${ex.status}: ${await ex.text()}`);
const step = await call('/api/steps', { method: 'POST', body: JSON.stringify({ step: 'accruals', done: true }) });
if (step.status !== 200) throw new Error(`step ${step.status}: ${await step.text()}`);
const home2 = await call('/');
const html2 = await home2.text();
if (!html2.includes('Recategorized Misc reimbursement - J. Chen to Travel')) throw new Error('audit trail missing categorization');
if (!html2.includes('Resolved exception mismatch:l-09:b-09 as accepted')) throw new Error('audit trail missing resolution');
if (!html2.includes('Completed checklist step &quot;accruals&quot;') && !html2.includes('Completed checklist step "accruals"')) throw new Error('audit trail missing step');
if (html2.includes('Queue clear')) throw new Error('other exceptions should still be open');
console.log('e2e pass');
