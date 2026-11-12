/**
 * 阶段 0-1 算法内核：变量与溢出、循环求和、数组最值、复杂度与递归。
 * 所有轨迹均为确定性状态机；数值演示用显式的 32 位模拟（并如实告知这是模拟）。
 */

import { TraceEvent, parseInt1, parseIntArray, Validation } from '../kernel/trace';

/* ============ cpp-io-var：int 溢出演示（a + b） ============ */

export interface VarState {
  a: string; b: string;
  ai: number; bi: number;
  rawSum: number | null;      // JS 安全整数内的真实和
  intSum: number | null;      // 模拟 int32 回绕后的值
  overflow: boolean;
  done: boolean;
  message: string;
}

const INT_MIN = -2147483648, INT_MAX = 2147483647;

function toInt32(x: number): number {
  return (x | 0); // JS 位运算即按 int32 回绕
}

export function validateVarInput(raw: Record<string, string>): Validation {
  const va = parseInt1(raw.a || '', 'a', -2000000000, 2000000000);
  if (!va.ok) return va;
  const vb = parseInt1(raw.b || '', 'b', -2000000000, 2000000000);
  if (!vb.ok) return vb;
  return { ok: true, normalized: { a: va.normalized as number, b: vb.normalized as number } };
}

export function buildVarTrace(a: number, b: number): TraceEvent<VarState>[] {
  const events: TraceEvent<VarState>[] = [];
  const push = (type: string, s: Omit<VarState, never>, line: number, explain: string) => {
    events.push({ step: events.length, type, state: s, codeLine: line, explain });
  };
  const rawSum = a + b;
  const overflow = rawSum > INT_MAX || rawSum < INT_MIN;
  const intSum = toInt32(rawSum);

  push('read-a', { a: String(a), b: String(b), ai: a, bi: b, rawSum: null, intSum: null, overflow: false, done: false, message: '' }, 6,
    `cin >> a：读入 a = ${a}。int 的范围是 [${INT_MIN}, ${INT_MAX}]，本题 a 在范围内。`);
  push('read-b', { a: String(a), b: String(b), ai: a, bi: b, rawSum: null, intSum: null, overflow: false, done: false, message: '' }, 6,
    `cin >> b：读入 b = ${b}。`);
  push('add', { a: String(a), b: String(b), ai: a, bi: b, rawSum, intSum, overflow, done: false, message: '' }, 7,
    overflow
      ? `计算 a + b = ${rawSum}，超出 int 范围 → 发生回绕（有符号溢出在 C++ 中是未定义行为，x86 常见表现为按 32 位回绕）：${rawSum} - 2^32 = ${intSum}。`
      : `计算 a + b = ${rawSum}，仍在 int 范围内，安全。`);
  push('done', { a: String(a), b: String(b), ai: a, bi: b, rawSum, intSum, overflow, done: true, message: overflow ? '溢出！' : '' }, 8,
    overflow
      ? `输出 ${intSum}（错误答案！）。教训：范围可能超 int 时用 long long。`
      : `输出 ${rawSum}（正确）。`);
  return events;
}

/* ============ cpp-if-loop：循环求和（循环不变量） ============ */

export interface LoopState {
  n: number;
  i: number;
  sum: number;
  done: boolean;
}

export function validateLoopInput(raw: Record<string, string>): Validation {
  return parseInt1(raw.n || '', 'n', 1, 20);
}

