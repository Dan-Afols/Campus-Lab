const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'https://campuslabs.duckdns.org/admin/';
  const outDir = process.argv[3] || '/tmp';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const html = await page.content();
    const screenshotPath = `${outDir}/admin_screenshot.png`;
    const htmlPath = `${outDir}/admin_page.html`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    fs.writeFileSync(htmlPath, html, 'utf8');

    const adminTextMatches = (html.match(/admin/ig) || []).length;

    console.log('URL:', url);
    console.log('Saved screenshot:', screenshotPath);
    console.log('Saved HTML:', htmlPath);
    console.log('Count of "admin" (case-insensitive) in HTML:', adminTextMatches);

    const hasCreateAdmin = /create\s+admin/i.test(html) || /add\s+admin/i.test(html);
    console.log('Has create/add admin text:', hasCreateAdmin);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
