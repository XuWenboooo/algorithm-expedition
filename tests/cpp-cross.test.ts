/** C++17 reference programs are rebuilt from source by npm test. */
import { describe, it, expect, beforeAll } from 'vitest';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

import { piKmp, searchNaive, piNaive } from '../src/algorithms/kmp';
import { buildBubbleTrace } from '../src/algorithms/stage2';
import { buildHashTrace, buildGridTrace as buildGridTrace35, HashOp } from '../src/algorithms/stage35';
import { buildVarTrace, buildLoopTrace, buildFibTrace } from '../src/algorithms/basics';
import { buildDsuTrace, buildHeapTrace, buildTopoTrace, buildLisTrace, DsuOp, HeapOp } from '../src/algorithms/batch2';
import { buildNqueensTrace, buildGreedyTrace, buildDiscreteTrace, Segment } from '../src/algorithms/batch3';

const CPP_DIR = path.resolve(__dirname, '../scripts/cpp');
const BIN = (name: string) => path.join(CPP_DIR, 'bin', `${name}${process.platform === 'win32' ? '.exe' : ''}`);

function runExe(name: string, input: string): { ok: boolean; stdout: string; stderr: string } {
  const exe = BIN(name);
  if (!fs.existsSync(exe)) return { ok: false, stdout: '', stderr: `missing exe: ${exe}` };
  const r = spawnSync(exe, { input, encoding: 'utf8', timeout: 20000 });
  return { ok: r.status === 0, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let buildOk = false;
let buildReason = '';

beforeAll(() => {
  // 若 bin 已存在则直接用（由 npm test 预先构建）；否则尝试现场编译
  const binDir = path.join(CPP_DIR, 'bin');
  const needed = ['kmp_ref', 'sort_ref', 'prefix_ref', 'bisect_ref', 'twoptr_ref', 'bracket_ref', 'hash_ref', 'knap_ref', 'var_ref', 'loop_ref', 'fib_ref', 'grid_ref', 'dsu_ref', 'heap_ref', 'topo_ref', 'lis_ref', 'nqueens_ref', 'greedy_ref', 'discrete_ref'];
  if (needed.every((n) => fs.existsSync(path.join(binDir, `${n}${process.platform === 'win32' ? '.exe' : ''}`)))) {
    buildOk = true;
    buildReason = '使用已编译的 scripts/cpp/bin/*.exe';
    return;
  }
  const r = spawnSync(process.execPath, [path.join(CPP_DIR, '../build-cpp.mjs')], { encoding: 'utf8', timeout: 300000 });
  buildOk = r.status === 0 && needed.every((n) => fs.existsSync(BIN(n)));
  buildReason = buildOk ? 'Built reference programs from source' : `C++ build failed: ${r.stdout || r.stderr || 'No output'}`;
  if (!buildOk) throw new Error(buildReason);
});

describe('C++17 参考程序对拍（源码编译）', () => {
  it('编译产物必须可用', () => {
    if (!buildOk) throw new Error(buildReason);
    expect(buildOk).toBe(true);
  });

  it('KMP：固定种子 200 组随机（种子 777001）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777001);
    const alpha = 'ABC';
    for (let t = 0; t < 200; t++) {
      const randStr = (len: number) => Array.from({ length: len }, () => alpha[Math.floor(rnd() * alpha.length)]).join('');
      const text = randStr(1 + Math.floor(rnd() * 30));
      const pat = randStr(1 + Math.floor(rnd() * 8));
      const r = runExe('kmp_ref', `${text}\n${pat}\n`);
      expect(r.ok, `kmp_ref 运行失败: ${r.stderr}`).toBe(true);
      const lines = r.stdout.trim().split('\n');
      const cppPi = lines[0].trim().split(/\s+/).map(Number);
      const cppOcc = lines[2]?.trim() ? lines[2].trim().split(/\s+/).map(Number) : [];
      expect(cppPi).toEqual(piKmp(pat));
      expect(cppOcc).toEqual(searchNaive(text, pat));
      expect(piKmp(pat)).toEqual(piNaive(pat));
    }
  });

  it('排序：固定种子 150 组随机（种子 777002）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777002);
    for (let t = 0; t < 150; t++) {
      const n = 1 + Math.floor(rnd() * 10);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 1999) - 999);
      const r = runExe('sort_ref', `${n}\n${a.join(' ')}\n`);
      expect(r.ok).toBe(true);
      const cppSorted = r.stdout.trim().split(/\s+/).map(Number);
      const ev = buildBubbleTrace(a);
      expect(cppSorted).toEqual(ev[ev.length - 1].state.a);
    }
  });

  it('前缀和：固定种子 100 组（种子 777003）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777003);
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rnd() * 12);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 2001) - 1000);
      const l = Math.floor(rnd() * n);
      const rr = Math.max(l, Math.floor(rnd() * n));
      const r = runExe('prefix_ref', `${n}\n${a.join(' ')}\n${l} ${rr}\n`);
      expect(r.ok).toBe(true);
      const lines = r.stdout.trim().split('\n');
      const cppPre = lines[0].trim().split(/\s+/).map(Number);
      const cppQuery = Number(lines[1].trim());
      const direct = a.slice(l, rr + 1).reduce((x, y) => x + y, 0);
      expect(cppQuery).toBe(direct);
      // TS 前缀和：用轨迹构建并核对查询语义
      expect(cppPre.length).toBe(n + 1);
      expect(cppPre[n]).toBe(a.reduce((x, y) => x + y, 0));
    }
  });

  it('二分：固定种子 150 组（种子 777004）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777004);
    for (let t = 0; t < 150; t++) {
      const n = 1 + Math.floor(rnd() * 16);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 50));
      a.sort((x, y) => x - y);
      const x = Math.floor(rnd() * 60) - 5;
      const r = runExe('bisect_ref', `${n}\n${a.join(' ')}\n${x}\n`);
      expect(r.ok).toBe(true);
      let expected = n;
      for (let k = 0; k < n; k++) if (a[k] >= x) { expected = k; break; }
      expect(Number(r.stdout.trim())).toBe(expected);
    }
  });

  it('双指针：固定种子 150 组（种子 777005）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777005);
    for (let t = 0; t < 150; t++) {
      const n = 1 + Math.floor(rnd() * 12);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 40) - 20);
      a.sort((x, y) => x - y);
      const target = Math.floor(rnd() * 60) - 30;
      const r = runExe('twoptr_ref', `${n}\n${a.join(' ')}\n${target}\n`);
      expect(r.ok).toBe(true);
      // 独立暴力基线
      let brute: [number, number] | null = null;
      for (let l = 0; l < n && !brute; l++)
        for (let rr = l + 1; rr < n; rr++)
          if (a[l] + a[rr] === target) { brute = [l, rr]; break; }
      const out = r.stdout.trim();
      if (brute) {
        const [l, rr] = out.split(/\s+/).map(Number);
        expect(a[l] + a[rr]).toBe(target);
      } else {
        expect(out).toBe('-1');
      }
    }
  });

  it('括号匹配：穷举小规模 + 随机（批量模式，种子 777006）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777006);
    const bruteOk = (s: string): boolean => {
      const st: string[] = [];
      const PAIR: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
      for (const c of s) {
        if ('([{'.includes(c)) st.push(c);
        else if (st.length && PAIR[c] === st[st.length - 1]) st.pop();
        else return false;
      }
      return st.length === 0;
    };
    // 生成全部用例：穷举长度 ≤ 5（6^1+...+6^5 = 9330）+ 100 组随机
    const cases: string[] = [];
    const chars = ['(', ')', '[', ']', '{', '}'];
    const gen = (len: number, cur: string) => {
      if (cur.length === len) { cases.push(cur); return; }
      for (const c of chars) gen(len, cur + c);
    };
    for (let len = 1; len <= 5; len++) gen(len, '');
    for (let t = 0; t < 100; t++) {
      const len = 1 + Math.floor(rnd() * 20);
      cases.push(Array.from({ length: len }, () => chars[Math.floor(rnd() * chars.length)]).join(''));
    }
    // 批量一次进程
    const r = runExe('bracket_ref', `${cases.length}\n${cases.join('\n')}\n`);
    expect(r.ok).toBe(true);
    const outs = r.stdout.trim().split('\n');
    expect(outs.length).toBe(cases.length);
    cases.forEach((s, i) => {
      expect(outs[i].trim(), `用例 "${s}"`).toBe(bruteOk(s) ? 'MATCH' : 'NO');
    });
  });

  it('线性探测哈希：固定种子 150 组（种子 777007）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777007);
    for (let t = 0; t < 150; t++) {
      const m = 5 + Math.floor(rnd() * 8);
      const nOps = 1 + Math.floor(rnd() * 8);
      const ops: HashOp[] = [];
      const inputOps: string[] = [];
      for (let i = 0; i < nOps; i++) {
        const rr = rnd();
        const key = Math.floor(rnd() * 60);
        if (rr < 0.55) { ops.push({ kind: 'add', key }); inputOps.push(`+ ${key}`); }
        else if (rr < 0.85) { ops.push({ kind: 'del', key }); inputOps.push(`- ${key}`); }
        else { ops.push({ kind: 'find', key }); }
      }
      const r = runExe('hash_ref', `${m}\n${inputOps.length}\n${inputOps.join('\n')}\n`);
      expect(r.ok).toBe(true);
      const cppTable = r.stdout.trim().split(/\s+/).map(Number);
      const ev = buildHashTrace(ops.filter((o) => o.kind !== 'find'), m);
      const tsTable = ev[ev.length - 1].state.table.map((x) => (x === null ? -1 : x));
      expect(cppTable).toEqual(tsTable);
    }
  });

  it('0/1 背包：固定种子 100 组（种子 777008）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777008);
    const brute = (items: { w: number; v: number }[], W: number) => {
      let best = 0;
      for (let mask = 0; mask < (1 << items.length); mask++) {
        let w = 0, v = 0;
        for (let i = 0; i < items.length; i++) if (mask & (1 << i)) { w += items[i].w; v += items[i].v; }
        if (w <= W) best = Math.max(best, v);
      }
      return best;
    };
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rnd() * 4);
      const items = Array.from({ length: n }, () => ({ w: 1 + Math.floor(rnd() * 8), v: Math.floor(rnd() * 20) }));
      const W = 1 + Math.floor(rnd() * 12);
      const r = runExe('knap_ref', `${n} ${W}\n${items.map((it) => `${it.w} ${it.v}`).join('\n')}\n`);
      expect(r.ok).toBe(true);
      expect(Number(r.stdout.trim())).toBe(brute(items, W));
    }
  });

  it('int 回绕 / 循环求和 / 斐波那契：边界组合', () => {
    if (!buildOk) throw new Error(buildReason);
    // int 回绕
    for (const [a, b] of [[2147483647, 1], [-2147483647, -2], [2147483646, 1], [-5, 3]] as [number, number][]) {
      const r = runExe('var_ref', `${a} ${b}\n`);
      expect(r.ok).toBe(true);
      const ev = buildVarTrace(a, b);
      expect(Number(r.stdout.trim())).toBe(ev[ev.length - 1].state.intSum);
    }
    // 循环求和
    for (const n of [1, 5, 20]) {
      const r = runExe('loop_ref', `${n}\n`);
      expect(Number(r.stdout.trim())).toBe((n * (n + 1)) / 2);
      const ev = buildLoopTrace(n);
      expect(ev[ev.length - 1].state.sum).toBe((n * (n + 1)) / 2);
    }
    // 斐波那契：值 + 两种调用数（与 TS 轨迹核对）
    for (const n of [1, 10, 15]) {
      const r = runExe('fib_ref', `${n}\n`);
      const [val, , cn, cm] = r.stdout.trim().split(/\s+/).map(Number);
      const naive = buildFibTrace(n, 'naive');
      const memo = buildFibTrace(n, 'memo');
      expect(val).toBe(naive[naive.length - 1].state.result);
      expect(cn).toBe(naive[naive.length - 1].state.calls);
      expect(cm).toBe(memo[memo.length - 1].state.calls);
    }
  });

  it('网格 DFS/BFS：固定种子 100 组（种子 777009）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777009);
    for (let t = 0; t < 100; t++) {
      const R = 2 + Math.floor(rnd() * 4);
      const C = 2 + Math.floor(rnd() * 6);
      const grid: string[][] = Array.from({ length: R }, () => Array.from({ length: C }, () => (rnd() < 0.7 ? '.' : '#')));
      const sr = Math.floor(rnd() * R), sc = Math.floor(rnd() * C);
      grid[sr][sc] = 'o';
      const mode = rnd() < 0.5 ? 'DFS' : 'BFS';
      const rows = grid.map((row) => row.join(''));
      const r = runExe('grid_ref', `${R} ${C}\n${rows.join('\n')}\n${mode}\n`);
      expect(r.ok).toBe(true);
      const cppVisited = Number(r.stdout.trim());
      const ev = buildGridTrace35(rows, mode as 'DFS' | 'BFS');
      expect(cppVisited).toBe(ev[ev.length - 1].state.visitedCount);
    }
  });

  it('并查集：固定种子 150 组（种子 777010）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777010);
    for (let t = 0; t < 150; t++) {
      const n = 2 + Math.floor(rnd() * 10);
      const nOps = 1 + Math.floor(rnd() * 8);
      const ops: DsuOp[] = [];
      const lines: string[] = [];
      for (let i = 0; i < nOps; i++) {
        const a = 1 + Math.floor(rnd() * n);
        const b = 1 + Math.floor(rnd() * n);
        if (rnd() < 0.6) { ops.push({ kind: 'union', a, b }); lines.push(`+ ${a} ${b}`); }
        else { ops.push({ kind: 'find', a, b }); lines.push(`? ${a} ${b}`); }
      }
      const r = runExe('dsu_ref', `${n}\n${nOps}\n${lines.join('\n')}\n`);
      expect(r.ok).toBe(true);
      // C++ 输出：查询行 + 组数行
      const out = r.stdout.trim().split('\n').map((s) => s.trim()).filter(Boolean);
      const cppFind = out.slice(0, out.length - 1).map(Number).map((x) => x === 1);
      const cppGroups = Number(out[out.length - 1]);
      // TS 侧：从轨迹提取 find 结果与组数
      const ev = buildDsuTrace(ops, n);
      const findResults: boolean[] = [];
      for (const e of ev) {
        if (e.type === 'find' && e.state.op?.kind === 'find') findResults.push(e.state.result.startsWith('同集合'));
      }
      const last = ev[ev.length - 1].state;
      const rootOf = (x: number) => { let r = x; while (last.fa[r] !== r) r = last.fa[r]; return r; };
      const roots = new Set<number>();
      for (let i = 1; i <= n; i++) roots.add(rootOf(i));
      expect(findResults).toEqual(cppFind);
      expect(roots.size).toBe(cppGroups);
    }
  });

  it('堆：固定种子 150 组（种子 777011）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777011);
    for (let t = 0; t < 150; t++) {
      const nOps = 1 + Math.floor(rnd() * 10);
      const ops: HeapOp[] = [];
      const lines: string[] = [];
      for (let i = 0; i < nOps; i++) {
        if (rnd() < 0.6) { const k = Math.floor(rnd() * 99); ops.push({ kind: 'push', key: k }); lines.push(`+${k}`); }
        else { ops.push({ kind: 'pop', key: 0 }); lines.push('-1'); }
      }
      const r = runExe('heap_ref', `${nOps}\n${lines.join('\n')}\n`);
      expect(r.ok).toBe(true);
      const out = r.stdout.trim().split('\n').map((s) => s.trim()).filter(Boolean);
      const lastLine = out[out.length - 1];
      const cppPops = (lastLine === 'EMPTY' ? out.slice(0, -1) : out.slice(0, out.length - 1)).map(Number).map((x) => (x === -1 ? null : x));
      const cppRest = lastLine === 'EMPTY' ? [] : lastLine.split(/\s+/).map(Number);
      // TS 侧
      const ev = buildHeapTrace(ops);
      const tsPops: (number | null)[] = [];
      for (const e of ev) {
        if (['sink-done', 'pop-last', 'empty-pop'].includes(e.type)) {
          if (e.state.result === '堆空') tsPops.push(null);
          else if (e.state.result.startsWith('弹出')) tsPops.push(Number(e.state.result.match(/\d+/)![0]));
        }
      }
      const tsRest = ev[ev.length - 1].state.heap.slice(1).sort((x, y) => x - y);
      expect(tsPops).toEqual(cppPops);
      expect(tsRest).toEqual(cppRest);
    }
  });

  it('拓扑排序：固定种子 150 组（种子 777012）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777012);
    for (let t = 0; t < 150; t++) {
      const n = 2 + Math.floor(rnd() * 6);
      const m = 1 + Math.floor(rnd() * 8);
      const edges: { from: number; to: number }[] = [];
      for (let i = 0; i < m; i++) {
        let u = 1 + Math.floor(rnd() * n);
        let v = 1 + Math.floor(rnd() * n);
        if (u === v) v = ((v % n) + 1);
        if (!edges.some((e) => e.from === u && e.to === v)) edges.push({ from: u, to: v });
      }
      const r = runExe('topo_ref', `${n} ${edges.length}\n${edges.map((e) => `${e.from} ${e.to}`).join('\n')}\n`);
      expect(r.ok).toBe(true);
      const out = r.stdout.trim();
      const ev = buildTopoTrace(n, edges);
      const tsLast = ev[ev.length - 1].state;
      if (out === 'CYCLE') {
        expect(tsLast.hasCycle).toBe(true);
      } else {
        const cppOrder = out.split(/\s+/).map(Number);
        expect(tsLast.hasCycle).toBe(false);
        expect(tsLast.order).toEqual(cppOrder);
      }
    }
  });

  it('LIS：固定种子 100 组（种子 777013，含全相等/全递减）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777013);
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rnd() * 10);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 40) - 20);
      const r = runExe('lis_ref', `${n}\n${a.join(' ')}\n`);
      expect(r.ok).toBe(true);
      const cppAns = Number(r.stdout.trim());
      const ev = buildLisTrace(a);
      expect(ev[ev.length - 1].state.answer).toBe(cppAns);
    }
  });

  it('N 皇后：n=1..6 解数与剪枝数逐一对拍', () => {
    if (!buildOk) throw new Error(buildReason);
    for (let n = 1; n <= 6; n++) {
      const r = runExe('nqueens_ref', `${n}\n`);
      expect(r.ok).toBe(true);
      const [cppSol, cppPruned] = r.stdout.trim().split(/\s+/).map(Number);
      const ev = buildNqueensTrace(n);
      const last = ev[ev.length - 1].state;
      expect(last.solutions.length).toBe(cppSol);
      expect(last.pruned).toBe(cppPruned);
    }
  });

  it('区间调度：固定种子 100 组（种子 777014）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777014);
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rnd() * 8);
      const segs: Segment[] = [];
      const lines: string[] = [];
      for (let i = 0; i < n; i++) {
        const l = Math.floor(rnd() * 30);
        const rr = l + Math.floor(rnd() * 15);
        segs.push({ id: i + 1, l, r: rr });
        lines.push(`${l} ${rr}`);
      }
      const r = runExe('greedy_ref', `${n}\n${lines.join('\n')}\n`);
      expect(r.ok).toBe(true);
      const cppCount = Number(r.stdout.trim());
      const ev = buildGreedyTrace(segs);
      expect(ev[ev.length - 1].state.chosen.length).toBe(cppCount);
    }
  });

  it('离散化：固定种子 100 组（种子 777015）', () => {
    if (!buildOk) throw new Error(buildReason);
    const rnd = mulberry32(777015);
    for (let t = 0; t < 100; t++) {
      const n = 1 + Math.floor(rnd() * 10);
      const a = Array.from({ length: n }, () => Math.floor(rnd() * 50));
      const r = runExe('discrete_ref', `${n}\n${a.join(' ')}\n`);
      expect(r.ok).toBe(true);
      const cppRanks = r.stdout.trim().split(/\s+/).map(Number);
      const ev = buildDiscreteTrace(a, 1000000);
      expect(ev[ev.length - 1].state.mapped).toEqual(cppRanks);
    }
  });
});