export function buildLoopTrace(n: number): TraceEvent<LoopState>[] {
  const events: TraceEvent<LoopState>[] = [];
  const push = (type: string, s: LoopState, line: number, explain: string) => {
    // 不变量按事件语义区分：add 之后 sum 已含第 i 项；其余时刻 sum = 前 i-1 项之和
    const midIter = type === 'add';
    const expectSum = midIter ? (s.i * (s.i + 1)) / 2 : ((s.i - 1) * s.i) / 2;
    const label = midIter ? `循环体执行后：sum = 1+…+${s.i} = ${s.sum}` : `循环头处：sum = 1+…+${s.i - 1} = ${s.sum}（前 i-1 项，i=${s.i}）`;
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: s.done
        ? { name: '求和结果', ok: s.sum === (n * (n + 1)) / 2, detail: `sum = ${s.sum}，与公式 n(n+1)/2 = ${(n * (n + 1)) / 2} 一致` }
        : { name: '循环不变量', ok: s.sum === expectSum, detail: `${label}——不变量${s.sum === expectSum ? '成立' : '被破坏！'}：sum 恰好是"已处理项数的和"` },
    });
  };
  push('init', { n, i: 1, sum: 0, done: false }, 5, `初始化 i=1, sum=0。不变量开始成立：sum 是前 i-1 个正整数的和（i=1 时是空的和 = 0）。`);
  let i = 1, sum = 0;
  while (i <= n) {
    push('check', { n, i, sum, done: false }, 6, `检查循环条件 i(${i}) <= n(${n})：成立，进入循环体。`);
    sum += i;
    push('add', { n, i, sum, done: false }, 7, `sum += i：加上第 ${i} 个数，sum = ${sum}。不变量在循环体末尾依然成立（对新的 i+1 而言）。`);
    i++;
    push('step', { n, i, sum, done: false }, 8, `i++：i 变为 ${i}。`);
  }
  push('exit', { n, i, sum, done: false }, 6, `条件 i(${i}) > n(${n})：循环结束。`);
  push('done', { n, i, sum, done: true }, 10, `输出 sum = ${sum}。循环不变量法保证了正确性：每次迭代维护"sum = 前 i-1 个数的和"，退出时恰好完成。`);
  return events;
}

/* ============ cpp-array-string：数组求最值 + 越界反例 ============ */

export interface MaxState {
  a: number[];
  i: number;
  best: number;
  bestIdx: number;
  cmpIdx: number;
  offByOne: boolean;
  outOfBounds: boolean;   // 本步发生了越界读（演示用，读取 undefined）
  done: boolean;
}

export function validateArrayInput(raw: Record<string, string>): Validation {
  return parseIntArray(raw.a || '', 10, '数组', -999, 999);
}

export function buildMaxTrace(a: number[], offByOne: boolean): TraceEvent<MaxState>[] {
  const events: TraceEvent<MaxState>[] = [];
  const n = a.length;
  let i = offByOne ? 0 : 1;
  let best = a[0], bestIdx = 0;
  const push = (type: string, s: Omit<MaxState, never>, line: number, explain: string) => {
    events.push({ step: events.length, type, state: s, codeLine: line, explain });
  };
  push('init', { a: [...a], i, best, bestIdx, cmpIdx: -1, offByOne, outOfBounds: false, done: false }, 6,
    offByOne
      ? '⚠ 反例模式：循环写成了 for (i = 0; i <= n; i++)——条件带等号，i 会走到 n，读 a[n] 越界！'
      : `初始化 best = a[0] = ${best}。不变量：best 永远等于已扫描部分 a[0..i-1] 的最大值。`);
  for (; i < (offByOne ? n + 1 : n); i++) {
    if (i >= n) {
      push('oob', { a: [...a], i, best, bestIdx, cmpIdx: i, offByOne, outOfBounds: true, done: false }, 8,
        `i = ${i}：条件 i <= ${n} 仍然成立，读取 a[${i}] —— 数组只有下标 0..${n - 1}，这里<b>越界</b>（可视化显示为 ???）。真实 C++ 中是未定义行为，可能读到垃圾值甚至崩溃。正确写法：for (i = 1; i < n; i++)。`);
      break;
    }
    push('compare', { a: [...a], i, best, bestIdx, cmpIdx: i, offByOne, outOfBounds: false, done: false }, 8,
      `比较 a[${i}] = ${a[i]} 与当前 best = ${best}（best = a[0..${i - 1}] 的最大值）。`);
    if (a[i] > best) {
      const oldBest = best;
      best = a[i]; bestIdx = i;
      push('update', { a: [...a], i, best, bestIdx, cmpIdx: -1, offByOne, outOfBounds: false, done: false }, 9,
        `${a[i]} > ${oldBest}：更新 best = ${best}（下标 ${i}）。不变量保持：best 是 a[0..${i}] 的最大值。`);
    } else {
      push('keep', { a: [...a], i, best, bestIdx, cmpIdx: -1, offByOne, outOfBounds: false, done: false }, 8,
        `${a[i]} ≤ ${best}：不更新。不变量保持。`);
    }
  }
  push('done', { a: [...a], i, best, bestIdx, cmpIdx: -1, offByOne, outOfBounds: false, done: true }, 12,
    `结束。最大值 = ${best}，下标 = ${bestIdx}。正确性由不变量"best = a[0..i-1] 的最大值"在扫描完成时给出。`);
  return events;
}

