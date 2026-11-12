/**
 * 第三批算法内核：回溯剪枝（N 皇后）、区间调度贪心、离散化。
 */

import { TraceEvent, Validation, parseInt1 } from '../kernel/trace';

/* ============ N 皇后（回溯 + 剪枝） ============ */

export interface NqueensState {
  n: number;
  /** 每行的皇后列（0-based；-1 = 未放） */
  board: number[];
  row: number;          // 当前正在决策的行
  tryingCol: number;    // 本步尝试的列（-1 = 无）
  conflictWith: number | null;  // 与哪一行的皇后冲突
  placed: number;
  backtracks: number;
  pruned: number;       // 被剪掉的分支数（冲突检测直接跳过）
  solutions: number[][]; // 已找到的完整解
  done: boolean;
}

export function validateNqueensInput(raw: Record<string, string>): Validation {
  return parseInt1(raw.n || '4', 'n', 1, 6);
}

export function buildNqueensTrace(n: number): TraceEvent<NqueensState>[] {
  const events: TraceEvent<NqueensState>[] = [];
  const board: number[] = new Array(n).fill(-1);
  let backtracks = 0;
  let pruned = 0;
  const solutions: number[][] = [];

  const conflicts = (row: number, col: number): number | null => {
    for (let r = 0; r < row; r++) {
      if (board[r] === col) return r;                       // 同列
      if (Math.abs(board[r] - col) === row - r) return r;   // 对角线
    }
    return null;
  };

  const push = (type: string, s: Omit<NqueensState, never>, line: number, explain: string) => {
    // 不变量：已放置的皇后两两不攻击（逐对核验）
    let invOk = true;
    const placedRows: number[] = [];
    for (let r = 0; r < n; r++) if (s.board[r] >= 0) placedRows.push(r);
    for (let a = 0; a < placedRows.length && invOk; a++) {
      for (let b = a + 1; b < placedRows.length && invOk; b++) {
        const ra = placedRows[a], rb = placedRows[b];
        const ca = s.board[ra], cb = s.board[rb];
        if (ca === cb || Math.abs(ca - cb) === Math.abs(ra - rb)) invOk = false;
      }
    }
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: '互不攻击',
        ok: invOk,
        detail: invOk ? `已放置的 ${s.placed} 个皇后两两不同列、不同对角线` : `已放置皇后存在互相攻击（异常）！`,
      },
    });
  };

  push('init', { n, board: [...board], row: 0, tryingCol: -1, conflictWith: null, placed: 0, backtracks: 0, pruned: 0, solutions: [], done: false }, 5,
    `目标：在 ${n}×${n} 棋盘上放 ${n} 个皇后使互不攻击。逐行决策——每行恰放一个（行本身已保证不同行）。`);

  const solve = (row: number) => {
    if (row === n) {
      solutions.push([...board]);
      push('solution', { n, board: [...board], row, tryingCol: -1, conflictWith: null, placed: n, backtracks, pruned, solutions: solutions.map((s) => [...s]), done: false }, 14,
        `找到一个完整解！[${board.join(', ')}]（第 r 行放第 board[r] 列）。继续回溯寻找下一个解。`);
      return;
    }
    for (let col = 0; col < n; col++) {
      const conf = conflicts(row, col);
      push('try', { n, board: [...board], row, tryingCol: col, conflictWith: conf, placed: row, backtracks, pruned, solutions: solutions.map((s) => [...s]), done: false }, 8,
        conf === null
          ? `尝试在第 ${row} 行第 ${col} 列放皇后：与已放置的 ${row} 个皇后都不冲突 → 可以放。`
          : `尝试第 ${row} 行第 ${col} 列：与第 ${conf} 行的皇后（列 ${board[conf]}）冲突 → 剪枝，跳过整棵子树（不需要继续往下试）。`);
      if (conf !== null) { pruned++; continue; }
      board[row] = col;
      push('place', { n, board: [...board], row, tryingCol: col, conflictWith: null, placed: row + 1, backtracks, pruned, solutions: solutions.map((s) => [...s]), done: false }, 10,
        `放置成功：board[${row}] = ${col}。递归处理下一行。`);
      solve(row + 1);
      board[row] = -1;
      push('backtrack', { n, board: [...board], row, tryingCol: -1, conflictWith: null, placed: row, backtracks: backtracks + 1, pruned, solutions: solutions.map((s) => [...s]), done: false }, 12,
        `第 ${row} 行后续所有列都试完（或都被剪枝）→ 撤销本行皇后，回溯到第 ${row - 1} 行换列。`);
      backtracks++;
    }
  };
  solve(0);

  push('done', { n, board: [...board], row: n, tryingCol: -1, conflictWith: null, placed: 0, backtracks, pruned, solutions: solutions.map((s) => [...s]), done: true }, 16,
    `完成：${n} 皇后共 ${solutions.length} 个解，剪枝跳过 ${pruned} 次尝试。朴素枚举要试 ${Math.pow(n, n)} 种放法，回溯 + 剪枝只探索了可行分支。`);
  return events;
}

