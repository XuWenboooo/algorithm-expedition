import { useState } from 'react';
import { StandardCoursePage, CourseSpec } from '../courses/CoursePage';
import { courseById } from '../courses/registry';
import { buildKmpBuildTrace, buildKmpMatchTrace, validateKmpInput, validateKmpMatchInput, piNaive } from '../algorithms/kmp';
import { KmpBuildState, KmpMatchState, KmpBuildEvent, KmpMatchEvent } from '../algorithms/kmp';
import { CellRow, Cell } from '../ui/CellView';

/* ================= 展示用 C++ 代码（与轨迹行号严格对应） ================= */

const CPP_BUILD = `// pi[i] = 模式串 p[0..i] 的最长相等真前后缀长度（本项目采用的定义）
vector<int> buildPi(const string& p) {
    int m = (int)p.size();
    vector<int> pi(m, 0);
    for (int i = 1; i < m; i++) {
        int j = pi[i - 1];
        while (j > 0 && p[i] != p[j]) j = pi[j - 1]; // 失配回退
        if (p[i] == p[j]) j++;                        // 匹配则延长
        pi[i] = j;
    }
    return pi;
}
`;

const CPP_MATCH = `// 返回 p 在 t 中所有出现位置（0-based，可能有重叠）
vector<int> kmpSearch(const string& t, const string& p) {
    vector<int> res;
    int n = (int)t.size(), m = (int)p.size();
    if (m == 0) return res;                  // 空模式串约定：不匹配
    vector<int> pi = buildPi(p);
    int j = 0;                                // j = 已匹配长度 = 下一待比较下标
    for (int i = 0; i < n; ) {
        if (j > 0 && t[i] != p[j]) j = pi[j - 1];   // 失配：i 不动，j 回退（=模式串右滑）
        else if (t[i] == p[j]) { i++; j++; }         // 相等：双前进
        else i++;                                    // j==0 失配：主串前进
        if (j == m) {                          // 完整匹配
            res.push_back(i - m);
            j = pi[j - 1];                     // 继续找下一个出现
        }
    }
    return res;
}
`;

const CPP_FULL = `#include <bits/stdc++.h>
using namespace std;

${CPP_BUILD}
${CPP_MATCH}
int main() {
    string t, p;
    cin >> t >> p;                    // 输入：主串 模式串
    if (p.empty()) {                  // 空模式串：本实现约定不匹配
        cout << 0 << "\\n";
        return 0;
    }
    vector<int> pi = buildPi(p);
    for (int i = 0; i < (int)pi.size(); i++) {
        cout << pi[i] << " \\n"[i + 1 == (int)pi.size()];
    }
    vector<int> occ = kmpSearch(t, p);
    cout << occ.size() << "\\n";
    for (int i = 0; i < (int)occ.size(); i++) {
        cout << occ[i] << " \\n"[i + 1 == (int)occ.size()];
    }
    return 0;
}
`;

/* ================= 前后缀观察器（ABXYZAB 教学例） ================= */