/* ============ complexity：斐波那契 朴素递归 vs 记忆化 ============ */

export interface FibState {
  n: number;
  mode: 'naive' | 'memo';
  /** 调用栈：f(k) 自底向上 */
  stack: { k: number; phase: 'enter' | 'exit'; value?: number }[];
  calls: number;
  memo: Record<number, number>;
  result: number | null;
  lastEvent: string;
  done: boolean;
}

export function validateFibInput(raw: Record<string, string>): Validation {
  return parseInt1(raw.n || '', 'n', 1, 12);
}

export function buildFibTrace(n: number, mode: 'naive' | 'memo'): TraceEvent<FibState>[] {
  const events: TraceEvent<FibState>[] = [];
  const memo: Record<number, number> = {};
  let calls = 0;
  const stack: FibState['stack'] = [];
  let result: number | null = null;

  const push = (type: string, lastEvent: string, line: number, explain: string) => {
    events.push({
      step: events.length, type,
      state: { n, mode, stack: stack.map((s) => ({ ...s })), calls, memo: { ...memo }, result, lastEvent, done: false },
      codeLine: line, explain,
    });
  };

  function fib(k: number): number {
    calls++;
    stack.push({ k, phase: 'enter' });
    push('call', `call f(${k})`, mode === 'naive' ? 4 : 8,
      mode === 'naive'
        ? `进入 f(${k})（第 ${calls} 次函数调用）。调用树继续分叉——注意同样的 f 可能被反复计算。`
        : `进入 f(${k})（第 ${calls} 次函数调用）。`);
    if (mode === 'memo') {
      if (memo[k] !== undefined) {
        stack.pop();
        stack.push({ k, phase: 'exit', value: memo[k] });
        push('memo-hit', `memo hit f(${k})`, 9, `memo[${k}] 已有值 ${memo[k]}，直接返回——这就是记忆化省掉重复子问题的瞬间。`);
        const v = memo[k];
        stack.pop();
        push('return', `return f(${k})`, 9, `f(${k}) = ${v} 返回给上一层。`);
        return v;
      }
    }
    if (k <= 2) {
      const v = 1;
      push('base', `base f(${k})`, mode === 'naive' ? 5 : 10, `边界：f(${k}) = 1。`);
      if (mode === 'memo') memo[k] = v;
      stack.pop();
      stack.push({ k, phase: 'exit', value: v });
      push('return', `return f(${k})`, mode === 'naive' ? 5 : 12, `f(${k}) = 1 返回。`);
      return v;
    }
    const l = fib(k - 1);
    const r = fib(k - 2);
    const v = l + r;
    if (mode === 'memo') {
      memo[k] = v;
      push('memo-save', `memo save f(${k})`, 11, `计算完成：f(${k}) = f(${k - 1}) + f(${k - 2}) = ${l} + ${r} = ${v}，存入 memo。`);
    }
    stack.pop();
    stack.push({ k, phase: 'exit', value: v });
    push('return', `return f(${k})`, mode === 'naive' ? 6 : 12, `f(${k}) = ${v} 返回（递归深度 = 当前调用栈 ${stack.length} 层）。`);
    return v;
  }

  push('init', 'init', 1, `准备计算 f(${n})，模式：${mode === 'naive' ? '朴素递归' : '记忆化递归'}。观察右侧调用计数——同一输入两种模式的最终答案相同。`);
  result = fib(n);
  push('done', 'done', 14,
    `完成：f(${n}) = ${result}，共 ${calls} 次函数调用。` +
    (mode === 'naive'
      ? `朴素递归的调用次数约为 O(φⁿ)（指数级）；换成 n=${n + 4} 试试调用数会爆炸。`
      : `记忆化后每个 f(k) 只真正计算一次：O(n)。对比朴素模式（同一 n）的调用数。`));
  return events;
}