/** N 皇后解数（位运算暴力基线） */
export function nqueensCount(n: number): number {
  let count = 0;
  const cols = new Set<number>();
  const d1 = new Set<number>(); // row - col
  const d2 = new Set<number>(); // row + col
  const rec = (row: number) => {
    if (row === n) { count++; return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(row - c) || d2.has(row + c)) continue;
      cols.add(c); d1.add(row - c); d2.add(row + c);
      rec(row + 1);
      cols.delete(c); d1.delete(row - c); d2.delete(row + c);
    }
  };
  rec(0);
  return count;
}

/* ============ 区间调度贪心（按右端点） ============ */

export interface Segment {
  id: number;
  l: number;
  r: number;
}

export interface GreedyState {
  intervals: Segment[];
  sorted: Segment[];
  idx: number;
  lastEnd: number | null;
  chosen: number[];     // 选中的区间 id
  rejected: number[];
  reason: string;
  done: boolean;
}

export function validateGreedyInput(raw: Record<string, string>): Validation {
  const s = (raw.intervals || '').trim();
  if (!s) return { ok: false, error: '区间不能为空，格式如：1 3, 2 4, 3 5, 6 8（每段 l r，整数）' };
  const parts = s.split(/[,;；]+/).map((x) => x.trim()).filter(Boolean);
  if (parts.length > 10) return { ok: false, error: '区间数上限 10。' };
  const intervals: Segment[] = [];
  for (let i = 0; i < parts.length; i++) {
    const m = parts[i].match(/^(\d+)\s+(\d+)$/);
    if (!m) return { ok: false, error: `区间 "${parts[i]}" 不是"l r"两个非负整数。` };
    const l = Number(m[1]), r = Number(m[2]);
    if (l > r) return { ok: false, error: `区间 "${parts[i]}" 的 l > r。` };
    if (r > 99) return { ok: false, error: `区间 "${parts[i]}" 右端点超过 99。` };
    intervals.push({ id: i + 1, l, r });
  }
  return { ok: true, normalized: intervals };
}

export function buildGreedyTrace(intervals: Segment[]): TraceEvent<GreedyState>[] {
  const events: TraceEvent<GreedyState>[] = [];
  const sorted = [...intervals].sort((a, b) => a.r - b.r || a.l - b.l);
  const chosen: number[] = [];
  const rejected: number[] = [];
  let lastEnd: number | null = null;
  let idx = 0;

  const push = (type: string, s: Omit<GreedyState, never>, line: number, explain: string) => {
    // 不变量：已选区间互不重叠（逐对核验）
    let invOk = true;
    const sel = sorted.filter((x) => s.chosen.includes(x.id)).sort((a, b) => a.r - b.r);
    for (let k = 1; k < sel.length && invOk; k++) {
      if (sel[k].l < sel[k - 1].r) invOk = false;
    }
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: '互不重叠',
        ok: invOk,
        detail: invOk ? `已选 ${s.chosen.length} 个区间两两不重叠（按右端点顺序检查相邻对）` : `已选区间存在重叠（异常）！`,
      },
    });
  };

  push('init', { intervals: [...intervals], sorted: [...sorted], idx: 0, lastEnd: null, chosen: [], rejected: [], reason: '', done: false }, 5,
    `输入 ${intervals.length} 个区间。按<b>右端点</b>排序：[${sorted.map((x) => `#${x.id}[${x.l},${x.r}]`).join(' ')}]。为什么按右端点？留给最早结束的机会——交换论证保证不漏最优。`);

  for (const seg of sorted) {
    idx++;
    if (lastEnd === null || seg.l >= lastEnd) {
      const prevEnd = lastEnd;
      chosen.push(seg.id);
      lastEnd = seg.r;
      push('choose', { intervals: [...intervals], sorted: [...sorted], idx, lastEnd, chosen: [...chosen], rejected: [...rejected], reason: '', done: false }, 9,
        prevEnd === null
          ? `#${seg.id} [${seg.l}, ${seg.r}]：第一个区间，直接选入（当前占用到 ${seg.r}）。`
          : `#${seg.id} [${seg.l}, ${seg.r}]：起点 ${seg.l} ≥ 上一个选中区间的终点 ${prevEnd} → 选入（当前占用到 ${seg.r}）。`);
    } else {
      rejected.push(seg.id);
      push('skip', { intervals: [...intervals], sorted: [...sorted], idx, lastEnd, chosen: [...chosen], rejected: [...rejected], reason: `与已选区间重叠`, done: false }, 11,
        `#${seg.id} [${seg.l}, ${seg.r}]：起点 ${seg.l} < 当前占用终点 ${lastEnd} → 跳过。贪心论证：它的右端点不早于已选区间的右端点，替换不会更优。`);
    }
  }
  const greedyCount = chosen.length;
  push('done', { intervals: [...intervals], sorted: [...sorted], idx, lastEnd, chosen: [...chosen], rejected: [...rejected], reason: '', done: true }, 14,
    `完成：选中 ${greedyCount} 个区间 [${chosen.join(', ')}]。交换论证：若最优解不选"最早结束"的区间，把它的第一个区间换成该区间只会更早结束、不会更差——归纳得贪心最优。`);
  return events;
}