function BorderObserver() {
  const [s, setS] = useState('ABXYZAB');
  const [k, setK] = useState(2);
  const clean = s.replace(/\s+/g, '');
  const valid = /^[A-Za-z0-9]{1,20}$/.test(clean);
  const n = clean.length;
  const kk = Math.max(0, Math.min(k, n - 1)); // 真前后缀必须严格短于整串
  const isProper = kk >= 1 && kk < n;
  const prefix = isProper ? clean.slice(0, kk) : '';
  const suffix = isProper ? clean.slice(n - kk) : '';
  const equal = prefix === suffix && isProper;
  const touch = isProper && kk * 2 > n; // 前后缀重叠（接触）

  const cells: Cell[] = clean.split('').map((ch, i) => {
    let state = 'idle';
    if (isProper && i < kk) state = 'active';
    if (isProper && i >= n - kk) state = i < kk ? 'match' : 'compare';
    if (equal && i < kk) state = 'match';
    return { text: ch, state, mark: undefined };
  });

  return (
    <div className="card" data-testid="border-observer">
      <h3>🔎 真前后缀观察器（教学例：ABXYZAB —— 前后缀中间隔开、不接触）</h3>
      <p className="small muted">
        真前缀 = 从开头开始但不能是整个串；真后缀同理。"最长相等真前后缀"就是 pi 表的答案。
        用 ABXYZAB 观察：真前后缀 "AB" 被 "XYZ" 隔开，一眼就能分开看。也可以输入 AAAA 这类串观察"前后缀可以重叠"。
      </p>
      <div className="input-row">
        <label className="field">
          <span>观察串（≤20 字母数字）</span>
          <input data-testid="observer-input" value={s} onChange={(e) => {
            const next = e.target.value;
            setS(next);
            // 输入变短时 k 夹取到新的合法上界，而不是粗暴重置
            const maxK = Math.max(0, next.replace(/\s+/g, '').length - 1);
            setK((old) => Math.min(old, maxK));
          }} />
        </label>
        <label className="field">
          <span>前后缀长度 k（1 ~ {Math.max(0, n - 1)}）</span>
          <input
            data-testid="observer-k" type="range" min={0} max={Math.max(0, n - 1)} value={kk}
            onChange={(e) => setK(Number(e.target.value))}
          />
        </label>
      </div>
      {!valid ? (
        <div className="err-text">⚠ 请输入 1~20 个英文字母或数字。</div>
      ) : (
        <>
          <CellRow spec={{ key: 'obs', label: `观察串 "${clean}"（k=${kk}）`, cells }} />
          <div className="explain-box" data-testid="observer-verdict">
            {kk === 0 && <>k=0：空串与任何串相等，但长度为 0 不是"最长相等真前后缀"的候选（pi 至少是 0，表示"没有非空真前后缀相等"）。</>}
            {isProper && !equal && <>前缀 <b>"{prefix}"</b> ≠ 后缀 <b>"{suffix}"</b>：不是相等真前后缀。</>}
            {equal && !touch && <>✅ 前缀 <b>"{prefix}"</b> = 后缀 <b>"{suffix}"</b>，且互不接触（中间隔开）——这是一个长度 {kk} 的真 border。</>}
            {equal && touch && <>✅ 前缀 <b>"{prefix}"</b> = 后缀 <b>"{suffix}"</b>，且它们<b>重叠/接触</b>了——允许！真前后缀可以重叠（例如 "AAAA" 取 k=3）。</>}
            {!isProper && kk >= n && <>k 必须严格小于串长（"真"的含义）。</>}
          </div>
          <p className="small">
            这串的 pi 表：<b>[{piNaive(clean).join(', ')}]</b>（每一格 = 最大的那个相等 k）。
          </p>
        </>
      )}
    </div>
  );
}

/* ================= 演示一：构造前缀表 ================= */

const buildDemo = {
  id: 'kmp-build',
  title: '① 构造前缀表 pi（自匹配：模式串和自己比）',
  desc: (
    <p className="small muted">
      pi[i] = p[0..i] 的最长相等真前后缀长度。观察器里的"真前后缀"在这里逐格计算出来。
      蓝色=当前候选左端 p[j]，黄色=正在比较。注意每一步的不变量面板——平台在用暴力法实时核对已算出的每一格。
    </p>
  ),
  fields: [
    { key: 'p', label: '模式串 p（≤40 字母数字）', default: 'ABABAB', width: 220, help: '试试 ABXYZAB、AAAB（连续回退）、AABAAB' },
  ],
  validate: (raw: Record<string, string>) => {
    const v = validateKmpInput(raw.p || '');
    return v.ok ? { ok: true as const, value: v.normalized as string } : { ok: false as const, error: v.error! };
  },
  build: (p: string) => buildKmpBuildTrace(p),
  predict: (cur: KmpBuildEvent | null, next: KmpBuildEvent | null) => {
    if (cur?.type === 'compare' && next) {
      const s = cur.state;
      const willMatch = s.p[s.cmpL] === s.p[s.cmpR];
      return {
        question: `p[${s.cmpR}]='${s.p[s.cmpR]}' 与 p[${s.cmpL}]='${s.p[s.cmpL]}' 会相等吗？`,
        options: ['相等 → 延长候选', '不等 → 回退候选'],
        correct: willMatch ? 0 : 1,
      };
    }
    return null;
  },
  render: (ev: KmpBuildEvent | null, p: string) => {
    const s: KmpBuildState = ev?.state || { phase: 'build', p, pi: new Array(p.length).fill(null), i: 0, j: 0, cmpL: -1, cmpR: -1, assigned: -1, done: false };
    const cells: Cell[] = s.p.split('').map((ch, idx) => {
      const isCmp = idx === s.cmpL || idx === s.cmpR;
      return {
        text: ch,
        state: isCmp ? 'compare' : idx < s.i ? 'done' : 'idle',
        sub: s.pi[idx] === null ? '?' : String(s.pi[idx]),
      };
    });
    const pointers: Record<number, string> = {};
    if (s.cmpL >= 0) pointers[s.cmpL] = 'j';
    pointers[Math.min(s.i, s.p.length - 1)] = (pointers[Math.min(s.i, s.p.length - 1)] ? pointers[Math.min(s.i, s.p.length - 1)] + ',' : '') + 'i';
    return (
      <div>
        <CellRow spec={{ key: 'p', label: '模式串（格内下方 = pi 值，? 表示未计算）', cells, pointers }} />
      </div>
    );
  },
};

