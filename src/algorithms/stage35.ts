/**
 * 阶段 3-5 算法内核：括号匹配（栈）、网格 DFS/BFS、线性探测哈希表、0/1 背包 DP。
 */

import { TraceEvent, Validation } from '../kernel/trace';

/* ============ 栈：括号匹配 ============ */

export interface BracketState {
  s: string;
  pos: number;
  stack: { ch: string; pos: number }[];
  action: string;
  errorAt: number | null;
  done: boolean;
  ok: boolean | null;
}

const OPEN = '([{';
const PAIR: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

export function validateBracketInput(raw: Record<string, string>): Validation {
  const s = (raw.s || '').replace(/\s+/g, '');
  if (s.length === 0) return { ok: false, error: '括号串不能为空。' };
  if (s.length > 24) return { ok: false, error: '长度超过 24，请缩短以便观察。' };
  if (!/^[()\[\]{}]+$/.test(s)) return { ok: false, error: '只支持三种括号字符：( ) [ ] { }。' };
  return { ok: true, normalized: s };
}

export function buildBracketTrace(s: string): TraceEvent<BracketState>[] {
  const events: TraceEvent<BracketState>[] = [];
  const stack: { ch: string; pos: number }[] = [];
  let errorAt: number | null = null;
  let ok: boolean | null = null;

  const push = (type: string, pos: number, action: string, line: number, explain: string, done = false) => {
    events.push({ step: events.length, type,
      state: { s, pos, stack: stack.map((x) => ({ ...x })), action, errorAt, done, ok },
      codeLine: line, explain,
      invariant: errorAt !== null
        ? { name: '栈内容一致性', ok: true, detail: `已出错：位置 ${errorAt} 的括号无法匹配，停止。` }
        : { name: '栈内容一致性', ok: true, detail: `栈中恰好是"尚未闭合的左括号"（当前 ${stack.length} 个），每个都等待自己的右括号` },
    });
  };

  push('init', -1, '初始化', 4, `栈空。逐字符扫描，左括号入栈，右括号找栈顶配对。`);

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (OPEN.includes(ch)) {
      stack.push({ ch, pos: i });
      push('push', i, `push ${ch}`, 7, `${ch} 是左括号：入栈等待配对（栈深 ${stack.length}）。`);
    } else {
      if (stack.length === 0) {
        errorAt = i;
        push('error-extra-close', i, `error`, 9, `${ch} 是右括号但栈为空——没有左括号与它配对，例如 "())" 的第二个 ) 或 "()]". 位置 ${i}。`, true);
        ok = false;
        push('done', i, '结束', 15, `结果：不匹配（位置 ${i} 的 ${ch} 多余）。`, true);
        return events;
      }
      const top = stack[stack.length - 1];
      if (PAIR[ch] === top.ch) {
        stack.pop();
        push('pop', i, `pop ${top.ch}${ch}`, 10, `${ch} 与栈顶 ${top.ch}（位置 ${top.pos}）配对成功：弹出（栈深 ${stack.length}）。`);
      } else {
        errorAt = i;
        push('error-mismatch', i, `error`, 12, `${ch} 期望配对 ${PAIR[ch]}，但栈顶是 ${top.ch}（位置 ${top.pos}）——交叉嵌套，如 "([)]"。`, true);
        ok = false;
        push('done', i, '结束', 15, `结果：不匹配。`, true);
        return events;
      }
    }
  }
  if (stack.length > 0) {
    ok = false;
    errorAt = stack[0].pos; // 最早未闭合的左括号
    push('done', s.length - 1, '结束', 15, `扫描结束但栈非空（剩 ${stack.map((x) => x.ch).join('')}）——左括号多余，最早未闭合处在位置 ${errorAt}，如 "((()"。结果：不匹配。`, true);
    return events;
  }
  ok = true;
  push('done', s.length - 1, '结束', 15, `扫描结束且栈空：所有括号正确闭合。结果：匹配 ✓`, true);
  return events;
}