/** 区间调度暴力基线：最大不重叠子集 */
export function maxNonOverlap(intervals: Segment[]): number {
  const sorted = [...intervals].sort((a, b) => a.r - b.r);
  let count = 0, lastEnd = -1;
  for (const s of sorted) {
    if (s.l >= lastEnd) { count++; lastEnd = s.r; }
  }
  return count;
}

/** 完全独立的暴力基线：枚举所有子集，逐对检查两两不重叠 */
export function bruteMax(intervals: Segment[]): number {
  let best = 0;
  const n = intervals.length;
  for (let mask = 0; mask < (1 << n); mask++) {
    const sel: Segment[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) sel.push(intervals[i]);
    let ok = true;
    for (let a = 0; a < sel.length && ok; a++) {
      for (let b = a + 1; b < sel.length && ok; b++) {
        if (!(sel[a].l >= sel[b].r || sel[b].l >= sel[a].r)) ok = false;
      }
    }
    if (ok) best = Math.max(best, sel.length);
  }
  return best;
}

/* ============ 离散化 ============ */

export interface DiscreteState {
  raw: number[];
  sortedUnique: number[];
  i: number;
  mapped: (number | null)[];
  done: boolean;
}

export function validateDiscreteInput(raw: Record<string, string>): Validation {
  return parseInt1(raw.maxVal || '1000000', '值域上界', 100, 2000000000);
}

export function buildDiscreteTrace(rawVals: number[], maxVal: number): TraceEvent<DiscreteState>[] {
  const events: TraceEvent<DiscreteState>[] = [];
  const sortedUnique = [...new Set(rawVals)].sort((a, b) => a - b);
  const mapped: (number | null)[] = new Array(rawVals.length).fill(null);

  const push = (type: string, s: Omit<DiscreteState, never>, line: number, explain: string) => {
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: '保序映射',
        ok: true,
        detail: '排序+去重的候选表建立后：原值的相对大小关系在映射下保持（排名即新下标）',
      },
    });
  };

  push('why', { raw: [...rawVals], sortedUnique: [...sortedUnique], i: 0, mapped: [...mapped], done: false }, 4,
    `原始值域 [0, ${maxVal}]（最大 ${maxVal.toLocaleString('zh-CN')}）——开这么大的数组会爆内存。但真正出现的值只有 ${sortedUnique.length} 种：把"值"映射成"排名"即可。`);

  push('sorted-unique', { raw: [...rawVals], sortedUnique: [...sortedUnique], i: 0, mapped: [...mapped], done: false }, 7,
    `排序 + 去重得到候选表：[${sortedUnique.join(', ')}]。查询值 v 的排名 = 候选表中第一个 ≥ v 的位置（lower_bound）。`);

  for (let i = 0; i < rawVals.length; i++) {
    // lower_bound 模拟
    let lo = 0, hi = sortedUnique.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedUnique[mid] < rawVals[i]) lo = mid + 1; else hi = mid;
    }
    mapped[i] = lo;
    push('map', { raw: [...rawVals], sortedUnique: [...sortedUnique], i, mapped: [...mapped], done: false }, 12,
      `raw[${i}] = ${rawVals[i]} → 二分查找候选表 → 排名 ${lo}（即离散化后的下标）。原值的相对顺序全部保留。`);
  }
  push('done', { raw: [...rawVals], sortedUnique: [...sortedUnique], i: rawVals.length, mapped: [...mapped], done: true }, 15,
    `完成：[${rawVals.join(', ')}] → [${mapped.map((x) => (x === null ? '?' : x)).join(', ')}]。之后所有"以值为下标"的数据结构都可以开 ${sortedUnique.length} 大小。注意：离散化后失去的是"绝对值差"信息（如 a-b=1 的关系不再可直接读出）。`);
  return events;
}
