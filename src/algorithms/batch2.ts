/**
 * 第二批算法内核：并查集（路径压缩+按大小合并）、堆（上浮/下沉）、拓扑排序（Kahn）、LIS。
 * 同样原则：确定性状态机、完整快照、每步不变量核验。
 */

import { TraceEvent, Validation, parseIntArray } from '../kernel/trace';

/* ============ 并查集 ============ */

export type DsuOp = { kind: 'union' | 'find'; a: number; b: number };

export interface DsuState {
  n: number;
  fa: number[];       // fa[i] = i 的父节点（根指向自身）
  size: number[];     // 按大小合并
  op: DsuOp | null;
  /** 当前 find 链：从 x 到根的路径（用于路径压缩可视化） */
  findPath: number[];
  /** 本步是否发生了路径压缩 */
  compressed: boolean;
  /** 合并时比较的两个根 */
  rootsCompared: [number, number] | null;
  result: string;
  done: boolean;
}

function parseInt1Local(raw: string, name: string, min: number, max: number): Validation {
  const t = raw.trim();
  if (!/^-?\d+$/.test(t)) return { ok: false, error: `${name}必须是整数。` };
  const v = Number(t);
  if (!Number.isSafeInteger(v) || v < min || v > max) return { ok: false, error: `${name}必须在 [${min}, ${max}] 范围内。` };
  return { ok: true, normalized: v };
}

export function validateDsuInput(raw: Record<string, string>): Validation {
  const opsRaw = (raw.ops || '').trim();
  if (!opsRaw) return { ok: false, error: '操作序列不能为空，格式如：+1 2 ?3 4 +3 4 ?1 4（每条操作 2 个 token：+a b 或 ?a b）' };
  const parts = opsRaw.split(/\s+/);
  if (parts.length % 2 !== 0) return { ok: false, error: '操作序列的 token 数应为偶数（每条操作：+a b 或 ?a b）。' };
  const ops: DsuOp[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const t0 = parts[i], t1 = parts[i + 1];
    const kind = t0[0];
    const a = Number(t0.slice(1)), b = Number(t1);
    if ((kind !== '+' && kind !== '?') || !/^\d+$/.test(t0.slice(1)) || !/^\d+$/.test(t1)) {
      return { ok: false, error: `操作 "${t0} ${t1}" 不合法：应为 +a b（合并）或 ?a b（查询），a、b 为整数。` };
    }
    ops.push({ kind: kind === '+' ? 'union' : 'find', a, b });
  }
  if (ops.length === 0) return { ok: false, error: '至少需要 1 个操作。' };
  if (ops.length > 12) return { ok: false, error: '操作数上限 12（保证可视化清晰）。' };
  const vn = parseInt1Local(raw.n || '8', '节点数 n', 2, 12);
  if (!vn.ok) return vn;
  const n = vn.normalized as number;
  for (const op of ops) {
    if (op.a < 1 || op.a > n || op.b < 1 || op.b > n) {
      return { ok: false, error: `操作包含超出 [1, ${n}] 的节点编号。` };
    }
  }
  return { ok: true, normalized: { ops, n } };
}

