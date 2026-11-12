/**
 * 基础模块内核测试：变量溢出、循环求和、数组最值、斐波那契。
 */
import { describe, it, expect } from 'vitest';
import { buildVarTrace, buildLoopTrace, buildMaxTrace, buildFibTrace, validateVarInput, validateLoopInput, validateArrayInput, validateFibInput } from '../src/algorithms/basics';
import { replay } from '../src/kernel/trace';

describe('变量与溢出', () => {
  it('不溢出：2147483646 + 1 = 2147483647', () => {
    const ev = buildVarTrace(2147483646, 1);
    expect(ev[ev.length - 1].state.intSum).toBe(2147483647);
    expect(ev[ev.length - 1].state.overflow).toBe(false);
  });
  it('溢出：2147483647 + 1 回绕为 -2147483648', () => {
    const ev = buildVarTrace(2147483647, 1);
    const last = ev[ev.length - 1].state;
    expect(last.overflow).toBe(true);
    expect(last.intSum).toBe(-2147483648);
  });
  it('负溢出：-2147483647 - 2', () => {
    const ev = buildVarTrace(-2147483647, -2);
    expect(ev[ev.length - 1].state.intSum).toBe(2147483647);
  });
  it('非法输入', () => {
    expect(validateVarInput({ a: 'abc', b: '1' }).ok).toBe(false);
    expect(validateVarInput({ a: '3000000000', b: '1' }).ok).toBe(false);
    expect(validateVarInput({ a: '1', b: '' }).ok).toBe(false);
  });
});

describe('循环求和', () => {
  it('n=1..20 结果正确且不变量全程成立', () => {
    for (let n = 1; n <= 20; n++) {
      const ev = buildLoopTrace(n);
      replay(ev, (e) => { expect(e.invariant?.ok).toBe(true); });
      expect(ev[ev.length - 1].state.sum).toBe((n * (n + 1)) / 2);
    }
  });
  it('非法输入', () => {
    expect(validateLoopInput({ n: '0' }).ok).toBe(false);
    expect(validateLoopInput({ n: '21' }).ok).toBe(false);
    expect(validateLoopInput({ n: 'x' }).ok).toBe(false);
  });
});

describe('数组最值', () => {
  const cases: number[][] = [
    [5], [1, 2], [2, 1], [3, 3, 3], [-5, -1, -9], [7, -7, 0, 999, -999],
  ];
  it('正确版：结果 = Math.max', () => {
    for (const a of cases) {
      const ev = buildMaxTrace(a, false);
      const last = ev[ev.length - 1].state;
      expect(last.best).toBe(Math.max(...a));
      expect(a[last.bestIdx]).toBe(last.best);
    }
  });
  it('反例版：发生越界事件并停止', () => {
    const ev = buildMaxTrace([1, 2, 3], true);
    const oob = ev.filter((e) => e.type === 'oob');
    expect(oob.length).toBe(1);
    expect(ev[ev.length - 1].state.done).toBe(true);
  });
  it('非法输入', () => {
    expect(validateArrayInput({ a: '' }).ok).toBe(false);
    expect(validateArrayInput({ a: '1,x' }).ok).toBe(false);
    expect(validateArrayInput({ a: '1 2 3 4 5 6 7 8 9 10 11' }).ok).toBe(false);
  });
});

describe('斐波那契：朴素 vs 记忆化', () => {
  it('同一 n 结果一致', () => {
    for (const n of [1, 2, 3, 5, 10, 18]) {
      const naive = buildFibTrace(n, 'naive');
      const memo = buildFibTrace(n, 'memo');
      expect(naive[naive.length - 1].state.result).toBe(memo[memo.length - 1].state.result);
    }
  });
  it('斐波那契数值正确（f(10)=55）', () => {
    const ev = buildFibTrace(10, 'memo');
    expect(ev[ev.length - 1].state.result).toBe(55);
  });
  it('记忆化调用次数远少于朴素（n=12）', () => {
    const naive = buildFibTrace(12, 'naive');
    const memo = buildFibTrace(12, 'memo');
    const cn = naive[naive.length - 1].state.calls;
    const cm = memo[memo.length - 1].state.calls;
    expect(cm).toBeLessThan(cn / 5);
    expect(cn).toBeGreaterThan(200);
  });
  it('非法输入', () => {
    expect(validateFibInput({ n: '0' }).ok).toBe(false);
    expect(validateFibInput({ n: '19' }).ok).toBe(false);
  });
});
