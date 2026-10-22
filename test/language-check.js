/**
 * Issue #29: real-browser regression against this checkout's unchanged HEAD.
 *
 * node test/language-check.js --playwright=C:\path\to\node_modules\playwright
 *   --browser=C:\path\to\chrome.exe --report-dir=C:\outside-the-checkout
 *   [--expected-action=https://formspree.io/f/mgebzeqq]
 *
 * Serves baseline files with `git show HEAD:<file>` and draft files from disk.
 * Every non-local browser request is intercepted. Formspree never receives data.
 * Reports and screenshots go outside this checkout by default.
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const GIT_SAFE_ROOT = ROOT.replace(/\\/g, '/');
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const equal = arg.indexOf('=');
  if (!arg.startsWith('--') || equal < 0) throw new Error('Use --option=value');
  return [arg.slice(2, equal), arg.slice(equal + 1)];
}));
const playwrightPath = args.playwright || process.env.MMPI_PLAYWRIGHT || 'playwright';
const browserPath = args.browser || process.env.MMPI_BROWSER ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = path.resolve(args['report-dir'] ||
  path.join(path.dirname(ROOT), '测试记录', 'language-check-' + runId));
if (reportDir === ROOT || reportDir.startsWith(ROOT + path.sep)) {
  throw new Error('Reports must be outside the draft checkout');
}
let chromium;
try { ({ chromium } = require(playwrightPath)); }
catch (error) {
  throw new Error('Playwright is unavailable. Pass --playwright=<existing package path>. ' + error.message);
}
const head = execFileSync('git', ['-c', 'safe.directory=' + GIT_SAFE_ROOT, 'rev-parse', 'HEAD'],
  { cwd: ROOT, encoding: 'utf8' }).trim();
const report = { head, browser: browserPath, started: new Date().toISOString(),
  checks: [], comparisons: [], submissions: [], interceptedExternalRequests: [],
  pageErrors: [], serverErrors: [], screenshots: [] };
fs.mkdirSync(reportDir, { recursive: true });

function check(condition, message) {
  assert.ok(condition, message);
  report.checks.push(message);
}
function equal(actual, expected, message) {
  const left = JSON.stringify(actual), right = JSON.stringify(expected);
  if (left !== right) {
    let offset = 0;
    while (offset < Math.min(left.length, right.length) && left[offset] === right[offset]) offset++;
    throw new Error(message + ': difference at JSON byte ' + offset + '\nactual: ' +
      left.slice(Math.max(0, offset - 80), offset + 160) + '\nexpected: ' +
      right.slice(Math.max(0, offset - 80), offset + 160));
  }
  report.checks.push(message);
}
function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const baselineCache = new Map();
const server = http.createServer((req, res) => {
  try {
    const decoded = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const match = /^\/(baseline|draft)\/(.*)$/.exec(decoded);
    if (!match || req.method !== 'GET') { res.writeHead(404).end(); return; }
    const relative = match[2] || 'MMPI-1-test.html';
    const absolute = path.resolve(ROOT, relative);
    if (!absolute.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    let body;
    if (match[1] === 'baseline') {
      if (!baselineCache.has(relative)) baselineCache.set(relative, execFileSync('git',
        ['-c', 'safe.directory=' + GIT_SAFE_ROOT, 'show', 'HEAD:' + relative.replace(/\\/g, '/')],
        { cwd: ROOT, maxBuffer: 20 * 1024 * 1024, windowsHide: true }));
      body = baselineCache.get(relative);
    } else body = fs.readFileSync(absolute);
    res.writeHead(200, { 'Content-Type': mime[path.extname(relative)] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    res.end(body);
  } catch (error) {
    report.serverErrors.push({ url: req.url, error: error.message });
    res.writeHead(404).end('Not found');
  }
});

async function openPage(context, base, version) {
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push({ version, error: error.message }));
  await page.addInitScript(() => {
    window.__testAlerts = [];
    window.alert = message => window.__testAlerts.push(String(message));
  });
  await page.goto(base + '/' + version + '/MMPI-1-test.html');
  await page.waitForFunction(() => typeof Chart === 'function' &&
    document.querySelectorAll('#select_all input[type=radio]').length === 1134);
  await page.evaluate(() => {
    document.querySelectorAll('.modal').forEach(el => el.remove());
    // Capture the actual US T scores before the existing profile conversion.
    const original = window.start_to_creat_profile;
    window.start_to_creat_profile = function (scores) {
      window.__testUSScores = Array.from(scores);
      return original.apply(this, arguments);
    };
    Chart.defaults.global.animation.duration = 0;
  });
  return page;
}

function randomAnswers(seed) {
  const values = [];
  for (let i = 0; i < 567; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    values.push(seed < 0x80000000 ? 'T' : 'F');
  }
  return values.join('');
}
async function fill(page, sample) {
  await page.evaluate(({ gender, longform, answers }) => {
    const config = document.forms.config;
    config.querySelector('input[name=gender][value=' + (gender ? 'F' : 'M') + ']').click();
    config.querySelector('input[name=testform][value=' + (longform ? 'L' : 'S') + ']').click();
    const form = document.getElementById('select_all');
    form.querySelectorAll('input[type=radio]').forEach(el => { el.checked = false; });
    for (let i = 1; i <= 567; i++) {
      if (answers[i - 1]) form.elements['Q' + i].value = answers[i - 1];
    }
  }, sample);
}
async function snapshot(page, score) {
  return page.evaluate(doScore => {
    if (doScore) {
      window.__testAlerts.length = 0;
      score_rb(document.forms.questions);
    }
    const results = document.getElementById('score-results');
    const charts = Object.values(Chart.instances).sort((a, b) => a.canvas.id.localeCompare(b.canvas.id));
    return {
      gender, longform, answers: Array.from(ans), usTScores: window.__testUSScores,
      reportText: results.textContent,
      tables: Array.from(results.querySelectorAll('table')).map(table =>
        Array.from(table.rows).map(row => Array.from(row.cells).map(cell => cell.textContent))),
      charts: charts.map(chart => ({ canvas: chart.canvas.id, labels: chart.data.labels,
        datasets: chart.data.datasets.map(data => ({ label: data.label, data: data.data })),
        title: chart.options.title.text })),
      payload: Array.from(new FormData(document.getElementById('select_all')).entries()),
      alerts: window.__testAlerts.slice(), reportCount: document.querySelectorAll('#score-results').length
    };
  }, score);
}
async function preserveDuringSwitch(page, mode, label) {
  await page.evaluate(() => {
    window.__beforeLanguage = {
      radios: Array.from(document.querySelectorAll('input[type=radio]')),
      checked: Array.from(document.querySelectorAll('input[type=radio]')).map(el => el.checked),
      english: Array.from(document.querySelectorAll('.question-text--en')),
      chinese: Array.from(document.querySelectorAll('.question-text--zh')),
      data: JSON.stringify(Array.from(new FormData(document.getElementById('select_all')).entries())),
      report: document.getElementById('score-results'), charts: Object.values(Chart.instances),
      gender, longform, ans: JSON.stringify(ans)
    };
  });
  await page.locator('#question-language').selectOption(mode);
  const state = await page.evaluate(() => {
    const before = window.__beforeLanguage;
    const same = (old, current) => old.length === current.length && old.every((el, i) => el === current[i]);
    const radios = Array.from(document.querySelectorAll('input[type=radio]'));
    return {
      mode: document.body.getAttribute('data-question-language'),
      select: document.getElementById('question-language').value,
      radioIdentity: same(before.radios, radios),
      textIdentity: same(before.english, Array.from(document.querySelectorAll('.question-text--en'))) &&
        same(before.chinese, Array.from(document.querySelectorAll('.question-text--zh'))),
      checked: JSON.stringify(before.checked) === JSON.stringify(radios.map(el => el.checked)),
      payload: before.data === JSON.stringify(Array.from(new FormData(document.getElementById('select_all')).entries())),
      config: before.gender === gender && before.longform === longform,
      answers: before.ans === JSON.stringify(ans),
      reportIdentity: before.report === document.getElementById('score-results'),
      chartIdentity: same(before.charts, Object.values(Chart.instances))
    };
  });
  equal(state, { mode, select: mode, radioIdentity: true, textIdentity: true, checked: true,
    payload: true, config: true, answers: true, reportIdentity: true, chartIdentity: true },
  label + ': switch to ' + mode + ' preserves nodes, selections, payload, settings and report');
}

async function checkDisplay(page, mode) {
  const state = await page.evaluate(() => {
    const visible = el => getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
    const english = Array.from(document.querySelectorAll('.question-text--en'));
    const chinese = Array.from(document.querySelectorAll('.question-text--zh'));
    const numbers = Array.from(document.querySelectorAll('.question-number'));
    const surfaces = Array.from(document.querySelectorAll('.answer-option__surface')).slice(0, 2);
    return {
      englishCount: english.length, chineseCount: chinese.length,
      englishVisible: english.filter(visible).length, chineseVisible: chinese.filter(visible).length,
      numbers: numbers.map(el => Number(el.textContent.replace(/\D/g, ''))),
      numbersVisible: numbers.filter(visible).length,
      englishLang: english.every(el => el.getAttribute('lang') === 'en'),
      chineseLang: chinese.every(el => el.getAttribute('lang') === 'zh-CN'),
      englishText: english.every((el, index) => el.textContent === questions[index + 1]),
      chineseText: chinese.every((el, index) => el.textContent === questions_zh[index + 1]),
      labels: surfaces.map(el => el.innerText.trim()),
      configOutsideSubmission: !document.getElementById('select_all').contains(document.getElementById('question-language')),
      instruction: document.querySelector('.answer-instruction').innerText.trim()
    };
  });
  equal(state.numbers, Array.from({ length: 567 }, (_, i) => i + 1), mode + ': all question numbers retained');
  equal([state.englishCount, state.chineseCount, state.numbersVisible], [567, 567, 567], mode + ': 567 bilingual items and visible numbers');
  equal([state.englishVisible, state.chineseVisible], mode === 'both' ? [567, 567] : mode === 'en' ? [567, 0] : [0, 567],
    mode + ': text visibility');
  equal(state.labels, mode === 'en' ? ['True', 'False'] : ['符合', '不符合'], mode + ': visible answer labels');
  check(state.englishLang && state.chineseLang && state.configOutsideSubmission, mode + ': lang tags and separate config form');
  check(state.englishText && state.chineseText, mode + ': all 567 source texts preserved exactly');
  check(mode === 'en' ? !/[\u4e00-\u9fff]/.test(state.instruction) : state.instruction.includes('按整句话判断'),
    mode + ': matching visible answer instruction');
}

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  console.log('START baseline ' + head.slice(0, 7) + '; local server ' + base);
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  try {
    report.browserVersion = browser.version();
    console.log('BROWSER ' + report.browserVersion);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const interceptRequest = async route => {
      const request = route.request();
      if (new URL(request.url()).origin === base) return route.continue();
      if (/^https:\/\/formspree\.io\/f\//.test(request.url()) && request.method() === 'POST') {
        report.submissions.push({ url: request.url(), method: request.method(),
          payload: Array.from(new URLSearchParams(request.postData() || '').entries()) });
        return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Submission intercepted locally</title>' });
      }
      report.interceptedExternalRequests.push({ url: request.url(), method: request.method() });
      return route.abort('blockedbyclient');
    };
    await context.route('**/*', interceptRequest);
    const baseline = await openPage(context, base, 'baseline');
    const draft = await openPage(context, base, 'draft');
    console.log('LOADED baseline and draft');
    equal(await draft.locator('#question-language').inputValue(), 'both', 'Default is bilingual');
    equal(await draft.locator('body').getAttribute('data-question-language'), 'both', 'Default body language is bilingual');
    for (const mode of ['both', 'en', 'zh']) {
      await preserveDuringSwitch(draft, mode, 'Initial display');
      await checkDisplay(draft, mode);
      await draft.screenshot({ path: path.join(reportDir, 'desktop-' + mode + '.png') });
      report.screenshots.push('desktop-' + mode + '.png');
    }
    const invalid = await draft.evaluate(() => {
      const before = document.body.getAttribute('data-question-language');
      return ['fr', '', null, undefined, {}, 'EN'].every(mode => set_question_language(mode) === false &&
        document.body.getAttribute('data-question-language') === before &&
        document.getElementById('question-language').value === before);
    });
    check(invalid, 'Invalid language modes are rejected without changing state');
    await draft.evaluate(() => document.querySelector('#Q1').closest('label').click());
    check(await draft.locator('#Q1').isChecked(), 'Full answer label remains clickable');
    await draft.locator('#question-language').focus();
    await draft.locator('#question-language').press('Home');
    await draft.locator('#question-language').press('ArrowDown');
    await draft.locator('#question-language').press('Enter');
    equal(await draft.locator('body').getAttribute('data-question-language'), 'en', 'Language selector works with keyboard');
    await draft.locator('#Not_Q1').locator('..').click({ position: { x: 3, y: 15 } });
    check(await draft.locator('#Not_Q1').isChecked(), 'English False label padding is clickable');

    const patterns = [
      ...[20260922, 20261022, 0x12345678].map(seed => ({ name: 'seed-' + seed, answers: randomAnswers(seed) })),
      { name: 'all-T', answers: 'T'.repeat(567) }, { name: 'all-F', answers: 'F'.repeat(567) },
      { name: 'empty', answers: '' }
    ];
    for (const pattern of patterns) for (const gender of [0, 1]) for (const longform of [true, false]) {
      const sample = { ...pattern, gender, longform };
      const label = pattern.name + '/' + (gender ? 'female' : 'male') + '/' + (longform ? 'long' : 'short');
      await fill(baseline, sample);
      const expected = await snapshot(baseline, true);
      check(expected.charts.length === (longform ? 2 : 1) && expected.reportCount === 1,
        label + ': baseline chart and report count');
      await fill(draft, sample);
      equal(await draft.evaluate(() => getComputedStyle(document.getElementById('longformdiv')).display === 'none'),
        !longform, label + ': short/long question visibility');
      for (const mode of ['both', 'en', 'zh']) {
        await preserveDuringSwitch(draft, mode, label);
        const actual = await snapshot(draft, true);
        equal(actual, expected, label + '/' + mode + ': complete baseline score/report/payload parity');
        const before = await snapshot(draft, false);
        await preserveDuringSwitch(draft, mode === 'zh' ? 'en' : 'zh', label + ' after scoring');
        equal(await snapshot(draft, false), before, label + '/' + mode + ': language-only switch preserves scored data');
        report.comparisons.push({ sample: label, mode, sha256: digest(actual), charts: actual.charts.length,
          answers: actual.answers.length - 1, payloadFields: actual.payload.length });
      }
      console.log('PASS ' + label + ' (3 language modes)');
    }

    console.log('MATRIX PASS: 72 complete report/score comparisons');
    // Existing repository checks exercise Chart.js, Mf, report layout and recalculation.
    const harness = await context.newPage();
    harness.on('pageerror', error => report.pageErrors.push({ version: 'harness', error: error.message }));
    await harness.goto(base + '/draft/test/browser-check.html');
    await harness.waitForFunction(() => /^(PASS|FAIL)/.test(document.getElementById('result').textContent));
    report.existingBrowserChecks = await harness.locator('#result').innerText();
    check(report.existingBrowserChecks.startsWith('PASS'), 'Existing browser-check.html: ' + report.existingBrowserChecks.split('\n')[0]);
    console.log('EXISTING ' + report.existingBrowserChecks.split('\n')[0]);
    await harness.close();

    const mobileContext = await browser.newContext({ viewport: { width: 393, height: 852 },
      isMobile: true, hasTouch: true, deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' });
    await mobileContext.route('**/*', interceptRequest);
    for (const mode of ['both', 'en', 'zh']) {
      const mobile = await openPage(mobileContext, base, 'draft');
      await mobile.locator('#question-language').selectOption(mode);
      await checkDisplay(mobile, mode);
      check(await mobile.evaluate(() => navigator.maxTouchPoints > 0), mode + ': mobile touch emulation enabled');
      await mobile.locator('.answer-instruction').evaluate(el => el.scrollIntoView({ block: 'start' }));
      await mobile.screenshot({ path: path.join(reportDir, 'mobile-' + mode + '.png') });
      report.screenshots.push('mobile-' + mode + '.png');
      await mobile.close();
    }
    await mobileContext.close();
    console.log('MOBILE PASS: all three modes with touch emulation');

    const restored = await draft.evaluate(() => {
      document.getElementById('question-language').value = 'en';
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      return document.body.getAttribute('data-question-language');
    });
    equal(restored, 'en', 'pageshow synchronizes a browser-restored select value');
    await draft.reload();
    check(await draft.evaluate(() => document.body.getAttribute('data-question-language') ===
      document.getElementById('question-language').value), 'Reload keeps selector and visible mode synchronized');
    await draft.locator('#question-language').selectOption('zh');
    await draft.goto(base + '/draft/google87497ff281bdd4ca.html');
    await draft.goBack();
    check(await draft.evaluate(() => document.body.getAttribute('data-question-language') ===
      document.getElementById('question-language').value), 'History back keeps selector and visible mode synchronized');
    console.log('RESTORATION PASS: pageshow, reload and history back');

    // Native submit (including the clicked submit button) is intercepted, never sent.
    for (const version of ['baseline', 'draft']) for (const mode of version === 'baseline' ? ['baseline'] : ['both', 'en', 'zh']) {
      const submitPage = await openPage(context, base, version);
      await fill(submitPage, { gender: 1, longform: true, answers: randomAnswers(20261022) });
      if (version === 'draft') await submitPage.locator('#question-language').selectOption(mode);
      const previousCount = report.submissions.length;
      await submitPage.locator('button[type=submit]').click();
      await submitPage.waitForURL('https://formspree.io/f/**');
      check(report.submissions.length === previousCount + 1, version + '/' + mode + ': native POST intercepted');
      const sent = report.submissions[report.submissions.length - 1];
      sent.version = version; sent.mode = mode;
      if (version === 'draft') {
        equal(sent.payload, report.submissions[0].payload, mode + ': actual POST fields match baseline');
        if (args['expected-action']) equal(sent.url, args['expected-action'], mode + ': rotated action target');
      }
      check(sent.payload.length === 569 && sent.payload[0][0] === 'invisible_question' &&
        sent.payload[0][1] === '1' && sent.payload.at(-1)[0] === 'check', mode + ': 567 answers, sex and submitter only');
      await submitPage.close();
    }
    check(report.pageErrors.length === 0, 'No browser JavaScript exceptions');
    check(report.serverErrors.length === 0, 'No missing local/baseline assets');
    check(report.interceptedExternalRequests.length === 0, 'No unexpected external requests');
    report.status = 'PASS';
    console.log('PASS ' + report.checks.length + ' assertions; ' + report.comparisons.length +
      ' full baseline comparisons; ' + report.submissions.length + ' intercepted POSTs');
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  report.status = 'FAIL'; report.error = error.stack; process.exitCode = 1;
  console.error(error.stack);
}).finally(() => {
  report.finished = new Date().toISOString();
  fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Report: ' + path.join(reportDir, 'report.json'));
  server.close();
});
