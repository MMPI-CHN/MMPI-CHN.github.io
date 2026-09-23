/**
 * MMPI-2 中国常模换算模块
 * ============================================================================
 *
 * 本文件由本项目作者与 Anthropic Claude Opus 5（claude-opus-5，1M 上下文）
 * 于 2026 年 9 月讨论后共同完成。推导过程与证据见 docs/探索纪要.md。
 *
 * ---------------------------------------------------------------------------
 * 数据来源（已出版的样本统计量；最终换算为近似值）
 * ---------------------------------------------------------------------------
 * Cheung, F. M., Song, W. Z., & Zhang, J. X. (1996).
 *   The Chinese MMPI-2: Research and applications in Hong Kong and the
 *   People's Republic of China.
 *   In J. N. Butcher (Ed.), International Adaptations of the MMPI-2
 *   (pp. 137-161). Minneapolis: University of Minnesota Press.
 *   —— 表 6-3（书页 145）
 *
 * 该表标题为 "MMPI-2 Raw Scores and K-Corrected T Scores (Based on U.S. Norms)
 * for PRC Normal Adults"，给出 31 个量表 × 男女 的：
 *   ① 中国原始分均值与标准差
 *   ② 中国样本各人的美国常模K校正T分的均值与标准差，非“均值受测者”的T分
 *
 * 样本（书页 142 正文）：经 ICH + VRIN + TRIN 筛除后的全国常模样本，
 * 男 1106 / 女 1108，覆盖全国七大行政区，按地理分布、婚姻、教育、年龄
 * 对标全国人口统计。
 *
 * ⚠ 表 6-3 表头印的 "N = 40 / N = 36" 是印刷错误（与表 6-2 香港非学生样本
 *   重复），正文明确该表为全国常模样本。两表数据体完全不同。
 *
 * ---------------------------------------------------------------------------
 * 换算原理
 * ---------------------------------------------------------------------------
 * 若把中国常模样本放在【美国】T 分尺子上量，其均值是 M_T、标准差是 S_T
 * （二者均为表 6-3 原值）。而中国常模自身的定义要求均值 50、标准差 10。
 * 本项目据此做一次仿射近似（并非官方中国一致性T分变换）：
 *
 *     T_中国 = 50 + (T_美国 − M_T) × 10 / S_T
 *
 * 两参数直接取自已出版的样本统计量。它们不能确定中国分布形状或个人分数误差。
 *
 * 内部一致性检验（详见 docs/探索纪要.md）：对 L/F/K/Mf/Si 五个线性 T 分量表
 * （其美国标准差可从查表精确反解），"10 × 中国原始分SD / 美国原始分SD" 应当
 * 等于表 6-3 印的 S_T。10 格全部吻合，最大偏差 1.4，平均 0.44。
 *
 * 端到端检验：把表 6-3 的中国原始分均值喂进本项目的美国查表（已打勘误），
 * 复现书中印的 T 分 —— 58 格，|差| 中位数 0.60 T 分，最大 2.0，100% 在 3 以内。
 *
 * ---------------------------------------------------------------------------
 * 已知局限
 * ---------------------------------------------------------------------------
 * 1. 中国常模的【完整原始分频数分布】未公开。本模块校正了分布的位置与
 *    离散度，仍沿用美国计分变换。中国分布形状和残余误差未获验证。
 * 2. 常模采样于 1990 年代（对标 1990 年第四次全国人口普查）。本模块校正的是
 *    "1990 年代的中美差异"，不校正此后中国人群内部的变化。
 * 3. 本项目的中文译文与正版中文简体字版不同，而表 6-3 的常模是用正版译文
 *    建立的。因此结果不等同于正版 MMPI-2。
 * 4. 本模块采用表中29个量表的数据（不对VRIN/TRIN做此换算）。其余量表（Harris-Lingoes 子量表、
 *    RC 量表、PSY-5、多数附加量表）无中国常模，correctT 返回 null。
 *
 * ---------------------------------------------------------------------------
 * 区分点
 * ---------------------------------------------------------------------------
 * 《MMPI-2 中文简体字版使用手册》(张建新主编, 科学出版社, 2021) 第二章第七节：
 *   MMPI 美国 70 T ／ MMPI-2 美国 65 T ／ MMPI 与 MMPI-2 中国均为 60 T
 * 手册同时说明代价：60 T 下约 16% 的正常人被划入异常（美国 65 T 标准为 8%），
 * 并建议解释剖析图时同时参照两套标准。
 */

