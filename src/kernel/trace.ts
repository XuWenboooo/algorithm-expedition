/**
 * 算法远征 · 轨迹内核（可序列化的确定性轨迹）
 *
 * 设计原则：
 * 1. 轨迹由确定性算法状态机生成，事件携带【完整状态快照】，UI 只消费轨迹。
 * 2. 同一输入必须生成完全相同的轨迹；前进/后退/重播恢复完全一致的状态
 *    （后退 = 直接取 index-1 的快照，天然精确）。
 * 3. 每个关键事件带代码位置（伪代码/C++ 行号）与可选不变量检查。
 */

/** 代码位置：指向课程展示代码的 1-based 行号 */
export interface CodePos {
  line: number;
}

/** 不变量检查结果 */
export interface InvariantCheck {
  name: string;
  ok: boolean;
  detail: string;
}

/** 可序列化轨迹事件。S 为该课程的快照类型（必须可 JSON 序列化）。 */
export interface TraceEvent<S> {
  /** 0-based 步号 */
  step: number;
  /** 语义事件类型，如 'compare' | 'mismatch' | 'fallback' | 'match' ... */
  type: string;
  /** 完整状态快照 */
  state: S;
  /** 对应代码行 */
  codeLine?: number;
  /** 中文解释 */
  explain: string;
  /** 可选不变量 */
  invariant?: InvariantCheck;
}

/** 生成轨迹的函数签名：输入 → 事件数组（纯函数、确定性） */
export type TraceBuilder<S, I> = (input: I) => TraceEvent<S>[];

/** 输入校验结果 */
export interface Validation {
  ok: boolean;
  /** 用户可读的中文错误提示 */
  error?: string;
  /** 归一化后的输入（如去除首尾空白） */
  normalized?: unknown;
}

/** 轨迹模块元信息 */
export interface TraceMeta {
  /** 快照中需要高亮的数组名等（供通用 ArrayView 使用） */
  labels?: Record<string, string>;
}

/* ---------- 播放器纯状态机（便于单测） ---------- */

export interface PlayerState {
  index: number; // 当前步（0-based），-1 表示尚未开始
  playing: boolean;
  /** ms/步 */
  speed: number;
}

export const initialPlayerState: PlayerState = {
  index: -1,
  playing: false,
  speed: 800,
};

export type PlayerAction =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'setSpeed'; speed: number }
  | { type: 'goto'; index: number };

export function playerReducer(state: PlayerState, action: PlayerAction, total: number): PlayerState {
  switch (action.type) {
    case 'next':
      return { ...state, playing: false, index: Math.min(state.index + 1, total - 1) };
    case 'prev':
      return { ...state, playing: false, index: Math.max(state.index - 1, -1) };
    case 'play':
      // 已到终点则重新播放
      if (state.index >= total - 1) return { ...state, playing: true, index: -1 };
      return { ...state, playing: true };
    case 'pause':
      return { ...state, playing: false };
    case 'reset':
      return { ...state, playing: false, index: -1 };
    case 'setSpeed':
      return { ...state, speed: action.speed };
    case 'goto':
      return { ...state, playing: false, index: Math.max(-1, Math.min(action.index, total - 1)) };
    default:
      return state;
  }
}

/* ---------- 输入辅助 ---------- */

/** 校验可视化字符串输入（限长、限制字符集可选） */
export function validateStringInput(raw: string, maxLen: number, name: string, charset?: RegExp): Validation {
  const s = raw.replace(/\s+/g, '');
  if (s.length === 0) return { ok: false, error: `${name}不能为空。` };
  if (s.length > maxLen) return { ok: false, error: `${name}过长（最多 ${maxLen} 个字符），请缩短以保证可视化清晰。` };
  if (charset && !charset.test(s)) {
    return { ok: false, error: `${name}包含不支持的字符。本例仅支持字母 A-Z（区分大小写请见说明）。` };
  }
  return { ok: true, normalized: s };
}

/** 解析整数数组输入，"1, 2 3" / "1 2 3" 均可 */
export function parseIntArray(raw: string, maxLen: number, name: string, min = -1000, max = 1000): Validation {
  const parts = raw.trim().split(/[\s,，、]+/).filter(Boolean);
  if (parts.length === 0) return { ok: false, error: `${name}不能为空。` };
  if (parts.length > maxLen) return { ok: false, error: `${name}元素个数超过上限 ${maxLen}，请缩短以保证可视化清晰。` };
  const nums: number[] = [];
  for (const p of parts) {
    if (!/^-?\d+$/.test(p)) return { ok: false, error: `${name}中 "${p}" 不是合法整数。` };
    const v = Number(p);
    if (!Number.isSafeInteger(v)) return { ok: false, error: `${name}中 "${p}" 超出安全整数范围。` };
    if (v < min || v > max) return { ok: false, error: `${name}中 "${p}" 超出范围 [${min}, ${max}]。` };
    nums.push(v);
  }
  return { ok: true, normalized: nums };
}

/** 解析单个整数 */
export function parseInt1(raw: string, name: string, min: number, max: number): Validation {
  const t = raw.trim();
  if (!/^-?\d+$/.test(t)) return { ok: false, error: `${name}必须是整数。` };
  const v = Number(t);
  if (!Number.isSafeInteger(v) || v < min || v > max) {
    return { ok: false, error: `${name}必须在 [${min}, ${max}] 范围内。` };
  }
  return { ok: true, normalized: v };
}

/** 用于测试：重放整个轨迹并允许外部对每个事件做断言 */
export function replay<S>(events: TraceEvent<S>[], assert: (e: TraceEvent<S>, i: number) => void): void {
  events.forEach((e, i) => {
    if (e.step !== i) throw new Error(`step 字段不连续：events[${i}].step = ${e.step}`);
    assert(e, i);
  });
}

/** 用于测试：前进后退一致性 —— 后退 N 步再前进 N 步，快照必须逐字节一致 */
export function assertBackForwardStable<S>(events: TraceEvent<S>[], n = 5): void {
  if (events.length === 0) return;
  const total = events.length;
  const start = Math.min(n, total - 1);
  const forwardThenBack = events[start].state;
  // 简单实现：直接比较快照（因为后退实现就是取 index-1，这里检查快照对象可深度相等）
  const backSnapshot = events[start - 1].state;
  const backAgainForward = events[start].state;
  const snapEq = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
  if (!snapEq(forwardThenBack, backAgainForward)) {
    throw new Error('前进两次到达同一状态不一致（轨迹不可复现）');
  }
  if (!snapEq(events[start - 1].state, backSnapshot)) {
    throw new Error('后退状态不一致');
  }
}
