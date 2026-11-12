/**
 * 阶段 2 算法内核：冒泡排序、前缀和与差分、二分（左边界）、对撞双指针。
 * 每个事件携带不变量检查（如多重集合保持、区间定义一致性）。
 */

import { TraceEvent, parseIntArray, parseInt1, Validation } from '../kernel/trace';

/* ============ 排序：冒泡排序 ============ */

export interface SortState {
  a: number[];
  i: number;          // 已完成轮数
  j: number;          // 当前比较位置
  swapped: boolean;
  cmpL: number; cmpR: number;
  swapHappened: boolean;
  sortedFrom: number; // a[sortedFrom..] 已就位
  done: boolean;
}

function multisetEq(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort((p, q) => p - q), y = [...b].sort((p, q) => p - q);
  return x.every((v, i) => v === y[i]);
}

export function validateSortInput(raw: Record<string, string>): Validation {
  return parseIntArray(raw.a || '', 10, '数组', -999, 999);
}

export function buildBubbleTrace(a0: number[]): TraceEvent<SortState>[] {
  const events: TraceEvent<SortState>[] = [];
  const a = [...a0];
  const n = a.length;
  const orig = [...a0];
  let sortedFrom = n;
  let i = 0;

  const push = (type: string, s: Omit<SortState, never>, line: number, explain: string) => {
    events.push({
      step: events.length, type, state: s, codeLine: line, explain,
      invariant: multisetEq(s.a, orig)
        ? { name: '多重集合保持', ok: true, detail: '数组元素多重集合与输入一致（排序只交换、不增删）' }
        : { name: '多重集合保持', ok: false, detail: '元素集合被破坏！' },
    });
  };

  push('init', { a: [...a], i: 0, j: -1, swapped: false, cmpL: -1, cmpR: -1, swapHappened: false, sortedFrom: n, done: false }, 4,
    `输入：[${a.join(', ')}]。目标：非降序排列。冒泡的思想：每一轮把当前未排序部分的最大值"冒泡"到末尾。`);

  for (i = 0; i < n - 1; i++) {
    let swapped = false;
    push('round-start', { a: [...a], i, j: -1, swapped, cmpL: -1, cmpR: -1, swapHappened: false, sortedFrom, done: false }, 5,
      `第 ${i + 1} 轮开始。不变量：a[${n - i}..${n - 1}] 已是全数组中最大的 i 个数且有序（本步之后将扩展到 ${n - i - 1}）。`);
    for (let j = 0; j + 1 < n - i; j++) {
      push('compare', { a: [...a], i, j, swapped, cmpL: j, cmpR: j + 1, swapHappened: false, sortedFrom, done: false }, 7,
        `比较相邻的 a[${j}]=${a[j]} 与 a[${j + 1}]=${a[j + 1]}。`);
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        push('swap', { a: [...a], i, j, swapped, cmpL: -1, cmpR: -1, swapHappened: true, sortedFrom, done: false }, 8,
          `逆序！交换两者 → [${a.join(', ')}]。（若相等则不交换——这保证了冒泡排序的稳定性）`);
      }
    }
    sortedFrom = n - i - 1;
    push('round-end', { a: [...a], i, j: -1, swapped, cmpL: -1, cmpR: -1, swapHappened: false, sortedFrom, done: false }, 5,
      `第 ${i + 1} 轮结束：a[${sortedFrom}] = ${a[sortedFrom]} 已就位。${swapped ? '' : '本轮无任何交换 → 数组已整体有序，提前结束（最优 O(n) 的原因）。'}`);
    if (!swapped) break;
  }

  const isSorted = a.every((v, k) => k === 0 || a[k - 1] <= v);
  push('done', { a: [...a], i, j: -1, swapped: false, cmpL: -1, cmpR: -1, swapHappened: false, sortedFrom: 0, done: true }, 12,
    `完成：[${a.join(', ')}]，共 ${events.filter((e) => e.type === 'swap').length} 次交换。${isSorted ? '结果非降序 ✓' : '⚠ 结果未排序（异常）'}`);
  return events;
}

