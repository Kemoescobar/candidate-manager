import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Candidate Manager E2E', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Register a test user
    await request.post(`${API_URL}/api/auth/register`, {
      data: { email: 'e2e@test.com', password: 'Password123', name: 'E2E Tester' },
    });
    // Login
    const res = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'e2e@test.com', password: 'Password123' },
    });
    const body = await res.json();
    authToken = body.data.token;
    void authToken;
  });

  test.beforeEach(async ({ page }) => {
    // Set auth state in localStorage before navigating
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-will-be-replaced');
    });
  });

  test('Login flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'e2e@test.com');
    await page.fill('#password', 'Password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('Full candidate lifecycle', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'e2e@test.com');
    await page.fill('#password', 'Password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Create candidate
    await page.click('text=+ Nouveau candidat');
    await expect(page).toHaveURL('/candidates/new');

    await page.fill('#firstName', 'Pierre');
    await page.fill('#lastName', 'TestE2E');
    await page.fill('#email', `e2e.candidate.${Date.now()}@test.com`);
    await page.fill('#position', 'QA Engineer');
    await page.fill('#experience', '2');

    // Add skill
    await page.fill('input[aria-label="Nouvelle compétence"]', 'Playwright');
    await page.click('text=Ajouter');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Find the created candidate
    await page.fill('input[type="search"]', 'TestE2E');
    await expect(page.locator('text=Pierre TestE2E')).toBeVisible();

    // View detail
    await page.click('button[aria-label^="Voir Pierre"]');
    await expect(page.locator('h1')).toContainText('Pierre TestE2E');

    // Validate
    await page.click('button[aria-label="Valider ce candidat"]');
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10000 });

    // Go back and delete
    await page.click('button:has-text("← Retour")');
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('button[aria-label^="Supprimer Pierre"]');
    await expect(page.locator('text=Pierre TestE2E')).not.toBeVisible();
  });

  test('Should show validation errors on empty form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('#email', 'e2e@test.com');
    await page.fill('#password', 'Password123');
    await page.click('button[type="submit"]');

    await page.click('text=+ Nouveau candidat');
    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });
});
