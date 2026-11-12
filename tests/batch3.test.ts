/**
 * 第三批内核测试：N 皇后回溯、区间调度贪心、离散化。
 */
import { describe, it, expect } from 'vitest';
import {
  buildNqueensTrace, nqueensCount, buildGreedyTrace, bruteMax, buildDiscreteTrace,
  validateNqueensInput, validateGreedyInput, validateDiscreteInput,
  Segment,
} from '../src/algorithms/batch3';
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

describe('N 皇后回溯', () => {
  const known: Record<number, number> = { 1: 1, 2: 0, 3: 0, 4: 2, 5: 10, 6: 4 };
  it('n=1..6 解数与已知序列一致，轨迹不变量全程成立', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const ev = buildNqueensTrace(n);
      replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
      const found = ev.filter((e) => e.type === 'solution').length;
      expect(found).toBe(known[n]);
      expect(ev[ev.length - 1].state.solutions.length).toBe(known[n]);
      // 剪枝确实发生过（n≥4）
      if (n >= 4) expect(ev[ev.length - 1].state.pruned).toBeGreaterThan(0);
    }
  });
  it('n=2/3 无解也正常终止', () => {
    for (const n of [2, 3]) {
      const ev = buildNqueensTrace(n);
      expect(ev[ev.length - 1].state.done).toBe(true);
      expect(ev[ev.length - 1].state.solutions).toEqual([]);
    }
  });
  it('非法输入', () => {
    expect(validateNqueensInput({ n: '0' }).ok).toBe(false);
    expect(validateNqueensInput({ n: '7' }).ok).toBe(false);
    expect(validateNqueensInput({ n: 'x' }).ok).toBe(false);
    expect(validateNqueensInput({ n: '5' }).ok).toBe(true);
  });
  it('基线一致性：nqueensCount(5)=10', () => {
    expect(nqueensCount(5)).toBe(10);
    expect(nqueensCount(4)).toBe(2);
  });
});

describe('区间调度贪心', () => {
  const rnd = mulberry32(999005);
  it('随机 300 组与暴力枚举一致（n ≤ 8）', () => {
    for (let t = 0; t < 300; t++) {
      const n = 1 + Math.floor(rnd() * 8);
      const intervals: Segment[] = Array.from({ length: n }, (_, i) => {
        const l = Math.floor(rnd() * 30);
        const r = l + Math.floor(rnd() * 15);
        return { id: i + 1, l, r };
      });
      const ev = buildGreedyTrace(intervals);
      replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
      const greedyCount = ev[ev.length - 1].state.chosen.length;
      expect(greedyCount).toBe(bruteMax(intervals));
    }
  });
  it('经典反例：重叠区间选到"最早结束"的', () => {
    // [1,10], [2,3], [4,5]：按右端点选 #2、#3 → 2 个（朴素按左端点会只选 1 个）
    const ev = buildGreedyTrace([{ id: 1, l: 1, r: 10 }, { id: 2, l: 2, r: 3 }, { id: 3, l: 4, r: 5 }]);
    expect(ev[ev.length - 1].state.chosen.length).toBe(2);
  });
  it('非法输入', () => {
    expect(validateGreedyInput({ intervals: '' }).ok).toBe(false);
    expect(validateGreedyInput({ intervals: '3 1' }).ok).toBe(false);
    expect(validateGreedyInput({ intervals: '1 x' }).ok).toBe(false);
    expect(validateGreedyInput({ intervals: '1 3, 2 4' }).ok).toBe(true);
  });
});

describe('离散化', () => {
  it('映射保持相对顺序', () => {
    const raw = [1000000, 5, 999999999, 5, 42];
    const ev = buildDiscreteTrace(raw, 2000000000);
    replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
    const last = ev[ev.length - 1].state;
    const mapped = last.mapped as number[];
    // 5 出现两次 → 同一排名
    expect(mapped[1]).toBe(mapped[3]);
    // 相对顺序：5 < 42 < 1000000 < 999999999
    expect(mapped[1]).toBeLessThan(mapped[4]);
    expect(mapped[4]).toBeLessThan(mapped[0]);
    expect(mapped[0]).toBeLessThan(mapped[2]);
    // 候选表 = 排序去重
    expect(last.sortedUnique).toEqual([5, 42, 1000000, 999999999]);
  });
  it('全部相同值 → 单一候选', () => {
    const ev = buildDiscreteTrace([7, 7, 7], 1000000);
    expect(ev[ev.length - 1].state.sortedUnique).toEqual([7]);
  });
  it('非法输入', () => {
    expect(validateDiscreteInput({ maxVal: '10' }).ok).toBe(false);
    expect(validateDiscreteInput({ maxVal: '1000000' }).ok).toBe(true);
  });
});