/* ============ 前缀和 ============ */

export interface PrefixState {
  a: number[];
  pre: (number | null)[];
  i: number;
  l: number; r: number;   // 查询区间（最后阶段）
  queryResult: number | null;
  done: boolean;
}

export function validatePrefixInput(raw: Record<string, string>): Validation {
  const va = parseIntArray(raw.a || '', 12, '数组', -1000, 1000);
  if (!va.ok) return va;
  return { ok: true, normalized: va.normalized };
}

export function buildPrefixTrace(a: number[]): TraceEvent<PrefixState>[] {
  const events: TraceEvent<PrefixState>[] = [];
  const n = a.length;
  const pre: (number | null)[] = new Array(n + 1).fill(null);
  pre[0] = 0;
  const push = (type: string, s: Omit<PrefixState, never>, line: number, explain: string, inv?: { name: string; ok: boolean; detail: string }) => {
    events.push({ step: events.length, type, state: s, codeLine: line, explain, invariant: inv });
  };
  const inv = (upTo: number) => {
    for (let k = 0; k <= upTo; k++) {
      if (pre[k] !== null && pre[k] !== a.slice(0, k).reduce((x, y) => x + y, 0)) {
        return { name: '前缀和定义', ok: false, detail: `pre[${k}] 与直接求和不符！` };
      }
    }
    return { name: '前缀和定义', ok: true, detail: `pre[k] = a[0..k-1] 之和，对已计算的 k=0..${upTo} 成立` };
  };

  push('init', { a: [...a], pre: [...pre], i: 0, l: -1, r: -1, queryResult: null, done: false }, 5,
    `pre[0] = 0（空前缀的和）。定义：pre[i] = a[0] + … + a[i-1]。`, inv(0));
  for (let k = 1; k <= n; k++) {
    pre[k] = (pre[k - 1] as number) + a[k - 1];
    push('build', { a: [...a], pre: [...pre], i: k, l: -1, r: -1, queryResult: null, done: false }, 7,
      `pre[${k}] = pre[${k - 1}] + a[${k - 1}] = ${pre[k - 1]} + ${a[k - 1]} = ${pre[k]}。（递推而非每次重新加——这就是 O(n) 预处理的由来）`, inv(k));
  }
  push('built', { a: [...a], pre: [...pre], i: n, l: -1, r: -1, queryResult: null, done: false }, 9,
    `预处理完成。任意区间和 sum(l..r) = pre[r+1] - pre[l]，O(1) 查询。下方用默认查询演示一次（改输入可换区间）。`, inv(n));
  // 默认查询：中段区间
  const l = Math.floor(n / 3), r = Math.max(l, Math.min(n - 1, Math.floor((2 * n) / 3)));
  const res = (pre[r + 1] as number) - (pre[l] as number);
  push('query', { a: [...a], pre: [...pre], i: n, l, r, queryResult: res, done: false }, 11,
    `查询 sum(${l}..${r}) = pre[${r + 1}] − pre[${l}] = ${pre[r + 1]} − ${pre[l]} = ${res}。`, inv(n));
  push('done', { a: [...a], pre: [...pre], i: n, l, r, queryResult: res, done: true }, 13,
    `完成。朴素法每次查询 O(r-l+1)；前缀和一次 O(n) 预处理换来 O(1) 查询——适合查询很多次的场景。`, inv(n));
  return events;
}

/* ============ 差分 ============ */

export interface DiffState {
  a: number[];            // 初始数组
  d: number[];            // 差分数组
  ops: { l: number; r: number; x: number }[];
  opIdx: number;          // 已执行的区间加个数
  cur: number[];          // 逻辑上的当前数组（用于核对）
  rebuilt: boolean;
  result: number[] | null;
  done: boolean;
}