export function buildDsuTrace(ops: DsuOp[], n: number): TraceEvent<DsuState>[] {
  const events: TraceEvent<DsuState>[] = [];
  const fa: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  const size: number[] = new Array(n + 1).fill(1);

  const push = (type: string, s: Omit<DsuState, never>, line: number, explain: string) => {
    // 不变量：森林无环（沿 fa 走必到根）且每棵树根唯一
    let invOk = true;
    for (let i = 1; i <= n && invOk; i++) {
      let r = i, hops = 0;
      while (fa[r] !== r) { r = fa[r]; if (++hops > n) { invOk = false; break; } }
    }
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: '森林结构',
        ok: invOk,
        detail: invOk
          ? `fa 构成森林（无环）；每个节点的根唯一 —— find(x) 沿 fa 必达其集合的唯一代表元`
          : `fa 出现环（异常）！`,
      },
    });
  };

  push('init', { n, fa: [...fa], size: [...size], op: null, findPath: [], compressed: false, rootsCompared: null, result: '', done: false }, 5,
    `初始：n=${n} 个节点各自成集（fa[i]=i，size=1）。查询/合并都从"找根"开始。`);

  for (const op of ops) {
    if (op.kind === 'union') {
      // 先展示两次 find
      const pathA: number[] = [];
      let r1 = op.a;
      while (fa[r1] !== r1) { pathA.push(r1); r1 = fa[r1]; }
      pathA.push(r1);
      push('find-a', { n, fa: [...fa], size: [...size], op, findPath: [...pathA], compressed: pathA.length > 1, rootsCompared: null, result: '', done: false }, 8,
        `合并 ${op.a} 与 ${op.b}：先找 ${op.a} 的根。沿 fa 向上：[${pathA.join(' → ')}]。${pathA.length > 1 ? '（路径压缩将在 find 结束时把这些节点直接挂到根）' : '（它已是根）'}`);
      for (const node of pathA) fa[node] = r1;

      const pathB: number[] = [];
      let r2 = op.b;
      while (fa[r2] !== r2) { pathB.push(r2); r2 = fa[r2]; }
      pathB.push(r2);
      push('find-b', { n, fa: [...fa], size: [...size], op, findPath: [...pathB], compressed: pathB.length > 1, rootsCompared: null, result: '', done: false }, 8,
        `再找 ${op.b} 的根：[${pathB.join(' → ')}]。`);

      if (r1 === r2) {
        push('same-root', { n, fa: [...fa], size: [...size], op, findPath: [], compressed: false, rootsCompared: [r1, r2], result: `已在同一集合（根 ${r1}）`, done: false }, 11,
          `两根相同（${r1}）：已在同一集合，合并会引入环，跳过。这正是"合并前先查根"防环的意义。`);
      } else {
        const aFirst = size[r1] >= size[r2];
        const big = aFirst ? r1 : r2, small = aFirst ? r2 : r1;
        fa[small] = big;
        size[big] += size[small];
        push('union', { n, fa: [...fa], size: [...size], op, findPath: [], compressed: false, rootsCompared: [r1, r2], result: `根 ${small} 挂到 ${big}`, done: false }, 13,
          `按大小合并：size[${r1}]=${aFirst ? size[r1] : size[big] - size[small]} ≥ size[${r2}]=${aFirst ? size[big] - size[small] : size[r2]} → 小树根 ${small} 挂到大树根 ${big} 下（挂反会让树变高）。合并后集合大小 = ${size[big]}。`);
      }
    } else {
      const path: number[] = [];
      let r = op.a;
      while (fa[r] !== r) { path.push(r); r = fa[r]; }
      path.push(r);
      const wasCompressed = path.length > 1;
      for (const node of path) fa[node] = r;
      const pathB: number[] = [];
      let r2 = op.b;
      while (fa[r2] !== r2) { pathB.push(r2); r2 = fa[r2]; }
      pathB.push(r2);
      for (const node of pathB) fa[node] = r2;
      push('find', { n, fa: [...fa], size: [...size], op, findPath: [...path], compressed: wasCompressed, rootsCompared: [r, r2], result: r === r2 ? `同集合（根 ${r}）` : `不同集合（根 ${r} 与 ${r2}）`, done: false }, 16,
        `查询 ${op.a} 与 ${op.b} 是否同集合：${op.a} 的根 = ${r}${wasCompressed ? `（路径 [${path.join(' → ')}] 已压缩）` : ''}，${op.b} 的根 = ${r2}。${r === r2 ? '根相同 → 同集合 ✓' : '根不同 → 不在同一集合 ✗'}。`);
    }
  }
  push('done', { n, fa: [...fa], size: [...size], op: null, findPath: [], compressed: false, rootsCompared: null, result: '', done: true }, 19,
    `完成。均摊复杂度：路径压缩 + 按大小合并 → 单次操作均摊 O(α(n))（α 为反阿克曼函数，实践中近似常数）。`);
  return events;
}

/** 独立模型：朴素分组（对拍基线） */
export function dsuNaive(ops: DsuOp[], n: number): { same: boolean[]; groups: number } {
  const comp = new Map<number, number>();
  const groupOf = new Map<number, number>();
  let nextGroup = 0;
  for (let i = 1; i <= n; i++) { comp.set(i, i); groupOf.set(i, nextGroup++); }
  const same: boolean[] = [];
  for (const op of ops) {
    if (op.kind === 'union') {
      const g1 = groupOf.get(op.a)!, g2 = groupOf.get(op.b)!;
      if (g1 !== g2) {
        for (const [node, g] of groupOf) if (g === g2) groupOf.set(node, g1);
      }
    } else {
      same.push(groupOf.get(op.a) === groupOf.get(op.b));
    }
  }
  // 组数
  const gs = new Set<number>();
  for (let i = 1; i <= n; i++) gs.add(groupOf.get(i)!);
  return { same, groups: gs.size };
}

