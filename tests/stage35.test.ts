/**
 * 阶段 3-5 内核测试：括号匹配、网格 DFS/BFS、线性探测哈希、背包 DP。
 * 哈希测试包含独立模型对拍：任何操作序列后，"遇空即停"的查询结果必须
 * 与真实集合内容一致（这是无墓碑删除正确性的本质要求）。
 */
import { describe, it, expect } from 'vitest';
import {
  buildBracketTrace, buildGridTrace, buildHashTrace, buildKnapsackTrace,
  validateBracketInput, validateGridInput, validateHashInput, validateKnapsackInput,
  HashOp,
} from '../src/algorithms/stage35';
import { replay } from '../src/kernel/trace';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('括号匹配', () => {
  const valid = ['()', '()[]{}', '([{}])', '(())', '()()', '{[()]}'];
  const invalid = ['(', ')', '([)]', '((()', '())', ']'];
  it('合法串全部判定匹配', () => {
    for (const s of valid) {
      const ev = buildBracketTrace(s);
      expect(ev[ev.length - 1].state.ok).toBe(true);
    }
  });
  it('非法串全部判定不匹配且给出位置', () => {
    for (const s of invalid) {
      const ev = buildBracketTrace(s);
      const last = ev[ev.length - 1].state;
      expect(last.ok).toBe(false);
      expect(last.errorAt).not.toBeNull();
    }
  });
  it('非法输入', () => {
    expect(validateBracketInput({ s: '' }).ok).toBe(false);
    expect(validateBracketInput({ s: '(a)' }).ok).toBe(false);
    expect(validateBracketInput({ s: '('.repeat(25) }).ok).toBe(false);
    expect(validateBracketInput({ s: '()[]' }).ok).toBe(true);
  });
});

describe('网格 DFS/BFS', () => {
  const grid = ['o..#', '.#..', '....', '..#.'];
  it('DFS 与 BFS 访问总数一致且覆盖全部连通空地', () => {
    const rows = grid;
    const dfs = buildGridTrace(rows, 'DFS');
    const bfs = buildGridTrace(rows, 'BFS');
    const dfsLast = dfs[dfs.length - 1].state;
    const bfsLast = bfs[bfs.length - 1].state;
    // 连通空地计数（手算）：o 在 (0,0)；空地共 13 格，全连通？(0,0)→(0,1)→(0,2);(1,0)…图连通
    expect(dfsLast.visitedCount).toBe(bfsLast.visitedCount);
    expect(dfsLast.visitedCount).toBe(13);
  });
  it('墙与不连通区域不被访问', () => {
    const rows = ['o#.', '##.', '...'];
    const ev = buildGridTrace(rows, 'BFS');
    const last = ev[ev.length - 1].state;
    // (0,0) 只能到 (1,0)? (1,0) 是 #。可达：无（(0,0) 右是 # 下是 #）
    expect(last.visitedCount).toBe(1);
  });
  it('BFS 访问序号与无权最短距离单调一致（独立 BFS 对拍）', () => {
    const rows = ['o...', '.##.', '....'];
    const ev = buildGridTrace(rows, 'BFS');
    const last = ev[ev.length - 1].state;
    // 独立计算真实最短距离
    const R = 3, C = 4;
    const dist: number[][] = Array.from({ length: R }, () => new Array(C).fill(-1));
    const q: number[][] = [[0, 0]];
    dist[0][0] = 0;
    while (q.length) {
      const [r, c] = q.shift()!;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
        if (rows[nr][nc] === '#' || dist[nr][nc] >= 0) continue;
        dist[nr][nc] = dist[r][c] + 1;
        q.push([nr, nc]);
      }
    }
    // 性质：距离小的格子访问序号一定更小（BFS 分层性质）
    const cells: { d: number; o: number }[] = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (dist[r][c] >= 0) cells.push({ d: dist[r][c], o: last.order[r][c] });
    }
    for (const x of cells) for (const y of cells) {
      if (x.d < y.d) expect(x.o).toBeLessThan(y.o);
    }
    // 起点序号为 1
    expect(last.order[0][0]).toBe(1);
  });
  it('非法输入', () => {
    expect(validateGridInput({ grid: '' }).ok).toBe(false);
    expect(validateGridInput({ grid: 'o..\n..#' }).ok).toBe(true);
    expect(validateGridInput({ grid: 'oo.\n...' }).ok).toBe(false);
    expect(validateGridInput({ grid: 'o..x' }).ok).toBe(false);
    expect(validateGridInput({ grid: '..' }).ok).toBe(false);
  });
});

