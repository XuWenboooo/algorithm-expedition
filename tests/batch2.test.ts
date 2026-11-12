/**
 * 第二批内核测试：并查集、堆、拓扑排序、LIS。
 */
import { describe, it, expect } from 'vitest';
import {
  buildDsuTrace, dsuNaive, buildHeapTrace, buildTopoTrace, topoDfs, buildLisTrace, lisBrute,
  validateDsuInput, validateHeapInput, validateTopoInput, validateLisInput,
  DsuOp, HeapOp,
} from '../src/algorithms/batch2';
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

describe('并查集', () => {
  function modelCheck(ops: DsuOp[], n: number) {
    const ev = buildDsuTrace(ops, n);
    replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
    const last = ev[ev.length - 1].state;
    const naive = dsuNaive(ops, n);
    // 用最终 fa 计算每组（根相同 = 同组）
    const rootOf = (x: number) => { let r = x; while (last.fa[r] !== r) r = last.fa[r]; return r; };
    // 逐一核对查询结果：每个 find 操作恰对应一个 type='find' 事件（结果为该时刻的真值）
    const findResults: boolean[] = [];
    for (const e of ev) {
      if (e.type === 'find' && e.state.op?.kind === 'find') {
        findResults.push(e.state.result.startsWith('同集合'));
      }
    }
    expect(findResults).toEqual(naive.same);
    // 组数核对
    const roots = new Set<number>();
    for (let i = 1; i <= n; i++) roots.add(rootOf(i));
    expect(roots.size).toBe(naive.groups);
  }

  it('固定场景：合并链 + 查询 + 冗余合并防环', () => {
    modelCheck([
      { kind: 'union', a: 1, b: 2 }, { kind: 'union', a: 2, b: 3 }, { kind: 'union', a: 3, b: 4 },
      { kind: 'find', a: 1, b: 4 }, { kind: 'find', a: 1, b: 5 },
      { kind: 'union', a: 1, b: 4 }, // 冗余合并（同根）
      { kind: 'find', a: 4, b: 5 },
    ], 6);
  });

  it('固定种子随机 300 组（种子 888001）', () => {
    const rnd = mulberry32(888001);
    for (let t = 0; t < 300; t++) {
      const n = 2 + Math.floor(rnd() * 10);
      const nOps = 1 + Math.floor(rnd() * 8);
      const ops: DsuOp[] = [];
      for (let i = 0; i < nOps; i++) {
        const a = 1 + Math.floor(rnd() * n);
        const b = 1 + Math.floor(rnd() * n);
        ops.push(rnd() < 0.6 ? { kind: 'union', a, b } : { kind: 'find', a, b });
      }
      modelCheck(ops, n);
    }
  });

  it('非法输入', () => {
    expect(validateDsuInput({ ops: '', n: '8' }).ok).toBe(false);
    expect(validateDsuInput({ ops: '+1 2 x3 4', n: '8' }).ok).toBe(false);
    expect(validateDsuInput({ ops: '+1 9', n: '8' }).ok).toBe(false);
    expect(validateDsuInput({ ops: '+1 2', n: '20' }).ok).toBe(false);
    expect(validateDsuInput({ ops: '+1 2 ?2 1', n: '8' }).ok).toBe(true);
  });
});

describe('堆', () => {
  function modelCheck(ops: HeapOp[]) {
    const ev = buildHeapTrace(ops);
    replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
    // 独立模型：数组排序模拟
    const model: number[] = [];
    const pops: (number | null)[] = [];
    for (const op of ops) {
      if (op.kind === 'push') model.push(op.key);
      else pops.push(model.length ? model.splice(model.indexOf(Math.min(...model)), 1)[0] : null);
    }
    // 每次弹出操作只取其终态事件（sink-done / pop-last / empty-pop）的 result
    const popResults: (number | null)[] = [];
    for (const e of ev) {
      if (['sink-done', 'pop-last', 'empty-pop'].includes(e.type)) {
        const r = e.state.result;
        if (r === '堆空') popResults.push(null);
        else if (r.startsWith('弹出')) popResults.push(Number(r.match(/\d+/)![0]));
      }
    }
    expect(popResults).toEqual(pops);
    // 最终堆内容 = 模型剩余（多重集合）
    expect([...ev[ev.length - 1].state.heap.slice(1)].sort((x, y) => x - y)).toEqual([...model].sort((x, y) => x - y));
  }

  it('固定场景：插入乱序 + 弹出最小', () => {
    modelCheck([
      { kind: 'push', key: 5 }, { kind: 'push', key: 3 }, { kind: 'push', key: 8 },
      { kind: 'push', key: 1 }, { kind: 'pop', key: 0 }, { kind: 'pop', key: 0 },
      { kind: 'push', key: 2 }, { kind: 'pop', key: 0 },
    ]);
  });

  it('固定种子随机 300 组（种子 888002）', () => {
    const rnd = mulberry32(888002);
    for (let t = 0; t < 300; t++) {
      const nOps = 1 + Math.floor(rnd() * 10);
      const ops: HeapOp[] = [];
      for (let i = 0; i < nOps; i++) {
        ops.push(rnd() < 0.6 ? { kind: 'push', key: Math.floor(rnd() * 99) } : { kind: 'pop', key: 0 });
      }
      modelCheck(ops);
    }
  });

  it('空堆弹出安全', () => {
    const ev = buildHeapTrace([{ kind: 'pop', key: 0 }]);
    expect(ev.some((e) => e.type === 'empty-pop')).toBe(true);
  });

  it('非法输入', () => {
    expect(validateHeapInput({ ops: '' }).ok).toBe(false);
    expect(validateHeapInput({ ops: '+5 x3' }).ok).toBe(false);
    expect(validateHeapInput({ ops: '-2' }).ok).toBe(false);
    expect(validateHeapInput({ ops: '+5 +3 -1' }).ok).toBe(true);
  });
});

