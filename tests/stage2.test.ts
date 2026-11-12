/**
 * 阶段 2 内核测试：冒泡排序、前缀和、差分、二分、双指针。
 * 对拍基线：JS 内置 sort / 直接求和 / 线性扫描。
 */
import { describe, it, expect } from 'vitest';
import {
  buildBubbleTrace, buildPrefixTrace, buildDiffTrace, buildBisectTrace, buildTwoPtrTrace,
  validateSortInput, validateDiffInput, validateBisectInput, validateTwoPtrInput,
} from '../src/algorithms/stage2';
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

describe('冒泡排序', () => {
  const rnd = mulberry32(114514);
  it('固定种子随机 200 组 + 边界：结果等于内置排序，多重集合保持', () => {
    const cases: number[][] = [[5], [2, 1], [1, 1, 1], [3, -3]];
    // 空数组不合法（校验层拦截），这里测轨迹层：单元素/重复/负数
    for (const a of cases) {
      if (a.length === 0) continue;
      const ev = buildBubbleTrace(a);
      const last = ev[ev.length - 1].state;
      expect(last.a).toEqual([...a].sort((x, y) => x - y));
    }
    for (let i = 0; i < 200; i++) {
      const n = 1 + Math.floor(rnd() * 10);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 1999) - 999);
      const ev = buildBubbleTrace(a);
      replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
      const last = ev[ev.length - 1].state;
      expect(last.a).toEqual([...a].sort((x, y) => x - y));
      expect(last.done).toBe(true);
    }
  });
  it('非法输入：非整数/超长/空', () => {
    expect(validateSortInput({ a: '1,x' }).ok).toBe(false);
    expect(validateSortInput({ a: '' }).ok).toBe(false);
    expect(validateSortInput({ a: Array(11).fill(1).join(' ') }).ok).toBe(false);
    expect(validateSortInput({ a: '3 1 2' }).ok).toBe(true);
  });
});

describe('前缀和', () => {
  it('轨迹终态与直接求和一致；查询结果正确', () => {
    const a = [3, -1, 4, 1, -5, 9, 2, 6];
    const ev = buildPrefixTrace(a);
    replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
    const last = ev[ev.length - 1].state;
    const direct = a.slice(last.l, last.r + 1).reduce((x, y) => x + y, 0);
    expect(last.queryResult).toBe(direct);
    expect(last.pre![last.pre!.length - 1]).toBe(a.reduce((x, y) => x + y, 0));
  });
  it('单元素与全负数组', () => {
    for (const a of [[7], [-1, -2, -3]]) {
      const ev = buildPrefixTrace(a);
      expect(ev[ev.length - 1].state.queryResult).not.toBeNull();
    }
  });
});

describe('差分', () => {
  it('区间加后重建结果与朴素模拟一致（随机 100 组，种子 2026）', () => {
    const rnd = mulberry32(2026);
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rnd() * 12);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 201) - 100);
      const m = 1 + Math.floor(rnd() * 4);
      const ops = Array.from({ length: m }, () => {
        let l = 1 + Math.floor(rnd() * n);
        let r = 1 + Math.floor(rnd() * n);
        if (l > r) [l, r] = [r, l];
        return { l, r, x: Math.floor(rnd() * 201) - 100 };
      });
      const ev = buildDiffTrace(a, ops);
      const last = ev[ev.length - 1].state;
      const naive = [...a];
      for (const op of ops) for (let k = op.l; k <= op.r; k++) naive[k - 1] += op.x;
      expect(last.result).toEqual(naive);
    }
  });
  it('非法输入：区间越界/格式错误', () => {
    expect(validateDiffInput({ a: '1 2 3', ops: '2 4 1' }).ok).toBe(false);
    expect(validateDiffInput({ a: '1 2 3', ops: '1 2 x' }).ok).toBe(false);
    expect(validateDiffInput({ a: '1 2 3', ops: '' }).ok).toBe(false);
    expect(validateDiffInput({ a: '1 2 3', ops: '1 2 5, 3 3 -1' }).ok).toBe(true);
  });
});

describe('二分（第一个 ≥ x）', () => {
  const rnd = mulberry32(999);
  it('随机 300 组与线性扫描一致（含 x 小于全部/大于全部/相等元素）', () => {
    for (let t = 0; t < 300; t++) {
      const n = 1 + Math.floor(rnd() * 16);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 50));
      a.sort((x, y) => x - y);
      const x = Math.floor(rnd() * 60) - 5;
      const ev = buildBisectTrace(a, x);
      const last = ev[ev.length - 1].state;
      let expected = a.length;
      for (let k = 0; k < n; k++) if (a[k] >= x) { expected = k; break; }
      expect(last.answer).toBe(expected);
      replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
    }
  });
  it('无序数组被输入校验拒绝', () => {
    expect(validateBisectInput({ a: '3 1 2', x: '2' }).ok).toBe(false);
    expect(validateBisectInput({ a: '1 2 3', x: '2' }).ok).toBe(true);
  });
  it('单元素边界', () => {
    expect(buildBisectTrace([5], 5)[0].state.answer).toBe(null); // 初始态
    const ev = buildBisectTrace([5], 5);
    expect(ev[ev.length - 1].state.answer).toBe(0);
    expect(buildBisectTrace([5], 6)[ev.length - 1].state.answer).toBe(1);
  });
});

describe('对撞双指针', () => {
  const rnd = mulberry32(777);
  it('随机 300 组与暴力 O(n²) 一致（找到第一组即可）', () => {
    for (let t = 0; t < 300; t++) {
      const n = 1 + Math.floor(rnd() * 12);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 40) - 20);
      a.sort((x, y) => x - y);
      const target = Math.floor(rnd() * 60) - 30;
      const ev = buildTwoPtrTrace(a, target);
      const last = ev[ev.length - 1].state;
      // 暴力：任意一组
      let brute: { l: number; r: number } | null = null;
      for (let l = 0; l < n && !brute; l++) {
        for (let r = l + 1; r < n; r++) {
          if (a[l] + a[r] === target) { brute = { l, r }; break; }
        }
      }
      if (brute) {
        expect(last.found).not.toBeNull();
        expect(a[last.found!.l] + a[last.found!.r]).toBe(target);
      } else {
        expect(last.found).toBeNull();
      }
    }
  });
  it('重复元素与全相同数组', () => {
    const ev = buildTwoPtrTrace([2, 2, 2, 2], 4);
    expect(ev[ev.length - 1].state.found).toEqual({ l: 0, r: 3 });
  });
  it('非法输入', () => {
    expect(validateTwoPtrInput({ a: '2 1', target: '3' }).ok).toBe(false);
    expect(validateTwoPtrInput({ a: '1 2 3', target: 'x' }).ok).toBe(false);
  });
});
