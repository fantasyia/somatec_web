import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
await p.goto('https://www.somatecblocking.com.br/protecao-comercial', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
console.log('testids:', JSON.stringify(await p.$$eval('[data-testid]', els => [...new Set(els.map(e => e.getAttribute('data-testid')))])));
console.log('botoes :', JSON.stringify((await p.$$eval('button', els => els.map(e => (e.textContent||'').trim().slice(0,45)).filter(Boolean))).slice(0, 20)));
await b.close();
