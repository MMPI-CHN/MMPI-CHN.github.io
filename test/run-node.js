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
      addEventListener() {}, removeChild(c) { this.children = this.children.filter(x => x !== c); }, click() {},
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
test('男性 Mf 在常见分数段能查到有效 T 分（错误下标潜伏于原来跳过的分支）', () => {
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
console.log('\n【9】渲染路径：只保留一张基础解释表，按显示的近似中国 T 分选档');
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
function findTable(a, needle, latest = false) {
  const tables = walk(a.__body).filter(e => e.tagName === 'table');
  if (latest) tables.reverse();
  return tables.find(t => {
    const head = t.children.find(c => c.tagName === 'thead' || c.tagName === 'tr');
    return head && allText(head).includes(needle);
  });
}
function basicRow(table, key) {
  return table.children.find(r => r.tagName === 'tr' && r.children[0] &&
    r.children[0].textContent.startsWith(key + '（'));
}

test('页面只有一张基础解释表；完整大表仍明示美国常模来源，两图标为中国近似 T 分', () => {
  const a = renderOnce(0, 'F');
  const txt = allText(a.__body);
  ok(txt.includes('中国常模近似 T 分') && txt.includes('基础解释'), '缺少简明表头');
  ok(!txt.includes('美国常模 T 分（原始查表）'), '仍显示重复的美国13项解释表');
  ok(!txt.includes('按本近似公式换算为60分'), '仍显示技术对照表');
  ok(!txt.includes('以下解释按美国常模T分分档'), '仍显示过时的解释前缀');
  ok(txt.includes('T Score (美国常模)'), '原始大表没有标明T分来源');
  eq(walk(a.__body).filter(e => e.tagName === 'table').length, 3, '应只有原始大表、关键题表与近似中国基础表');
  a.charts.forEach(c => {
    ok(c.options.title.text.includes('中国常模近似 T 分'), '图标题未标近似中国 T 分');
    ok(c.data.datasets.every(d => d.label.includes('中国常模近似 T 分')), '图例未标近似中国 T 分');
  });
  ok(txt.indexOf('我们对T分进行了-8的修正') < 0, '仍残留旧的 -8 说明文字');
});

test('中国常模表含表头 + 13 个量表行（Mf 不再被跳过）', () => {
  const a = renderOnce(0, 'F');
  const t = findTable(a, '中国常模近似 T 分');
  ok(t !== undefined, '找不到中国常模表');
  eq(t.children.filter(r => r.tagName === 'tr').length, 14);
});

test('Mf 男女只显示对应计分条目，原始表与近似中国表数值一致', () => {
  for (const [gender, sex, us, cn] of [[0, '男性', 60, 66], [1, '女性', 57, 42]]) {
    const a = renderOnce(gender, 'F');
    const raw = findTable(a, 'Scale Description');
    const rawRows = walk(raw).filter(x => x.tagName === 'tr' && x.children.length && allText(x.children[0]).trim() === 'Mf');
    eq(rawRows.length, 1, `${sex}原始量表表只能有一个Mf`);
    ok(allText(rawRows[0]).includes(sex === '男性' ? 'Male' : 'Female'), `${sex}原始Mf条目选错`);
    ok(!allText(rawRows[0]).includes(sex === '男性' ? 'Female' : 'Male'), `${sex}原始表混入另一性别`);
    const cnTable = findTable(a, '中国常模近似 T 分');
    const mfRows = table => table.children.filter(x => x.tagName === 'tr' && x.children.length && allText(x.children[0]).includes('Mf（'));
    eq(mfRows(cnTable).length, 1, `${sex}换算表只能有一个Mf`);
    ok(allText(mfRows(cnTable)[0].children[0]).includes(`按${sex}计分） : ${cn}`), `${sex}换算Mf分数错`);
    ok(allText(rawRows[0]).includes(String(us)), `${sex}美国Mf原始表T分错`);
  }
});

test('每个量表行都给出数值或明确说明，不出现 undefined / NaN（男女 × 全是/全否）', () => {
  for (const g of [0, 1]) for (const ch of ['T', 'F']) {
    const a = renderOnce(g, ch);
    const t = findTable(a, '中国常模近似 T 分');
    t.children.filter(r => r.tagName === 'tr').slice(1).forEach(r => {
      const c1 = allText(r.children[0]);
      ok(c1.indexOf('undefined') < 0, `${g ? '女' : '男'}/全${ch} 出现 undefined: "${c1}"`);
      ok(c1.indexOf('NaN') < 0, `${g ? '女' : '男'}/全${ch} 出现 NaN: "${c1}"`);
      const good = / : \d+$/.test(c1.trim()) || /超出量表范围/.test(c1) || /无中国常模数据/.test(c1);
      ok(good, `${g ? '女' : '男'}/全${ch} 行内容异常: "${c1}"`);
    });
  }
});

function renderBasicAt(a, key, chineseT) {
  const scores = [];
  a.CN_KEYS.forEach((k, i) => {
    scores[a.damn_for_gender(a.gender)[i]] = a.MMPI_CN.usTForCN(k, a.gender, k === key ? chineseT : 50);
  });
  a.start_to_print_result(a.resultArray, scores);
  const table = findTable(a, '中国常模近似 T 分', true);
  return basicRow(table, key);
}
function withoutReferencePrefix(s) {
  return s.replace(/^【近似换算值达到 60 分参考线，不等于诊断】/, '');
}

test('12个非Mf基础量表沿用作者原两阈值、三档与解释全文', () => {
  const a = loadApp();
  a.gender = 0;
  a.CN_KEYS.forEach((key, i) => {
    if (key === 'Mf') return;
    const source = a.resultArray[i];
    const [high, middle] = [source[1], source[2]];
    for (const [t, selected] of [[middle - 1, 5], [middle, 4], [high - 1, 4], [high, 3]]) {
      const row = renderBasicAt(a, key, t);
      ok(row, `${key}=${t} 缺少结果行`);
      ok(row.children[0].textContent.endsWith(`: ${t}`), `${key}=${t} 显示分数错误`);
      eq(withoutReferencePrefix(row.children[1].textContent), source[selected], `${key}=${t} 原解释全文或档位被改动`);
    }
  });
});

test('随机PDF的 D 美国T=68 换算显示55，沿用原第三档解释全文', () => {
  const a = loadApp();
  a.gender = 0;
  const scores = [];
  scores[a.damn_for_gender(0)[4]] = 68;
  a.start_to_print_result(a.resultArray, scores);
  const t = findTable(a, '中国常模近似 T 分');
  const d = basicRow(t, 'D');
  ok(d !== undefined, '缺少D量表行');
  ok(d.children[0].textContent.endsWith(': 55'), 'D换算结果应显示55');
  eq(withoutReferencePrefix(d.children[1].textContent), a.resultArray[4][5], 'D=55 应采用作者原第三档文字');
});

test('档位采用页面显示的取整值：Pa 79.6→80选原高档，D 59.6→60选原中档', () => {
  const a = loadApp();
  a.gender = 0;
  const scores = [];
  scores[a.damn_for_gender(0)[8]] = a.MMPI_CN.usTForCN('Pa', 0, 79.6);
  scores[a.damn_for_gender(0)[4]] = a.MMPI_CN.usTForCN('D', 0, 59.6);
  a.start_to_print_result(a.resultArray, scores);
  const pa = basicRow(findTable(a, '中国常模近似 T 分'), 'Pa');
  const d = basicRow(findTable(a, '中国常模近似 T 分'), 'D');
  ok(pa.children[0].textContent.endsWith(': 80'), 'Pa应显示取整后的80');
  eq(withoutReferencePrefix(pa.children[1].textContent), a.resultArray[8][3], 'Pa应按显示的80选作者原高档');
  ok(d.children[0].textContent.endsWith(': 60'), 'D应显示取整后的60');
  eq(withoutReferencePrefix(d.children[1].textContent), a.resultArray[4][4], 'D应按显示的60选作者原中档');
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

test('两张图每个点等于对应量表的近似中国 T 分，超表范围留空而非画成 0', () => {
  const groups = [
    ['L', 'F', 'K', 'Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'],
    ['ANX', 'FRS', 'OBS', 'DEP', 'HEA', 'BIZ', 'ANG', 'CYN', 'ASP', 'TPA', 'LSE', 'SOD', 'FAM', 'WRK', 'TRT']
  ];
  let gaps = 0;
  for (const g of [0, 1]) for (const answer of ['T', 'F']) {
    const a = renderOnce(g, answer);
    const raw = findTable(a, 'Scale Description');
    ok(raw, '缺少原始美国 T 分表');
    groups.forEach((keys, ci) => {
      const cfg = a.charts[ci];
      ok(cfg, `${g ? '女' : '男'}/全${answer} 缺少图${ci}`);
      const values = cfg.data.datasets[0].data;
      eq(values.length, keys.length, `图${ci} 点数`);
      keys.forEach((key, vi) => {
        eq(cfg.data.labels[vi], key, `图${ci} 第${vi}项量表错位`);
        const rows = walk(raw).filter(r => r.tagName === 'tr' && r.children.length > 4 &&
          allText(r.children[0]).trim() === key);
        eq(rows.length, 1, `${key} 应只有所选性别的一条原始分行`);
        const tUS = Number(allText(rows[0].children[4]).trim());
        const expected = Number.isFinite(tUS) ? a.MMPI_CN.correctT(key, g, tUS) : null;
        eq(values[vi], expected, `${g ? '女' : '男'}/全${answer} ${key} 图点与中国换算表不一致`);
        if (expected === null) gaps++;
      });
    });
  }
  ok(gaps > 0, '极端答卷应包含超出查表范围的空白图点');
});

test('诊断说明、警告和诊断表在原始技术表之前，原始选项在最后且限宽', () => {
  const a = renderOnce(0, 'F');
  const nodes = walk(a.__body);
  const index = predicate => nodes.findIndex(predicate);
  const note = index(e => e.tagName === 'span' && allText(e).includes('中国常模近似T分表按'));
  const warning = index(e => e.tagName === 'span2' && allText(e).includes('注意！结果仅供参考！'));
  const link = index(e => e.tagName === 'a' && allText(e).includes('查看常模换算'));
  const diagnostic = nodes.indexOf(findTable(a, '中国常模近似 T 分'));
  const raw = nodes.indexOf(findTable(a, 'Scale Description'));
  const choices = index(e => e.tagName === 'span4' && allText(e).includes('如果有需要，可以保留您的原始选项'));
  ok(note >= 0 && warning >= 0 && link >= 0 && diagnostic >= 0 && raw >= 0 && choices >= 0,
    `结果区块缺少元素：说明=${note} 警告=${warning} 链接=${link} 诊断表=${diagnostic} 原始表=${raw} 选项=${choices}`);
  ok(note < warning && warning < link && link < diagnostic && diagnostic < raw && raw < choices,
    '诊断区块、技术表、原始选项顺序错误');
  ok(nodes[choices].style.maxWidth, '原始选项未设置最大宽度');
});

// 2026-09-22 PDF复核暴露的边界与解释路径。
test('空答卷不显示检查框，仍显示分数、图表和基础解释', () => {
  for (const lf of [true, false]) {
    const a = loadApp(); a.longform = lf; a.ans = [undefined];
    a.score();
    eq(a.charts.length, lf ? 2 : 1);
    const text = allText(a.__body);
    ok(!text.includes('答卷检查：'));
    ok(findTable(a, '中国常模近似 T 分') !== undefined);
  }
});
test('已有报告后再空答：替换旧报告，仍显示本次分数和图表', () => {
  const a = renderOnce(0, 'F');
  eq(a.profileCharts.length, 2);
  const oldReport = a.__body.children.find(x => x.attrs.id === 'score-results');
  a.ans = [undefined]; a.score();
  eq(a.profileCharts.length, 2);
  const reports = a.__body.children.filter(x => x.attrs.id === 'score-results');
  eq(reports.length, 1);
  ok(reports[0] !== oldReport);
  ok(!allText(a.__body).includes('答卷检查：'));
  ok(findTable(a, '中国常模近似 T 分') !== undefined);
});
test('固定种子随机作答：不显示检查框，仍显示一张基础解释表', () => {
  const a = loadApp(); let seed = 20260922;
  a.ans = [undefined];
  for (let i = 1; i <= 567; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    a.ans.push(seed < 2147483648 ? 'T' : 'F');
  }
  a.score();
  eq(a.charts.length, 2);
  const text = allText(a.__body);
  ok(!text.includes('答卷检查：'));
  const cnTable = findTable(a, '中国常模近似 T 分');
  ok(cnTable);
  ok(allText(cnTable).includes('基础解释'));
  ok(!allText(cnTable).includes('以下解释按美国常模T分分档'));
});
test('未完成题对不得伪装成完整的VRIN/TRIN分数', () => {
  const a = loadApp();
  a.ans = [undefined, ...Array(537).fill('F'), ...Array(30).fill('?')];
  a.score();
  const raw = findTable(a, 'Scale Description');
  const rows = walk(raw).filter(x => x.tagName === 'tr' && x.children.length && ['VRIN','TRIN'].includes(allText(x.children[0]).trim()));
  ok(rows.some(r => allText(r).includes('未完整作答')));
});
test('短卷忽略文本导入的后197题，不报告内容量表部分T分', () => {
  const a = loadApp(); a.longform = false;
  a.ans = [undefined, ...Array(370).fill('F'), ...Array(197).fill('T')];
  a.score();
  eq(a.ans.length, 371);
  const raw = findTable(a, 'Scale Description');
  const rinRows = walk(raw).filter(x => x.tagName === 'tr' && x.children.length && ['VRIN','TRIN'].includes(allText(x.children[0]).trim()));
  eq(rinRows.length, 2);
  ok(rinRows.every(r => allText(r).includes('未完整作答')));
  const rows = walk(a.__body).filter(x => x.tagName === 'tr');
  const anx = rows.find(x => allText(x.children[0]).trim() === 'ANX');
  ok(allText(anx).includes('短卷不适用'));
  eq(a.charts.length, 1);
});
test('随机填答按题抽样，每题恰选一个答案，第二次调用也覆盖旧答案', () => {
  const a = loadApp();
  const elements = [];
  for (let i = 1; i <= 20; i++) for (const value of ['T','F'])
    elements.push({type:'radio',name:'Q'+i,value,checked:false});
  const sex = {type:'radio',name:'gender',value:'M',checked:true}; elements.push(sex);
  a.__byId.select_all = { elements };
  let calls = 0;
  a.Math = Object.create(Math); a.Math.random = () => (++calls % 2 ? 0.8 : 0.2);
  for (let run = 0; run < 2; run++) {
    a.clickRandomToTOrF('select_all');
    for (let i = 0; i < 40; i += 2) eq(elements[i].checked + elements[i+1].checked, 1);
    eq(elements.slice(0,40).filter(x => x.checked && x.value === 'T').length, 10);
    eq(sex.checked, true);
  }
  eq(calls, 40);
});
test('拒绝无穷值和布尔值，不将四舍五入后的60误判为达到参考线', () => {
  for (const value of [Infinity,-Infinity,true,false,' ']) eq(CN.correctT('D',0,value),null);
  const us = CN.usTForCN('D',0,59.6);
  eq(CN.correctT('D',0,us),60);
  eq(CN.isElevatedCN('D',0,us),false);
});
test('随机PDF的13个基础量表：从记录的原始分独立核对K校正、美国T和近似T', () => {
  // 手工读取测试2.pdf第2、8、9页。没有把这当作逐题计分键的外部验证。
  const rows = {L:[11,83,68],F:[29,undefined,null],K:[21,62,63],Hs:[14,79,69],
    D:[27,68,55],Hy:[37,89,78],Pd:[29,84,81],Mf:[32,62,68],Pa:[16,72,62],
    Pt:[18,77,67],Sc:[37,105,85],Ma:[22,65,62],Si:[35,61,54]};
  for (const [key,[raw,us,cn]] of Object.entries(rows)) {
    const table = S[CN.scaleIndex(key,0)][3];
    const correctedRaw = Math.floor(raw + (table[0] || 0) * 21 + 0.5);
    eq(table[correctedRaw+1],us,key+' US');
    eq(CN.correctT(key,0,us),cn,key+' CN');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════');
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
if (fail) { console.log('失败项：\n  - ' + failures.join('\n  - ')); process.exitCode = 1; }
else console.log('全部通过 ✓');
console.log('══════════════════════════════════════\n');