describe('拓扑排序', () => {
  function modelCheck(n: number, edges: { from: number; to: number }[]) {
    const ev = buildTopoTrace(n, edges);
    replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
    const last = ev[ev.length - 1].state;
    const dfs = topoDfs(n, edges);
    expect(last.hasCycle).toBe(dfs.hasCycle);
    if (!dfs.hasCycle) {
      expect(last.order.length).toBe(n);
      expect([...last.order].sort((x, y) => x - y)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
      // 边方向一致性
      const pos = new Map(last.order.map((v, i) => [v, i]));
      for (const e of edges) expect(pos.get(e.from)!).toBeLessThan(pos.get(e.to)!);
    }
  }

  it('DAG：经典菱形 + 链', () => {
    modelCheck(6, [
      { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 4 }, { from: 3, to: 4 }, { from: 4, to: 5 },
    ]);
  });

  it('环：报告 hasCycle', () => {
    modelCheck(4, [{ from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 1 }]);
  });

  it('固定种子随机 200 组（种子 888003，一半带环）', () => {
    const rnd = mulberry32(888003);
    for (let t = 0; t < 200; t++) {
      const n = 2 + Math.floor(rnd() * 6);
      const m = 1 + Math.floor(rnd() * 8);
      const edges: { from: number; to: number }[] = [];
      for (let i = 0; i < m; i++) {
        let u = 1 + Math.floor(rnd() * n);
        let v = 1 + Math.floor(rnd() * n);
        if (u === v) v = ((v % n) + 1);
        if (!edges.some((e) => e.from === u && e.to === v)) edges.push({ from: u, to: v });
      }
      modelCheck(n, edges);
    }
  });

  it('非法输入', () => {
    expect(validateTopoInput({ n: '4', edges: '' }).ok).toBe(false);
    expect(validateTopoInput({ n: '4', edges: '1->1' }).ok).toBe(false);
    expect(validateTopoInput({ n: '4', edges: '1->5' }).ok).toBe(false);
    expect(validateTopoInput({ n: '4', edges: '1->2, 1->2' }).ok).toBe(false);
    expect(validateTopoInput({ n: '4', edges: '1->2, 2->3' }).ok).toBe(true);
  });
});

describe('LIS', () => {
  const rnd = mulberry32(888004);
  it('随机 200 组与位枚举暴力一致（n ≤ 8）', () => {
    for (let t = 0; t < 200; t++) {
      const n = 1 + Math.floor(rnd() * 8);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 40) - 20);
      const ev = buildLisTrace(a);
      replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
      const last = ev[ev.length - 1].state;
      expect(last.answer).toBe(lisBrute(a));
    }
  });
  it('边界：单元素 / 全相等（严格上升） / 全递减', () => {
    const last = (a: number[]) => {
      const ev = buildLisTrace(a);
      return ev[ev.length - 1].state.answer;
    };
    expect(last([5])).toBe(1);
    expect(last([3, 3, 3])).toBe(1);       // 严格上升：相等不算
    expect(last([5, 4, 3, 2, 1])).toBe(1);
    expect(last([1, 2, 3, 4])).toBe(4);
  });
  it('非法输入', () => {
    expect(validateLisInput({ a: '' }).ok).toBe(false);
    expect(validateLisInput({ a: '1,x' }).ok).toBe(false);
    expect(validateLisInput({ a: Array(11).fill(1).join(' ') }).ok).toBe(false);
    expect(validateLisInput({ a: '3 1 2' }).ok).toBe(true);
  });
});