/* ============ DFS / BFS：网格洪水填入 ============ */

export interface GridState {
  grid: string[][];            // '.' 空 '#' 墙 'o' 待淹 'x' 已淹
  rows: number; cols: number;
  mode: 'DFS' | 'BFS';
  frontier: { r: number; c: number }[];  // 栈（DFS）或队列（BFS）内容
  cur: { r: number; c: number } | null;
  visitedCount: number;
  order: number[][];           // 访问序号
  nextOrder: number;
  done: boolean;
  note: string;
}

export function validateGridInput(raw: Record<string, string>): Validation {
  const g = (raw.grid || '').trim();
  if (!g) return { ok: false, error: '网格不能为空。' };
  const rows = g.split(/\n+/).map((r) => r.replace(/\s+/g, ''));
  if (rows.length < 2 || rows.length > 6) return { ok: false, error: '行数需在 2~6 之间。' };
  const cols = rows[0].length;
  let startCount = 0;
  for (const r of rows) {
    if (r.length !== cols) return { ok: false, error: '每行长度必须一致。' };
    if (!/^[.#o]+$/.test(r)) return { ok: false, error: '每行只能包含 .（空地）、#（墙）、o（起点，恰好 1 个）。' };
    for (const ch of r) if (ch === 'o') startCount++;
  }
  if (startCount !== 1) return { ok: false, error: '需要恰好一个起点 o。' };
  if (cols < 2 || cols > 10) return { ok: false, error: '列数需在 2~10 之间。' };
  return { ok: true, normalized: rows };
}

function gridInit(rows: string[]): { grid: string[][]; start: { r: number; c: number } } {
  const grid = rows.map((r) => r.split(''));
  let start = { r: 0, c: 0 };
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 'o') { start = { r, c }; grid[r][c] = '.'; }
    }
  }
  return { grid, start };
}

export function buildGridTrace(rowsRaw: string[], mode: 'DFS' | 'BFS'): TraceEvent<GridState>[] {
  const events: TraceEvent<GridState>[] = [];
  const { grid, start } = gridInit(rowsRaw);
  const R = grid.length, C = grid[0].length;
  const order: number[][] = Array.from({ length: R }, () => new Array(C).fill(0));
  let nextOrder = 1;
  const frontier: { r: number; c: number }[] = [{ ...start }];
  const inFrontier = new Set<string>([`${start.r},${start.c}`]);
  grid[start.r][start.c] = 'o';
  order[start.r][start.c] = nextOrder++;
  let visitedCount = 1;
  let cur: { r: number; c: number } | null = null;
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  const push = (type: string, line: number, explain: string) => {
    events.push({
      step: events.length, type,
      state: {
        grid: grid.map((row) => [...row]), rows: R, cols: C, mode,
        frontier: frontier.map((f) => ({ ...f })), cur: cur ? { ...cur } : null,
        visitedCount, order: order.map((row) => [...row]), nextOrder, done: false, note: '',
      },
      codeLine: line, explain,
      invariant: {
        name: '访问标记不变量',
        ok: true,
        detail: `${mode === 'DFS' ? '栈' : '队列'}中的格子都"已标记待访问"，每个格子最多进 ${mode === 'DFS' ? '栈' : '队'}一次（当前容器大小 ${frontier.length}），保证每个格子只处理一次。`,
      },
    });
  };

  push('init', 6, `${mode === 'DFS' ? '把起点压入栈' : '把起点入队'} (${start.r}, ${start.c})。DFS 用栈（递归本质是栈），BFS 用队列——唯一区别就是容器的存取顺序。`);

  while (frontier.length > 0) {
    cur = mode === 'DFS' ? frontier.pop()! : frontier.shift()!;
    inFrontier.delete(`${cur.r},${cur.c}`);
    grid[cur.r][cur.c] = 'x';
    push(mode === 'DFS' ? 'pop' : 'dequeue', 9,
      `${mode === 'DFS' ? '弹出栈顶' : '取出队首'} (${cur.r}, ${cur.c})（访问序号 ${order[cur.r][cur.c]}）并染色为已访问 x。${mode === 'DFS' ? '栈：后进先出 → 一条路走到底。' : '队列：先进先出 → 一圈圈向外扩散（最短路性质来源）。'}`);
    for (const [dr, dc] of DIRS) {
      const nr = cur.r + dr, nc = cur.c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      if (grid[nr][nc] !== '.') continue;
      if (inFrontier.has(`${nr},${nc}`)) continue;
      frontier.push({ r: nr, c: nc });
      inFrontier.add(`${nr},${nc}`);
      grid[nr][nc] = 'o';
      order[nr][nc] = nextOrder++;
      visitedCount++;
      push('discover', 12,
        `发现相邻空地 (${nr}, ${nc})：标记为待访问 o 并${mode === 'DFS' ? '压栈' : '入队'}（第 ${order[nr][nc]} 个被发现）。`);
    }
  }
  push('done', 16, `容器空 → 连通块遍历完成，共访问 ${visitedCount} 个格子。对比两种模式：访问总数相同，但顺序不同——BFS 的序号就是无权最短距离的层次。`);
  return events;
}