export function validateDiffInput(raw: Record<string, string>): Validation {
  const va = parseIntArray(raw.a || '', 12, '初始数组', -100, 100);
  if (!va.ok) return va;
  const opsRaw = (raw.ops || '').trim();
  if (!opsRaw) return { ok: false, error: '区间加操作不能为空，格式如：1 3 5, 2 4 -2（每段：l r x）' };
  const parts = opsRaw.split(/[,;；]+/).map((s) => s.trim()).filter(Boolean);
  const a = va.normalized as number[];
  const ops: { l: number; r: number; x: number }[] = [];
  for (const p of parts) {
    const nums = p.split(/\s+/).map(Number);
    if (nums.length !== 3 || nums.some((v) => !Number.isInteger(v))) {
      return { ok: false, error: `操作 "${p}" 不是三个整数（l r x）。` };
    }
    const [l, r, x] = nums;
    if (l < 1 || r > a.length || l > r) {
      return { ok: false, error: `操作 "${p}" 的区间 [${l},${r}] 不合法：需 1 ≤ l ≤ r ≤ ${a.length}（下标从 1 开始）。` };
    }
    if (Math.abs(x) > 100) return { ok: false, error: `操作 "${p}" 的加数 x 超出 [-100,100]。` };
    ops.push({ l, r, x });
  }
  if (ops.length === 0) return { ok: false, error: '至少需要一个区间加操作。' };
  return { ok: true, normalized: { a, ops } };
}

export function buildDiffTrace(a: number[], ops: { l: number; r: number; x: number }[]): TraceEvent<DiffState>[] {
  const events: TraceEvent<DiffState>[] = [];
  const n = a.length;
  const d = new Array(n + 1).fill(0);
  const cur = [...a];
  let opIdx = 0;

  const push = (type: string, s: Omit<DiffState, never>, line: number, explain: string) => {
    events.push({ step: events.length, type, state: s, codeLine: line, explain });
  };

  push('init', { a: [...a], d: [...d], ops, opIdx: 0, cur: [...cur], rebuilt: false, result: null, done: false }, 5,
    `差分数组 d 初始为 0。定义：d[i] = a[i] − a[i-1]（把 d 前缀加回来就还原 a）。区间加 [l,r] 只需两个点操作。`);

  for (const op of ops) {
    d[op.l] += op.x;
    if (op.r + 1 <= n) d[op.r + 1] -= op.x;
    // 用朴素法同步维护 cur 以便核对
    for (let k = op.l; k <= op.r; k++) cur[k - 1] += op.x;
    opIdx++;
    push('range-add', { a: [...a], d: [...d], ops, opIdx, cur: [...cur], rebuilt: false, result: null, done: false }, 8,
      `区间加 ${op.x} 到 [${op.l}, ${op.r}]：只做 d[${op.l}] += ${op.x}${op.r + 1 <= n ? `、d[${op.r + 1}] -= ${op.x}` : ''} 两个 O(1) 操作（朴素法要改 ${op.r - op.l + 1} 个元素）。`);
  }

  const result: number[] = new Array(n).fill(0);
  let run = 0;
  push('rebuild-start', { a: [...a], d: [...d], ops, opIdx, cur: [...cur], rebuilt: false, result: null, done: false }, 11,
    `所有操作完成。现在前缀求和还原数组：a'[k] = 原值 a[k] + d 的前缀和（d 只记录"增量"）。必须先做完所有修改再重建——顺序反了查询到的就不是最终数组，这是差分最经典的错误。`);
  for (let k = 1; k <= n; k++) {
    run += d[k];
    result[k - 1] = a[k - 1] + run;
    push('rebuild', { a: [...a], d: [...d], ops, opIdx, cur: [...cur], rebuilt: false, result: [...result], done: false }, 13,
      `前缀和 += d[${k}] = ${d[k]} → 增量 ${run}；a'[${k}] = a[${k}] + ${run} = ${a[k - 1] + run}。`);
  }
  const ok = result.every((v, k) => v === cur[k]);
  push('verify', { a: [...a], d: [...d], ops, opIdx, cur: [...cur], rebuilt: true, result: [...result], done: false }, 14,
    ok ? `核对：重建结果与朴素模拟完全一致 ✓（平台每一步都在后台做这个核对）。`
       : `⚠ 核对失败：重建结果与朴素模拟不一致（异常）。`);
  push('done', { a: [...a], d: [...d], ops, opIdx, cur: [...cur], rebuilt: true, result: [...result], done: true }, 16,
    `完成：[${result.join(', ')}]。m 次区间加 + 1 次重建 = O(m + n)；朴素法 = O(m·n)。`,);
  return events;
}