(function (global) {
  'use strict';

  // ==========================================================================
  // 一、量表代号 → my_data.js 中 scales 数组的下标 [男条目, 女条目]
  // ==========================================================================
  // 绝大多数量表男女共用同一条目；仅 Mf 按性别拆成两条（10=男, 11=女）。
  var SCALE_INDEX = {
    L: [3, 3], F: [0, 0], K: [4, 4], Fb: [1, 1],
    Hs: [6, 6], D: [7, 7], Hy: [8, 8], Pd: [9, 9], Mf: [10, 11],
    Pa: [12, 12], Pt: [13, 13], Sc: [14, 14], Ma: [15, 15], Si: [16, 16],
    ANX: [48, 48], FRS: [49, 49], OBS: [50, 50], DEP: [51, 51], HEA: [52, 52],
    BIZ: [53, 53], ANG: [54, 54], CYN: [55, 55], ASP: [56, 56], TPA: [57, 57],
    LSE: [58, 58], SOD: [59, 59], FAM: [60, 60], WRK: [61, 61], TRT: [62, 62]
  };

  // ==========================================================================
  // 二、Cheung/Song/Zhang (1996) 表 6-3 原值
  // ==========================================================================
  // raw:  [男均值, 男标准差, 女均值, 女标准差]   —— 中国原始分（临床量表为未经K校正）
  // tUS:  [男均值, 男标准差, 女均值, 女标准差]   —— 按美国常模算出的 K 校正 T 分
  var NORM = {
    L:   { raw: [ 6.0, 2.8,  5.8, 2.8], tUS: [60.6, 12.6, 60.9, 13.9] },
    F:   { raw: [ 9.3, 4.6,  9.0, 4.5], tUS: [64.8, 13.9, 68.3, 15.2] },
    K:   { raw: [14.1, 5.0, 13.3, 4.9], tUS: [47.3, 11.2, 45.6, 12.1] },
    Hs:  { raw: [ 8.3, 4.6,  9.5, 4.9], tUS: [56.1, 12.0, 55.3, 12.2] },
    D:   { raw: [24.3, 5.0, 26.6, 5.0], tUS: [62.8, 10.0, 63.0, 10.7] },
    Hy:  { raw: [22.2, 5.7, 23.2, 5.8], tUS: [53.2, 12.6, 52.7, 12.8] },
    Pd:  { raw: [18.6, 4.6, 17.9, 4.6], tUS: [52.5, 10.1, 51.3, 10.0] },
    Mf:  { raw: [24.4, 4.1, 30.0, 3.9], tUS: [46.9,  8.3, 64.5,  9.2] },
    Pa:  { raw: [11.7, 3.6, 12.2, 3.9], tUS: [55.9, 13.0, 57.0, 13.6] },
    Pt:  { raw: [15.8, 8.0, 17.4, 8.2], tUS: [57.2, 12.0, 55.8, 11.4] },
    Sc:  { raw: [19.5, 9.2, 20.6, 9.7], tUS: [62.7, 12.1, 62.3, 11.7] },
    Ma:  { raw: [17.8, 5.1, 16.6, 4.9], tUS: [51.0, 11.5, 49.7, 10.7] },
    Si:  { raw: [32.3, 7.3, 35.4, 7.5], tUS: [57.4,  8.6, 58.1,  8.2] },
    Fb:  { raw: [ 7.1, 4.8,  8.1, 5.2], tUS: [71.1, 19.0, 73.4, 18.9] },
    // 15 个内容量表
    ANX: { raw: [ 7.3, 4.2,  8.1, 4.5], tUS: [54.1,  9.8, 53.2,  9.9] },
    FRS: { raw: [ 7.0, 3.9, 10.7, 4.2], tUS: [60.6, 12.9, 62.0, 12.6] },
    OBS: { raw: [ 5.4, 3.6,  6.1, 3.6], tUS: [51.5, 11.8, 51.6, 10.9] },
    DEP: { raw: [ 9.6, 5.2, 10.8, 5.6], tUS: [60.4,  9.1, 59.6,  9.5] },
    HEA: { raw: [ 8.4, 4.8,  9.5, 5.0], tUS: [57.6, 11.1, 57.4, 10.3] },
    BIZ: { raw: [ 4.1, 3.6,  4.2, 3.6], tUS: [56.6, 12.7, 57.8, 11.8] },
    ANG: { raw: [ 5.9, 3.0,  6.6, 3.2], tUS: [50.8,  9.2, 52.8, 10.2] },
    CYN: { raw: [11.8, 4.2, 11.9, 4.5], tUS: [53.7,  8.4, 55.7,  8.7] },
    ASP: { raw: [ 8.8, 3.9,  8.0, 3.3], tUS: [51.7,  9.2, 54.7,  8.8] },
    TPA: { raw: [10.7, 3.5, 11.0, 3.3], tUS: [57.1, 10.8, 61.5, 12.2] },
    LSE: { raw: [ 8.6, 4.5,  9.8, 4.6], tUS: [61.4, 11.0, 60.6, 10.5] },
    SOD: { raw: [ 9.5, 4.4, 10.2, 4.6], tUS: [53.6,  9.2, 55.4,  9.4] },
    FAM: { raw: [ 7.0, 3.9,  7.4, 3.9], tUS: [54.8, 10.5, 53.1, 10.0] },
    WRK: { raw: [11.2, 5.7, 12.1, 5.8], tUS: [57.7, 10.8, 56.5, 10.7] },
    TRT: { raw: [ 9.9, 4.5, 10.4, 4.5], tUS: [63.7, 10.9, 63.1, 10.7] }
  };

  var CUTOFF_CN = 60;   // 中国 MMPI-2 区分点
  var CUTOFF_US = 65;   // 美国 MMPI-2 区分点
  var T_FLOOR   = 30;   // 本项目近似换算的显示下限
  var T_CEIL    = 120;  // 本项目近似换算的显示上限

  function params(scale, gender) {
    var n = NORM[scale];
    if (!n) return null;
    var o = gender ? 2 : 0;
    return { MT: n.tUS[o], ST: n.tUS[o + 1], rawM: n.raw[o], rawSD: n.raw[o + 1] };
  }

  /**
   * 美国常模 T 分 → 中国常模 T 分
   * @param  {string} scale   量表代号（NORM 的键，如 'F' 'Sc' 'DEP'）
   * @param  {number} gender  0 = 男, 1 = 女
   * @param  {number} tUS     本项目查表算出的（美国常模）T 分
   * @param  {object} [opts]  { clamp: true, round: true }
   * @return {number|null}    中国常模 T 分；该量表无中国常模时返回 null
   */
  function correctT(scale, gender, tUS, opts) {
    opts = opts || {};
    var p = params(scale, gender);
    if (!p) return null;
    if (typeof tUS !== 'number' || !isFinite(tUS)) return null;
    var v = 50 + (Number(tUS) - p.MT) * 10 / p.ST;
    if (opts.clamp !== false) v = Math.max(T_FLOOR, Math.min(T_CEIL, v));
    return opts.round === false ? v : Math.round(v);
  }

  /**
   * 反向：中国常模的某个 T 分，对应美国常模的多少 T 分。
   * 默认问的是中国 60 分界点 —— 这个数字很适合直接呈现给使用者：
   * "你现在看到的美国 T 分要达到 X，才相当于中国标准的 60 分界点"。
   */
  function usTForCN(scale, gender, tCN) {
    var p = params(scale, gender);
    if (!p) return null;
    if (tCN === undefined) tCN = CUTOFF_CN;
    return p.MT + (tCN - 50) * p.ST / 10;
  }

  /** 该量表在【中国常模】下是否达到 60 分界点 */
  function isElevatedCN(scale, gender, tUS) {
    var t = correctT(scale, gender, tUS, { round: false });
    return t === null ? null : t >= CUTOFF_CN;
  }

  function hasNorm(scale) {
    return Object.prototype.hasOwnProperty.call(NORM, scale);
  }

  /** 按性别返回该量表在 scales 数组中的正确下标（解决 Mf 男女分条目的问题） */
  function scaleIndex(scale, gender) {
    var p = SCALE_INDEX[scale];
    return p ? p[gender ? 1 : 0] : undefined;
  }

  global.MMPI_CN = {
    NORM: NORM,
    SCALE_INDEX: SCALE_INDEX,
    correctT: correctT,
    usTForCN: usTForCN,
    isElevatedCN: isElevatedCN,
    hasNorm: hasNorm,
    scaleIndex: scaleIndex,
    params: params,
    CUTOFF_CN: CUTOFF_CN,
    CUTOFF_US: CUTOFF_US,
    T_FLOOR: T_FLOOR,
    T_CEIL: T_CEIL,
    SOURCE: 'Cheung, Song & Zhang (1996), Table 6-3, in Butcher (Ed.), ' +
            'International Adaptations of the MMPI-2, pp. 137-161, ' +
            'Univ. of Minnesota Press'
  };

  // ==========================================================================
  // 三、美国查表勘误清单（已直接修入 my_data.js，此处留档并提供自检）
  // ==========================================================================
  // 依据：对 my_data.js 内全部 147 个量表条目（约 5000 格）做单调性与邻域线性
  // 残差扫描，用同量表异性别表 + 等差步长模式交叉定值。错误率约 0.18%，
  // 全部是人工转录的典型病征：漏位、首位数字误写、行错位、粘贴污染。
  // 格式：[scales下标, 性别, 原始分, 原错误值, 已修正为, 置信度, 依据]
  var ERRATA = [
    [14, 0, 21, 4,     41, 'high',   'Sc男: 39,[?],42 且Sc女同位=41；原值"4"系漏位'],
    [13, 0, 42, 93,    83, 'high',   'Pt男: 77,79,81,[?],85,87,89,91 严格+2；首位9/8误写'],
    [74, 0, 37, 30,    90, 'high',   'Mt男: 87,88,[?],[?],93,95；首位9/3误写'],
    [74, 0, 38, 31,    91, 'high',   'Mt男: 同上，连续两格系统性9→3误写'],
    [77, 1, 33, 87389, 88, 'high',   'PK女: 84,86,[?],90,92 严格+2；粘贴污染'],
    [15, 0, 27, 59,    68, 'medium', 'Ma男: 65,[?],72，候选68/69；疑为raw24=59行错位'],
    [67, 1, 6,  7,     72, 'medium', 'AAS女: 67,[?],78，候选72/73；漏位'],
    [56, 1, 7,  42,    52, 'medium', 'ASP女: 49,[?],54，候选51/52；疑为raw3=42行错位'],
    [63, 1, 34, 76,    78, 'medium', 'A女: 76,77,[?],80，候选78/79；疑为raw32=76行错位']
  ];

  // 存疑未修：Fp男 raw6 = 80（按 +7 等差应为 84）。Fp 仅 27 题、步长本就粗，
  // 不排除原表如此，需比对原始出版物。
  var ERRATA_UNRESOLVED = [
    { scaleIdx: 2, gender: 0, raw: 6, value: 80,
      note: 'Fp男 raw6=80, raw7=94。若按+7等差应为84/91。需核原书。' }
  ];

  /** 自检：确认 9 条勘误仍在 my_data.js 中（防止日后被覆盖回退） */
  function verifyErrata(scales) {
    var ok = [], bad = [];
    ERRATA.forEach(function (e) {
      var tbl = scales && scales[e[0]] && scales[e[0]][3 + e[1]];
      var cur = tbl ? tbl[e[2] + 1] : undefined;
      (cur === e[4] ? ok : bad).push(
        (scales[e[0]] ? scales[e[0]][0][1] : '?') + (e[1] ? '女' : '男') +
        ' raw' + e[2] + ': 期望 ' + e[4] + '，实际 ' + cur);
    });
    return { passed: ok.length, failed: bad.length, ok: ok, bad: bad };
  }

  global.MMPI_ERRATA = {
    list: ERRATA,
    unresolved: ERRATA_UNRESOLVED,
    verify: verifyErrata
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MMPI_CN: global.MMPI_CN, MMPI_ERRATA: global.MMPI_ERRATA };
  }
})(typeof window !== 'undefined' ? window : globalThis);