/* ============ 线性探测哈希表 ============ */

export type HashOp = { kind: 'add' | 'del' | 'find'; key: number };

export interface HashState {
  m: number;
  table: (number | null)[];
  op: HashOp | null;
  h: number | null;         // 本次哈希值
  probe: number | null;     // 当前探测位置
  probeCount: number;
  shifted: boolean;         // 删除后发生了探测链修复
  message: string;
  done: boolean;
}

function parseInt1Local(raw: string, name: string, min: number, max: number): Validation {
  const t = raw.trim();
  if (!/^-?\d+$/.test(t)) return { ok: false, error: `${name}必须是整数。` };
  const v = Number(t);
  if (!Number.isSafeInteger(v) || v < min || v > max) return { ok: false, error: `${name}必须在 [${min}, ${max}] 范围内。` };
  return { ok: true, normalized: v };
}

export function validateHashInput(raw: Record<string, string>): Validation {
  const opsRaw = (raw.ops || '').trim();
  if (!opsRaw) return { ok: false, error: '操作序列不能为空，格式如：+12 +25 +5 -12 ?25' };
  const parts = opsRaw.split(/\s+/);
  const ops: HashOp[] = [];
  for (const p of parts) {
    const kind = p[0];
    const keyStr = p.slice(1);
    if (!['+', '-', '?'].includes(kind) || !/^\d{1,3}$/.test(keyStr)) {
      return { ok: false, error: `操作 "${p}" 不合法：应为 +k（插入）、-k（删除）、?k（查找），k 为 0~999。` };
    }
    const key = Number(keyStr);
    if (key > 999) return { ok: false, error: `键 ${key} 超出 0~999。` };
    ops.push({ kind: kind === '+' ? 'add' : kind === '-' ? 'del' : 'find', key });
  }
  if (ops.length === 0) return { ok: false, error: '至少需要 1 个操作。' };
  if (ops.length > 10) return { ok: false, error: '操作数上限 10（保证可视化清晰）。' };
  const vm = parseInt1Local(raw.m || '8', '表长 m', 5, 13);
  if (!vm.ok) return vm;
  return { ok: true, normalized: { ops, m: vm.normalized as number } };
}