describe('线性探测哈希', () => {
  /** 独立模型：真实键集合。删除修复正确 ⇔ 对任意序列后查询与集合一致 */
  function modelCheck(ops: HashOp[], m: number) {
    const ev = buildHashTrace(ops, m);
    replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
    const last = ev[ev.length - 1].state;
    // 独立模拟
    const set = new Set<number>();
    for (const op of ops) {
      if (op.kind === 'add') set.add(op.key);
      if (op.kind === 'del') set.delete(op.key);
    }
    // 表内容必须恰好等于集合
    const tableKeys = last.table.filter((x) => x !== null) as number[];
    expect(new Set(tableKeys)).toEqual(set);
    expect(tableKeys.length).toBe(set.size);
    // "遇空即停"查询对每个键验证
    for (const key of Array.from({ length: 30 }, (_, i) => i)) {
      let probe = key % m;
      let found = false;
      for (let step = 0; step < m; step++) {
        const cell = last.table[probe];
        if (cell === null) break;
        if (cell === key) { found = true; break; }
        probe = (probe + 1) % m;
      }
      expect(found).toBe(set.has(key));
    }
  }

  it('固定场景：冲突 + 删除引发探测链修复（经典案例）', () => {
    // m=7：10%7=3, 17%7=3, 24%7=3 → 同链；删除 10 后 17、24 必须能被查到
    modelCheck([
      { kind: 'add', key: 10 }, { kind: 'add', key: 17 }, { kind: 'add', key: 24 },
      { kind: 'del', key: 10 },
      { kind: 'find', key: 17 }, { kind: 'find', key: 24 },
    ], 7);
  });

  it('固定种子随机 300 组（插入/删除/查找混合）', () => {
    const rnd = mulberry32(31415);
    for (let t = 0; t < 300; t++) {
      const m = 5 + Math.floor(rnd() * 8);
      const nOps = 1 + Math.floor(rnd() * 8);
      const ops: HashOp[] = [];
      for (let i = 0; i < nOps; i++) {
        const r = rnd();
        const key = Math.floor(rnd() * 60);
        ops.push(r < 0.5 ? { kind: 'add', key } : r < 0.8 ? { kind: 'del', key } : { kind: 'find', key });
      }
      modelCheck(ops, m);
    }
  });

  it('表满插入失败不崩溃', () => {
    const ev = buildHashTrace([{ kind: 'add', key: 1 }, { kind: 'add', key: 2 }, { kind: 'add', key: 3 }, { kind: 'add', key: 4 }, { kind: 'add', key: 5 }], 4);
    expect(ev.some((e) => e.type === 'full')).toBe(true);
  });
  it('非法输入', () => {
    expect(validateHashInput({ ops: '', m: '8' }).ok).toBe(false);
    expect(validateHashInput({ ops: '+12 x5', m: '8' }).ok).toBe(false);
    expect(validateHashInput({ ops: '+1234', m: '8' }).ok).toBe(false);
    expect(validateHashInput({ ops: '+12', m: '20' }).ok).toBe(false);
    expect(validateHashInput({ ops: '+12 -3 ?45', m: '7' }).ok).toBe(true);
  });
});

describe('0/1 背包', () => {
  it('二维结果与暴力枚举一致（随机 100 组，种子 666）', () => {
    const rnd = mulberry32(666);
    const brute = (items: { w: number; v: number }[], W: number) => {
      let best = 0;
      const n = items.length;
      for (let mask = 0; mask < (1 << n); mask++) {
        let w = 0, v = 0;
        for (let i = 0; i < n; i++) if (mask & (1 << i)) { w += items[i].w; v += items[i].v; }
        if (w <= W) best = Math.max(best, v);
      }
      return best;
    };
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rnd() * 4);
      const items = Array.from({ length: n }, () => ({ w: 1 + Math.floor(rnd() * 8), v: Math.floor(rnd() * 20) }));
      const W = 1 + Math.floor(rnd() * 12);
      const ev = buildKnapsackTrace(items, W, '2d');
      expect(ev[ev.length - 1].state.answer).toBe(brute(items, W));
    }
  });
  it('一维正序（错误示范）会高估：≥ 一维倒序（正确）= 二维，且此组数据严格更大', () => {
    const items = [{ w: 2, v: 3 }, { w: 3, v: 4 }, { w: 4, v: 5 }];
    const W = 10;
    const correctAns = buildKnapsackTrace(items, W, '1d-correct');
    const wrongAns = buildKnapsackTrace(items, W, '1d-wrong');
    const twoD = buildKnapsackTrace(items, W, '2d');
    const aCorrect = correctAns[correctAns.length - 1].state.answer as number;
    const aWrong = wrongAns[wrongAns.length - 1].state.answer as number;
    const a2d = twoD[twoD.length - 1].state.answer as number;
    expect(aCorrect).toBe(a2d);
    // 正序允许重复选取 → 结果只会更高（这就是错误所在）
    expect(aWrong).toBeGreaterThanOrEqual(aCorrect);
    expect(aWrong).toBeGreaterThan(a2d); // 本组数据下确实发生了重复选取
  });
  it('非法输入', () => {
    expect(validateKnapsackInput({ items: '', W: '10' }).ok).toBe(false);
    expect(validateKnapsackInput({ items: '2:3, x', W: '10' }).ok).toBe(false);
    expect(validateKnapsackInput({ items: '2:3', W: '40' }).ok).toBe(false);
    expect(validateKnapsackInput({ items: '2:3, 3:4', W: '10' }).ok).toBe(true);
  });
  it('重复选取检测按物品精确归因（改进闭环 #2）', () => {
    // 物品1 正序自重复是模式固有真实行为 → 应报给物品1；物品2 无重复 → 不报给物品2
    const ev = buildKnapsackTrace([{ w: 1, v: 10 }, { w: 2, v: 20 }], 4, '1d-wrong');
    const reuseEvents = ev.filter((e) => e.type === 'fill' && e.state.note && e.state.note.includes('重复选取'));
    const item2Reuse = reuseEvents.filter((e) => e.state.i === 2);
    expect(reuseEvents.length).toBeGreaterThan(0);
    expect(item2Reuse.length).toBe(0);
    expect(ev[ev.length - 1].state.answer).toBe(40);
    // 真重复场景（单件物品重复装）仍报警
    const single = buildKnapsackTrace([{ w: 1, v: 10 }], 12, '1d-wrong');
    expect(single.filter((e) => e.state.note && e.state.note.includes('重复选取')).length).toBeGreaterThan(0);
  });
});