/* ================= 演示二：主串匹配（双视角） ================= */

/** 定宽字符条：用于主串-模式串对齐展示 */
function CharStrip({ text, stateOf, marks, offset = 0 }: {
  text: string; stateOf?: (i: number) => string; marks?: Record<number, string>; offset?: number;
}) {
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(<span key={`pad${i}`} style={{ display: 'inline-block', width: 30 }} />);
  for (let i = 0; i < text.length; i++) {
    cells.push(
      <span key={i} className={`cell ${stateOf ? stateOf(i) : ''}`} style={{ minWidth: 30, height: 40 }}>
        {text[i]}
        {marks?.[i] && <span className="state-mark">{marks[i]}</span>}
      </span>
    );
  }
  return <div style={{ display: 'flex', gap: 0, overflowX: 'auto', padding: '2px 0' }}>{cells}</div>;
}

const matchDemo = {
  id: 'kmp-match',
  title: '② 主串匹配（指针视角 ⇄ 滑动视角 同步对比）',
  desc: (
    <p className="small muted">
      左侧"指针视角"显示 i/j 与 pi 表；右侧"滑动视角"把模式串真的画在主串下面——
      <b>j 回退几格，模式串就整体右滑几格</b>，两者是同一件事的两种看法。主串 i 永远只前进，这就是 KMP 快的原因。
    </p>
  ),
  fields: [
    { key: 't', label: '主串 t（≤40）', default: 'ABABABCABABAB', width: 220 },
    { key: 'p', label: '模式串 p（≤40，且 ≤ 主串长）', default: 'ABABAB', width: 220, help: '试试 ABAB（重叠匹配）、AAAB/AAAAAAAB（连续回退）、XYZ（找不到）' },
  ],
  validate: (raw: Record<string, string>) => {
    const v = validateKmpMatchInput(raw.t || '', raw.p || '');
    return v.ok ? { ok: true as const, value: v.normalized as { t: string; p: string } } : { ok: false as const, error: v.error! };
  },
  build: (v: { t: string; p: string }) => buildKmpMatchTrace(v.t, v.p),
  predict: (cur: KmpMatchEvent | null, next: KmpMatchEvent | null) => {
    if (cur?.type === 'compare' && next) {
      const s = cur.state;
      const willMatch = s.t[s.cmpT] === s.p[s.cmpP];
      return {
        question: `t[${s.cmpT}]='${s.t[s.cmpT]}' 与 p[${s.cmpP}]='${s.p[s.cmpP]}' 会相等吗？`,
        options: ['相等 → i、j 同时 +1', '不等 → i 不动，j 回退'],
        correct: willMatch ? 0 : 1,
      };
    }
    return null;
  },
  render: (ev: KmpMatchEvent | null, v: { t: string; p: string }) => {
    const s: KmpMatchState = ev?.state || {
      phase: 'match', t: v.t, p: v.p, pi: piNaive(v.p), i: 0, j: 0, cmpT: -1, cmpP: -1,
      align: 0, lastFallback: null, matches: [], done: false,
    };
    const { t, p, pi, i, j, cmpT, cmpP, align, matches } = s;

    // 指针视角：主串行 + 模式串行（各自从 0 开始）+ pi 表
    const piCells: Cell[] = pi.map((x, idx) => ({
      text: String(x),
      state: idx < j ? 'active' : 'idle',
      sub: `p[${idx}]`,
    }));

    // 滑动视角：模式串画在主串下方 align 处
    const slideState = (piIdx: number) => {
      if (cmpT >= 0 && cmpP >= 0 && cmpT === align + piIdx) {
        return piIdx < j ? 'match' : 'compare';
      }
      if (piIdx < j) return 'match';
      return 'idle';
    };

    return (
      <div>
        <div className="dual-view">
          <div className="view-box" data-testid="pointer-view">
            <div className="vt">指针视角（变量与 pi 表）</div>
            <CharStrip text={t} stateOf={(idx) => (idx === cmpT ? 'compare' : idx < i ? 'done' : 'idle')}
              marks={cmpT >= 0 ? { [cmpT]: 'i' } : {}} />
            <div style={{ marginTop: 6 }} />
            <CharStrip text={p} stateOf={(idx) => (idx === cmpP ? 'compare' : idx < j ? 'match' : 'idle')}
              marks={cmpP >= 0 ? { [cmpP]: 'j' } : {}} />
            <p className="small muted" style={{ margin: '6px 0 2px' }}>
              pi 表（蓝色 = 正在使用的部分）：第 {Math.max(0, j - 1)} 格将决定回退目标
            </p>
            <CellRow spec={{ key: 'pi', cells: piCells, showIndex: true }} />
          </div>
          <div className="view-box" data-testid="slide-view">
            <div className="vt">滑动视角（模式串贴在主串下方，窗口起点 = i − j = {align}）</div>
            <CharStrip text={t} stateOf={(idx) => (idx === cmpT ? 'compare' : idx < i ? 'done' : 'idle')} />
            <CharStrip
              text={p}
              offset={align}
              stateOf={slideState}
            />
            {s.lastFallback && (
              <p className="small" data-testid="fallback-note">
                ⬅ 本次回退：j 从 {s.lastFallback.from} → {s.lastFallback.to}，等效滑动量 = {s.lastFallback.from} − {s.lastFallback.to} ={' '}
                <b>{s.lastFallback.from - s.lastFallback.to}</b> 格（模式串窗口 {Math.max(0, align - (s.lastFallback.from - s.lastFallback.to))} → {align}）
              </p>
            )}
            {matches.length > 0 && (
              <p className="small result-ok">已找到出现位置：[{matches.join(', ')}]</p>
            )}
          </div>
        </div>
      </div>
    );
  },
};