export function buildHashTrace(ops: HashOp[], m: number): TraceEvent<HashState>[] {
  const events: TraceEvent<HashState>[] = [];
  const table: (number | null)[] = new Array(m).fill(null);

  const push = (type: string, s: Omit<HashState, never>, line: number, explain: string, midRepair = false) => {
    if (midRepair) {
      // 删除/搬移的中间态：探测链暂时断裂是算法的固有阶段，不变量声明推迟到修复完成
      events.push({
        step: events.length, type, state: s, codeLine: line, explain,
        invariant: { name: '探测链完整性', ok: true, detail: '（修复进行中：此中间态允许探测链暂时截断，"del-done" 事件将声明完整不变量）' },
      });
      return;
    }
    // 核心不变量：对表中每个键 k，从 h(k) 到其所在槽的探测链上没有空槽
    // （这是"遇空即停"查询正确的充要条件；删除修复就是为了让它保持成立）
    let invOk = true;
    let badKey = -1;
    for (let idx = 0; idx < s.table.length; idx++) {
      const k = s.table[idx];
      if (k === null) continue;
      let p = k % s.m;
      let reachable = false;
      for (let step = 0; step < s.m; step++) {
        if (s.table[p] === null) break;
        if (p === idx) { reachable = true; break; }
        p = (p + 1) % s.m;
      }
      if (!reachable) { invOk = false; badKey = k; break; }
    }
    events.push({
      step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: '探测链完整性',
        ok: invOk,
        detail: invOk
          ? '每个在表中的键，从 h(k) 到其所在槽的路径上都没有空槽 —— "遇空即停"的查询能找到所有存在的键'
          : `键 ${badKey} 的探测链被空槽截断，"遇空即停"将查不到它（删除后必须修复！）。若看到此条说明存在 bug。`,
      },
    });
  };

  push('init', { m, table: [...table], op: null, h: null, probe: null, probeCount: 0, shifted: false, message: '', done: false }, 4,
    `表长 m = ${m}（演示取素数可减少冲突，但线性探测对任何 m 都正确）。哈希函数 h(k) = k % m。`);

  for (const op of ops) {
    const h = op.key % m;
    if (op.kind === 'add') {
      push('hash', { m, table: [...table], op, h, probe: h, probeCount: 0, shifted: false, message: '', done: false }, 7,
        `插入 ${op.key}：h(${op.key}) = ${op.key} % ${m} = ${h}。哈希表是集合语义：先沿探测链查重，再找空槽插入。`);
      // 第一遍：查重（遇空即停——不存在则链上必然无重复）
      let probe = h, count = 0, exists = -1;
      while (table[probe] !== null && count < m) {
        if (table[probe] === op.key) { exists = probe; break; }
        count++;
        probe = (probe + 1) % m;
      }
      if (exists >= 0) {
        push('exists', { m, table: [...table], op, h, probe: exists, probeCount: count, shifted: false, message: '已存在', done: false }, 8,
          `沿探测链在槽 ${exists} 发现 ${op.key} 已存在：集合不允许重复键，跳过本次插入（表中每个键至多占一个槽）。`);
        continue;
      }
      // 第二遍：从自然位置找第一个空槽（统计冲突次数）
      probe = h;
      count = 0;
      while (table[probe] !== null) {
        count++;
        push('collision', { m, table: [...table], op, h, probe, probeCount: count, shifted: false, message: '', done: false }, 9,
          `槽 ${probe} 已被 ${table[probe]} 占用（第 ${count} 次冲突）：线性探测 → 试下一个槽 (probe+1) % m。`);
        probe = (probe + 1) % m;
        if (count >= m) break;
      }
      if (count >= m) {
        push('full', { m, table: [...table], op, h, probe, probeCount: count, shifted: false, message: '表满', done: false }, 9,
          `绕表一周无空槽：表满，插入失败（真实场景应扩容 rehash）。`);
        continue;
      }
      table[probe] = op.key;
      push('insert', { m, table: [...table], op, h, probe, probeCount: count, shifted: false, message: '', done: false }, 11,
        `放入槽 ${probe}。${count > 0 ? `探测链长度 ${count + 1}——插入沿链走，查询也要走同样的链。` : '无冲突，直接放入。'}`);
    } else if (op.kind === 'del') {
      let probe = h;
      let count = 0;
      let found = -1;
      push('hash', { m, table: [...table], op, h, probe, probeCount: 0, shifted: false, message: '', done: false }, 14,
        `删除 ${op.key}：先按插入同样的探测链查找，起点 h(${op.key}) = ${h}。`);
      while (table[probe] !== null && count < m) {
        if (table[probe] === op.key) { found = probe; break; }
        count++;
        push('probe', { m, table: [...table], op, h, probe, probeCount: count, shifted: false, message: '', done: false }, 16,
          `槽 ${probe} 是 ${table[probe]} ≠ ${op.key}：继续探测下一个槽。`);
        probe = (probe + 1) % m;
      }
      if (found < 0) {
        push('notfound', { m, table: [...table], op, h, probe, probeCount: count, shifted: false, message: '不存在', done: false }, 16,
          count >= m ? `绕表一整圈仍未找到 → ${op.key} 不在表中（表满时的兜底终止）。` : `遇到空槽 → ${op.key} 不在表中，无需删除。`);
        continue;
      }
      table[found] = null;
      push('remove', { m, table: [...table], op, h, probe: found, probeCount: count, shifted: false, message: '', done: false }, 18,
        `在槽 ${found} 找到并置空。但还没完！直接留空会截断探测链——后面与 ${op.key} 同链的键将查不到，必须修复。`, true);
      // 探测链修复（标准"空洞右移"法，不使用墓碑标记）：
      // 从 found 右侧的连续簇开始扫描；若键 k 的自然位置 hk 到空洞的距离 < hk 到 k 当前位置的距离，
      // 说明 k 的探测链会先落入空洞 → k 查不到 → 必须搬到空洞；空洞随之右移到 k 原位置。
      let hole = found;
      let j = (found + 1) % m;
      let shiftedAny = false;
      while (table[j] !== null) {
        const k = table[j] as number;
        const hk = k % m;
        const dHole = (hole - hk + m) % m;
        const dJ = (j - hk + m) % m;
        if (dHole < dJ) {
          table[hole] = k;
          table[j] = null;
          shiftedAny = true;
          push('shift', { m, table: [...table], op, h, probe: j, probeCount: count, shifted: true, message: '', done: false }, 21,
            `修复：键 ${k}（自然位置 ${hk}）到空洞 ${hole} 的距离 ${dHole} < 到当前位置 ${j} 的距离 ${dJ}——它的探测链会先落入空洞，若不搬移将"查无此键"。把它从槽 ${j} 搬到槽 ${hole}，空洞右移到 ${j}。`, true);
          hole = j;
        }
        j = (j + 1) % m;
        if (j === hole) break; // 环形安全阀
      }
      push('del-done', { m, table: [...table], op, h, probe: hole, probeCount: count, shifted: shiftedAny, message: '', done: false }, 23,
        shiftedAny
          ? `删除完成，探测链已修复（空洞最终停在槽 ${hole}）。本例不使用墓碑标记：靠搬移保证"遇空即停"的查询仍然正确。`
          : `删除完成：其后紧邻的元素探测链都不经过空洞（无需搬移）。`);
    } else {
      let probe = h;
      let count = 0;
      let found = -1;
      push('hash', { m, table: [...table], op, h, probe, probeCount: 0, shifted: false, message: '', done: false }, 26,
        `查找 ${op.key}：起点 h(${op.key}) = ${h}。`);
      while (table[probe] !== null && count < m) {
        if (table[probe] === op.key) { found = probe; break; }
        count++;
        push('probe', { m, table: [...table], op, h, probe, probeCount: count, shifted: false, message: '', done: false }, 28,
          `槽 ${probe} 是 ${table[probe]} ≠ ${op.key}：继续探测。`);
        probe = (probe + 1) % m;
      }
      push('find-done', { m, table: [...table], op, h, probe: found >= 0 ? found : probe, probeCount: count, shifted: false, message: found >= 0 ? '找到' : '不存在', done: false }, 30,
        found >= 0
          ? `${op.key} 在槽 ${found}（探测 ${count + 1} 次）。`
          : count >= m
            ? `绕表一整圈 → ${op.key} 不在表中（表满兜底）。`
            : `遇到空槽 → ${op.key} 不在表中（遇空即停之所以正确，是因为删除时修复了探测链）。`);
    }
  }
  push('done', { m, table: [...table], op: null, h: null, probe: null, probeCount: 0, shifted: false, message: '', done: true }, 32,
    `全部操作完成。装填因子 = ${table.filter((x) => x !== null).length}/${m}。线性探测的痛点是"聚集"——连成片的槽会越撞越长。`);
  return events;
}

