/**
 * KMP —— 金标准模块。
 *
 * 定义约定（本项目采用）：pi[i] = 模式串 p[0..i] 的【最长相等真前后缀】长度。
 * （部分教材称之为 next 数组且下标偏移不同；界面出现 "next" 时均指本定义。）
 *
 * 轨迹是真实算法状态机的执行记录：
 * - 阶段一 build：构造 pi 表（展示比较、延长、连续回退、置零）。
 * - 阶段二 match：主串匹配（主串 i 永不回退；j 回退 = 模式串右滑）。
 * 每个事件携带完整快照，事件间用不变量校验（构造阶段暴力验证 pi 前缀性质，
 * 匹配阶段验证 p[0..j-1] === t[align..i-1]）。
 */

import { TraceEvent, Validation } from '../kernel/trace';

/* ============ 阶段一：构造前缀表 ============ */

export interface KmpBuildState {
  phase: 'build';
  p: string;
  /** pi 数组当前值（未计算的格显示 null） */
  pi: (number | null)[];
  /** 下一个要计算的下标 i */
  i: number;
  /** 当前候选答案：p[0..j-1] 是 p[0..i-1] 的真前后缀（也是当前比较的左指针） */
  j: number;
  /** 本步高亮：比较左下标（模式串内 p[j]）与右下标（p[i]）；无比较则 -1 */
  cmpL: number;
  cmpR: number;
  /** 刚被赋值的 pi 下标；-1 表示本步无赋值 */
  assigned: number;
  done: boolean;
}

export type KmpBuildEvent = TraceEvent<KmpBuildState>;

/** KMP 本体计算 pi（与下方可视化轨迹同一状态机；piNaive 仅作对拍基线） */
export function piKmp(p: string): number[] {
  const m = p.length;
  const pi = new Array<number>(m).fill(0);
  for (let i = 1; i < m; i++) {
    let j = pi[i - 1];
    while (j > 0 && p[i] !== p[j]) j = pi[j - 1];
    if (p[i] === p[j]) j++;
    pi[i] = j;
  }
  return pi;
}

/** 暴力计算 pi（对拍基线）：pi[i] = 最大的 k ≤ i 使 p[0..k-1] == p[i-k+1..i] */
export function piNaive(p: string): number[] {
  const m = p.length;
  const pi = new Array<number>(m).fill(0);
  for (let i = 1; i < m; i++) {
    for (let k = i; k >= 1; k--) {
      let eq = true;
      for (let a = 0; a < k; a++) {
        if (p[a] !== p[i - k + 1 + a]) { eq = false; break; }
      }
      if (eq) { pi[i] = k; break; }
    }
  }
  return pi;
}