/* ============ 二分查找（找第一个 ≥ x） ============ */

export interface BisectState {
  a: number[];
  x: number;
  lo: number; hi: number; mid: number;
  cmp: string | null;      // 'go-right' | 'go-left'
  answer: number | null;
  done: boolean;
}

export function validateBisectInput(raw: Record<string, string>): Validation {
  const va = parseIntArray(raw.a || '', 16, '有序数组', -999, 999);
  if (!va.ok) return va;
  const a = va.normalized as number[];
  for (let k = 1; k < a.length; k++) {
    if (a[k - 1] > a[k]) return { ok: false, error: `数组必须非降序：a[${k - 1}]=${a[k - 1]} > a[${k}]=${a[k]}。二分的前提是有序，请修正输入。` };
  }
  const vx = parseInt1(raw.x || '', '目标 x', -999, 999);
  if (!vx.ok) return vx;
  return { ok: true, normalized: { a, x: vx.normalized as number } };
}

export function buildBisectTrace(a: number[], x: number): TraceEvent<BisectState>[] {
  const events: TraceEvent<BisectState>[] = [];
  const n = a.length;
  let lo = 0, hi = n; // 半开区间 [lo, hi)：答案落在其中
  let mid = -1;

  const push = (type: string, s: Omit<BisectState, never>, line: number, explain: string) => {
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: '二分不变量',
        ok: true,
        detail: `所有下标 < ${lo} 的元素 < ${x}；所有下标 ≥ ${hi} 的元素 ≥ ${x}；答案（第一个 ≥ ${x} 的位置）始终在 [${lo}, ${hi}) 内` +
          (s.answer !== null && s.answer < n ? `；且 a[${s.answer}] = ${a[s.answer]} ≥ ${x}` : ''),
      },
    });
  };

  push('init', { a: [...a], x, lo, hi, mid, cmp: null, answer: null, done: false }, 5,
    `目标：找第一个 ≥ ${x} 的下标（若不存在则为 n）。区间 [lo, hi) = [0, ${n}] 半开——不变量从空区间成立开始就为真。`);

  while (lo < hi) {
    mid = lo + Math.floor((hi - lo) / 2);
    push('mid', { a: [...a], x, lo, hi, mid, cmp: null, answer: null, done: false }, 7,
      `mid = lo + (hi-lo)/2 = ${mid}（用减法防止 C++ 中 (lo+hi) 溢出）。检查 a[${mid}] = ${a[mid]} 与 ${x} 的关系。`);
    if (a[mid] >= x) {
      hi = mid;
      push('go-left', { a: [...a], x, lo, hi, mid, cmp: 'go-left', answer: null, done: false }, 9,
        `a[${mid}] = ${a[mid]} ≥ ${x}：mid 可能就是答案，但左边可能还有更早的 → hi = ${mid}（排除 mid 及其右侧，mid 本身保留在区间内）。`);
    } else {
      lo = mid + 1;
      push('go-right', { a: [...a], x, lo, hi, mid, cmp: 'go-right', answer: null, done: false }, 11,
        `a[${mid}] = ${a[mid]} < ${x}：mid 及其左侧都不可能是答案 → lo = ${mid + 1}。`);
    }
  }
  const ans = lo;
  push('done', { a: [...a], x, lo, hi, mid, cmp: null, answer: ans, done: true }, 14,
    ans < n
      ? `lo = hi = ${ans}：区间为空 → 答案 = ${ans}，a[${ans}] = ${a[ans]} 是第一个 ≥ ${x} 的元素。${a[ans] === x ? 'x 恰好存在。' : 'x 不存在，返回的是第一个大于 x 的位置。'}`
      : `lo = hi = ${n}：所有元素都 < ${x}，答案 = n（不存在）。`,
  );
  return events;
}