/* ============ 0/1 背包 DP ============ */

export interface KnapsackItem { w: number; v: number }

export interface DpState {
  items: KnapsackItem[];
  W: number;
  dp: number[][];        // (n+1) x (W+1) 或一维 [[...]]
  i: number; c: number;  // 当前填到 (i, c)
  mode: '2d' | '1d-correct' | '1d-wrong';
  note: string;
  itemUsedTwice: boolean;
  done: boolean;
  answer: number | null;
}

export function validateKnapsackInput(raw: Record<string, string>): Validation {
  const itemsRaw = (raw.items || '').trim();
  if (!itemsRaw) return { ok: false, error: '物品不能为空，格式如：2:3, 3:4, 4:5（重量:价值）' };
  const parts = itemsRaw.split(/[,，;；]+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 6) return { ok: false, error: '物品数上限 6（保证表格可读）。' };
  const items: KnapsackItem[] = [];
  for (const p of parts) {
    const mm = p.match(/^(\d{1,2})\s*[:：]\s*(\d{1,4})$/);
    if (!mm) return { ok: false, error: `物品 "${p}" 不是"重量:价值"格式（如 3:4）。` };
    const w = Number(mm[1]), v = Number(mm[2]);
    if (w < 1 || w > 30) return { ok: false, error: `物品 "${p}" 重量需在 1~30。` };
    if (v < 0 || v > 999) return { ok: false, error: `物品 "${p}" 价值需在 0~999。` };
    items.push({ w, v });
  }
  const vw = parseInt1Local(raw.W || '10', '容量 W', 1, 20);
  if (!vw.ok) return vw;
  return { ok: true, normalized: { items, W: vw.normalized as number } };
}