/* ============ 堆（小根堆） ============ */

export type HeapOp = { kind: 'push' | 'pop'; key: number };

export interface HeapState {
  heap: number[];
  op: HeapOp | null;
  activeIdx: number;      // 当前操作位置（上浮/下沉中的节点）
  cmpIdx: number;         // 与之比较的父/子
  phase: string;          // swim / sink / swap / none
  result: string;
  done: boolean;
}

export function validateHeapInput(raw: Record<string, string>): Validation {
  const opsRaw = (raw.ops || '').trim();
  if (!opsRaw) return { ok: false, error: '操作序列不能为空，格式如：+5 +3 +8 -1（+k 插入，-1 弹出最小）' };
  const parts = opsRaw.split(/\s+/);
  const ops: HeapOp[] = [];
  for (const p of parts) {
    const kind = p[0];
    if (kind !== '+' && kind !== '-') return { ok: false, error: `操作 "${p}" 不合法：+k 插入 或 -1 弹出最小。` };
    if (kind === '+') {
      if (!/^\d{1,3}$/.test(p.slice(1))) return { ok: false, error: `操作 "${p}" 的键必须是 0~999 整数。` };
      ops.push({ kind: 'push', key: Number(p.slice(1)) });
    } else {
      if (p !== '-1') return { ok: false, error: `弹出操作写作 "-1"（- 表示弹出最小）。` };
      ops.push({ kind: 'pop', key: 0 });
    }
  }
  if (ops.length === 0) return { ok: false, error: '至少需要 1 个操作。' };
  if (ops.length > 12) return { ok: false, error: '操作数上限 12。' };
  if (ops.filter((o) => o.kind === 'push').length > 9) return { ok: false, error: '插入总数上限 9（数组形态可视化更清晰）。' };
  return { ok: true, normalized: ops };
}

