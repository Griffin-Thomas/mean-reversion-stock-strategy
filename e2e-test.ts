import { chromium, Browser, Page } from 'playwright';

async function testApp() {
  console.log('Starting E2E tests for Mean Reversion Trading App...\n');

  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  const issues: string[] = [];

  try {
    // Test 1: Navigate to app
    console.log('Test 1: Loading app...');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(2000);

    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        issues.push(`Console error: ${msg.text()}`);
      }
    });

    // Test 2: Check header loads
    console.log('Test 2: Checking header...');
    const header = await page.locator('h1').first();
    const headerText = await header.textContent();
    if (!headerText?.includes('Mean Reversion')) {
      issues.push('Header not found or incorrect');
    } else {
      console.log('  ✓ Header loaded correctly');
    }

    // Test 3: Check for loading state
    console.log('Test 3: Checking loading state...');
    const loadingText = await page.locator('text=Loading').count();
    if (loadingText > 0) {
      console.log('  → App is loading data...');
      await page.waitForTimeout(5000);
    }

    // Test 4: Check Trading Signals section
    console.log('Test 4: Checking Trading Signals section...');
    const signalsSection = await page.locator('text=Trading Signals').first();
    if (await signalsSection.count() === 0) {
      issues.push('Trading Signals section not found');
    } else {
      console.log('  ✓ Trading Signals section present');
    }

    // Test 5: Check Portfolio section
    console.log('Test 5: Checking Portfolio section...');
    const portfolioSection = await page.locator('text=Portfolio').first();
    if (await portfolioSection.count() === 0) {
      issues.push('Portfolio section not found');
    } else {
      console.log('  ✓ Portfolio section present');

      // Check portfolio values
      const totalValue = await page.locator('text=Total Value').first();
      if (await totalValue.count() > 0) {
        console.log('  ✓ Total Value displayed');
      }
    }

    // Test 6: Check Market Overview
    console.log('Test 6: Checking Market Overview...');
    const marketOverview = await page.locator('text=Market Overview').first();
    if (await marketOverview.count() === 0) {
      issues.push('Market Overview section not found');
    } else {
      console.log('  ✓ Market Overview section present');
    }

    // Test 7: Check Stock Chart
    console.log('Test 7: Checking Stock Chart...');
    const stockChart = await page.locator('text=Stock Chart').first();
    if (await stockChart.count() === 0) {
      issues.push('Stock Chart section not found');
    } else {
      console.log('  ✓ Stock Chart section present');
    }

    // Test 8: Check Backtest Results section
    console.log('Test 8: Checking Backtest Results...');
    const backtestSection = await page.locator('text=Backtest Results').first();
    if (await backtestSection.count() === 0) {
      issues.push('Backtest Results section not found');
    } else {
      console.log('  ✓ Backtest Results section present');
    }

    // Test 9: Test Refresh button
    console.log('Test 9: Testing Refresh button...');
    const refreshBtn = await page.locator('button:has-text("Refresh")').first();
    if (await refreshBtn.count() > 0) {
      await refreshBtn.click();
      console.log('  ✓ Refresh button clicked');
      await page.waitForTimeout(2000);
    } else {
      issues.push('Refresh button not found');
    }

    // Test 10: Test Run Backtest button
    console.log('Test 10: Testing Run Backtest button...');
    const backtestBtn = await page.locator('button:has-text("Run Backtest")').first();
    if (await backtestBtn.count() > 0) {
      await backtestBtn.click();
      console.log('  ✓ Run Backtest button clicked');
      await page.waitForTimeout(3000);
    } else {
      issues.push('Run Backtest button not found');
    }

    // Test 11: Click on a stock in heatmap
    console.log('Test 11: Testing stock selection in heatmap...');
    const heatmapItem = await page.locator('.grid > div').first();
    if (await heatmapItem.count() > 0) {
      await heatmapItem.click();
      console.log('  ✓ Heatmap stock clicked');
      await page.waitForTimeout(1000);

      // Check if Quick Actions appeared
      const quickActions = await page.locator('text=Quick Actions').first();
      if (await quickActions.count() > 0) {
        console.log('  ✓ Quick Actions panel appeared');

        // Test Buy button
        const buyBtn = await page.locator('button:has-text("Buy")').first();
        if (await buyBtn.count() > 0) {
          console.log('  ✓ Buy button available');
        }
      }
    }

    // Take screenshot
    console.log('\nTaking screenshot...');
    await page.screenshot({ path: '/Users/griffin/Desktop/stock-strategy/test-screenshot.png', fullPage: true });
    console.log('  ✓ Screenshot saved to test-screenshot.png');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));

    if (issues.length === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log(`❌ Found ${issues.length} issue(s):`);
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }

  } catch (error) {
    console.error('Test error:', error);
    issues.push(`Test error: ${error}`);
  } finally {
    console.log('\nKeeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  return issues;
}

testApp().catch(console.error);