/* ================= 课程组装 ================= */

const kmpSpec: CourseSpec = {
  meta: courseById('kmp')!,
  goals: [
    '能不看书写出 buildPi 与 kmpSearch，并解释每一行的作用',
    '能说明 pi[i] 的定义（最长相等真前后缀），并手动计算长度 ≤ 8 的模式串的 pi 表',
    '能解释"j 回退"与"模式串右滑"为什么是同一件事，并算出滑动量 = 旧 j − 新 j',
    '能说出 KMP 正确性的核心：主串指针 i 不回退、利用已匹配前缀的 border 信息继续对齐',
    '知道 KMP 的时间复杂度 O(n+m) 及其均摊证明思路',
  ],
  prereq: [
    '《数组、下标与字符串》：会遍历字符串、理解下标从 0 开始',
    '《条件与循环》：会 while / for',
    '不需要任何字符串算法基础——KMP 是本阶段字符串方向的入口',
  ],
  story: (
    <>
      <p>
        你在长长的一串列车车厢（主串）里找一段特定的车厢序列（模式串）。笨办法是：每次失配就把模式串
        <b>退回开头</b>，主串也<b>往回退一格</b>重新比——大量已经看过的信息全部作废。
      </p>
      <p>
        聪明的售票员会说："刚才比过的那几个车厢我已经记住了——失配时模式串不用退回开头，只需要滑到
        一个<b>已经天然对齐</b>的位置。"这个"天然对齐"由什么决定？由模式串<b>自己的开头和刚才结尾的重合程度</b>决定，
        也就是 <b>最长相等真前后缀</b>。KMP = 先给模式串做"自我介绍"（pi 表），再用它加速主串搜索。
      </p>
    </>
  ),
  derivation: (
    <>
      <h3>第 0 步：朴素匹配</h3>
      <p>枚举每个起点 s，逐位比较。最坏 O(n·m)：例如 t = AAAAAAA，p = AAAB 时每次都要比到第 4 位才失败。</p>
      <h3>第 1 步：关键观察——失配时我们到底知道什么？</h3>
      <p>
        已经匹配的前缀 p[0..j-1] 出现在主串里。若它有一个相等真前后缀 "AB"（长度 k），
        那么把模式串右滑 j−k 格后，模式串开头 k 个字符<b>自动与主串对齐</b>——根本不用重新比！
      </p>
      <h3>第 2 步：为了滑得最远，取最长的 k</h3>
      <p>滑得越少错过的可能性越少（漏解风险），但为了不漏解必须取<b>最长</b>的那个相等真前后缀——这就是 pi。</p>
      <h3>第 3 步：pi 表怎么快速算？模式串和自己匹配</h3>
      <p>
        令模式串既当主串又当模式串：pi[i] 可以从 pi[i-1] 递推——候选答案不会凭空出现，
        它一定是"上一个答案的答案"。这构成 O(m) 构造，加上 O(n) 匹配，总 O(n+m)。
      </p>
    </>
  ),
  demos: [buildDemo, matchDemo],
  below: <BorderObserver />,
  invariants: (
    <>
      <h3>核心不变量（轨迹每一步都在检查）</h3>
      <ul>
        <li><b>构造阶段</b>：任何时刻，已计算的 pi[0..i-1] 每一格都等于暴力定义值（平台实时用暴力法核对，可以在不变量面板看到）。</li>
        <li><b>匹配阶段</b>：j 永远等于"模式串窗口起点 align = i − j 到 i 的已匹配长度"，且 p[0..j-1] === t[align..i-1]。失配回退后新窗口的不变量由 pi 的定义保证。</li>
        <li><b>j 的双重含义</b>：j 既是"已匹配长度"，又是"下一个待比较下标 p[j]"——失配时主串 i 保持不变，j = pi[j-1]。</li>
      </ul>
      <h3>适用条件</h3>
      <ul>
        <li>适用于任意字母表的单模式串匹配；可重叠计数（每次 j==m 都记录，不做清零处理）。</li>
        <li>空模式串在本项目约定为"不匹配"（C++ 代码同样如此处理，界面上会直接提示）。</li>
      </ul>
      <h3>典型反例（试着在演示里复现）</h3>
      <ul>
        <li>想当然认为"失配就回退一格"：对 t=AAAAAAAB, p=AAAB，朴素法会退化，KMP 靠 pi=[0,1,2,0] 一次滑到位。</li>
        <li>认为"真前后缀不能重叠"：错。AAAA 的 pi=[0,1,2,3]，重叠完全合法（用观察器输入 AAAA 看看）。</li>
        <li>把 pi[j-1] 写成 pi[j]：会越界或死循环——这正是错题本该记的条目。</li>
      </ul>
      <p className="muted small">术语约定：部分教材把这张表叫 next 数组且整体偏移 1 位（next[i] = pi[i-1]），含义相同。本站统一采用 pi 定义。</p>
    </>
  ),
  complexity: (
    <ul>
      <li><b>构造 pi</b>：均摊 O(m)。直观证明：j 每次比较最多 +1（最多 m 次），每次回退至少 −1，回退总量 ≤ 增量总量。</li>
      <li><b>匹配</b>：均摊 O(n + m)，同理（i 只前进，j 的总回退量受总前进量限制）。</li>
      <li><b>空间</b>：O(m) 存 pi 表。</li>
      <li><b>最坏情况示例</b>：t = Aⁿ，p = A^(m-1)B：朴素法 Θ(n·m)，KMP 仍 O(n+m)——你可以在演示里输入看看。</li>
    </ul>
  ),
  code: [
    { title: 'buildPi：构造前缀表', code: CPP_BUILD, note: '与上方"构造前缀表"演示逐行对应（行号一致）。' },
    { title: 'kmpSearch：主串匹配', code: CPP_MATCH, note: '与上方"主串匹配"演示逐行对应。' },
    { title: '完整程序（可编译运行：读入主串与模式串，输出 pi 表与所有出现位置）', code: CPP_FULL, note: '本平台已实际用 MSVC C++17 编译此程序并与可视化内核对拍（见交付报告）。' },
  ],
  exercises: [
    {
      id: 'kmp-ex1', level: 1, kind: 'answer',
      title: '手动填写 pi 表（引导）',
      statement: <>模式串 p = <b>ABABC</b>。请手算并输入 pi 表，用逗号分隔 5 个数字（例如 0,0,...）。提示：逐格问"这个前缀的结尾能不能拼上开头"。</>,
      answer: '0,0,1,2,0',
      answerPattern: '格式：0,0,1,2,0',
      hints: [
        'pi[0] 永远是 0（单字符没有真前后缀）。',
        '看 pi[2]：前缀 "ABA" 结尾是 A，开头也是 A，所以至少是 1；能是 2 吗？AB≠BA。',
        'pi[3]：p[3]=B 接在长度 1 的候选 "A" 后面 → "AB"，开头恰好是 AB！',
        'pi[4]：从 pi[3]=2 出发，p[4]=C 与 p[2]=A 失配 → 回退 pi[1]=0 → C 与 p[0]=A 失配 → 0。',
      ],
      solution: <>pi = <b>0,0,1,2,0</b>。用上方演示输入 ABABC 自己走一遍，对照每一步的回退。</>,
    },
    {
      id: 'kmp-ex2', level: 2, kind: 'answer',
      title: '找所有出现位置（独立）',
      statement: <>主串 t = <b>AABAACAABAAX</b>，模式串 p = <b>AABAA</b>。用 KMP 思路（或在演示里验证）找出 p 在 t 中的所有出现位置（0 起始，逗号分隔，按从小到大）。</>,
      answer: '0,6',
      answerPattern: '格式：3,7（示例格式）',
      hints: [
        '先算 p 的 pi 表：AABAA → [0,1,0,1,2]。',
        '第一个匹配在开头就能对上吗？看 t[0..4]。',
        '找到一次后 j = pi[4] = 2，模式串"已经对好了 A A"继续滑——下一次出现只隔几个位置。',
      ],
      solution: <>出现位置 = <b>0 和 6</b>（两次出现重叠共享了 "AA" 前后缀）。在演示二输入验证。</>,
    },
    {
      id: 'kmp-ex3', level: 3, kind: 'choice',
      title: '从 pi 表读出周期（迁移）',
      hints: [
        '先弄清 pi[5]=4 的含义：整个串去掉最后 2 个字符后，前 4 个字符与后 4 个字符完全相同。',
        '"周期"意味着串可以写成某个短串重复若干次；重叠量 pi 越大，周期越短。',
      ],
      statement: <>p = <b>ABABAB</b>（m=6），pi[5] = 4。字符串理论告诉我们：<b>最小周期 = m − pi[m-1]</b>。它的最小周期是多长？为什么 KMP 能免费告诉我们这件事？</>,
      choices: [
        { text: '2（"AB" 循环 3 次）', correct: true, why: 'm − pi[m-1] = 6 − 4 = 2。pi[m-1] 表示去掉一个周期后剩下的部分仍与开头重合，所以周期长度 = m − pi[m-1]。' },
        { text: '4（pi 的值本身）', why: 'pi 是最长相等真前后缀的长度，不是周期；它告诉我们"重叠了多少"，周期 = m 减去这个重叠量。' },
        { text: '6（整个串自身）', why: '整个串是平凡的周期；问"最小周期"要找最短的循环节。' },
        { text: '3', why: 'ABABAB 里没有长度为 3 的循环节（ABA≠BAB）。' },
      ],
      solution: <>最小周期 = 6 − 4 = 2。这个性质在"求字符串循环节"类题目中直接使用；AC 自动机等后续内容也建立在 pi 思想上。</>,
    },
  ],
  pitfalls: (
    <ul>
      <li>把 <code>pi[j-1]</code> 写成 <code>pi[j]</code>：越界或错误回退。</li>
      <li>匹配成功后忘记 <code>j = pi[j-1]</code>：只能找到第一个出现位置。</li>
      <li>构造时写成 <code>while (j &gt; 0 &amp;&amp; p[i] != p[j]) j--;</code>：退化成 O(m²)，就不是 KMP 了。</li>
      <li>读入用 <code>cin &gt;&gt; s</code> 但题目含空格：应使用 getline 并处理换行残留。</li>
    </ul>
  ),
};

export function KmpPage() {
  return <StandardCoursePage spec={kmpSpec} />;
}