export function buildHeapTrace(ops: HeapOp[]): TraceEvent<HeapState>[] {
  const events: TraceEvent<HeapState>[] = [];
  const heap: number[] = [0]; // 1-based：heap[0] 为占位；heap[i] 的父是 heap[i>>1]，左右子是 heap[2i]、heap[2i+1]

  const push = (type: string, s: Omit<HeapState, never>, line: number, explain: string, midAdjust = false) => {
    const MID_ADJUST = new Set(['place', 'compare', 'swap', 'replace-top']);
    if (midAdjust || MID_ADJUST.has(type)) {
      // place/compare/swap 是上浮/下沉的中间态：堆性质暂时破坏是算法固有阶段，
      // 完整声明推迟到 push-done/sink-done 事件
      events.push({
        step: events.length, type, state: s, codeLine: line, explain,
        invariant: { name: '堆性质', ok: true, detail: '（调整进行中：此中间态允许暂未满足堆序，调整完成事件将声明完整堆性质）' },
      });
      return;
    }
    let ok = true;
    for (let i = 2; i < heap.length; i++) {
      if (heap[i >> 1] > heap[i]) { ok = false; break; }
    }
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: '堆性质',
        ok,
        detail: ok
          ? '任意父节点 ≤ 其子节点（小根堆）；且数组前 size 项构成完全二叉树'
          : `堆性质被破坏（异常）：位置 ${heap.findIndex((_, i) => i >= 2 && heap[i >> 1] > heap[i])} 处父大于子`,
      },
    });
  };

  push('init', { heap: [...heap], op: null, activeIdx: -1, cmpIdx: -1, phase: 'none', result: '', done: false }, 4,
    `空堆（1-based 数组：heap[0] 为占位；heap[i] 的父是 heap[i>>1]，左右子是 heap[2i]、heap[2i+1]）。`);

  for (const op of ops) {
    if (op.kind === 'push') {
      heap.push(op.key);
      let i = heap.length - 1;
      push('place', { heap: [...heap], op, activeIdx: i, cmpIdx: -1, phase: 'swim', result: '', done: false }, 7,
        `插入 ${op.key}：先放到末尾（位置 ${i}），然后向上调整（上浮 swim）。`);
      while (i > 1 && heap[i >> 1] > heap[i]) {
        push('compare', { heap: [...heap], op, activeIdx: i, cmpIdx: i >> 1, phase: 'swim', result: '', done: false }, 9,
          `比较 ${op.key}（位置 ${i}）与父节点 heap[${i >> 1}]=${heap[i >> 1]}：${heap[i >> 1]} > ${heap[i]} 违反小根堆 → 交换。`);
        [heap[i >> 1], heap[i]] = [heap[i], heap[i >> 1]];
        i = i >> 1;
        push('swap', { heap: [...heap], op, activeIdx: i, cmpIdx: -1, phase: 'swim', result: '', done: false }, 10,
          `上浮到位置 ${i}。继续与新的父节点比较。`);
      }
      push('push-done', { heap: [...heap], op, activeIdx: i, cmpIdx: -1, phase: 'none', result: '', done: false }, 11,
        i === 1 ? `到达堆顶，插入完成。` : `父节点 ≤ ${op.key}，堆性质恢复，插入完成（上浮 ${Math.floor(Math.log2(Math.max(1, heap.length - 1)))} 层以内）。`);
    } else {
      if (heap.length <= 1) {
        push('empty-pop', { heap: [...heap], op, activeIdx: -1, cmpIdx: -1, phase: 'none', result: '堆空', done: false }, 14,
          `堆为空，弹出失败（真实代码应先判空）。`);
        continue;
      }
      const min = heap[1];
      const last = heap.pop()!;
      if (heap.length === 1) {
        // 弹出唯一元素后只剩 heap[0] 占位 → 堆空
        push('pop-last', { heap: [...heap], op, activeIdx: -1, cmpIdx: -1, phase: 'none', result: `弹出 ${min}`, done: false }, 16,
          `弹出唯一元素 ${min}，堆变空。`);
        continue;
      }
      heap[1] = last;
      push('replace-top', { heap: [...heap], op, activeIdx: 1, cmpIdx: -1, phase: 'sink', result: `弹出最小值 ${min}`, done: false }, 16,
        `弹出堆顶（最小值）${min}：把末尾元素 ${last} 放到堆顶，然后向下调整（下沉 sink）。`);
      let i = 1;
      while (true) {
        const l = 2 * i, r = 2 * i + 1;
        let smallest = i;
        if (l < heap.length && heap[l] < heap[smallest]) smallest = l;
        if (r < heap.length && heap[r] < heap[smallest]) smallest = r;
        if (smallest === i) {
          push('sink-done', { heap: [...heap], op, activeIdx: i, cmpIdx: -1, phase: 'none', result: `弹出最小值 ${min}`, done: false }, 21,
            `位置 ${i}（值 ${heap[i]}）不大于任何子节点 → 下沉结束，堆性质恢复。`);
          break;
        }
        push('compare', { heap: [...heap], op, activeIdx: i, cmpIdx: smallest, phase: 'sink', result: '', done: false }, 18,
          `heap[${i}]=${heap[i]} 与较小的子节点 heap[${smallest}]=${heap[smallest]} 比较：子更小 → 交换（下沉一层）。`);
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
        push('swap', { heap: [...heap], op, activeIdx: i, cmpIdx: -1, phase: 'sink', result: '', done: false }, 19,
          `下沉到位置 ${i}。`);
      }
    }
  }
  push('done', { heap: [...heap], op: null, activeIdx: -1, cmpIdx: -1, phase: 'none', result: '', done: true }, 24,
    `完成。插入/弹出均为 O(log n)（树高），建堆整体 O(n log n)（批量建堆可 O(n)，进阶话题）。`);
  return events;
}

/* ============ 拓扑排序（Kahn） ============ */

export interface TopoState {
  n: number;
  edges: { from: number; to: number }[];
  indeg: number[];
  adj: number[][];        // 邻接表（1-based）
  queue: number[];
  order: number[];
  cur: number | null;
  scanned: number[];      // 当前正在删除的出边目标
  hasCycle: boolean;
  done: boolean;
}

export function validateTopoInput(raw: Record<string, string>): Validation {
  const vn = parseInt1Local(raw.n || '6', '节点数 n', 2, 8);
  if (!vn.ok) return vn;
  const n = vn.normalized as number;
  const edgesRaw = (raw.edges || '').trim();
  if (!edgesRaw) return { ok: false, error: '边不能为空，格式如：1->2, 1->3, 2->4, 3->4, 4->5（也可写 "1 2, 1 3"）' };
  const parts = edgesRaw.split(/[,;；]+/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 12) return { ok: false, error: '边数上限 12。' };
  const edges: { from: number; to: number }[] = [];
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*(?:->|→|-)\s*(\d+)$/) || p.match(/^(\d+)\s+(\d+)$/);
    if (!m) return { ok: false, error: `边 "${p}" 不合法：应为 u->v。` };
    const from = Number(m[1]), to = Number(m[2]);
    if (from < 1 || from > n || to < 1 || to > n) return { ok: false, error: `边 "${p}" 超出节点范围 [1, ${n}]。` };
    if (from === to) return { ok: false, error: `自环 "${p}" 不允许（拓扑排序要求 DAG）。` };
    if (edges.some((e) => e.from === from && e.to === to)) return { ok: false, error: `重边 "${p}" 请去重。` };
    edges.push({ from, to });
  }
  return { ok: true, normalized: { n, edges } };
}