/** 构造轨迹（教学版，事件粒度：loop-start / compare / extend / fallback / zero / done） */
export function buildKmpBuildTrace(pRaw: string): KmpBuildEvent[] {
  const p = pRaw;
  const m = p.length;
  const events: KmpBuildEvent[] = [];
  const pi: (number | null)[] = new Array(m).fill(null);

  const checkPiPrefix = (upTo: number): { name: string; ok: boolean; detail: string } => {
    const ref = piNaive(p);
    for (let k = 0; k <= upTo && k < m; k++) {
      if (pi[k] !== null && pi[k] !== ref[k]) {
        return { name: 'pi 前缀正确性', ok: false, detail: `pi[${k}]=${pi[k]} 与暴力值 ${ref[k]} 不符！` };
      }
    }
    return { name: 'pi 前缀正确性', ok: true, detail: `已计算的 pi[0..${Math.min(upTo, m - 1)}] 均与暴力定义一致` };
  };

  const push = (type: string, state: Omit<KmpBuildState, 'phase'>, codeLine: number, explain: string, inv?: boolean) => {
    events.push({
      step: events.length,
      type,
      state: { phase: 'build', ...state },
      codeLine,
      explain,
      invariant: inv === false ? undefined : checkPiPrefix(state.assigned >= 0 ? state.assigned : state.i - 1),
    });
  };

  // 代码行号（对应界面展示的 buildPi 代码）
  const L = { forLoop: 5, jInit: 6, while: 7, fallback: 7, ifEq: 8, extend: 8, assign: 9, done: 11 };

  if (m === 0) {
    push('done', { p, pi, i: 0, j: 0, cmpL: -1, cmpR: -1, assigned: -1, done: true }, L.done, '空模式串：pi 表为空。');
    return events;
  }

  pi[0] = 0;
  push('init', { p, pi: [...pi], i: 1, j: 0, cmpL: -1, cmpR: -1, assigned: 0, done: false }, L.assign,
    'pi[0] = 0：单个字符没有"真"前后缀（真前后缀不能取整个字符串），所以答案一定是 0。');

  let i = 1, j = 0;
  while (i < m) {
    // loop-start：j = pi[i-1]
    j = pi[i - 1] as number;
    push('loop-start', { p, pi: [...pi], i, j, cmpL: -1, cmpR: i, assigned: -1, done: false }, L.jInit,
      `开始计算 pi[${i}]：由已知的 pi[${i - 1}] = ${pi[i - 1]} 出发（答案不会从零开始猜，这就是 KMP 复用旧信息的核心）。`);

    // while (j > 0 && p[i] != p[j]) j = pi[j-1];
    while (true) {
      if (j > 0) {
        push('compare', { p, pi: [...pi], i, j, cmpL: j, cmpR: i, assigned: -1, done: false }, L.while,
          `比较 p[${i}]='${p[i]}' 与 p[${j}]='${p[j]}'。当前候选：p[0..${j - 1}] 既是 p[0..${i - 1}] 的真前缀也是真后缀。`);
        if (p[i] !== p[j]) {
          const oldJ = j;
          j = pi[j - 1] as number;
          push('fallback', { p, pi: [...pi], i, j, cmpL: -1, cmpR: i, assigned: -1, done: false }, L.fallback,
            `失配且 j=${oldJ} > 0：候选缩短为 pi[${oldJ - 1}] = ${j}。这个更短的候选是唯一可能仍成立的真前后缀（已由 pi 表保证），不必从头试。`);
          continue;
        }
        // 匹配成功：j++ 且 pi[i] = j
        j = j + 1;
        pi[i] = j;
        push('extend', { p, pi: [...pi], i, j, cmpL: -1, cmpR: -1, assigned: i, done: false }, L.extend,
          `相等！真前后缀可以延长一格：pi[${i}] = ${j}，然后 i 前进。`);
        i++;
        break;
      } else {
        // j == 0：比较 p[i] 与 p[0]
        push('compare', { p, pi: [...pi], i, j: 0, cmpL: 0, cmpR: i, assigned: -1, done: false }, L.ifEq,
          `候选已缩到 0：比较 p[${i}]='${p[i]}' 与 p[0]='${p[0]}'。`);
        if (p[i] === p[0]) {
          j = 1;
          pi[i] = 1;
          push('extend', { p, pi: [...pi], i, j, cmpL: -1, cmpR: -1, assigned: i, done: false }, L.extend,
            `相等！pi[${i}] = 1。`);
        } else {
          pi[i] = 0;
          push('zero', { p, pi: [...pi], i, j: 0, cmpL: -1, cmpR: -1, assigned: i, done: false }, L.assign,
            `不等且没有更短候选：pi[${i}] = 0（p[${i}] 与开头就对不上）。`);
        }
        i++;
        break;
      }
    }
  }

  push('done', { p, pi: [...pi], i: m, j, cmpL: -1, cmpR: -1, assigned: -1, done: true }, L.done,
    `构造完成。pi = [${pi.join(', ')}]。每格最多回退 O(log m) 次均摊，总时间 O(m)。`);
  return events;
}

export function validateKmpInput(raw: string): Validation {
  const s = raw.replace(/\s+/g, '');
  if (s.length === 0) return { ok: false, error: '输入不能为空。' };
  if (!/^[A-Za-z0-9]+$/.test(s)) return { ok: false, error: '仅支持英文字母和数字（避免空格/中文等字符影响可视化对齐）。' };
  if (s.length > 40) return { ok: false, error: '长度超过 40，可视化会失去可读性，请缩短。' };
  return { ok: true, normalized: s };
}

