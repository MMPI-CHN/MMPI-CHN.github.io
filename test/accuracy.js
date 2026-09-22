/**
 * MMPI-2 计分准确性检验（与 run-node.js 的形式测试分开）
 * ============================================================================
 * 运行：node test/accuracy.js
 *
 * 本测试由本项目作者与 Anthropic Claude Opus 5（claude-opus-5，1M 上下文）
 * 于 2026 年 9 月讨论后共同完成。
 *
 * run-node.js 测的是"代码有没有按设计跑"（形式正确性）。
 * 本文件测的是"算出来的数对不对"（数值准确性）—— 拿已出版的数据当标尺。
 *
 * ── 计分链路与各环节的可检验性 ──────────────────────────────────────────
 *
 *   答案 → 原始分 → K校正 → 美国一致性T分(查表) → 中国常模T分(仿射变换)
 *          [L1]     [L2]        [L3]                  [L4]
 *
 *   L1 计分键：与 T 分表长度互为独立结构，二者必须一致（本文件 §1）
 *   L2 K 校正：权重为公开常数 0.5/0.4/1.0/1.0/0.2（§2）
 *   L3 查表  ：可用【三个独立已出版样本】的原始分均值 → T 分均值验证（§3）
 *              其中两个样本（香港学生、香港非学生）对本项目是样本外数据
 *   L4 仿射  ：锚点为定义式（§4）；另用《手册》表2-10 做独立来源交叉核对（§5）
 *
 *   ⚠ 无法检验的部分：中国常模的【分布形状】。我们没有任何用中国常模计分的
 *     参照数据，因此最终的中国 T 分无法与"真值"对比。链条上每一环都对得上，
 *     但形状假设本身没有外部证据。这是已知的、无法用现有资料消除的局限。
 *
 * ── 三个参照样本 ────────────────────────────────────────────────────────
 * 全部出自 Cheung, F. M., Song, W. Z., & Zhang, J. X. (1996). The Chinese MMPI-2.
 * In J. N. Butcher (Ed.), International Adaptations of the MMPI-2 (pp. 137-161).
 *   表6-1（书页143）香港大学生      男 149 / 女 184
 *   表6-2（书页144）香港非学生成人  男  40 / 女  36
 *   表6-3（书页145）PRC 全国常模    男1106 / 女1108   ← 本项目换算所用
 * 三表格式一致：原始分均值/标准差 + 按【美国】常模算出的 K 校正 T 分均值/标准差。
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
function loadGlobals() {
  const sb = { console };
  vm.createContext(sb);
  for (const f of ['my_data.js', 'mmpi_cn_norms.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'origin_js', f), 'utf8'), sb);
  }
  return sb;
}
const app = loadGlobals();
const S = app.scales;
const CN = app.MMPI_CN;

let pass = 0, fail = 0; const failures = [];
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); pass++; }
  catch (e) { console.log('  ✗ ' + name + '\n      ' + e.message); fail++; failures.push(name); }
}
function ok(c, m) { if (!c) throw new Error(m || '断言失败'); }
function eq(a, b, m) { if (a !== b) throw new Error((m || '') + ` 期望 ${b}，实际 ${a}`); }

// ── 查表（对 K 校正后的分数线性插值）─────────────────────────────────────
function lookupT(key, gender, score) {
  const idx = CN.scaleIndex(key, gender);
  if (idx === undefined) return null;
  const a = S[idx][3 + gender];
  if (!a) return null;
  const p = [];
  for (let r = 0; r + 1 < a.length; r++) { const t = a[r + 1]; if (t != null) p.push([r, t]); }
  if (!p.length) return null;
  if (score <= p[0][0]) return p[0][1];
  if (score >= p[p.length - 1][0]) return p[p.length - 1][1];
  for (let j = 1; j < p.length; j++) if (score <= p[j][0]) {
    const [x0, y0] = p[j - 1], [x1, y1] = p[j];
    return y0 + (y1 - y0) * (score - x0) / (x1 - x0);
  }
}
function kW(key) { const i = CN.scaleIndex(key, 0); const a = S[i][3]; return (a && a[0]) || 0; }
function itemCount(key, gender) {
  const i = CN.scaleIndex(key, gender);
  return S[i][1].length + S[i][2].length;
}
// 反查 T=50 对应的（K校正后）分数
function rawAtT50(key, gender) {
  const idx = CN.scaleIndex(key, gender);
  const a = S[idx][3 + gender]; const p = [];
  for (let r = 0; r + 1 < a.length; r++) { const t = a[r + 1]; if (t != null) p.push([r, t]); }
  const dec = p[p.length - 1][1] < p[0][1];
  for (let j = 1; j < p.length; j++) {
    const [x0, y0] = p[j - 1], [x1, y1] = p[j];
    if ((!dec && 50 >= y0 && 50 <= y1) || (dec && 50 <= y0 && 50 >= y1))
      return x0 + (x1 - x0) * (50 - y0) / (y1 - y0);
  }
  return null;
}

// ── 三个参照样本：[男raw均值, 男rawSD, 男T均值, 男TSD, 女raw均值, 女rawSD, 女T均值, 女TSD]
const T61 = { // 香港大学生 149/184
  L:[4.2,2.4,52.9,10.4, 4.3,2.2,53.6,10.4], F:[9.0,7.1,62.7,16.9, 8.2,5.9,64.8,16.2],
  K:[12.7,4.5,44.5,9.7, 12.3,3.9,44.1,8.5], Hs:[9.3,5.0,60.9,11.0, 10.6,4.9,60.2,9.3],
  D:[24.5,5.7,63.0,11.4, 26.2,6.0,62.3,12.7], Hy:[24.1,5.2,57.4,12.0, 24.9,5.1,56.1,11.4],
  Pd:[19.8,5.1,56.9,11.4, 18.7,4.6,55.0,10.1], Mf:[26.1,4.2,50.1,9.4, 33.2,4.4,56.8,10.6],
  Pa:[12.4,3.9,58.3,13.6, 12.4,3.9,57.5,13.7], Pt:[21.2,8.8,64.6,12.8, 21.6,8.8,62.2,11.7],
  Sc:[22.9,11.3,65.2,14.0, 22.2,10.6,63.6,12.2], Ma:[18.5,4.7,53.6,11.0, 17.8,4.4,53.8,10.1],
  Si:[33.8,9.3,59.2,10.9, 34.9,9.2,57.5,10.0], Fb:[6.3,5.7,67.5,20.1, 6.6,5.0,67.8,17.5],
  ANX:[9.7,5.0,59.9,11.6, 10.0,5.2,57.6,11.7], FRS:[6.3,3.7,58.3,12.3, 8.6,3.9,55.8,10.9],
  OBS:[8.2,3.5,60.4,11.5, 8.2,3.5,58.1,11.3], DEP:[11.8,6.1,64.1,10.6, 12.0,6.2,61.7,10.4],
  HEA:[8.7,5.6,58.4,12.1, 10.2,5.3,58.8,10.5], BIZ:[5.0,3.9,60.1,13.1, 4.9,3.5,60.5,10.7],
  ANG:[5.7,3.5,50.1,10.3, 6.4,3.3,52.3,10.8], CYN:[11.3,4.0,52.5,7.7, 10.8,3.7,53.2,7.1],
  ASP:[10.2,3.5,54.9,8.7, 9.1,3.0,57.5,8.2], TPA:[9.2,3.6,52.7,10.6, 10.1,3.5,58.5,12.1],
  LSE:[8.8,5.4,61.9,13.5, 9.1,5.1,59.0,11.9], SOD:[11.0,5.4,57.0,11.9, 10.0,5.0,55.1,10.2],
  FAM:[8.0,4.2,57.6,11.7, 8.3,4.2,55.6,11.1], WRK:[13.1,6.6,61.2,12.4, 14.1,6.5,60.1,12.2],
  TRT:[10.2,4.9,64.4,12.1, 9.9,5.0,61.9,12.0]
};
const T62 = { // 香港非学生成人 40/36
  L:[5.5,2.6,58.8,11.6, 6.4,2.4,63.4,12.1], F:[9.2,4.9,64.4,15.2, 7.9,4.4,64.5,14.8],
  K:[13.3,4.2,45.8,8.9, 13.6,5.0,46.2,12.3], Hs:[8.6,5.0,59.2,11.1, 8.5,4.5,56.0,8.9],
  D:[24.4,4.8,62.8,9.3, 26.2,5.2,62.0,10.9], Hy:[22.5,5.7,54.0,12.4, 22.3,5.7,51.5,11.0],
  Pd:[19.9,4.5,57.1,10.1, 17.4,4.9,52.4,10.7], Mf:[24.2,4.1,46.4,8.2, 31.1,3.5,61.9,8.5],
  Pa:[11.8,4.1,56.3,15.1, 11.1,3.5,53.2,12.0], Pt:[18.8,8.1,61.2,11.7, 17.2,7.4,56.2,9.9],
  Sc:[20.4,9.5,62.3,11.7, 19.1,8.9,59.9,10.4], Ma:[17.8,4.4,51.9,9.9, 16.4,4.7,50.8,10.9],
  Si:[34.0,8.1,59.4,9.5, 34.4,7.1,57.1,7.9], Fb:[6.0,4.6,66.9,18.2, 6.4,3.5,67.2,13.8],
  ANX:[8.3,4.5,56.5,10.1, 8.1,5.1,53.6,11.2], FRS:[6.2,3.6,58.1,11.4, 8.2,3.3,54.4,9.6],
  OBS:[6.6,3.5,55.2,11.2, 6.8,3.2,53.5,9.3], DEP:[10.8,5.5,62.4,9.5, 10.0,4.7,58.1,8.1],
  HEA:[8.5,5.3,57.9,12.0, 8.2,4.5,54.7,9.4], BIZ:[4.2,2.6,57.3,9.7, 4.5,3.2,58.5,11.1],
  ANG:[5.7,3.2,50.2,9.4, 6.2,3.0,51.6,9.8], CYN:[11.8,4.0,53.5,7.7, 11.5,4.6,54.7,8.8],
  ASP:[10.9,4.0,57.3,10.5, 9.1,3.5,57.8,9.7], TPA:[8.9,3.9,52.5,10.9, 8.6,3.9,53.8,12.4],
  LSE:[8.2,4.9,60.3,12.3, 8.0,3.9,56.3,8.6], SOD:[10.7,4.2,56.1,9.1, 10.3,4.0,55.4,8.1],
  FAM:[8.0,4.5,57.4,12.3, 8.3,4.0,55.5,10.2], WRK:[11.1,5.8,57.3,11.0, 11.2,5.0,54.6,8.9],
  TRT:[9.8,5.1,63.2,12.9, 9.3,3.9,60.4,9.2]
};
// 表6-3 直接从模块读（本项目换算所用的那份）
const T63 = {};
Object.keys(CN.NORM).forEach(k => {
  const n = CN.NORM[k];
  T63[k] = [n.raw[0], n.raw[1], n.tUS[0], n.tUS[1], n.raw[2], n.raw[3], n.tUS[2], n.tUS[3]];
});

console.log('\n════════ MMPI-2 计分准确性检验 ════════');

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【1】L1 计分键 ↔ T分表长度：两个独立数据结构必须一致');
// ═══════════════════════════════════════════════════════════════════════════
// T 分表的槽位数 = 可能的原始分个数 = 题数 + 1（含 0 分）。若某量表漏了或多了
// 一道题，或某张表被截断，这一条就会失败。不依赖任何外部数据。
test('T分表覆盖的最大分数不得超过物理上可能的最大分', () => {
  // 注意 T 表的索引对 K 校正量表是【校正后】的分数，上限 = 题数 + 权重×30（K 有 30 题）。
  // 另外出版表在 T 触到 120 天花板处就截断，所以只能断言"不超过"，不能断言"等于"。
  // 若某张表覆盖了物理上不可能达到的分数，说明数据被污染或错位。
  const bad = [], trunc = [];
  for (const key of Object.keys(CN.NORM)) for (const g of [0, 1]) {
    const tbl = S[CN.scaleIndex(key, g)][3 + g];
    if (!tbl || tbl.length < 5) { bad.push(key + (g ? '女' : '男') + ' 无T表'); continue; }
    const maxPossible = Math.floor(itemCount(key, g) + kW(key) * 30 + 0.5);
    const tableMax = tbl.length - 2;
    if (tableMax > maxPossible) {
      bad.push(key + (g ? '女' : '男') + ': 表覆盖到 ' + tableMax + '，但物理上限只有 ' + maxPossible);
    } else if (tableMax < maxPossible) {
      trunc.push(key + (g ? '女' : '男'));
    }
  }
  console.log('      ' + trunc.length + '/58 张表在天花板处截断（正常），0 张覆盖不可能的分数');
  ok(bad.length === 0, bad.length + ' 处越界：\n      ' + bad.join('\n      '));
});
test('13 个基础量表题数与 MMPI-2 公开值一致', () => {
  // 公开的 MMPI-2 量表题数
  const PUB = { L:15, F:60, K:30, Hs:32, D:57, Hy:60, Pd:50, Mf:56, Pa:40, Pt:48, Sc:78, Ma:46, Si:69 };
  const bad = [];
  for (const k of Object.keys(PUB)) {
    const n = itemCount(k, 0);
    if (n !== PUB[k]) bad.push(`${k}: 实际 ${n}，公开值 ${PUB[k]}`);
  }
  ok(bad.length === 0, bad.join('; '));
});
test('同一量表男女题目清单完全相同（Mf 除外）', () => {
  for (const key of Object.keys(CN.NORM)) {
    if (key === 'Mf') continue;
    eq(CN.scaleIndex(key, 0), CN.scaleIndex(key, 1), `${key} 男女应共用同一条目`);
  }
  // Mf 男女是两个条目，但题目清单应一致
  const a = [...S[10][1], ...S[10][2]].sort((x, y) => x - y).join(',');
  const b = [...S[11][1], ...S[11][2]].sort((x, y) => x - y).join(',');
  eq(a, b, 'Mf 男女条目的题目清单应相同（只有 T 分转换方向不同）');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【2】L2 K 校正权重 == 公开常数');
// ═══════════════════════════════════════════════════════════════════════════
test('Hs=0.5 · Pd=0.4 · Pt=1.0 · Sc=1.0 · Ma=0.2，其余为 0', () => {
  const W = { Hs: 0.5, Pd: 0.4, Pt: 1.0, Sc: 1.0, Ma: 0.2 };
  for (const key of Object.keys(CN.NORM)) {
    const expect = W[key] || 0;
    const actual = kW(key);
    ok(Math.abs(actual - expect) < 1e-9, `${key} K权重 期望 ${expect}，实际 ${actual}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【3】L3 查表准确性：三个已出版样本，其中两个对本项目是样本外');
// ═══════════════════════════════════════════════════════════════════════════
function checkSample(label, TBL, tolMed, tolMax) {
  const diffs = [], worst = [];
  for (const key of Object.keys(TBL)) for (const g of [0, 1]) {
    const o = g ? 4 : 0;
    const raw = TBL[key][o], book = TBL[key][o + 2];
    if (raw === undefined || book === undefined) continue;
    const kAdj = raw + kW(key) * TBL.K[o];
    const mine = lookupT(key, g, kAdj);
    if (mine === null) continue;
    const d = mine - book;
    diffs.push(Math.abs(d));
    if (Math.abs(d) > tolMax) worst.push(`${key}${g ? '女' : '男'}: 查表 ${mine.toFixed(1)} vs 书上 ${book}（差 ${d.toFixed(1)}）`);
  }
  diffs.sort((a, b) => a - b);
  const med = diffs[Math.floor(diffs.length / 2)];
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  console.log(`      ${label}：${diffs.length} 格，中位数 ${med.toFixed(2)}，均值 ${mean.toFixed(2)}，最大 ${diffs[diffs.length - 1].toFixed(2)}`);
  ok(med <= tolMed, `中位数 ${med.toFixed(2)} > ${tolMed}`);
  ok(worst.length === 0, `${worst.length} 格超出容差 ${tolMax}：\n      ` + worst.join('\n      '));
}
test('表6-3 PRC 全国常模（男1106/女1108）—— 换算所用样本', () =>
  checkSample('表6-3', T63, 1.0, 3.0));
test('表6-1 香港大学生（男149/女184）—— 样本外', () =>
  checkSample('表6-1', T61, 1.5, 4.0));
test('表6-2 香港非学生成人（男40/女36）—— 样本外', () =>
  checkSample('表6-2', T62, 1.5, 4.0));

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【4】L4 仿射变换：定义式自洽');
// ═══════════════════════════════════════════════════════════════════════════
test('仿射变换的定义式：喂入 M_T 恰好得 50（29 量表 × 2 性别）', () => {
  for (const key of Object.keys(CN.NORM)) for (const g of [0, 1]) {
    const p = CN.params(key, g);
    const v = CN.correctT(key, g, p.MT, { round: false });
    ok(Math.abs(v - 50) < 1e-9, key + (g ? '女' : '男') + ' 得 ' + v);
  }
});
test('（诊断）T_US(原始分均值) 与 M_T 之差 —— 即映射非线性的程度', () => {
  // 这两个量在数学上本不相等：raw→T 是非线性映射，故"均值处的 T 分"不等于"T 分的均值"
  // （Jensen 不等式）。表6-3 报的 M_T 是后者，仿射变换锚在后者才是对的。
  // 这个差值本身是有用的诊断量：它度量了映射在该样本取值范围上的弯曲程度。
  const rows = [];
  for (const key of Object.keys(CN.NORM)) for (const g of [0, 1]) {
    const n = CN.NORM[key], o = g ? 2 : 0;
    const kAdj = n.raw[o] + kW(key) * CN.NORM.K.raw[o];
    rows.push([key + (g ? '女' : '男'), lookupT(key, g, kAdj) - n.tUS[o]]);
  }
  const abs = rows.map(r => Math.abs(r[1])).sort((a, b) => a - b);
  const worst = rows.reduce((a, b) => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a));
  console.log('      58 格，中位数 ' + abs[29].toFixed(2) + ' T分，最大 '
              + Math.abs(worst[1]).toFixed(2) + ' @ ' + worst[0]);
  ok(Math.abs(worst[1]) <= 3.5, '最大偏差 ' + Math.abs(worst[1]).toFixed(2) + ' 超出 3.5，可能不只是非线性');
});
test('样本外合理性：两个香港样本走完整链路，中国 T 分应落在 [38,68]', () => {
  // Cheung 原文称香港与 PRC 样本的分数模式 "very similar"，故香港样本按中国常模换算后
  // 应在 50 附近，不应出现极端值。若某量表跑到 80+，说明链路某处有问题。
  const bad = [], all = [];
  for (const pair of [['表6-1 港生', T61], ['表6-2 港非学生', T62]]) {
    const label = pair[0], TBL = pair[1];
    for (const key of Object.keys(TBL)) for (const g of [0, 1]) {
      const o = g ? 4 : 0;
      const tUS = lookupT(key, g, TBL[key][o] + kW(key) * TBL.K[o]);
      const tCN = CN.correctT(key, g, tUS, { round: false });
      if (tCN === null) continue;
      all.push(tCN);
      if (tCN < 38 || tCN > 68) bad.push(label + ' ' + key + (g ? '女' : '男') + ': 中国T=' + tCN.toFixed(1));
    }
  }
  all.sort(function (a, b) { return a - b; });
  console.log('      ' + all.length + ' 格，范围 [' + all[0].toFixed(1) + ', '
              + all[all.length - 1].toFixed(1) + ']，中位数 ' + all[Math.floor(all.length / 2)].toFixed(1));
  ok(bad.length === 0, bad.length + ' 格落在合理区间外：\n      ' + bad.join('\n      '));
});
test('中国 60 分界点对应的美国 T 分 = M_T + S_T（且都落在合理区间）', () => {
  for (const key of Object.keys(CN.NORM)) for (const g of [0, 1]) {
    const p = CN.params(key, g);
    const v = CN.usTForCN(key, g, 60);
    ok(Math.abs(v - (p.MT + p.ST)) < 1e-9, `${key}${g ? '女' : '男'} 不等于 M_T+S_T`);
    ok(v > 40 && v < 110, `${key}${g ? '女' : '男'} 分界点对应美国T=${v.toFixed(1)}，超出合理区间`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【5】L4 独立来源交叉核对：《手册》表2-10 的中美均值之差');
// ═══════════════════════════════════════════════════════════════════════════
// 表2-10 出自 2021 年《MMPI-2中文简体字版使用手册》，与 Cheung 1996 是两个独立来源。
// 我们的中国原始分均值（Cheung 表6-3）减去从本项目查表反查的美国 T=50 原始分，
// 其绝对值应当等于表2-10 公布的 |中美均值之差|。这同时核对三样东西：
// 表6-3 的原始分均值、本项目的查表数据、以及 K 校正的折算方式。
const D2_10 = { L:[2.6,1.2], F:[4.8,5.3], K:[0.8,1.7], Hs:[3.4,3.6], D:[6.0,6.5],
  Hy:[1.3,1.1], Pd:[2.0,1.7], Mf:[2.4,5.9], Pa:[1.6,2.0], Pt:[4.6,4.7],
  Sc:[8.3,9.4], Ma:[0.9,0.5], Si:[6.4,7.4] };
test('13 个基础量表：|中国均值 − 美国T50原始分| ≈ 表2-10 的 Δ（容差 1.0）', () => {
  const rows = [], bad = [];
  for (const key of Object.keys(D2_10)) for (const g of [0, 1]) {
    const o = g ? 2 : 0;
    const usK = rawAtT50('K', g);
    const usRaw = rawAtT50(key, g) - kW(key) * usK;     // 折回未校正原始分
    const cnRaw = CN.NORM[key].raw[o];
    const mine = Math.abs(cnRaw - usRaw);
    const book = D2_10[key][g];
    const d = mine - book;
    rows.push([key + (g ? '女' : '男'), mine, book, d]);
    if (Math.abs(d) > 1.0) bad.push(`${key}${g ? '女' : '男'}: 我们算 ${mine.toFixed(2)} vs 手册 ${book}（差 ${d.toFixed(2)}）`);
  }
  const mean = rows.reduce((s, r) => s + Math.abs(r[3]), 0) / rows.length;
  const worst = rows.reduce((a, b) => (Math.abs(b[3]) > Math.abs(a[3]) ? b : a));
  console.log(`      26 格，平均偏差 ${mean.toFixed(2)}，最大 ${Math.abs(worst[3]).toFixed(2)} @ ${worst[0]}`);
  ok(bad.length === 0, `${bad.length} 格超出容差：\n      ` + bad.join('\n      '));
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n【6】明确记录无法检验的部分');
// ═══════════════════════════════════════════════════════════════════════════
test('（说明性）中国常模的分布形状无外部参照，故最终中国 T 分无法与真值对比', () => {
  // 这一项永远通过，作用是把局限写进测试输出，避免"全绿"被误读为"全对"。
  console.log('      · 已检验：计分键、K 权重、查表（3 个已出版样本）、仿射变换锚点、表2-10 交叉核对');
  console.log('      · 未检验：中国常模原始分的分布形状（数据未公开）');
  console.log('      · 未检验：本项目译文与正版中文简体字版的题目等价性（无法量化）');
  console.log('      · 未检验：1990 年代常模到当代的人群漂移（方向未知）');
  ok(true);
});

console.log('\n══════════════════════════════════════');
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
if (fail) { console.log('失败项：\n  - ' + failures.join('\n  - ')); process.exitCode = 1; }
else console.log('全部通过 ✓');
console.log('══════════════════════════════════════\n');
