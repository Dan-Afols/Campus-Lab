const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const outDir = 'scripts/verify/output';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const url = process.argv[2] || 'https://campuslabs.duckdns.org/admin';
  console.log('Visiting', url);
  await page.goto(url, { waitUntil: 'networkidle' });
  // wait a short time for client-side JS to render
  await page.waitForTimeout(1500);
  const html = await page.content();
  fs.writeFileSync(`${outDir}/admin.html`, html, 'utf8');
  await page.screenshot({ path: `${outDir}/admin-screenshot.png`, fullPage: true });
  console.log('Saved', `${outDir}/admin.html`, 'and', `${outDir}/admin-screenshot.png`);
  await browser.close();
})();
