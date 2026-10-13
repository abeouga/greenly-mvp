import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ headless: false });
const evidence = [];
const gardenId = '35f733b6-1944-482f-824e-cefc33ea7d8e';
const targets = [
  { name: 'ec', url: 'http://127.0.0.1:5186/' },
  { name: 'canvas-list', url: 'http://127.0.0.1:5173/' },
  { name: 'canvas-editor', url: `http://127.0.0.1:5173/gardens/${gardenId}` },
];

try {
  for (const target of targets) {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await context.newPage();
    const iconRequests = [];
    const failedRequests = [];
    const pageErrors = [];
    let blockedFingerprintRequests = 0;

    // ブラウザによる個別アイコンの遮断を障害注入として再現します。
    await page.route(/\/lucide-react\/dist\/esm\/icons\/fingerprint\.js/, async function blockFingerprint(route) {
      blockedFingerprintRequests += 1;
      await route.abort('blockedbyclient');
    });
    page.on('request', function recordIconRequest(request) {
      if (request.url().includes('lucide-react')) iconRequests.push(request.url());
    });
    page.on('requestfailed', function recordFailure(request) {
      failedRequests.push({ url: request.url(), failure: request.failure() });
    });
    page.on('pageerror', function recordPageError(error) {
      pageErrors.push(error.message);
    });

    await page.goto(target.url);
    const header = page.locator('.kusakari-site-chrome');
    await expect(header.locator('.announcement')).toContainText('ひと鉢からはじまる、緑のある暮らし。');
    for (const icon of ['user-round', 'history', 'shopping-cart']) {
      await expect(header.locator(`svg.lucide-${icon}`)).toBeVisible();
    }
    if (target.name === 'canvas-editor') {
      await expect(page.getByTestId('model-loaded')).toHaveText('読み込み済み: 50 / 50');
    }
    await page.evaluate(function waitForFonts() { return document.fonts.ready; });
    await page.waitForLoadState('networkidle');
    expect(iconRequests.some(function isOptimized(url) {
      return url.includes('/.vite/deps/lucide-react.js');
    })).toBe(true);
    expect(iconRequests.filter(function isRawIcon(url) {
      return url.includes('/lucide-react/dist/esm/icons/');
    })).toEqual([]);
    expect(blockedFingerprintRequests).toBe(0);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    await header.screenshot({ path: `artifacts/e2e/icon-delivery-${target.name}.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(function fitsViewport() {
      return document.documentElement.scrollWidth <= innerWidth;
    })).toBe(true);
    evidence.push({ target, iconRequests, blockedFingerprintRequests, failedRequests, pageErrors, mobileOverflow: false });
    await context.close();
  }
  await writeFile('artifacts/e2e/icon-delivery-browser.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
