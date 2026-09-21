/**
 * MMPI-2 中文测试 —— 计分层回归测试
 * ============================================================================
 * 运行：node test/run-node.js
 *
 * 本测试由本项目作者与 Anthropic Claude Opus 5（claude-opus-5，1M 上下文）
 * 于 2026 年 9 月讨论后共同完成。
 *
 * 设计意图：2026-09 的修复涉及 9 处查表数值、1 处性别下标、1 处长短卷开关、
 * 以及常模换算的整体替换。这些改动全部属于"看不出错、但结果是错的"那一类，
 * 只有自动化断言能长期拦住回退。本文件把每一条修复都钉成一个测试。
 *
 * 核心验收数据：Cheung, Song & Zhang (1996) 表6-3 公布的中国全国常模样本
 * 原始分均值 + 按美国常模算出的 T 分。把前者喂进本项目的查表，必须复现后者。
 * 这一条同时验证：查表数据完整性、K 校正索引、性别表选择、勘误是否仍在。
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS = f => fs.readFileSync(path.join(ROOT, 'origin_js', f), 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// 极简 DOM 桩：只实现被计分/渲染路径用到的接口，并记录生成的节点树以便断言
// ─────────────────────────────────────────────────────────────────────────────
function makeDom() {
  const mkEl = (tag) => {
    const el = {
      tagName: tag, style: {}, children: [], attrs: {},
      _text: '',
      get textContent() { return this._text; },
      set textContent(v) { this._text = String(v); },
      appendChild(c) { this.children.push(c); return c; },
      insertBefore(c) { this.children.push(c); return c; },
      setAttribute(k, v) { this.attrs[k] = v; },
      getAttribute(k) { return this.attrs[k]; },
      getContext() { return {}; },
      addEventListener() {}, removeChild() {}, click() {},
      get parentNode() { return body; },
      get nextSibling() { return null; }
    };
    return el;
  };
  const body = mkEl('body');
  const byId = {};
  const doc = {
    body,
    baseURI: 'http://localhost/',
    createElement: mkEl,
    createTextNode: (t) => ({ nodeType: 3, textContent: String(t) }),
    getElementsByTagName: (t) => (t === 'body' ? [body] : []),
    getElementById: (id) => (byId[id] || (byId[id] = mkEl('div'))),
    write() {}
  };
  return { doc, body, byId };
}

function loadApp() {
  const { doc, body, byId } = makeDom();
  const alerts = [];
  const sandbox = {
    console,
    document: doc,
    alert: (m) => alerts.push(String(m)),
    prompt: () => '',
    performance: { now: () => 0 },
    // Chart.js 桩：记录每次绘图的 labels 与 data，便于断言剖析图内容
    charts: [],
    Chart: function (ctx, cfg) { sandbox.charts.push(cfg); return { destroy() {} }; }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(JS('my_data.js'), sandbox);
  vm.runInContext(JS('mmpi_cn_norms.js'), sandbox);
  vm.runInContext(JS('my_script.js'), sandbox);
  sandbox.__alerts = alerts;
  sandbox.__body = body;
  sandbox.__byId = byId;
  return sandbox;
}

// ─────────────────────────────────────────────────────────────────────────────
// 断言框架
// ─────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); pass++; }
  catch (e) { console.log('  ✗ ' + name + '\n      ' + e.message); fail++; failures.push(name); }
}
function eq(actual, expected, msg) {
  if (actual !== expected) throw new Error((msg || '') + ` 期望 ${expected}，实际 ${actual}`);
}
function ok(cond, msg) { if (!cond) throw new Error(msg || '断言失败'); }
function near(actual, expected, tol, msg) {
  if (!(Math.abs(actual - expected) <= tol))
    throw new Error((msg || '') + ` 期望 ${expected}±${tol}，实际 ${actual}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cheung/Song/Zhang (1996) 表6-3：PRC 全国常模样本（男1106/女1108）
// [男原始分均值, 男T分均值, 女原始分均值, 女T分均值]
// ─────────────────────────────────────────────────────────────────────────────
const T63 = {
  L:[6.0,60.6,5.8,60.9], F:[9.3,64.8,9.0,68.3], K:[14.1,47.3,13.3,45.6],
  Hs:[8.3,56.1,9.5,55.3], D:[24.3,62.8,26.6,63.0], Hy:[22.2,53.2,23.2,52.7],
  Pd:[18.6,52.5,17.9,51.3], Mf:[24.4,46.9,30.0,64.5], Pa:[11.7,55.9,12.2,57.0],
  Pt:[15.8,57.2,17.4,55.8], Sc:[19.5,62.7,20.6,62.3], Ma:[17.8,51.0,16.6,49.7],
  Si:[32.3,57.4,35.4,58.1], Fb:[7.1,71.1,8.1,73.4],
  ANX:[7.3,54.1,8.1,53.2], FRS:[7.0,60.6,10.7,62.0], OBS:[5.4,51.5,6.1,51.6],
  DEP:[9.6,60.4,10.8,59.6], HEA:[8.4,57.6,9.5,57.4], BIZ:[4.1,56.6,4.2,57.8],
  ANG:[5.9,50.8,6.6,52.8], CYN:[11.8,53.7,11.9,55.7], ASP:[8.8,51.7,8.0,54.7],
  TPA:[10.7,57.1,11.0,61.5], LSE:[8.6,61.4,9.8,60.6], SOD:[9.5,53.6,10.2,55.4],
  FAM:[7.0,54.8,7.4,53.1], WRK:[11.2,57.7,12.1,56.5], TRT:[9.9,63.7,10.4,63.1]
};

const app = loadApp();
const S = app.scales;
const CN = app.MMPI_CN;

// 查表工具：对（K校正后的）分数做线性插值
function tableLookup(scaleKey, gender, score) {
  const idx = CN.scaleIndex(scaleKey, gender);
  const a = S[idx][3 + gender];
  const p = [];
  for (let r = 0; r + 1 < a.length; r++) { const t = a[r + 1]; if (t != null) p.push([r, t]); }
  if (!p.length) return null;
  if (score <= p[0][0]) return p[0][1];
  if (score >= p[p.length - 1][0]) return p[p.length - 1][1];
  for (let j = 1; j < p.length; j++) {
    if (score <= p[j][0]) {
      const [x0, y0] = p[j - 1], [x1, y1] = p[j];
      return y0 + (y1 - y0) * (score - x0) / (x1 - x0);
    }
  }
}
function kWeight(scaleKey) {
  const idx = CN.scaleIndex(scaleKey, 0);
  const a = S[idx][3];
  return (a && a[0]) || 0;
}
// 对线性 T 分量表，从查表精确反解美国原始分标准差
function usRawSD(scaleKey, gender) {
  const idx = CN.scaleIndex(scaleKey, gender);
  const a = S[idx][3 + gender];
  const p = [];
  for (let r = 0; r + 1 < a.length; r++) { const t = a[r + 1]; if (t != null && t > 30 && t < 120) p.push([r, t]); }
  const n = p.length; let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of p) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
  return Math.abs(10 / ((n * sxy - sx * sy) / (n * sxx - sx * sx)));
}

console.log('\n══════ MMPI-2 计分层回归测试 ══════\n');

// ═══════════════════════════════════════════════════════════════════════════
console.log('【1】查表勘误（9 处手抄错误）');
// ═══════════════════════════════════════════════════════════════════════════
test('9 条勘误全部在位（MMPI_ERRATA.verify）', () => {
  const r = app.MMPI_ERRATA.verify(S);
  ok(r.failed === 0, `${r.failed} 条未通过：\n      ` + r.bad.join('\n      '));
  eq(r.passed, 9, '通过条数');
});
test('Sc男 raw21 = 41（原为 4，偏低 37 个 T 分）', () => eq(S[14][3][22], 41));
test('Pt男 raw42 = 83（原为 93，偏高 10 分且压在 80 阈值上）', () => eq(S[13][3][43], 83));
test('Mt男 raw37/38 = 90/91（原为 30/31，偏低 60 分）', () => {
  eq(S[74][3][38], 90); eq(S[74][3][39], 91);
});
test('PK女 raw33 = 88（原为 87389，会把图表 y 轴拉爆）', () => eq(S[77][4][34], 88));
test('全表 T 值均在 [28,120] 且方向单调', () => {
  const bad = [];
  S.forEach(s => {
    const rev = (s[0][2] === 'Masculinity-Femininity - Female');
    for (const g of [0, 1]) {
      const a = s[3 + g]; if (!a || a.length < 5) continue;
      let prev = null;
      for (let k = 0; k + 1 < a.length; k++) {
        const t = a[k + 1]; if (t == null) continue;
        if (t < 28 || t > 120) bad.push(`${s[0][1]}${g ? '女' : '男'} raw${k}=${t} 越界`);
        if (prev !== null) {
          const d = t - prev;
          if ((!rev && d < 0) || (rev && d > 0)) bad.push(`${s[0][1]}${g ? '女' : '男'} raw${k} ${prev}→${t} 逆转`);
        }
        prev = t;
      }
    }
  });
  ok(bad.length === 0, `${bad.length} 处异常：\n      ` + bad.slice(0, 5).join('\n      '));
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【2】端到端：用中国常模原始分均值复现书上印的美国 T 分');
// ═══════════════════════════════════════════════════════════════════════════
test('58 格 |差| 中位数 ≤ 1.0 且最大 ≤ 3.0（验证查表+K校正+性别表选择）', () => {
  const diffs = [];
  const worst = [];
  for (const key of Object.keys(T63)) {
    for (const g of [0, 1]) {
      const raw = T63[key][g ? 2 : 0], book = T63[key][g ? 3 : 1];
      const kAdj = raw + kWeight(key) * T63.K[g ? 2 : 0];
      const mine = tableLookup(key, g, kAdj);
      if (mine === null) continue;
      const d = Math.abs(mine - book);
      diffs.push(d);
      if (d > 3) worst.push(`${key}${g ? '女' : '男'}: 查表${mine.toFixed(1)} vs 书上${book}`);
    }
  }
  eq(diffs.length, 58, '比对格数');
  diffs.sort((a, b) => a - b);
  const med = diffs[Math.floor(diffs.length / 2)];
  ok(med <= 1.0, `中位数 ${med.toFixed(2)} > 1.0`);
  ok(worst.length === 0, `有 ${worst.length} 格偏差 >3：\n      ` + worst.join('\n      '));
  console.log(`      （中位数 ${med.toFixed(2)}，最大 ${diffs[diffs.length - 1].toFixed(2)}）`);
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【3】中国常模双参数换算');
// ═══════════════════════════════════════════════════════════════════════════
test('喂入 M_T 应得中国 T = 50（定义自洽）', () => {
  for (const key of Object.keys(T63)) for (const g of [0, 1]) {
    const p = CN.params(key, g);
    near(CN.correctT(key, g, p.MT, { round: false }), 50, 1e-9, `${key}${g ? '女' : '男'}`);
  }
});
test('喂入 M_T + S_T 应得中国 T = 60（即中国分界点）', () => {
  for (const key of Object.keys(T63)) for (const g of [0, 1]) {
    const p = CN.params(key, g);
    near(CN.correctT(key, g, p.MT + p.ST, { round: false }), 60, 1e-9, `${key}${g ? '女' : '男'}`);
  }
});
test('usTForCN 与 correctT 互为逆运算', () => {
  for (const key of ['F', 'Sc', 'K', 'Mf', 'DEP']) for (const g of [0, 1]) {
    const usT = CN.usTForCN(key, g, 60);
    near(CN.correctT(key, g, usT, { round: false }), 60, 1e-9, `${key}${g ? '女' : '男'}`);
  }
});
test('输出恒被钳位在 [30,120]', () => {
  for (const key of Object.keys(T63)) for (const g of [0, 1]) for (const t of [-50, 0, 30, 70, 120, 300]) {
    const v = CN.correctT(key, g, t);
    ok(v >= 30 && v <= 120, `${key}${g ? '女' : '男'} 输入${t} → ${v}`);
  }
});
test('换算严格单调（不再出现"原始分更高、报出更低"）', () => {
  for (const key of Object.keys(T63)) for (const g of [0, 1]) {
    let prev = -Infinity;
    for (let t = 20; t <= 130; t++) {
      const v = CN.correctT(key, g, t, { clamp: false, round: false });
      ok(v >= prev, `${key}${g ? '女' : '男'} 在 T=${t} 处非单调`);
      prev = v;
    }
  }
});
test('无中国常模的量表返回 null，不静默放行', () => {
  eq(CN.correctT('Pd1', 0, 70), null);
  eq(CN.correctT('RCd', 0, 70), null);
  eq(CN.correctT('MAC-R', 1, 70), null);
  eq(CN.hasNorm('Pd1'), false);
  eq(CN.hasNorm('DEP'), true);
});
test('无效输入返回 null（undefined / NaN / 空串）', () => {
  eq(CN.correctT('F', 0, undefined), null);
  eq(CN.correctT('F', 0, NaN), null);
  eq(CN.correctT('F', 0, ''), null);
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【4】内部一致性：表6-3 的 T 分标准差 vs 从查表反解的原始分标准差');
// ═══════════════════════════════════════════════════════════════════════════
test('5 个线性 T 分量表：10×(中国SD/美国SD) ≈ 书上 S_T，最大偏差 ≤ 1.5', () => {
  const rows = [];
  for (const key of ['L', 'F', 'K', 'Mf', 'Si']) for (const g of [0, 1]) {
    const n = CN.NORM[key], o = g ? 2 : 0;
    const cnSD = n.raw[o + 1], ST = n.tUS[o + 1];
    const pred = 10 * cnSD / usRawSD(key, g);
    rows.push([key + (g ? '女' : '男'), pred, ST, Math.abs(pred - ST)]);
  }
  const worst = rows.reduce((a, b) => (b[3] > a[3] ? b : a));
  ok(worst[3] <= 1.5, `${worst[0]} 偏差 ${worst[3].toFixed(2)}（预测${worst[1].toFixed(1)} vs 书上${worst[2]}）`);
  const mean = rows.reduce((s, r) => s + r[3], 0) / rows.length;
  console.log(`      （10 格，平均偏差 ${mean.toFixed(2)}，最大 ${worst[3].toFixed(2)} @ ${worst[0]}）`);
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【5】Mf 性别下标 bug 回归');
// ═══════════════════════════════════════════════════════════════════════════
test('damn_for_gender 取到正确的 Mf 条目（男10 / 女11）', () => {
  eq(app.damn_for_gender(0)[7], 10, '男性应取 scales[10]');
  eq(app.damn_for_gender(1)[7], 11, '女性应取 scales[11]');
});
test('scales[10] 有男表、scales[11] 有女表（另一性别为空数组）', () => {
  ok(S[10][3].length > 3, 'scales[10][3] 应为男性 Mf 表');
  eq(S[10][4].length, 0, 'scales[10][4] 应为空');
  eq(S[11][3].length, 0, 'scales[11][3] 应为空');
  ok(S[11][4].length > 3, 'scales[11][4] 应为女性 Mf 表');
});
test('男性 Mf 在常见分数段能查到有效 T 分（修复前取错表，恒为 undefined）', () => {
  // 中国男性 Mf 原始分均值为 24.4（表6-3），取整后必须能查到 T 分
  ok(S[10][3][24 + 1] !== undefined, 'scales[10][3] 在 raw24 处应有 T 分');
  const v = tableLookup('Mf', 0, 24);
  ok(v !== null && isFinite(v), '男性 Mf raw24 查表应返回有限数');
  // 修复前男性走的是 scales[11][3]，那是空数组 —— 任何原始分都查不到
  eq(S[11][3].length, 0, '修复前男性误用的 scales[11][3] 确实是空数组');
});
test('美国 Mf 男表的地板在 raw16（T=30），低于此值无 T 分属原表性质', () => {
  const m = S[10][3];
  let first = -1;
  for (let r = 0; r + 1 < m.length; r++) if (m[r + 1] != null) { first = r; break; }
  eq(first, 16, '最低可查原始分');
  eq(m[first + 1], 30, '该处 T 分应为地板值 30');
  eq(CN.correctT('Mf', 0, undefined), null, '超表时中国换算应返回 null 而非瞎算');
  eq(CN.hasNorm('Mf'), true, 'Mf 本身是有中国常模的 —— 两种情况必须能区分');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【6】长短卷 bug 回归');
// ═══════════════════════════════════════════════════════════════════════════
test('use_long_form(false) 真正把 longform 置为 false', () => {
  app.longform = true;
  app.use_long_form(false);
  eq(app.longform, false, 'longform 应被更新（修复前只改了 CSS）');
  app.use_long_form(true);
  eq(app.longform, true);
});
test('13 个基础量表的题号全部 ≤ 370（短卷可有效计分）', () => {
  for (const key of ['L','F','K','Hs','D','Hy','Pd','Mf','Pa','Pt','Sc','Ma','Si']) {
    const idx = CN.scaleIndex(key, 0);
    const mx = Math.max(...S[idx][1], ...S[idx][2]);
    ok(mx <= 370, `${key} 最大题号 ${mx} 超出短卷范围`);
  }
});
test('内容量表与 Fb 均依赖 371 题以后的项目（故短卷下必须不呈现）', () => {
  for (const key of ['Fb','ANX','FRS','OBS','DEP','HEA','BIZ','ANG','CYN','ASP','TPA','LSE','SOD','FAM','WRK','TRT']) {
    const idx = CN.scaleIndex(key, 0);
    const mx = Math.max(...S[idx][1], ...S[idx][2]);
    ok(mx > 370, `${key} 最大题号 ${mx}，不应依赖长卷`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【7】全流程冒烟：极端作答下不得出现异常值');
// ═══════════════════════════════════════════════════════════════════════════
for (const [label, ansFn] of [['全选"是"', () => 'T'], ['全选"否"', () => 'F']]) {
  for (const g of [0, 1]) {
    test(`${label} / ${g ? '女' : '男'}：13 个基础量表的中国 T 分均为 [30,120] 内的有限数`, () => {
      const a = loadApp();
      a.gender = g; a.longform = true;
      a.ans = [undefined];
      for (let i = 1; i < a.questions.length; i++) a.ans.push(ansFn());
      a.score();
      const dm = a.damn_for_gender(g);
      const keys = ['L','F','K','Hs','D','Hy','Pd','Mf','Pa','Pt','Sc','Ma','Si'];
      const bad = [];
      keys.forEach((k, i) => {
        const tUS = a.__usT ? a.__usT[dm[i]] : tableLookup(k, g,
          (() => {   // 自行按答案重算原始分，避免依赖内部变量
            const idx = a.MMPI_CN.scaleIndex(k, g);
            let raw = 0;
            for (const q of a.scales[idx][1]) if (a.ans[q] === 'T') raw++;
            for (const q of a.scales[idx][2]) if (a.ans[q] === 'F') raw++;
            let kRaw = 0;
            for (const q of a.scales[4][1]) if (a.ans[q] === 'T') kRaw++;
            for (const q of a.scales[4][2]) if (a.ans[q] === 'F') kRaw++;
            const w = (a.scales[idx][3] && a.scales[idx][3][0]) || 0;
            return Math.floor(raw + w * kRaw + 0.5);
          })());
        const cn = a.MMPI_CN.correctT(k, g, tUS);
        if (cn === null || !isFinite(cn) || cn < 30 || cn > 120) bad.push(`${k}: 美国T=${tUS} → 中国T=${cn}`);
      });
      ok(bad.length === 0, bad.join('; '));
    });
  }
}
test('全选"否"（分数落在表内）不应触发任何 alert', () => {
  const a = loadApp();
  a.gender = 0; a.longform = true;
  a.ans = [undefined];
  for (let i = 1; i < a.questions.length; i++) a.ans.push('F');
  a.score();
  ok(a.__alerts.length === 0, '不应有 alert，实际收到：' + a.__alerts.join(' | '));
});
test('全选"是"使 F 原始分(41)超出美国表上界(28)，应如实报警而非静默', () => {
  const a = loadApp();
  a.gender = 0; a.longform = true;
  a.ans = [undefined];
  for (let i = 1; i < a.questions.length; i++) a.ans.push('T');
  a.score();
  // F 量表 41 个正向题，全选"是"即原始分 41；美国男表只查到 28（T=120）
  eq(a.scales[0][1].length, 41, 'F 量表正向题数');
  eq(a.scales[0][3].length - 2, 28, 'F 男表最高可查原始分');
  ok(a.__alerts.length > 0, '超出量表范围时应给出提示');
  ok(a.__alerts.join(' ').indexOf('超出') >= 0, '提示文本应说明超出范围');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【8】常模数据完整性');
// ═══════════════════════════════════════════════════════════════════════════
test('NORM 覆盖 29 个量表，每项都有 raw[4] 与 tUS[4]', () => {
  const ks = Object.keys(CN.NORM);
  eq(ks.length, 29, '量表数');
  for (const k of ks) {
    eq(CN.NORM[k].raw.length, 4, `${k}.raw 长度`);
    eq(CN.NORM[k].tUS.length, 4, `${k}.tUS 长度`);
    for (const v of CN.NORM[k].raw.concat(CN.NORM[k].tUS)) ok(typeof v === 'number' && isFinite(v), `${k} 含非数值`);
  }
});
test('NORM 的每个键都能在 SCALE_INDEX 中解析出有效下标', () => {
  for (const k of Object.keys(CN.NORM)) for (const g of [0, 1]) {
    const idx = CN.scaleIndex(k, g);
    ok(typeof idx === 'number', `${k} 无下标映射`);
    ok(S[idx] !== undefined, `${k} 下标 ${idx} 越界`);
    ok(S[idx][3 + g] !== undefined && S[idx][3 + g].length > 3, `${k}${g ? '女' : '男'} 无 T 表`);
  }
});
test('CN_KEYS 与 damn 顺序一致（13 项，逐项对应）', () => {
  eq(app.CN_KEYS.length, 13);
  const dm0 = app.damn_for_gender(0), dm1 = app.damn_for_gender(1);
  app.CN_KEYS.forEach((k, i) => {
    eq(dm0[i], CN.scaleIndex(k, 0), `男 ${k}`);
    eq(dm1[i], CN.scaleIndex(k, 1), `女 ${k}`);
  });
});
test('区分点常量：中国 60 / 美国 65', () => {
  eq(CN.CUTOFF_CN, 60); eq(CN.CUTOFF_US, 65);
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【9】渲染路径：中国常模表与分界点对照表必须真的出现在页面上');
// ═══════════════════════════════════════════════════════════════════════════
function walk(el, out) {
  out = out || [];
  if (!el || !el.children) return out;
  for (const c of el.children) { out.push(c); walk(c, out); }
  return out;
}
function allText(el) {
  let t = (el && el.textContent) ? el.textContent : '';
  if (el && el.children) for (const c of el.children) t += ' ' + allText(c);
  return t;
}
function renderOnce(gender, ansChar) {
  const a = loadApp();
  a.gender = gender; a.longform = true;
  a.ans = [undefined];
  for (let i = 1; i < a.questions.length; i++) a.ans.push(ansChar);
  a.score();
  return a;
}
function findTable(a, needle) {
  return walk(a.__body).filter(e => e.tagName === 'table')
                       .find(t => allText(t).indexOf(needle) >= 0);
}

test('页面上出现"各量表的中国常模 T 分"表头，且无残留的旧 -8 说明', () => {
  const a = renderOnce(0, 'F');
  const txt = allText(a.__body);
  ok(txt.indexOf('各量表的中国常模 T 分') >= 0, '未找到中国常模表表头');
  ok(txt.indexOf('我们对T分进行了-8的修正') < 0, '仍残留旧的 -8 说明文字');
});

test('中国常模表含表头 + 13 个量表行（Mf 不再被跳过）', () => {
  const a = renderOnce(0, 'F');
  const t = findTable(a, '各量表的中国常模 T 分');
  ok(t !== undefined, '找不到中国常模表');
  eq(t.children.filter(r => r.tagName === 'tr').length, 14);
});

test('每个量表行都给出数值或明确说明，不出现 undefined / NaN（男女 × 全是/全否）', () => {
  for (const g of [0, 1]) for (const ch of ['T', 'F']) {
    const a = renderOnce(g, ch);
    const t = findTable(a, '各量表的中国常模 T 分');
    t.children.filter(r => r.tagName === 'tr').slice(1).forEach(r => {
      const c1 = allText(r.children[0]);
      ok(c1.indexOf('undefined') < 0, `${g ? '女' : '男'}/全${ch} 出现 undefined: "${c1}"`);
      ok(c1.indexOf('NaN') < 0, `${g ? '女' : '男'}/全${ch} 出现 NaN: "${c1}"`);
      const good = /（美国常模/.test(c1) || /超出量表范围/.test(c1) || /无中国常模数据/.test(c1);
      ok(good, `${g ? '女' : '男'}/全${ch} 行内容异常: "${c1}"`);
    });
  }
});

test('分界点对照表渲染出 13 个量表，且 F男=78.7 / Sc男=74.8', () => {
  const a = renderOnce(0, 'F');
  const t = findTable(a, '才相当于中国常模的 60 分界点');
  ok(t !== undefined, '找不到分界点对照表');
  eq(t.children.filter(r => r.tagName === 'tr').length, 14);
  const txt = allText(t);
  ok(txt.indexOf('78.7') >= 0, 'F男 应为 78.7');
  ok(txt.indexOf('74.8') >= 0, 'Sc男 应为 74.8');
});

test('长卷绘制 2 张剖析图；短卷只绘 1 张并给出说明', () => {
  const lon = renderOnce(0, 'F');
  eq(lon.charts.length, 2, '长卷：效度临床图 + 内容量表图');
  const a = loadApp();
  a.gender = 0;
  a.use_long_form(false);
  a.ans = [undefined];
  for (let i = 1; i <= 370; i++) a.ans.push('F');
  a.score();
  eq(a.charts.length, 1, '短卷：只应绘制效度临床图');
  ok(allText(a.__body).indexOf('内容量表依赖第 371 题以后的项目') >= 0, '缺少短卷说明');
});

test('剖析图数据中不含 undefined / NaN（男女各一遍）', () => {
  for (const g of [0, 1]) {
    const a = renderOnce(g, 'F');
    a.charts.forEach((cfg, ci) => {
      ((cfg && cfg.data && cfg.data.datasets) || []).forEach(d => {
        (d.data || []).forEach((v, vi) => {
          ok(v !== undefined, `${g ? '女' : '男'} 图${ci} 第${vi}项为 undefined`);
          ok(!(typeof v === 'number' && isNaN(v)), `${g ? '女' : '男'} 图${ci} 第${vi}项为 NaN`);
        });
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════');
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
if (fail) { console.log('失败项：\n  - ' + failures.join('\n  - ')); process.exitCode = 1; }
else console.log('全部通过 ✓');
console.log('══════════════════════════════════════\n');
