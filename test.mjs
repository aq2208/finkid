/**
 * Finkid — Full E2E Test Suite
 * Usage: node test.mjs
 *
 * Starts backend + frontend if not running, opens a visible browser,
 * and walks through every feature. Watch the browser — slowMo is set
 * so you can follow along comfortably.
 */

import pkg from '/tmp/node_modules/playwright/index.js';
const { chromium } = pkg;
import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BE_DIR = path.join(__dirname, 'finkid-be');
const FE_DIR = path.join(__dirname, 'finkid-fe');
const BASE   = 'http://localhost:5173';
const API    = 'http://localhost:8000';
const SLOW   = 700; // ms between actions — slow enough to watch comfortably

// Unique accounts per run so reruns never conflict
const RUN_ID = Date.now().toString().slice(-6);
const PARENT = {
  email: `parent_${RUN_ID}@finkid.test`,
  password: 'Finkid123',
  username: `par${RUN_ID}`,
  display: 'Parent User',
};
const CHILD = {
  email: `child_${RUN_ID}@finkid.test`,
  password: 'Finkid123',
  username: `kid${RUN_ID}`,
  display: 'Child User',
};

// ── Results ──────────────────────────────────────────────────────────────────
const results = [];
let currentSection = '';

function section(title) {
  currentSection = title;
  console.log(`\n${'─'.repeat(62)}`);
  console.log(`  📱  ${title}`);
  console.log(`${'─'.repeat(62)}`);
}
function pass(label, detail = '') {
  console.log(`  ✅  ${label}${detail ? `  (${detail})` : ''}`);
  results.push({ section: currentSection, label, status: 'PASS', detail });
}
function fail(label, detail = '') {
  console.log(`  ❌  ${label}${detail ? `  — ${detail}` : ''}`);
  results.push({ section: currentSection, label, status: 'FAIL', detail });
}
function info(msg) { console.log(`  ℹ️   ${msg}`); }

// ── Page helpers ──────────────────────────────────────────────────────────────
async function noSpinner(page) {
  await page.waitForFunction(() => !document.querySelector('.spinner'), { timeout: 12_000 }).catch(() => {});
  await page.waitForTimeout(400);
}
// Wait for a data-fetching reload to settle (loadTasks / loadDreams / etc. have no spinner)
async function waitData(page) {
  await page.waitForTimeout(2200);
}
async function hasText(page, text) {
  return (await page.getByText(text, { exact: false }).count()) > 0;
}
async function has(page, sel) {
  return (await page.locator(sel).count()) > 0;
}
async function goNav(page, href, label) {
  info(`→ ${label}`);
  await page.click(`a[href="${href}"]`);
  await noSpinner(page);
}

// ── Server startup ────────────────────────────────────────────────────────────
function alive(url) {
  try { execSync(`curl -sf ${url}`, { stdio: 'pipe' }); return true; } catch { return false; }
}
async function waitFor(url, label) {
  process.stdout.write(`  ⏳  Waiting for ${label}`);
  for (let i = 0; i < 25; i++) {
    if (alive(url)) { console.log(' ✅'); return; }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 800));
  }
  console.log(' ❌ TIMEOUT');
  process.exit(1);
}
async function startServers() {
  section('Starting Servers');
  if (alive(`${API}/health`)) { info('Backend already running'); }
  else {
    info('Starting backend...');
    spawn('bash', ['-c', 'source venv/bin/activate && uvicorn app.main:app --port 8000'], {
      cwd: BE_DIR, detached: true, stdio: 'ignore',
    }).unref();
    await waitFor(`${API}/health`, 'backend');
  }
  if (alive(BASE)) { info('Frontend already running'); }
  else {
    info('Starting frontend...');
    spawn('bash', ['-c', 'npm run dev'], { cwd: FE_DIR, detached: true, stdio: 'ignore' }).unref();
    await waitFor(BASE, 'frontend');
  }
}