/* ============ 阶段二：主串匹配 ============ */

export interface KmpMatchState {
  phase: 'match';
  t: string;
  p: string;
  pi: number[];
  /** 主串指针（永不回退） */
  i: number;
  /** 模式串已匹配长度 == 下一待比较下标 */
  j: number;
  /** 本步比较位置：t 中的下标、p 中的下标；无比较则 -1 */
  cmpT: number;
  cmpP: number;
  /** 模式串当前对齐起点 = i - j（滑动视角） */
  align: number;
  /** 上一次回退：{from, to}；用于展示滑动量 */
  lastFallback: { from: number; to: number } | null;
  /** 已找到的出现位置 */
  matches: number[];
  done: boolean;
}

export type KmpMatchEvent = TraceEvent<KmpMatchState>;

/** 朴素匹配（对拍基线） */
export function searchNaive(t: string, p: string): number[] {
  const res: number[] = [];
  if (p.length === 0) return res;
  for (let s = 0; s + p.length <= t.length; s++) {
    let eq = true;
    for (let a = 0; a < p.length; a++) {
      if (t[s + a] !== p[a]) { eq = false; break; }
    }
    if (eq) res.push(s);
  }
  return res;
}

export function buildKmpMatchTrace(tRaw: string, pRaw: string, pi?: number[]): KmpMatchEvent[] {
  const t = tRaw, p = pRaw;
  const n = t.length, m = p.length;
  const table = pi !== undefined ? pi.slice() : piKmp(p);
  const events: KmpMatchEvent[] = [];

  const inv = (s: { i: number; j: number }): { name: string; ok: boolean; detail: string } => {
    const align = s.i - s.j;
    if (s.j === 0) {
      return { name: '对齐不变量', ok: true, detail: 'j=0：模式串开头对齐在主串 i 处，尚无已匹配前缀。' };
    }
    const okPrefix = Array.from({ length: s.j }, (_, a) => p[a]).join('') ===
      Array.from({ length: s.j }, (_, a) => t[align + a]).join('');
    return {
      name: '对齐不变量',
      ok: okPrefix,
      detail: okPrefix
        ? `p[0..${s.j - 1}] === t[${align}..${s.i - 1}]（已匹配部分完全一致；j 同时就是已匹配长度）`
        : `不变量被破坏！p[0..${s.j - 1}] !== t[${align}..${s.i - 1}]`,
    };
  };

  const push = (type: string, s: Omit<KmpMatchState, 'phase' | 'align'>, codeLine: number, explain: string) => {
    events.push({
      step: events.length,
      type,
      state: { phase: 'match', ...s, align: s.i - s.j },
      codeLine,
      explain,
      invariant: inv(s),
    });
  };

  // 代码行号（对应界面展示的 kmpSearch 代码）
  const L = { forLoop: 8, while: 9, fallback: 9, ifEq: 10, advance: 10, advanceI: 11, fullMatch: 12, report: 13, nextJ: 14, done: 17 };

  if (m === 0) {
    push('done', { t, p, pi: table, i: 0, j: 0, cmpT: -1, cmpP: -1, lastFallback: null, matches: [], done: true },
      L.done, '空模式串：本实现约定不进行匹配（C++ 代码同样直接返回空）。');
    return events;
  }

  push('init', { t, p, pi: table, i: 0, j: 0, cmpT: -1, cmpP: -1, lastFallback: null, matches: [], done: false },
    L.forLoop, `初始化 i=0（主串指针，只前进不回退），j=0（模式串已匹配长度，也是下一待比较下标）。`);

  let i = 0, j = 0;
  const matches: number[] = [];
  while (i < n) {
    if (j > 0) {
      push('compare', { t, p, pi: table, i, j, cmpT: i, cmpP: j, lastFallback: null, matches: [...matches], done: false },
        L.while, `比较 t[${i}]='${t[i]}' 与 p[${j}]='${p[j]}'（模式串窗口起点 align = i - j = ${i - j}）。`);
      if (t[i] !== p[j]) {
        const oldJ = j;
        j = table[j - 1] as number;
        push('fallback', { t, p, pi: table, i, j, cmpT: -1, cmpP: -1, lastFallback: { from: oldJ, to: j }, matches: [...matches], done: false },
          L.fallback, `失配：主串 i=${i} 不动，j 从 ${oldJ} 回退到 pi[${oldJ - 1}]=${j}；等效于模式串整体右滑 ${oldJ - j} 格（对齐起点 ${i - oldJ} → ${i - j}）。`);
        continue;
      }
      i++; j++;
      if (j === m) {
        matches.push(i - m);
        const newJ = table[m - 1] as number;
        push('full-match', { t, p, pi: table, i, j: newJ, cmpT: -1, cmpP: -1, lastFallback: { from: m, to: newJ }, matches: [...matches], done: false },
          L.fullMatch, `完整匹配！出现位置 = i - m = ${i - m}。记录后令 j = pi[m-1] = ${newJ}，继续寻找下一个出现（模式串右滑 ${m - newJ} 格）。`);
        continue;
      }
      push('advance', { t, p, pi: table, i, j, cmpT: -1, cmpP: -1, lastFallback: null, matches: [...matches], done: false },
        L.advance, `相等：i 与 j 同时 +1（模式串窗口起点 align = i - j 不变，窗口向右扩展一格）。`);
      continue;
    } else {
      push('compare', { t, p, pi: table, i, j: 0, cmpT: i, cmpP: 0, lastFallback: null, matches: [...matches], done: false },
        L.ifEq, `j=0：比较 t[${i}]='${t[i]}' 与 p[0]='${p[0]}'。`);
      if (t[i] === p[0]) {
        i++; j++;
        if (j === m) {
          matches.push(i - m);
          const newJ0 = table[m - 1] as number;
          push('full-match', { t, p, pi: table, i, j: newJ0, cmpT: -1, cmpP: -1, lastFallback: { from: m, to: newJ0 }, matches: [...matches], done: false },
            L.fullMatch, `完整匹配！出现位置 = i - m = ${i - m}。记录后令 j = pi[m-1] = ${newJ0}，继续寻找下一个出现。`);
          continue;
        }
        push('advance', { t, p, pi: table, i, j, cmpT: -1, cmpP: -1, lastFallback: null, matches: [...matches], done: false },
          L.advance, `相等：j 变为 1，模式串头部进入匹配。`);
      } else {
        i++;
        push('advance-i', { t, p, pi: table, i, j: 0, cmpT: -1, cmpP: -1, lastFallback: null, matches: [...matches], done: false },
          L.advanceI, `不等且 j=0：主串 i 前进一格（模式串没进入匹配，只能整体右移一格）。`);
      }
    }
  }

  push('done', { t, p, pi: table, i, j, cmpT: -1, cmpP: -1, lastFallback: null, matches: [...matches], done: true },
    L.done, matches.length
      ? `搜索结束：共 ${matches.length} 处出现：[${matches.join(', ')}]。主串 i 从未回退，时间 O(n + m)。`
      : `搜索结束：模式串未在主串中出现。主串 i 从未回退，时间 O(n + m)。`);
  return events;
}

export function validateKmpMatchInput(tRaw: string, pRaw: string): Validation {
  const vt = validateKmpInput(tRaw);
  if (!vt.ok) return { ok: false, error: `主串：${vt.error}` };
  const vp = validateKmpInput(pRaw);
  if (!vp.ok) return { ok: false, error: `模式串：${vp.error}` };
  const t = vt.normalized as string, p = vp.normalized as string;
  if (p.length > t.length) return { ok: false, error: '模式串比主串还长，不可能出现匹配；请交换或缩短模式串。' };
  return { ok: true, normalized: { t, p } };
}

/** KMP 结果（供测试与练习校验） */
export function kmpSolve(t: string, p: string): { pi: number[]; occurrences: number[] } {
  return { pi: piNaive(p), occurrences: searchNaive(t, p) };
}
