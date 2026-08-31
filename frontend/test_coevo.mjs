import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

await page.goto('http://localhost:3000/lab');
await page.waitForLoadState('networkidle');

await page.getByText(/co.evol/i).first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/tab_coevo_initial.png' });
console.log('Initial tab screenshot done');

const runBtn = page.getByRole('button', { name: /run co-evolution/i });
await runBtn.waitFor({ timeout: 5000 });
await runBtn.click();
console.log('Run button clicked');

await page.waitForTimeout(14000);
await page.screenshot({ path: '/tmp/tab_coevo_mid.png' });
console.log('Mid-run screenshot');

await page.waitForTimeout(12000);
await page.screenshot({ path: '/tmp/tab_coevo_done.png' });
console.log('Final screenshot');

const rows = await page.locator('table tbody tr').count();
console.log(`Table rows visible: ${rows}`);

await browser.close();