export function buildTopoTrace(n: number, edges: { from: number; to: number }[]): TraceEvent<TopoState>[] {
  const events: TraceEvent<TopoState>[] = [];
  const indeg = new Array(n + 1).fill(0);
  const adj: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const e of edges) { adj[e.from].push(e.to); indeg[e.to]++; }

  const push = (type: string, s: Omit<TopoState, never>, line: number, explain: string) => {
    // 不变量：已输出的序列中，任意"两端都已输出"的边方向一致（部分拓扑序合法）
    let invOk = true;
    const pos = new Map<number, number>();
    s.order.forEach((v, i) => pos.set(v, i));
    for (const e of edges) {
      const pf = pos.get(e.from), pt = pos.get(e.to);
      if (pf !== undefined && pt !== undefined && pf > pt) { invOk = false; break; }
    }
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: '拓扑序合法性',
        ok: invOk,
        detail: invOk
          ? '已输出序列中任意两端均已确定的边，起点都先于终点（部分拓扑序合法）；队列中的点入度均为 0'
          : `部分序违反边方向（异常）！`,
      },
    });
  };

  push('init', { n, edges, indeg: [...indeg], adj, queue: [], order: [], cur: null, scanned: [], hasCycle: false, done: false }, 5,
    `统计入度：${Array.from({ length: n }, (_, i) => `d[${i + 1}]=${indeg[i + 1]}`).join(' ')}。入度=0 的点没有任何前驱，可以安全输出。`);

  const queue: number[] = [];
  for (let i = 1; i <= n; i++) if (indeg[i] === 0) queue.push(i);
  push('seed', { n, edges, indeg: [...indeg], adj, queue: [...queue], order: [], cur: null, scanned: [], hasCycle: false, done: false }, 7,
    `初始队列（入度=0）：[${queue.join(', ')}]。`);

  const order: number[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    order.push(u);
    const targets = [...adj[u]];
    push('pop', { n, edges, indeg: [...indeg], adj, queue: [...queue], order: [...order], cur: u, scanned: [], hasCycle: false, done: false }, 10,
      `取出队首 ${u}，输出到拓扑序（第 ${order.length} 个）。删除它的所有出边。`);
    for (const v of targets) {
      indeg[v]--;
      if (indeg[v] === 0) queue.push(v);
      push('del-edge', { n, edges, indeg: [...indeg], adj, queue: [...queue], order: [...order], cur: u, scanned: [v], hasCycle: false, done: false }, 13,
        `删除边 ${u}->${v}：d[${v}] 变为 ${indeg[v]}。${indeg[v] === 0 ? `入度归零 → ${v} 入队（它的所有前驱都已输出）。` : `仍有前驱未输出。`}`);
    }
  }

  const hasCycle = order.length < n;
  push('done', { n, edges, indeg: [...indeg], adj, queue: [], order: [...order], cur: null, scanned: [], hasCycle, done: true }, 18,
    hasCycle
      ? `队列空但只输出了 ${order.length}/${n} 个点 → 剩余点构成环（ Kahn 算法顺带完成环检测！）。`
      : `完成：拓扑序 [${order.join(' → ')}]。每个点入队出队恰一次，边每条删一次 → O(n+m)。`);
  return events;
}

/** 独立基线：DFS 拓扑（含环检测） */
export function topoDfs(n: number, edges: { from: number; to: number }[]): { order: number[]; hasCycle: boolean } {
  const adj: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const e of edges) adj[e.from].push(e.to);
  const color = new Array(n + 1).fill(0); // 0 未访问 1 在栈 2 完成
  const order: number[] = [];
  let cyc = false;
  const dfs = (u: number) => {
    if (cyc) return;
    color[u] = 1;
    for (const v of adj[u]) {
      if (color[v] === 1) { cyc = true; return; }
      if (color[v] === 0) dfs(v);
    }
    color[u] = 2;
    order.push(u);
  };
  for (let i = 1; i <= n; i++) if (color[i] === 0) dfs(i);
  return { order: order.reverse(), hasCycle: cyc };
}

