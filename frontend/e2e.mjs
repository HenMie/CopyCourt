import { chromium } from 'playwright';

(async () => {
  console.log('Starting E2E test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  try {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#original_text');
    const testText = "这是一款非常棒的护肤品，用了之后皮肤变得非常光滑细腻，而且价格也很实惠，推荐给大家购买试试看！保证你们会喜欢的哦。";
    await page.fill('#original_text', testText);
    await page.click('button.holo-submit-btn');
    
    // Check if error banner shows up
    try {
      const errorBanner = await page.waitForSelector('.holo-error', { timeout: 3000 });
      console.log('ERROR BANNER TEXT:', await errorBanner.textContent());
    } catch (e) {}

    await page.waitForSelector('.holo-panel-scores', { timeout: 60000 });
    console.log('Test PASSED!');
  } catch (error) {
    console.error('Test FAILED:', error);
  } finally {
    await browser.close();
  }
})();
