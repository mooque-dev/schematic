import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Collect page errors on every test; fail loudly if the console logs an error.
function trackErrors(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('homepage loads with correct title, h1, and no console errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/Schematic/);
  await expect(page.locator('h1.hero-title')).toHaveText('Schematic');
  await expect(page.locator('main')).toBeVisible();
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('privacy invariant: the page makes zero external network requests', async ({ page }) => {
  const external = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('http://localhost') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u);
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  // trigger lazy content + a schema poster
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  expect(external, 'external requests:\n' + external.join('\n')).toHaveLength(0);
});

test('accessibility: no serious or critical axe violations', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  expect(serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}`).join('\n')).toBe('');
});

test('Reflect: full flow produces a domain profile and manages focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('#reflect-open').click();
  await expect(page.locator('#reflect')).toHaveClass(/open/);
  // background is inert while the modal is open
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await page.locator('#reflect-begin').click();
  for (let i = 0; i < 18; i++) {
    await page.locator('#reflect-scale button[data-v="3"]').click();
  }
  await expect(page.locator('#step-results')).toBeVisible();
  await expect(page.locator('#domain-bars .dbar')).toHaveCount(5);
  await expect(page.locator('#results-summary')).not.toBeEmpty();
  await page.locator('#reflect-done').click();
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
});

test('Reflect: Back button keeps focus inside the dialog', async ({ page }) => {
  await page.goto('/');
  await page.locator('#reflect-open').click();
  await page.locator('#reflect-begin').click();
  await page.locator('#reflect-scale button[data-v="2"]').click(); // → question 2
  await page.locator('#reflect-back').click();                     // → question 1 (Back self-disables)
  const inside = await page.evaluate(() => document.getElementById('reflect').contains(document.activeElement));
  expect(inside).toBe(true);
});

test('lightbox: opens a schema with title+description and pages within the group', async ({ page }) => {
  await page.goto('/');
  await page.locator('.schema').first().click();
  const lb = page.locator('#lightbox');
  await expect(lb).toHaveClass(/open/);
  await expect(lb.locator('.lb-title')).toContainText('Abandonment');
  await expect(lb.locator('.lb-desc')).not.toBeEmpty();
  await lb.locator('.lb-next').click();
  await lb.locator('.lb-next').click();
  await expect(lb.locator('.lb-img')).toHaveAttribute('src', /assets\/schemas\//); // stayed in schema group
  await page.keyboard.press('Escape');
  await expect(lb).not.toHaveClass(/open/);
});

test('finder: a clear description surfaces the matching schemas', async ({ page }) => {
  await page.goto('/');
  await page.locator('#finder-input').fill('I feel like people will abandon me and I cant trust anyone');
  await page.locator('#finder-form button[type="submit"]').click();
  await expect(page.locator('.finder-match')).toHaveCount(2);
  await expect(page.locator('.finder-match .fm-name').first()).toContainText('Abandonment');
});

test('mobile nav: hamburger opens the menu at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.locator('#nav-toggle');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('#nav-links')).toHaveClass(/open/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});