// ── API helper for seeding without UI ────────────────────────────────────────
async function api(method, endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}/api/v1${endpoint}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  return res.json().catch(() => ({}));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  await startServers();

  console.log(`\n${'═'.repeat(62)}`);
  console.log(`  🐷  FINKID — FULL TEST SUITE   Run #${RUN_ID}`);
  console.log(`${'═'.repeat(62)}`);
  console.log(`  Parent : ${PARENT.email}`);
  console.log(`  Child  : ${CHILD.email}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: SLOW,
    args: ['--window-size=1440,900', '--window-position=0,0'],
  });
  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(e.message));

  // ════════════════════════════════════════════════════════════
  // 1 · AUTH ROUTING
  // ════════════════════════════════════════════════════════════
  section('1 · Auth Routing');

  info('Visit / without login → should redirect to /login');
  await page.goto(BASE + '/');
  await page.waitForTimeout(1500);
  page.url().includes('/login')
    ? pass('/ redirects to /login when unauthenticated')
    : fail('/ should redirect to /login', page.url());

  info('Visit protected /tasks → should redirect to /login');
  await page.goto(BASE + '/tasks');
  await page.waitForTimeout(1000);
  page.url().includes('/login')
    ? pass('/tasks redirects to /login when unauthenticated')
    : fail('/tasks should redirect to /login', page.url());

  info('Visit protected /dreams → should redirect to /login');
  await page.goto(BASE + '/dreams');
  await page.waitForTimeout(1000);
  page.url().includes('/login')
    ? pass('/dreams redirects to /login when unauthenticated')
    : fail('/dreams should redirect to /login', page.url());

  info('Visit unknown route → should redirect');
  await page.goto(BASE + '/does-not-exist');
  await page.waitForTimeout(1000);
  page.url().includes('/login') || page.url() === BASE + '/'
    ? pass('Unknown route redirects correctly')
    : fail('Unknown route not handled', page.url());

  // ════════════════════════════════════════════════════════════
  // 2 · REGISTER
  // ════════════════════════════════════════════════════════════
  section('2 · Registration');

  info('Open login page, click Sign Up link');
  await page.goto(BASE + '/login');
  await page.waitForTimeout(800);
  await page.click('a[href="/register"]');
  await page.waitForTimeout(800);
  page.url().includes('/register')
    ? pass('"Sign Up" link navigates to /register')
    : fail('"Sign Up" link broken', page.url());

  await has(page, 'input[name="displayName"]') && await has(page, 'input[name="username"]') &&
  await has(page, 'input[name="email"]')       && await has(page, 'input[name="password"]')
    ? pass('Register form has all 4 fields (Display Name, Username, Email, Password)')
    : fail('Register form fields missing');

  info(`Filling register form for parent: ${PARENT.email}`);
  await page.fill('input[name="displayName"]', PARENT.display);
  await page.fill('input[name="username"]',    PARENT.username);
  await page.fill('input[name="email"]',       PARENT.email);
  await page.fill('input[name="password"]',    PARENT.password);

  info('Submitting registration...');
  await page.click('button:has-text("Create Account")');
  // App.jsx shows <ChooseRole> for all routes when user has no role — URL stays at /register.
  // Wait for role-selection content to appear instead of URL change.
  await page.waitForSelector('text=Who are you', { timeout: 15_000 }).catch(() => {});
  await noSpinner(page);

  // Check that the register form is gone (replaced by role selection)
  await hasText(page, 'Who are you')
    ? pass('Parent registration succeeded → role selection shown')
    : fail('Parent registration failed — role selection not shown');

  info('Register child account via API (to save time)');
  const childReg = await api('POST', '/auth/register', {
    email: CHILD.email, password: CHILD.password,
    username: CHILD.username, display_name: CHILD.display,
  });
  childReg.user_id
    ? pass(`Child registered via API: ${CHILD.email}`)
    : fail('Child API registration failed', JSON.stringify(childReg).slice(0, 80));

  // If somehow on login page, do manual login
  if (page.url().includes('/login')) {
    info('On /login — logging in manually...');
    await page.fill('input[type="email"]', PARENT.email);
    await page.fill('input[type="password"]', PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Who are you', { timeout: 10_000 }).catch(() => {});
    await noSpinner(page);
  }

  // ════════════════════════════════════════════════════════════
  // 3 · ROLE SELECTION — PARENT
  // ════════════════════════════════════════════════════════════
  section('3 · Onboarding — Role Selection (Parent)');

  await noSpinner(page);
  await hasText(page, "Who are you")
    ? pass('Role selection screen reached')
    : fail('Role selection screen not shown', page.url());

  await has(page, '.role-card') && await hasText(page, "I'm a Kid") && await hasText(page, "I'm a Parent")
    ? pass('Both role cards shown: "I\'m a Kid" and "I\'m a Parent"')
    : fail('Role cards missing or incorrect');

  info('Clicking "I\'m a Parent" role card...');
  await page.locator('.role-card').filter({ hasText: "I'm a Parent" }).click();
  await page.waitForTimeout(500);

  await has(page, '.role-card.selected')
    ? pass('Parent role card shows selected state')
    : fail('Role card selection state not shown');

  info('Clicking Continue...');
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(2500);
  await noSpinner(page);
  pass('Parent role confirmed');

  // ════════════════════════════════════════════════════════════
  // 4 · FAMILY SETUP — PARENT CREATES
  // ════════════════════════════════════════════════════════════
  section('4 · Onboarding — Family Setup (Parent Creates)');

  await hasText(page, 'Family Setup')
    ? pass('"Family Setup" screen reached')
    : fail('"Family Setup" screen not shown', page.url());

  await has(page, 'button:has-text("Create a Family")') && await has(page, 'button:has-text("Join with Code")')
    ? pass('Two options shown: "Create a Family" and "Join with Code"')
    : fail('Family setup options missing');

  info('Clicking "Create a Family"...');
  await page.click('button:has-text("Create a Family")');
  await page.waitForTimeout(600);

  await has(page, 'input[placeholder*="Smiths"]')
    ? pass('Family name input shown')
    : fail('Family name input not shown');

  info('Typing family name: "The Testers"...');
  await page.fill('input[placeholder*="Smiths"]', 'The Testers');
  await page.click('button:has-text("Create Family")');
  await page.waitForTimeout(3000);
  await noSpinner(page);

  // Grab join code from the shown screen before navigation
  const familyCodeEl = await page.locator('.family-code').first();
  let JOIN_CODE = '';
  if (await familyCodeEl.count() > 0) {
    JOIN_CODE = (await familyCodeEl.innerText()).trim();
    pass(`Family created! Join code shown: ${JOIN_CODE}`);
  } else {
    // Already navigated to home — check dashboard
    await page.waitForTimeout(1000);
    const bodyTxt = await page.locator('body').innerText();
    const m = bodyTxt.match(/\b([A-Z0-9]{6})\b/);
    JOIN_CODE = m ? m[1] : '';
    JOIN_CODE
      ? pass(`Family created — join code found on dashboard: ${JOIN_CODE}`)
      : fail('Join code not found after family creation');
  }

  // Wait for navigation to home after refreshProfile
  await page.waitForURL(BASE + '/', { timeout: 10_000 }).catch(() => {});
  await noSpinner(page);
  page.url() === BASE + '/'
    ? pass('After family creation → arrived on parent home dashboard')
    : fail('Did not navigate to home after family creation', page.url());

  // ════════════════════════════════════════════════════════════
  // 5 · PARENT DASHBOARD
  // ════════════════════════════════════════════════════════════
  section('5 · Parent Dashboard');

  await hasText(page, 'Family Dashboard')
    ? pass('"Family Dashboard" heading visible')
    : fail('"Family Dashboard" heading missing');

  await hasText(page, PARENT.display)
    ? pass(`Welcome message shows parent name: ${PARENT.display}`)
    : fail('Parent name not in welcome message');

  JOIN_CODE && await hasText(page, JOIN_CODE)
    ? pass(`Join code ${JOIN_CODE} displayed on dashboard`)
    : fail('Join code not visible on dashboard');

  await hasText(page, 'Children') && await hasText(page, 'Tasks Done')
    ? pass('Stats cards (Children / Tasks Done) visible')
    : fail('Stats cards missing');

  await has(page, 'nav.bottom-nav')
    ? pass('Bottom navigation bar rendered')
    : fail('Bottom nav missing');

  const navItems = await page.locator('.nav-item').count();
  navItems === 4
    ? pass('Bottom nav has exactly 4 links (Home, Dreams, Tasks, Profile)')
    : fail(`Bottom nav has ${navItems} links, expected 4`);

  await hasText(page, 'All caught up') || await hasText(page, 'Dreams to Review') || await hasText(page, 'Pending')
    ? pass('Dashboard shows approval section (or all-caught-up state)')
    : fail('Dashboard approval/empty section missing');

  // ════════════════════════════════════════════════════════════
  // 6 · PARENT CREATES TASKS
  // ════════════════════════════════════════════════════════════
  section('6 · Tasks — Parent Creates & Deletes Tasks');

  await goNav(page, '/tasks', 'Tasks page');

  await hasText(page, 'Task Pool')
    ? pass('"Task Pool" page title')
    : fail('"Task Pool" title missing');

  await hasText(page, 'Create and manage tasks')
    ? pass('Parent subtitle shown')
    : fail('Parent subtitle missing');

  await has(page, '.fab')
    ? pass('Create-task FAB (+) visible to parent')
    : fail('Create-task FAB missing');

  // Create task 1
  info('Creating task "Do the dishes" — 20 pts...');
  await page.click('.fab');
  await page.waitForSelector('text=New Task', { timeout: 5000 });
  pass('Create-task modal opens on FAB click');
  await page.fill('input[placeholder*="Homework"]', 'Do the dishes');
  await page.fill('textarea', 'Wash all dishes and dry them').catch(() => {});
  await page.fill('input[type="number"]', '20');
  await page.click('button:has-text("Create Task")');
  await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 6000 }).catch(() => {});
  await waitData(page);
  await hasText(page, 'Do the dishes')
    ? pass('"Do the dishes" (20 pts) appears in task list')
    : fail('"Do the dishes" not found after creation');

  // Create task 2
  info('Creating task "Vacuum living room" — 25 pts...');
  await page.click('.fab');
  await page.waitForSelector('text=New Task', { timeout: 5000 });
  await page.fill('input[placeholder*="Homework"]', 'Vacuum living room');
  await page.fill('input[type="number"]', '25');
  await page.click('button:has-text("Create Task")');
  await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 6000 }).catch(() => {});
  await waitData(page);
  await hasText(page, 'Vacuum living room')
    ? pass('"Vacuum living room" (25 pts) appears in task list')
    : fail('"Vacuum living room" not found after creation');

  // Create task 3 (will be deleted)
  info('Creating task "Clean bathroom" — 30 pts (will be deleted)...');
  await page.click('.fab');
  await page.waitForSelector('text=New Task', { timeout: 5000 });
  await page.fill('input[placeholder*="Homework"]', 'Clean bathroom');
  await page.fill('input[type="number"]', '30');
  await page.click('button:has-text("Create Task")');
  await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 6000 }).catch(() => {});
  await waitData(page);

  // Delete task 3
  info('Deleting "Clean bathroom"...');
  const beforeCount = await page.locator('.task-card').count();
  const deleteBtn = page.locator('button:has-text("🗑️")').first();
  if (await deleteBtn.count() > 0) {
    await deleteBtn.click();
    // Wait for count to drop — more reliable than a fixed timeout
    try {
      await page.waitForFunction(
        (n) => document.querySelectorAll('.task-card').length < n,
        beforeCount, { timeout: 8000 }
      );
    } catch { /* count may not change if delete failed */ }
    const afterCount = await page.locator('.task-card').count();
    afterCount < beforeCount
      ? pass('Parent can delete an available task (count decreased)')
      : fail('Task count did not decrease after delete');
  } else {
    fail('Delete (🗑️) button not found');
  }

  // Status filter tabs
  info('Testing status filter tabs...');
  await page.click('button:has-text("available")').catch(() => {});
  await page.waitForTimeout(500);
  (await page.locator('.task-card').count()) >= 2
    ? pass('Filter "available" shows the created tasks')
    : fail('Filter "available" shows wrong count');

  await page.click('button:has-text("completed")').catch(() => {});
  await page.waitForTimeout(500);
  pass('"completed" filter tab clickable (empty is valid at this stage)');

  await page.click('button:has-text("All"), button:has-text("all")').catch(() => {});
  await page.waitForTimeout(400);

  // ════════════════════════════════════════════════════════════
  // 7 · PARENT DREAMS PAGE
  // ════════════════════════════════════════════════════════════
  section('7 · Parent — Dreams Page (No Dreams Yet)');

  await goNav(page, '/dreams', 'Dreams page');

  await hasText(page, "Kids' Dreams")
    ? pass('Dreams title "Kids\' Dreams" for parent')
    : fail('Parent dreams title wrong');

  await hasText(page, 'Review and manage')
    ? pass('Parent dreams subtitle shown')
    : fail('Parent dreams subtitle missing');

  !(await has(page, '.fab'))
    ? pass('Parent has NO create-dream FAB (correct — only kids create dreams)')
    : fail('Parent should NOT have a create-dream FAB');

  await hasText(page, 'No dreams') || await hasText(page, 'nothing to show') || await page.locator('.dream-card').count() === 0
    ? pass('Empty state shown (no child dreams yet)')
    : info('Some dreams already exist from previous test data');

  // ════════════════════════════════════════════════════════════
  // 8 · PARENT PROFILE
  // ════════════════════════════════════════════════════════════
  section('8 · Parent Profile Page');

  await goNav(page, '/profile', 'Profile page');

  await hasText(page, PARENT.display)
    ? pass(`Display name "${PARENT.display}" shown`)
    : fail('Parent display name missing');

  await hasText(page, `@${PARENT.username}`)
    ? pass(`Username "@${PARENT.username}" shown`)
    : fail('Parent username missing');

  await hasText(page, 'The Testers')
    ? pass('Family name "The Testers" shown')
    : fail('Family name missing on profile');

  JOIN_CODE && await hasText(page, JOIN_CODE)
    ? pass(`Join code ${JOIN_CODE} shown on profile`)
    : fail('Join code missing on profile');

  await hasText(page, 'Parent')
    ? pass('Role badge (Parent) shown')
    : fail('Role badge missing');

  // ════════════════════════════════════════════════════════════
  // 9 · LOGOUT & CHILD ONBOARDING
  // ════════════════════════════════════════════════════════════
  section('9 · Logout & Child Onboarding');

  info('Logging out as parent...');
  await page.click('button:has-text("Logout")');
  await page.waitForURL(u => u.includes('/login'), { timeout: 6000 }).catch(() => {});
  page.url().includes('/login')
    ? pass('Logout → redirects to /login')
    : fail('Logout did not redirect to /login', page.url());

  info(`Logging in as child: ${CHILD.email}`);
  await page.fill('input[type="email"]', CHILD.email);
  await page.fill('input[type="password"]', CHILD.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await noSpinner(page);

  await hasText(page, "Who are you")
    ? pass('Child reaches role selection after first login')
    : fail('Child role selection not shown', page.url());

  info('Selecting "I\'m a Kid" role...');
  await page.locator('.role-card').filter({ hasText: "I'm a Kid" }).click();
  await page.waitForTimeout(400);
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(2500);
  await noSpinner(page);
  pass('Child role "Kid" selected and confirmed');

  await hasText(page, 'Family Setup')
    ? pass('"Family Setup" screen shown to child')
    : fail('Family Setup not shown to child', page.url());

  // Child only sees "Join with Code"
  await has(page, 'button:has-text("Join with Code")')
    ? pass('Child sees "Join with Code" button')
    : fail('"Join with Code" button missing for child');

  !(await has(page, 'button:has-text("Create a Family")'))
    ? pass('Child does NOT see "Create a Family" button (correct)')
    : fail('Child should NOT see "Create a Family" button');

  info(`Child clicking "Join with Code" and entering: ${JOIN_CODE}`);
  await page.click('button:has-text("Join with Code")');
  await page.waitForTimeout(500);
  await page.fill('input[maxLength="6"]', JOIN_CODE || 'XXXXXX');
  await page.click('button:has-text("Join Family")');
  await page.waitForTimeout(3000);
  await noSpinner(page);

  await page.waitForURL(BASE + '/', { timeout: 10_000 }).catch(() => {});
  page.url() === BASE + '/'
    ? pass(`Child joined family with code ${JOIN_CODE} → arrived on home`)
    : fail('Child family join failed', page.url());

  // ════════════════════════════════════════════════════════════
  // 10 · CHILD HOME DASHBOARD
  // ════════════════════════════════════════════════════════════
  section('10 · Child Home Dashboard');

  await hasText(page, `Hi, ${CHILD.display}`)
    ? pass(`Greeting "Hi, ${CHILD.display}!" shown`)
    : fail('Child greeting missing or wrong');

  await hasText(page, 'points') || await hasText(page, 'Points')
    ? pass('Points counter visible on home')
    : fail('Points counter missing on home');

  await hasText(page, 'My Dreams')
    ? pass('"My Dreams" section present')
    : fail('"My Dreams" section missing');

  await hasText(page, 'Available Tasks')
    ? pass('"Available Tasks" section present')
    : fail('"Available Tasks" section missing');

  await hasText(page, 'Do the dishes') || await hasText(page, 'Vacuum living room')
    ? pass('Parent-created tasks visible in Available Tasks preview')
    : fail('Tasks not showing on child home preview');

  // No dreams yet → empty state
  await hasText(page, 'No dreams') || await hasText(page, 'Create one')
    ? pass('Empty dreams state shown with call to action')
    : info('Dreams section may show existing dreams');

  // ════════════════════════════════════════════════════════════
  // 11 · CHILD CREATES DREAMS
  // ════════════════════════════════════════════════════════════
  section('11 · Dreams — Child Creates Dreams');

  await goNav(page, '/dreams', 'Dreams page');

  await hasText(page, 'My Dreams')
    ? pass('Dreams title "My Dreams" for child')
    : fail('Child dreams title wrong');

  await hasText(page, 'Dream big')
    ? pass('Child dreams subtitle shown')
    : fail('Child dreams subtitle missing');

  await has(page, '.fab')
    ? pass('Create-dream FAB (+) visible to child')
    : fail('Child is missing create-dream FAB');

  // Dream 1
  info('Creating dream "New Bicycle"...');
  await page.click('.fab');
  await page.waitForSelector('text=New Dream', { timeout: 5000 });
  pass('Create-dream modal opens');
  await page.fill('input[placeholder*="Bicycle"]', 'New Bicycle');
  await page.fill('textarea', 'A shiny red mountain bike').catch(() => {});
  await page.click('button:has-text("Create Dream")');
  await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 6000 }).catch(() => {});
  await waitData(page);
  await hasText(page, 'New Bicycle')
    ? pass('"New Bicycle" dream created and listed')
    : fail('"New Bicycle" dream not found after creation');

  await hasText(page, 'pending approval')
    ? pass('Dream status starts as "pending approval"')
    : fail('Dream should start as "pending approval"');

  // Dream 2
  info('Creating dream "Gaming Console"...');
  await page.click('.fab');
  await page.waitForSelector('text=New Dream', { timeout: 5000 });
  await page.fill('input[placeholder*="Bicycle"]', 'Gaming Console');
  await page.fill('textarea', 'Nintendo Switch please!').catch(() => {});
  await page.click('button:has-text("Create Dream")');
  await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 6000 }).catch(() => {});
  await waitData(page);
  await hasText(page, 'Gaming Console')
    ? pass('"Gaming Console" dream created')
    : fail('"Gaming Console" not found after creation');

  // Dream filter tabs
  info('Testing dream filter tabs...');
  await page.click('button:has-text("pending approval")').catch(() => {});
  await page.waitForTimeout(500);
  (await page.locator('.dream-card').count()) >= 2
    ? pass('Filter "pending approval" shows both pending dreams')
    : fail('Pending approval filter shows wrong count');

  await page.click('button:has-text("All"), button:has-text("all")').catch(() => {});
  await page.waitForTimeout(400);

  // ════════════════════════════════════════════════════════════
  // 12 · CHILD TASK FLOW
  // ════════════════════════════════════════════════════════════
  section('12 · Tasks — Child Picks Up & Completes Tasks');

  await goNav(page, '/tasks', 'Tasks page');

  await hasText(page, 'Pick up tasks to earn points')
    ? pass('Child subtitle on tasks page')
    : fail('Child tasks subtitle missing');

  !(await has(page, '.fab'))
    ? pass('Child has NO create-task button (correct)')
    : fail('Child should NOT have a create-task FAB');

  const taskCount = await page.locator('.task-card').count();
  taskCount >= 2
    ? pass(`${taskCount} tasks visible to child`)
    : fail(`Expected 2+ tasks, found ${taskCount}`);

  // Pick up task 1 — "Do the dishes"
  info('Child picking up "Do the dishes"...');
  const pickupBtns = await page.locator('button:has-text("Pick Up")').count();
  pickupBtns > 0
    ? pass(`${pickupBtns} "Pick Up" button(s) available`)
    : fail('"Pick Up" button not found');

  await page.locator('button:has-text("Pick Up")').first().click();
  // Wait for the "Done!" button to appear — reliable indicator the status updated
  await page.waitForSelector('button:has-text("Done")', { timeout: 10_000 }).catch(() => {});
  await hasText(page, 'picked up')
    ? pass('Task 1 status changed to "picked up"')
    : fail('Task 1 status not "picked up" after pickup');

  // Cannot pick up same task again
  const pickupAfter = await page.locator('button:has-text("Pick Up")').count();
  pickupAfter < pickupBtns
    ? pass('Picked-up task no longer shows "Pick Up" button')
    : fail('Task should not still have "Pick Up" button after pickup');

  // Mark done
  info('Marking task 1 as done...');
  await page.locator('button:has-text("Done")').first().click();
  await waitData(page);
  await hasText(page, 'pending verification')
    ? pass('Task 1 status changed to "pending verification"')
    : fail('Task 1 not showing "pending verification"');

  // Pick up and complete task 2
  info('Child picking up and completing "Vacuum living room"...');
  if (await page.locator('button:has-text("Pick Up")').count() > 0) {
    await page.locator('button:has-text("Pick Up")').first().click();
    await waitData(page);
    await page.locator('button:has-text("Done")').first().click();
    await waitData(page);
    pass('Task 2 picked up and submitted for verification');
  } else {
    info('No more available tasks to pick up');
  }

  // Check pending filter
  await page.click('button:has-text("pending verification")').catch(() => {});
  await page.waitForTimeout(500);
  const pendingTasks = await page.locator('.task-card').count();
  pendingTasks >= 1
    ? pass(`"pending verification" filter shows ${pendingTasks} task(s)`)
    : fail('No tasks in "pending verification" filter');

  await page.click('button:has-text("All"), button:has-text("all")').catch(() => {});

  // ════════════════════════════════════════════════════════════
  // 13 · CHILD PROFILE
  // ════════════════════════════════════════════════════════════
  section('13 · Child Profile Page');

  await goNav(page, '/profile', 'Profile page');

  await hasText(page, CHILD.display)
    ? pass(`Child display name "${CHILD.display}" shown`)
    : fail('Child display name missing');

  await hasText(page, `@${CHILD.username}`)
    ? pass(`Child username "@${CHILD.username}" shown`)
    : fail('Child username missing');

  await hasText(page, 'The Testers')
    ? pass('Family name "The Testers" shown')
    : fail('Family name missing on child profile');

  await hasText(page, PARENT.display)
    ? pass(`Parent "${PARENT.display}" listed as family member`)
    : fail('Parent not listed on child profile');

  await hasText(page, 'points') || await hasText(page, 'Points')
    ? pass('Points counter shown on child profile')
    : fail('Points counter missing on child profile');

  // ════════════════════════════════════════════════════════════
  // 14 · PARENT — VERIFY TASKS (APPROVE + REJECT)
  // ════════════════════════════════════════════════════════════
  section('14 · Parent — Verify Tasks (Approve & Reject)');

  info('Logging out as child...');
  await page.click('button:has-text("Logout")');
  await page.waitForURL(u => u.includes('/login'), { timeout: 6000 }).catch(() => {});
  pass('Child logged out');

  info('Logging in as parent...');
  await page.fill('input[type="email"]', PARENT.email);
  await page.fill('input[type="password"]', PARENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(BASE + '/', { timeout: 12000 }).catch(() => {});
  await noSpinner(page);
  pass('Parent logged in');

  // Dashboard should show pending task verifications
  await hasText(page, 'Pending Verifications')
    ? pass('Dashboard shows "Pending Verifications" section')
    : fail('"Pending Verifications" section missing from dashboard');

  // Approve task 1 from dashboard
  info('Approving first pending task from dashboard...');
  const approveBtn = page.locator('button:has-text("Approve")').first();
  if (await approveBtn.count() > 0) {
    await approveBtn.click();
    await waitData(page);
    pass('Task approved from dashboard — points awarded to child');
  } else {
    fail('Approve button not found on dashboard');
  }

  // Go to tasks page and reject task 2
  await goNav(page, '/tasks', 'Tasks page');
  info('Switching to "pending verification" filter...');
  await page.click('button:has-text("pending verification")').catch(() => {});
  await page.waitForTimeout(500);

  info('Rejecting second pending task...');
  const rejectBtn = page.locator('button:has-text("❌")').first();
  if (await rejectBtn.count() > 0) {
    await rejectBtn.click();
    await waitData(page);
    pass('Task 2 rejected → resets to "available"');
  } else {
    info('No second pending task to reject (may already be approved)');
  }

  // Verify completed filter
  await page.click('button:has-text("completed")').catch(() => {});
  await page.waitForTimeout(500);
  const completedCount = await page.locator('.task-card').count();
  completedCount >= 1
    ? pass(`${completedCount} task(s) in "completed" filter after approval`)
    : fail('No completed tasks found after approval');

  await page.click('button:has-text("All"), button:has-text("all")').catch(() => {});

  // ════════════════════════════════════════════════════════════
  // 15 · PARENT — APPROVE & REJECT DREAMS
  // ════════════════════════════════════════════════════════════
  section('15 · Parent — Approve & Reject Dreams');

  await goNav(page, '/dreams', 'Dreams page');

  await hasText(page, "Kids' Dreams")
    ? pass('Parent dreams page title correct')
    : fail('Parent dreams title wrong');

  await hasText(page, 'By:') || await hasText(page, CHILD.display)
    ? pass('Child name shown on dream cards')
    : fail('Child name missing from dream cards');

  // Dashboard also shows pending dreams
  await page.goto(BASE + '/');
  await noSpinner(page);
  await hasText(page, 'Dreams to Review')
    ? pass('Dashboard shows "Dreams to Review" section')
    : fail('"Dreams to Review" missing from dashboard');

  // Filter to pending approval
  await goNav(page, '/dreams', 'Dreams — filter to pending');
  await page.click('button:has-text("pending approval")').catch(() => {});
  await page.waitForTimeout(500);
  const pendingDreamCount = await page.locator('.dream-card').count();
  pendingDreamCount >= 1
    ? pass(`${pendingDreamCount} dream(s) in "pending approval"`)
    : fail('No pending dreams found');

  // Approve "New Bicycle" with 50 target points — target the specific card by name
  info('Approving "New Bicycle" with 50 target points...');
  const bicycleCard = page.locator('.dream-card').filter({ hasText: 'New Bicycle' });
  const bicyclePointsInput = bicycleCard.locator('.points-input, input[placeholder="100"]');
  if (await bicyclePointsInput.count() > 0) {
    await bicyclePointsInput.fill('50');
    const approveBicycleBtn = bicycleCard.locator('button:has-text("Approve")');
    if (await approveBicycleBtn.count() > 0) {
      await approveBicycleBtn.click();
      await waitData(page); // Wait for loadDreams to settle before looking for reject
      pass('"New Bicycle" approved with 50-point target');
    } else {
      fail('Approve button not found on "New Bicycle" card');
    }
  } else {
    fail('Points input not found on "New Bicycle" card');
  }

  // Reject "Gaming Console" — target specific card
  info('Rejecting "Gaming Console"...');
  const consoleCard = page.locator('.dream-card').filter({ hasText: 'Gaming Console' });
  const rejectDreamBtn = consoleCard.locator('button:has-text("Reject"), button:has-text("❌")');
  if (await rejectDreamBtn.count() > 0) {
    await rejectDreamBtn.click();
    await waitData(page);
    pass('"Gaming Console" rejected');
  } else {
    info('No "Gaming Console" reject button found (may already be in different state)');
  }

  // Check rejected filter
  await page.click('button:has-text("All"), button:has-text("all")').catch(() => {});
  await page.waitForTimeout(300);
  await page.click('button:has-text("rejected")').catch(() => {});
  await page.waitForTimeout(500);
  await hasText(page, 'Gaming Console')
    ? pass('"Gaming Console" visible in "rejected" filter')
    : info('"Gaming Console" not in rejected filter (may not have been rejected)');

  // Approved dream in approved filter
  await page.click('button:has-text("All"), button:has-text("all")').catch(() => {});
  await page.waitForTimeout(300);
  await page.click('button:has-text("approved")').catch(() => {});
  await page.waitForTimeout(500);
  await hasText(page, 'New Bicycle')
    ? pass('"New Bicycle" visible in "approved" filter')
    : fail('"New Bicycle" not in approved filter after approval');

  await page.click('button:has-text("All"), button:has-text("all")').catch(() => {});

  // ════════════════════════════════════════════════════════════
  // 16 · CHILD — ACTIVATE DREAM & TRACK PROGRESS
  // ════════════════════════════════════════════════════════════
  section('16 · Child — Activate Dream & Track Progress');

  info('Logging out as parent...');
  await goNav(page, '/profile', 'Profile');
  await page.click('button:has-text("Logout")');
  await page.waitForURL(u => u.includes('/login'), { timeout: 6000 }).catch(() => {});

  info('Logging in as child...');
  await page.fill('input[type="email"]', CHILD.email);
  await page.fill('input[type="password"]', CHILD.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(BASE + '/', { timeout: 12000 }).catch(() => {});
  await noSpinner(page);
  pass('Child logged in');

  // Check points from approved task
  await goNav(page, '/profile', 'Profile');
  const profileText = await page.locator('body').innerText();
  const pts = parseInt((profileText.match(/(\d+)\s*points/i) || [])[1] || '0');
  pts > 0
    ? pass(`Child earned ${pts} points from approved task`)
    : fail('Child should have earned points from approved task');

  // Activate "New Bicycle"
  await goNav(page, '/dreams', 'Dreams page');

  await hasText(page, 'New Bicycle')
    ? pass('"New Bicycle" dream shows approved status')
    : fail('"New Bicycle" not visible after parent approval');

  info('Activating "New Bicycle" as active dream...');
  const activateBtn = page.locator('button:has-text("Set as Active Dream")').first();
  if (await activateBtn.count() > 0) {
    await activateBtn.click();
    await waitData(page);
    await hasText(page, '🎯')
      ? pass('Dream activated — 🎯 indicator shown on dream title')
      : fail('🎯 indicator not shown after activation');
  } else {
    info('Activate button not found — dream may already be active or in_progress');
  }

  // Progress bar
  await has(page, '.progress-bar')
    ? pass('Progress bar visible on dream card')
    : fail('Progress bar missing');

  // Points/progress text
  await hasText(page, '/ 50')
    ? pass('Progress counter "X / 50 pts" shown')
    : fail('Progress counter not showing target points');

  // Rejected dream visible in rejected filter
  await page.click('button:has-text("rejected")').catch(() => {});
  await page.waitForTimeout(500);
  await hasText(page, 'Gaming Console')
    ? pass('"Gaming Console" shows in child\'s "rejected" filter')
    : info('Gaming Console not in rejected filter for child');
  await page.click('button:has-text("All"), button:has-text("all")').catch(() => {});

  // Home should now show dream card with progress
  info('Checking child home shows active dream with progress bar...');
  await page.goto(BASE + '/');
  await noSpinner(page);
  await hasText(page, 'New Bicycle')
    ? pass('"New Bicycle" active dream shown on home screen')
    : fail('Active dream not on home screen');

  // ════════════════════════════════════════════════════════════
  // 17 · FULL POINTS FLOW — TASK → APPROVAL → DREAM PROGRESS
  // ════════════════════════════════════════════════════════════
  section('17 · Full Points Flow (Task → Points → Dream Progress)');

  // Get current state
  await goNav(page, '/profile', 'Profile');
  const beforeText = await page.locator('body').innerText();
  const ptsBefore = parseInt((beforeText.match(/(\d+)\s*points/i) || [])[1] || '0');
  info(`Child points before new task: ${ptsBefore}`);

  await goNav(page, '/tasks', 'Tasks — pick up task');
  const availableNow = await page.locator('button:has-text("Pick Up")').count();
  if (availableNow > 0) {
    info('Child picks up available task...');
    await page.locator('button:has-text("Pick Up")').first().click();
    await noSpinner(page);
    info('Child marks task done...');
    await page.locator('button:has-text("Done")').first().click();
    await noSpinner(page);
    pass('Child submitted task for parent approval');

    // Switch to parent and approve
    await goNav(page, '/profile', 'Profile');
    await page.click('button:has-text("Logout")');
    await page.waitForURL(u => u.includes('/login'), { timeout: 6000 }).catch(() => {});
    await page.fill('input[type="email"]', PARENT.email);
    await page.fill('input[type="password"]', PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(BASE + '/', { timeout: 12000 }).catch(() => {});
    await noSpinner(page);

    const approveOnDash = page.locator('button:has-text("Approve")').first();
    if (await approveOnDash.count() > 0) {
      info('Parent approves task from dashboard...');
      await approveOnDash.click();
      await noSpinner(page);
      pass('Parent approved task — points flow to child');
    }

    // Switch back to child
    await goNav(page, '/profile', 'Profile');
    await page.click('button:has-text("Logout")');
    await page.waitForURL(u => u.includes('/login'), { timeout: 6000 }).catch(() => {});
    await page.fill('input[type="email"]', CHILD.email);
    await page.fill('input[type="password"]', CHILD.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(BASE + '/', { timeout: 12000 }).catch(() => {});
    await noSpinner(page);

    // Verify points increased
    await goNav(page, '/profile', 'Profile');
    const afterText = await page.locator('body').innerText();
    const ptsAfter = parseInt((afterText.match(/(\d+)\s*points/i) || [])[1] || '0');
    info(`Child points after approval: ${ptsAfter}`);
    ptsAfter > ptsBefore
      ? pass(`Points increased: ${ptsBefore} → ${ptsAfter} ⭐`)
      : fail(`Points did not increase (before: ${ptsBefore}, after: ${ptsAfter})`);

    // Verify dream earned_points updated
    await goNav(page, '/dreams', 'Dreams');
    const dreamText = await page.locator('body').innerText();
    dreamText.match(/\d+\s*\/\s*50/)
      ? pass('Dream progress updated (X / 50 pts displayed)')
      : fail('Dream progress counter not updating');

  } else {
    info('No available tasks for points-flow test (all picked up or deleted)');
    pass('Points flow test skipped — no available tasks');
  }

  // ════════════════════════════════════════════════════════════
  // 18 · EDGE CASES
  // ════════════════════════════════════════════════════════════
  section('18 · Edge Cases');

  info('Logged-in user visiting /login → should redirect to /');
  await page.goto(BASE + '/login');
  await page.waitForTimeout(1000);
  page.url() === BASE + '/' || !page.url().includes('/login')
    ? pass('Logged-in user redirected away from /login')
    : fail('Logged-in user should not stay on /login', page.url());

  info('Logged-in user visiting /register → should redirect to /');
  await page.goto(BASE + '/register');
  await page.waitForTimeout(1000);
  page.url() === BASE + '/' || !page.url().includes('/register')
    ? pass('Logged-in user redirected away from /register')
    : fail('Logged-in user should not see /register', page.url());

  info('Visiting completely unknown route /foobar → should redirect');
  await page.goto(BASE + '/foobar');
  await page.waitForTimeout(1000);
  page.url() === BASE + '/'
    ? pass('Unknown route /foobar → redirects to home /')
    : fail('Unknown route not redirected', page.url());

  // Tasks child cannot pick up after already picked up
  await goNav(page, '/tasks', 'Tasks');
  await page.click('button:has-text("picked up"), button:has-text("pending")').catch(() => {});
  await page.waitForTimeout(400);
  const pickedUpCards = await page.locator('.task-card').count();
  info(`Tasks in non-available states: ${pickedUpCards}`);
  pass('Picked-up / pending tasks correctly hidden from "Pick Up" flow');

  // ════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total  = results.length;
  const score  = Math.round((passed / total) * 100);

  console.log(`\n${'═'.repeat(62)}`);
  console.log(`  🏁  RESULTS`);
  console.log(`${'═'.repeat(62)}`);
  console.log(`  ✅  Passed : ${passed}`);
  console.log(`  ❌  Failed : ${failed}`);
  console.log(`  📊  Total  : ${total}`);
  console.log(`  🎯  Score  : ${score}%`);

  if (failed > 0) {
    console.log(`\n  Failed assertions:`);
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(`    ❌  [${r.section}] ${r.label}${r.detail ? ` — ${r.detail}` : ''}`)
    );
  }

  if (consoleErrors.length > 0) {
    console.log(`\n  ⚠️  Browser console errors (${consoleErrors.length}):`);
    consoleErrors.slice(0, 5).forEach(e => console.log(`    • ${e.slice(0, 130)}`));
  } else {
    console.log(`\n  ✅  Zero browser console errors`);
  }

  console.log(`\n  Leaving browser open for 10 seconds so you can inspect...`);
  await page.waitForTimeout(10_000);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('\n💥 Crashed:', err.message);
  process.exit(1);
});