export function buildKnapsackTrace(items: KnapsackItem[], W: number, mode: '2d' | '1d-correct' | '1d-wrong'): TraceEvent<DpState>[] {
  const events: TraceEvent<DpState>[] = [];
  const n = items.length;
  let dp: number[][] = [];
  let itemUsedTwice = false;

  if (mode === '2d') {
    dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  } else {
    dp = [new Array(W + 1).fill(0)]; // 一维：只有一行
  }

  const push = (type: string, s: Omit<DpState, never>, line: number, explain: string) => {
    events.push({ step: events.length, type, state: s, codeLine: line, explain });
  };

  const itemStr = items.map((it) => `(w=${it.w},v=${it.v})`).join(' ');

  if (mode === '2d') {
    push('init', { items, W, dp: dp.map((r) => [...r]), i: 0, c: 0, mode, note: '', itemUsedTwice: false, done: false, answer: null }, 6,
      `二维定义：dp[i][c] = 只考虑前 i 件物品、容量 c 时的最大价值。dp[0][*] = 0（没有物品可选）。输入：${itemStr}，W=${W}。`);
    for (let i = 1; i <= n; i++) {
      const { w, v } = items[i - 1];
      for (let c = 0; c <= W; c++) {
        const notTake = dp[i - 1][c];
        const take = c >= w ? dp[i - 1][c - w] + v : -1;
        dp[i][c] = Math.max(notTake, take < 0 ? notTake : take);
        push('fill', { items, W, dp: dp.map((r) => [...r]), i, c, mode, note: '', itemUsedTwice: false, done: false, answer: null }, 9,
          `dp[${i}][${c}] = max(不选: dp[${i - 1}][${c}]=${notTake}${c >= w ? `, 选: dp[${i - 1}][${c - w}]+${v}=${dp[i - 1][c - w] + v}` : `，选: 容量不足(w=${w})`}) = ${dp[i][c]}。注意"选"只依赖上一行——这是滚动数组能成立的原因。`);
      }
    }
    push('done', { items, W, dp: dp.map((r) => [...r]), i: n, c: W, mode, note: '', itemUsedTwice: false, done: true, answer: dp[n][W] }, 12,
      `答案 dp[${n}][${W}] = ${dp[n][W]}。时间 O(n·W)，空间 O(n·W)（可滚动到 O(W)）。`);
    return events;
  }

  // 一维滚动
  const one = new Array(W + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const { w, v } = items[i - 1];
    if (mode === '1d-correct') {
      for (let c = W; c >= w; c--) {
        const old = one[c];
        one[c] = Math.max(one[c], one[c - w] + v);
        push('fill', { items, W, dp: [[...one]], i, c, mode, note: '', itemUsedTwice: false, done: false, answer: null }, 16,
          `倒序 c=${c}：f[${c}] = max(f[${c}]=${old}, f[${c - w}]+${v}=${one[c - w] + v}) = ${one[c]}。倒序保证 f[c-w] 还是"上一行"的值（物品 ${i} 没被用过）。`);
      }
    } else {
      const prevRow = [...one]; // 进入物品 i 前的快照（= 上一行语义）
      for (let c = w; c <= W; c++) {
        const old = one[c];
        one[c] = Math.max(one[c], one[c - w] + v);
        // 精确检测：f[c-w] 若在本轮已被更新过（≠ 上一行同格值），用它转移 = 物品 i 被重复选取
        const reused = one[c - w] !== prevRow[c - w];
        if (reused) itemUsedTwice = true;
        push('fill', { items, W, dp: [[...one]], i, c, mode, note: reused ? `⚠ f[${c}] 用到了 f[${c - w}]，而 f[${c - w}] 本轮已被更新过（≠ 上一行值 ${prevRow[c - w]}）：物品 ${i} 被重复选取！` : '', itemUsedTwice, done: false, answer: null }, 20,
          `正序 c=${c}：f[${c}] = max(f[${c}]=${old}, f[${c - w}]+${v}=${one[c - w] + v}) = ${one[c]}。${reused ? '⚠ 注意 f[c-w] 已经是"本轮"更新过的值——物品 ' + i + ' 在这一件物品内被重复选取！' : '（f[c-w] 本轮尚未被更新，本次转移合规）'}`);
      }
    }
  }
  const correctAnswer = (() => {
    const d2 = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
    for (let i = 1; i <= n; i++) {
      for (let c = 0; c <= W; c++) {
        d2[i][c] = d2[i - 1][c];
        if (c >= items[i - 1].w) d2[i][c] = Math.max(d2[i][c], d2[i - 1][c - items[i - 1].w] + items[i - 1].v);
      }
    }
    return d2[n][W];
  })();
  push('done', { items, W, dp: [[...one]], i: n, c: W, mode, note: '', itemUsedTwice, done: true, answer: one[W] }, 23,
    mode === '1d-correct'
      ? `答案 f[W] = ${one[W]}，与二维版本一致 ✓。空间 O(W)。`
      : `得到 f[W] = ${one[W]}，但正确答案是 ${correctAnswer}——正序遍历允许同一物品重复选取，算出的其实是"完全背包"。0/1 背包必须倒序！`);
  return events;
}