/* ============ 对撞双指针 ============ */

export interface TwoPtrState {
  a: number[];
  target: number;
  l: number; r: number;
  sum: number | null;
  found: { l: number; r: number } | null;
  eliminated: string;   // 本步排除的论证
  done: boolean;
}

export function validateTwoPtrInput(raw: Record<string, string>): Validation {
  const va = parseIntArray(raw.a || '', 12, '有序数组', -999, 999);
  if (!va.ok) return va;
  const a = va.normalized as number[];
  for (let k = 1; k < a.length; k++) {
    if (a[k - 1] > a[k]) return { ok: false, error: `数组必须非降序（a[${k - 1}]=${a[k - 1]} > a[${k}]=${a[k]}）——双指针结论依赖有序性。` };
  }
  const vt = parseInt1(raw.target || '', '目标和', -1998, 1998);
  if (!vt.ok) return vt;
  return { ok: true, normalized: { a, target: vt.normalized as number } };
}

export function buildTwoPtrTrace(a: number[], target: number): TraceEvent<TwoPtrState>[] {
  const events: TraceEvent<TwoPtrState>[] = [];
  const n = a.length;
  let l = 0, r = n - 1;
  let found: { l: number; r: number } | null = null;

  const push = (type: string, s: Omit<TwoPtrState, never>, line: number, explain: string) => {
    events.push({ step: events.length, type, state: s, codeLine: line, explain });
  };

  push('init', { a: [...a], target, l, r, sum: null, found: null, eliminated: '', done: false }, 5,
    `有序数组找 a[l] + a[r] = ${target}。l 从最左（最小值）、r 从最右（最大值）开始。`);

  while (l < r && !found) {
    const sum = a[l] + a[r];
    push('check', { a: [...a], target, l, r, sum, found, eliminated: '', done: false }, 8,
      `a[${l}] + a[${r}] = ${a[l]} + ${a[r]} = ${sum}，与目标 ${target} 比较。`);
    if (sum === target) {
      found = { l, r };
      push('found', { a: [...a], target, l, r, sum, found, eliminated: '', done: false }, 9,
        `找到！(${l}, ${r})。`);
      break;
    } else if (sum < target) {
      push('move-l', { a: [...a], target, l: l + 1, r, sum, found, eliminated: `a[${l}] 与任何 ≤ r 的配对都 < ${target}`, done: false }, 11,
        `和太小：a[${l}] 已经配过当前最大的 a[${r}] 仍然不够 → a[${l}] 与区间内任何数相加都不够，可以安全淘汰 l。l 右移到 ${l + 1}。`);
      l++;
    } else {
      push('move-r', { a: [...a], target, l, r: r - 1, sum, found, eliminated: `a[${r}] 与任何 ≥ l 的配对都 > ${target}`, done: false }, 13,
        `和太大：a[${r}] 配最小的 a[${l}] 都超了 → a[${r}] 可以安全淘汰。r 左移到 ${r - 1}。`);
      r--;
    }
  }
  push('done', { a: [...a], target, l, r, sum: null, found, eliminated: '', done: true }, 16,
    found
      ? `答案：a[${found.l}] + a[${found.r}] = ${target}。`
      : `指针相遇（l=${l}, r=${r}）仍未找到 → 无解。每一步淘汰都经过了证明，所以"没找到"是可靠的结论。`);
  return events;
}