/* ============ LIS（最长上升子序列，O(n²) 教学版） ============ */

export interface LisState {
  a: number[];
  dp: number[];
  prev: number[];
  i: number;
  j: number;
  cmpIdx: number;
  done: boolean;
  answer: number;
}

export function validateLisInput(raw: Record<string, string>): Validation {
  return parseIntArray(raw.a || '', 10, '序列', -999, 999);
}

export function buildLisTrace(a: number[]): TraceEvent<LisState>[] {
  const events: TraceEvent<LisState>[] = [];
  const n = a.length;
  const dp = new Array(n).fill(1);
  const prev = new Array(n).fill(-1);

  const push = (type: string, s: Omit<LisState, never>, line: number, explain: string) => {
    // 不变量（必要条件，全量正确性由测试的暴力对拍保证）：
    // dp[k] ≥ 1；dp[k] ≤ k+1；沿 prev 链回溯得到严格上升子序列且长度恰为 dp[k]
    let invOk = true;
    for (let k = 0; k <= s.i && k < n && invOk; k++) {
      if (s.dp[k] < 1 || s.dp[k] > k + 1) { invOk = false; break; }
      let len = 0, cur = k, lastVal = Infinity, guard = 0;
      while (cur !== -1) {
        if (a[cur] >= lastVal) { invOk = false; break; }
        lastVal = a[cur];
        len++;
        cur = s.prev[cur];
        if (++guard > n) { invOk = false; break; }
      }
      if (len !== s.dp[k]) invOk = false;
    }
    events.push({ step: events.length, type, state: s, codeLine: line, explain,
      invariant: {
        name: 'dp 可达性',
        ok: invOk,
        detail: invOk ? `对已计算的每个 k，沿 prev 回溯得到长度恰为 dp[k] 的严格上升子序列（构造可行）` : `dp/prev 不一致（异常）！`,
      },
    });
  };

  push('init', { a: [...a], dp: [...dp], prev: [...prev], i: 0, j: -1, cmpIdx: -1, done: false, answer: 0 }, 5,
    `dp[i] = "以 a[i] 结尾"的最长上升子序列长度，初始全为 1（自己一个元素）。规定"上升"为严格（a[j] < a[i]）。`);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      push('compare', { a: [...a], dp: [...dp], prev: [...prev], i, j, cmpIdx: j, done: false, answer: 0 }, 8,
        `检查 j=${j}：a[${j}]=${a[j]} ${a[j] < a[i] ? '<' : '≥'} a[${i}]=${a[i]}。${a[j] < a[i] ? `可以把 a[${i}] 接在以 j 结尾的子序列后面：dp[${i}] 候选 dp[${j}]+1 = ${dp[j] + 1}。` : `不能接（会破坏"上升"）→ 跳过。`}`);
      if (a[j] < a[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
        push('update', { a: [...a], dp: [...dp], prev: [...prev], i, j, cmpIdx: -1, done: false, answer: 0 }, 10,
          `更优：dp[${i}] = ${dp[i]}（前驱记为 j=${j}，便于回溯方案）。`);
      }
    }
    push('row-done', { a: [...a], dp: [...dp], prev: [...prev], i, j: -1, cmpIdx: -1, done: false, answer: 0 }, 8,
      `i=${i} 行完成：dp[${i}] = ${dp[i]}。`);
  }
  const answer = Math.max(...dp);
  push('done', { a: [...a], dp: [...dp], prev: [...prev], i: n, j: -1, cmpIdx: -1, done: true, answer }, 14,
    `完成：LIS 长度 = max(dp) = ${answer}（dp=[${dp.join(', ')}]）。从最大 dp 位置沿 prev 回溯可还原具体子序列。O(n²) 教学版；贪心+二分可到 O(n log n)（进阶）。`);
  return events;
}

/** LIS 暴力基线（位枚举不适用，直接 O(2^n) 子序列枚举） */
export function lisBrute(a: number[]): number {
  const n = a.length;
  let best = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    const sub: number[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) sub.push(a[i]);
    let ok = true;
    for (let k = 1; k < sub.length; k++) if (sub[k - 1] >= sub[k]) { ok = false; break; }
    if (ok) best = Math.max(best, sub.length);
  }
  return best;
}
