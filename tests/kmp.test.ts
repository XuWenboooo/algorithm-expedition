/**
 * KMP 内核测试：
 * 1. 对拍：KMP 版 pi 与暴力版 pi；KMP 搜索与朴素搜索。
 *    小规模穷举（字母表 {A,B}，长度 ≤ 6 全枚举）+ 固定种子随机测试。
 * 2. 轨迹性质：step 连续、不变量全部 ok、终态结果与核心算法一致、
 *    前进后退可逆（后退取快照实现天然可逆，这里验证快照可复现）。
 * 3. 边界：空模式串、单字符、全相同字符（连续回退）、重叠匹配、找不到。
 */
import { describe, it, expect } from 'vitest';
import {
  piKmp, piNaive, searchNaive, kmpSolve,
  buildKmpBuildTrace, buildKmpMatchTrace,
  validateKmpInput, validateKmpMatchInput,
} from '../src/algorithms/kmp';
import { replay } from '../src/kernel/trace';

/** 固定种子线性同余伪随机（可复现） */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function checkBuildTrace(p: string) {
  const events = buildKmpBuildTrace(p);
  replay(events, (e, idx) => {
    expect(e.step).toBe(idx);
    expect(e.invariant?.ok).toBe(true);
    expect(e.explain.length).toBeGreaterThan(0);
  });
  const last = events[events.length - 1].state;
  expect(last.done).toBe(true);
  // 终态 pi 与暴力对拍
  expect(last.pi.map((x) => x as number)).toEqual(piNaive(p));
  // 与 KMP 本体对拍
  expect(piKmp(p)).toEqual(piNaive(p));
}

function checkMatchTrace(t: string, p: string) {
  const events = buildKmpMatchTrace(t, p);
  replay(events, (e, idx) => {
    expect(e.step).toBe(idx);
    expect(e.invariant?.ok).toBe(true);
  });
  const last = events[events.length - 1].state;
  expect(last.done).toBe(true);
  expect(last.matches).toEqual(searchNaive(t, p));
  // 前进后退可逆：同输入重生成轨迹，中点快照逐字节一致（后退即取 index-1 快照，天然精确）
  if (events.length > 3) {
    const again = buildKmpMatchTrace(t, p);
    expect(JSON.stringify(again[Math.floor(events.length / 2)].state))
      .toEqual(JSON.stringify(events[Math.floor(events.length / 2)].state));
  }
}

describe('KMP 前缀表：穷举对拍（字母表 {A,B}，模式串长 1..6）', () => {
  it('全部枚举共 126 个模式串', () => {
    let count = 0;
    for (let len = 1; len <= 6; len++) {
      const total = 1 << len;
      for (let mask = 0; mask < total; mask++) {
        let p = '';
        for (let k = 0; k < len; k++) p += ((mask >> k) & 1) === 0 ? 'A' : 'B';
        checkBuildTrace(p);
        count++;
      }
    }
    expect(count).toBe(2 + 4 + 8 + 16 + 32 + 64);
  });
});

describe('KMP 匹配：穷举对拍（字母表 {A,B}，主串长 ≤ 5，模式串长 ≤ 3）', () => {
  it('全部组合穷举', () => {
    const strs = (maxLen: number): string[] => {
      const out: string[] = [];
      for (let len = 1; len <= maxLen; len++) {
        const total = 1 << len;
        for (let mask = 0; mask < total; mask++) {
          let s = '';
          for (let k = 0; k < len; k++) s += ((mask >> k) & 1) === 0 ? 'A' : 'B';
          out.push(s);
        }
      }
      return out;
    };
    const texts = strs(5), pats = strs(3);
    for (const t of texts) for (const p of pats) if (p.length <= t.length) checkMatchTrace(t, p);
  });
});

describe('KMP：固定种子随机对拍（种子 20261110，字母表 A-C）', () => {
  it('500 组随机 (主串, 模式串)', () => {
    const rnd = mulberry32(20261110);
    const alpha = 'ABC';
    const randStr = (maxLen: number) => {
      const len = 1 + Math.floor(rnd() * maxLen);
      let s = '';
      for (let i = 0; i < len; i++) s += alpha[Math.floor(rnd() * alpha.length)];
      return s;
    };
    for (let i = 0; i < 500; i++) {
      const t = randStr(30), p = randStr(8);
      if (p.length > t.length) continue;
      expect(kmpSolve(t, p).occurrences).toEqual(searchNaive(t, p));
      expect(piKmp(p)).toEqual(piNaive(p));
      checkMatchTrace(t, p);
    }
  });
});

describe('KMP 边界与教学样例', () => {
  it('空模式串：搜索轨迹直接结束，无匹配', () => {
    const events = buildKmpMatchTrace('ABC', '');
    expect(events.length).toBe(1);
    expect(events[0].state.matches).toEqual([]);
  });

  it('单字符模式串', () => {
    checkMatchTrace('AAAA', 'A');
    expect(searchNaive('AAAA', 'A')).toEqual([0, 1, 2, 3]);
  });

  it('全相同字符（连续回退场景）', () => {
    checkBuildTrace('AAAB'); // pi = [0,1,2,0]
    checkMatchTrace('AAAAAAAB', 'AAAB');
    expect(piKmp('AAAB')).toEqual([0, 1, 2, 0]);
  });

  it('重叠匹配 ABAB 在 ABABABAB 中出现 3 次', () => {
    checkMatchTrace('ABABABAB', 'ABAB');
    expect(searchNaive('ABABABAB', 'ABAB')).toEqual([0, 2, 4]);
  });

  it('ABXYZAB 教学串：真前后缀 AB 中间隔开不接触', () => {
    checkBuildTrace('ABXYZAB');
    expect(piKmp('ABXYZAB')).toEqual([0, 0, 0, 0, 0, 1, 2]);
  });

  it('找不到匹配', () => {
    checkMatchTrace('ABCABC', 'XYZ');
    expect(searchNaive('ABCABC', 'XYZ')).toEqual([]);
  });

  it('输入校验：空串/超长/非法字符/模式串长于主串；内部空白被归一化去除', () => {
    expect(validateKmpInput('').ok).toBe(false);
    expect(validateKmpInput('A'.repeat(41)).ok).toBe(false);
    expect(validateKmpInput('AB C').ok).toBe(true); // 归一化为 'ABC'（自动去除空白）
    expect(validateKmpInput('AB C').normalized).toBe('ABC');
    expect(validateKmpInput('AB%C').ok).toBe(false);
    expect(validateKmpInput('ABab12').ok).toBe(true);
    expect(validateKmpMatchInput('AB', 'ABAB').ok).toBe(false);
    expect(validateKmpMatchInput('ABAB', '').ok).toBe(false);
  });
});

describe('KMP 轨迹复现性', () => {
  it('同输入两次生成轨迹完全一致（含固定教学输入）', () => {
    const a = buildKmpBuildTrace('ABABC');
    const b = buildKmpBuildTrace('ABABC');
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
    const c = buildKmpMatchTrace('ABABABCAABABC', 'ABABC');
    const d = buildKmpMatchTrace('ABABABCAABABC', 'ABABC');
    expect(JSON.stringify(c)).toEqual(JSON.stringify(d));
  });
});
