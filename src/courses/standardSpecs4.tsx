/**
 * 标准课程规格 · 第四部分：回溯剪枝、离散化与贪心入门（第三批扩展）。
 */
import { CourseSpec } from './CoursePage';
import { courseById } from './registry';
import { Demo } from './demoKit';
import { CellRow, Cell, VarChips } from '../ui/CellView';
import {
  buildNqueensTrace, buildGreedyTrace, buildDiscreteTrace,
  validateNqueensInput, validateGreedyInput, validateDiscreteInput,
  NqueensState, GreedyState, DiscreteState, Segment,
} from '../algorithms/batch3';

function cellsOf(arr: (string | number)[], states?: (i: number) => string, subs?: (i: number) => string | undefined): Cell[] {
  return arr.map((v, i) => ({ text: String(v), state: states ? states(i) : undefined, sub: subs ? subs(i) : undefined }));
}

/* ================= 17. backtracking 回溯与剪枝 ================= */

const nqueensDemo: Demo<number, NqueensState> = {
  id: 'nqueens-demo',
  title: '演示：N 皇后（回溯 + 冲突剪枝）',
  desc: <p className="small muted">逐行决策：每列尝试要么"放"（递归下一行）要么"冲突剪枝"（整棵子树直接跳过）。n≤6 保证轨迹可读。数一数剪枝救了多少次尝试。</p>,
  fields: [{ key: 'n', label: '棋盘大小 n（1~6）', default: '4', width: 100 }],
  validate: (raw) => {
    const v = validateNqueensInput(raw);
    return v.ok ? { ok: true, value: v.normalized as number } : { ok: false, error: v.error! };
  },
  build: (n) => buildNqueensTrace(n),
  predict: (cur) => {
    if (cur?.type === 'try') {
      const s = cur.state;
      return { question: `第 ${s.row} 行第 ${s.tryingCol} 列会冲突吗？`, options: ['冲突 → 剪枝跳过', '不冲突 → 放置'], correct: s.conflictWith !== null ? 0 : 1 };
    }
    return null;
  },
  render: (ev, v) => {
    const s: NqueensState = ev?.state || { n: v, board: new Array(v).fill(-1), row: 0, tryingCol: -1, conflictWith: null, placed: 0, backtracks: 0, pruned: 0, solutions: [], done: false };
    return (
      <div>
        <div className="cellrow-wrap" data-testid="chessboard">
          <div className="cellrow-label">棋盘（♛ = 已放皇后；黄 = 本步尝试位置；红 = 冲突来源行）</div>
          {s.board.map((_, r) => (
            <div key={r} className="cellrow">
              {Array.from({ length: s.n }, (_, c) => {
                const isQueen = s.board[r] === c;
                const isTrying = s.row === r && s.tryingCol === c;
                const isConflictSrc = s.conflictWith === r;
                return (
                  <span key={c} className={`cell ${isTrying ? 'compare' : isConflictSrc ? 'mismatch' : isQueen ? 'match' : 'idle'}`} style={{ minWidth: 40, height: 42 }}>
                    <span>{isQueen ? '♛' : '·'}</span>
                    <span className="sub">{isQueen || isTrying ? `r${r}c${c}` : ''}</span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <VarChips vars={[
          { name: '当前行', value: s.row },
          { name: '已放置', value: s.placed },
          { name: '已找到解', value: s.solutions.length },
          { name: '回溯次数', value: s.backtracks },
          { name: '剪枝次数', value: s.pruned },
        ]} />
      </div>
    );
  },
};

const btSpec: CourseSpec = {
  meta: courseById('backtracking')!,
  goals: [
    '能写出"决策 → 递归 → 撤销"的回溯模板，并解释撤销的必要性',
    '能区分"可行剪枝"（提前排除非法分支）与"最优剪枝"（提前排除更差分支）',
    '能计算朴素枚举 vs 剪枝后搜索空间的数量级差',
    '会在冲突检测中使用 O(1) 标记数组（列/对角线占用）',
  ],
  prereq: ['《DFS 与 BFS》《复杂度与递归》（递归树）'],
  story: (
    <p>走迷宫拿到全部出口：每到一个岔路口先试一条，走不通就退回来换下一条——但退回来之前把脚印擦掉（撤销状态）。聪明的探索者还有"看一眼就放弃整条路"的本事：前方墙上写着死路（冲突标记），不用真的走进去——这就是剪枝。</p>
  ),
  derivation: (
    <>
      <h3>朴素枚举 → 回溯</h3>
      <p>N 皇后朴素：枚举 C(n², n) 种放法逐个检查。观察"逐行放"后每行只需选列 → nⁿ 种。再观察：前 k 行互不攻击时，后面的选择完全不受"前 k 行怎么摆"以外信息影响 → 递归搜索可行分支 = 回溯。</p>
      <h3>剪枝的两层含义</h3>
      <p>可行性剪枝：当前尝试与已放皇后冲突 → 整棵子树（该列的所有后续行）直接跳过——演示里的 pruned 计数就是这些被省掉的尝试。最优性剪枝（本课不展开）：当"当前路径的最优可能值 ≤ 已知答案"时提前返回（搜索 + DP/分支限界）。</p>
    </>
  ),
  demos: [nqueensDemo],
  invariants: (
    <ul>
      <li><b>互不攻击不变量</b>（每步核验）：已放置皇后两两不同列、不同对角线——回溯的正确性全部压在这条不变量上。</li>
      <li><b>撤销一致性</b>：backtrack 事件后状态必须与进入该行之前完全一致（快照可复现保证）。</li>
      <li><b>典型反例</b>：递归后忘记撤销（状态泄漏 → 后续分支被污染）；对角线判断写成 |c1−c2| == |r1−r2| 的绝对值漏负号（应为 |Δc| == |Δr|）。</li>
    </ul>
  ),
  complexity: (
    <ul>
      <li>朴素枚举 nⁿ；回溯最坏仍是指数级（n 皇后解数增长极快），但剪枝把实际搜索空间压缩数个数量级——演示里对比 pruned 与总尝试数。</li>
      <li>空间 O(n)（递归深度 = 行数）。</li>
    </ul>
  ),
  code: [{
    title: '完整程序：N 皇后（回溯 + 剪枝 + 解数统计）',
    code: `#include <bits/stdc++.h>
using namespace std;

int n;
vector<int> board;          // board[r] = 第 r 行皇后所在列
long long solutions = 0;
long long pruned = 0;

bool conflicts(int row, int col) {
    for (int r = 0; r < row; r++) {
        if (board[r] == col) return true;                     // 同列
        if (abs(board[r] - col) == row - r) return true;      // 对角线（|Δc| == |Δr|）
    }
    return false;
}

void solve(int row) {
    if (row == n) {
        solutions++;
        return;
    }
    for (int col = 0; col < n; col++) {
        if (conflicts(row, col)) { pruned++; continue; }      // 剪枝：整棵子树跳过
        board[row] = col;      // 决策
        solve(row + 1);        // 递归
        board[row] = -1;       // 撤销（回溯）——不撤销会污染后续分支
    }
}

int main() {
    cin >> n;
    board.assign(n, -1);
    solve(0);
    cout << "solutions=" << solutions << " pruned=" << pruned << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'bt-ex1', level: 1, kind: 'answer', title: '冲突判断（引导）',
      statement: <>第 2 行皇后在第 4 列（board[2]=4）。第 5 行第 7 列冲突吗？（同对角线 |Δc|==|Δr|）回答"冲突"或"不冲突"。</>,
      answer: '冲突', answerPattern: '格式：冲突 / 不冲突',
      hints: ['Δr = 5−2 = 3；Δc = |7−4| = 3。', '|Δc| == |Δr| 即同一条对角线。'],
      solution: '冲突：|Δc|=3 == |Δr|=3，同在一条对角线上。',
    },
    {
      id: 'bt-ex2', level: 2, kind: 'answer', title: '撤销的作用（独立）',
      statement: <>回溯模板中 `board[row] = -1`（撤销）删掉后，搜索结果会？回答"仍正确"或"错误"。</>,
      answer: '错误', answerPattern: '格式：仍正确 / 错误',
      hints: ['下一列的尝试会看到"上一列残留的皇后"。', 'conflicts 扫描 board[0..row-1]。'],
      solution: '错误：同一行残留在多个列位置的"幽灵皇后"会污染后续冲突判断——这正是演示里每步核验互不攻击不变量能抓出的错误。',
    },
    {
      id: 'bt-ex3', level: 3, kind: 'choice', title: '剪枝威力（迁移）',
      statement: <>朴素枚举 n 皇后是 nⁿ（每行任选一列）。n=6 时 6⁶ = 46656；而演示中 n=6 剪枝后的总尝试数（try 事件数）大约是？</>,
      choices: [
        { text: '几十到几百量级', correct: true, why: '冲突剪枝在每行就砍掉大部分列，实际 try 次数远小于 nⁿ——你可以在演示里数 try 事件数验证。' },
        { text: '与 nⁿ 相同', why: '剪枝跳过的是不进入递归的分支。' },
        { text: '0（剪枝跳过一切）', why: '剪枝只跳过冲突分支，合法分支仍要探索。' },
        { text: 'n⁶', why: '同 nⁿ，这是朴素法。' },
      ],
      solution: '剪枝不是渐近改进（最坏仍指数），但常数到数量级的实际压缩巨大——这是回溯题"看起来能跑"的原因。',
    },
  ],
  pitfalls: <ul><li>忘记撤销状态（幽灵皇后）。</li><li>对角线公式写错（|Δc|==|Δr|，漏 abs）。</li><li>以为剪枝能改变最坏复杂度（不能，只是实际加速）。</li></ul>,
};

/* ================= 18. discrete-greedy 离散化与贪心入门 ================= */

const greedyDemo: Demo<Segment[], GreedyState> = {
  id: 'greedy-demo',
  title: '演示：区间调度贪心（按右端点排序）',
  desc: <p className="small muted">活动选择：选最多互不重叠的区间。按右端点排序后逐个决策（选/跳过都附论证）。交换论证的正确性写在推导里。</p>,
  fields: [{ key: 'intervals', label: '区间（≤10 个，l r）', default: '1 10, 2 3, 4 5, 6 8, 7 9', width: 240 }],
  validate: (raw) => {
    const v = validateGreedyInput(raw);
    return v.ok ? { ok: true, value: v.normalized as Segment[] } : { ok: false, error: v.error! };
  },
  build: (v) => buildGreedyTrace(v),
  render: (ev, v) => {
    const s: GreedyState = ev?.state || {
      intervals: v, sorted: [...v].sort((a, b) => a.r - b.r), idx: 0, lastEnd: null, chosen: [], rejected: [], reason: '', done: false,
    };
    const bars = s.sorted.map((seg) => ({ seg, state: s.chosen.includes(seg.id) ? 'match' : s.rejected.includes(seg.id) ? 'dim' : 'idle' }));
    const maxR = Math.max(...s.sorted.map((x) => x.r), 1);
    return (
      <div>
        <div className="cellrow-wrap">
          <div className="cellrow-label">按右端点排序后的区间条（绿 = 已选，暗 = 已跳过）</div>
          {bars.map(({ seg, state: barState }) => (
            <div key={seg.id} className="cellrow-label" style={{ margin: '2px 0' }}>
              <span className="tag">#{seg.id}</span>
              <span style={{ display: 'inline-block', marginLeft: Math.round((seg.l / maxR) * 320), position: 'relative', width: Math.round(((seg.r - seg.l) / maxR) * 320), height: 14, background: barState === 'match' ? 'var(--ok-soft)' : barState === 'dim' ? '#eef0f5' : 'var(--brand-soft)', border: '1px solid ' + (barState === 'match' ? 'var(--ok)' : 'var(--brand)'), borderRadius: 3 }} />
              <span className="small muted" style={{ marginLeft: 10 }}>[{seg.l}, {seg.r}] {barState === 'match' ? '✓已选' : barState === 'dim' ? '✗跳过' : ''}</span>
            </div>
          ))}
        </div>
        <VarChips vars={[
          { name: '当前占用终点', value: s.lastEnd ?? '—' },
          { name: '已选', value: s.chosen.length ? `[${s.chosen.join(', ')}]` : '—' },
          { name: '选中数', value: s.chosen.length },
        ]} />
      </div>
    );
  },
};

const discreteDemo: Demo<{ vals: number[]; maxVal: number }, DiscreteState> = {
  id: 'discrete-demo',
  title: '演示：离散化（值 → 排名）',
  desc: <p className="small muted">原始值域巨大（可到 20 亿）但真正出现的值很少——排序去重建候选表，二分查排名。相对顺序完全保留。</p>,
  fields: [
    { key: 'vals', label: '原始值（≤10 个，0~999999）', default: '1000000 5 999999999 5 42', width: 260 },
    { key: 'maxVal', label: '名义值域上界', default: '2000000000', width: 140, help: '展示"为什么需要离散化"' },
  ],
  validate: (raw) => {
    const parts = (raw.vals || '').trim().split(/[\s,，]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > 10) return { ok: false as const, error: '需要 1~10 个值，空格分隔。' };
    const vals: number[] = [];
    for (const p of parts) {
      if (!/^\d{1,9}$/.test(p)) return { ok: false as const, error: `"${p}" 不是 0~999999999 的整数。` };
      vals.push(Number(p));
    }
    const vm = validateDiscreteInput(raw);
    if (!vm.ok) return { ok: false as const, error: vm.error! };
    return { ok: true as const, value: { vals, maxVal: vm.normalized as number } };
  },
  build: (v) => buildDiscreteTrace(v.vals, v.maxVal),
  render: (ev, v) => {
    const s: DiscreteState = ev?.state || { raw: v.vals, sortedUnique: [], i: 0, mapped: new Array(v.vals.length).fill(null), done: false };
    const rawCells = cellsOf(s.raw, (i) => (i <= s.i ? 'done' : 'idle'));
    const mapCells = cellsOf(s.mapped.map((x) => (x === null ? '?' : x)), (i) => (i === s.i ? 'compare' : i < s.i ? 'match' : 'idle'));
    return (
      <div>
        <CellRow spec={{ key: 'raw', label: '原始值', cells: rawCells }} />
        <CellRow spec={{ key: 'map', label: '离散化后（排名）', cells: mapCells }} />
        <VarChips vars={[
          { name: '候选表', value: s.sortedUnique.length ? `[${s.sortedUnique.join(', ')}]` : '…' },
          { name: '数组可开大小', value: `${s.sortedUnique.length}（原值域 ${v.maxVal.toLocaleString('zh-CN')}）` },
        ]} />
      </div>
    );
  },
};

const dgSpec: CourseSpec = {
  meta: courseById('discrete-greedy')!,
  goals: [
    '能说出区间调度按右端点贪心的正确性论证（交换论证）框架',
    '能用反例解释其他贪心排序（按左端点/按长度）为什么错',
    '会手写离散化：排序去重 + lower_bound 映射，并说出它保留了什么、丢掉了什么',
    '建立"贪心需要论证"的意识：没有交换论证/反例检查的贪心就是赌博',
  ],
  prereq: ['《排序与比较器》《二分查找与二分答案》（lower_bound）'],
  story: (
    <p>会议室排期：一堆申请，一间会议室，怎么安排最多的会？直觉"先来先得"（按开始时间）会被一个超长的早会毁掉。正确直觉是"先结束的先用"——它把最大的自由度留给了后面。而"直觉"要变成"算法"，必须过论证这一关。</p>
  ),
  derivation: (
    <>
      <h3>交换论证：贪心的标准证明法</h3>
      <p>命题：按右端点排序逐个选，结果最优。证明骨架：若最优解的第一个区间不是"最早结束"的，把最优解的第一个换成"最早结束"的——它结束更早、不会与后续冲突，方案大小不变 → 存在一个含该区间的最优解 → 归纳成立。任何贪心题都该问一句："我的排序依据能用交换论证撑住吗？"</p>
      <h3>离散化：大值域问题的标配预处理</h3>
      <p>值域 10⁹ 但只出现 n ≤ 10⁵ 个值 → 开 10⁹ 的数组必炸。排序去重建候选表，查询"值 v 的排名"用 lower_bound——此后"以值为下标"的一切结构都只需要 O(n) 空间。代价：绝对差值信息丢失（a−b 的数值不再有意义）。</p>
    </>
  ),
  demos: [greedyDemo, discreteDemo],
  invariants: (
    <ul>
      <li><b>互不重叠不变量</b>（贪心每步核验）：已选区间两两不重叠（相邻对检查）。</li>
      <li><b>保序映射不变量</b>（离散化）：排序去重后，原值的相对大小关系在新下标下保持；相同值映射到相同排名。</li>
      <li><b>典型反例</b>（请在演示里复现）：按左端点贪心遇到 [1,10],[2,3],[4,5] 只选 1 个（正确 2 个）；按长度贪心遇到 [1,4],[6,9],[7,8] 会漏。离散化后误用"绝对差"（如判断 a-b=1）。</li>
    </ul>
  ),
  complexity: (
    <ul>
      <li>区间调度：排序 O(n log n) + 扫描 O(n)；空间 O(n)。</li>
      <li>离散化：排序去重 O(n log n) + 每查询二分 O(log n)；空间 O(n)。</li>
    </ul>
  ),
  code: [{
    title: '完整程序：区间调度贪心 + 离散化模板',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // ---- 区间调度：最大不重叠区间数（按右端点贪心）----
    int n;
    cin >> n;
    vector<pair<int, int>> segs(n);          // (r, l)
    for (auto& s : segs) cin >> s.second >> s.first;
    sort(segs.begin(), segs.end());          // 按右端点排序
    int cnt = 0, lastEnd = -1;
    for (auto& [r, l] : segs) {
        if (l >= lastEnd) { cnt++; lastEnd = r; }   // 端点相接视为不重叠
    }
    cout << cnt << "\\n";

    // ---- 离散化：值 → 排名 ----
    int m;
    cin >> m;
    vector<long long> a(m);
    for (auto& x : a) cin >> x;
    vector<long long> cand = a;
    sort(cand.begin(), cand.end());
    cand.erase(unique(cand.begin(), cand.end()), cand.end());   // 排序 + 去重
    for (int i = 0; i < m; i++) {
        // lower_bound = 第一个 >= a[i] 的位置 = a[i] 的排名
        cout << lower_bound(cand.begin(), cand.end(), a[i]) - cand.begin() << " \\n"[i + 1 == m];
    }
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'dg-ex1', level: 1, kind: 'answer', title: '反例识别（引导）',
      statement: <>按"左端点最早"贪心处理 [1,10], [2,3], [4,5]：会选几个区间？</>,
      answer: '1', answerPattern: '格式：1',
      hints: ['[1,10] 起点最早先被选中。', '它占用到 10，后面全被跳过。'],
      solution: '1 个。正确答案 2 个（[2,3] 和 [4,5]）——按右端点贪心才能得到。',
    },
    {
      id: 'dg-ex2', level: 2, kind: 'answer', title: '离散化排名（独立）',
      statement: <>原始值 [100, 5, 100, 7]。离散化后 100 的排名是？与 5、7 的排名各是多少（格式 "100→x, 5→y, 7→z"）。</>,
      answer: '100→2, 5→0, 7→1', answerPattern: '格式：100→2, 5→0, 7→1',
      hints: ['候选表 = 排序去重：[5, 7, 100]。', '排名从 0 开始。'],
      solution: '候选表 [5,7,100]：5→0、7→1、100→2（重复的 100 只占一个位置）。',
    },
    {
      id: 'dg-ex3', level: 3, kind: 'choice', title: '交换论证补全（迁移）',
      statement: <>交换论证的第一步："若最优解不含最早结束的区间 e，则……"接下来应填？</>,
      choices: [
        { text: '把最优解中第一个（最早结束的）区间换成 e，方案大小不变且仍合法 → 存在含 e 的最优解，归纳成立', correct: true, why: 'e 结束最早 → 替换后与新方案的后续区间仍不冲突（e.r ≤ 原首区间.r），大小不变。' },
        { text: '直接丢弃最优解，从头贪心', why: '论证要比较两个解，不是推翻重来。' },
        { text: '证明 e 必在所有最优解中', why: '过强——e 只需在"某个"最优解中即可归纳。' },
        { text: '用反例说明贪心错', why: '本命题贪心正确（有反例的是其他排序依据）。' },
      ],
      solution: '交换论证三步：构造替换 → 替换仍合法且不更差 → 归纳。所有"排序贪心"题都走这个骨架。',
    },
  ],
  pitfalls: <ul><li>贪心不写论证（遇到新型题就翻车）。</li><li>离散化后误用绝对差值信息。</li><li>端点相接语义（l == r 算不算重叠）与题目约定不一致。</li></ul>,
};

/* ================= 注册 ================= */

export const SPECS_PART4: Record<string, CourseSpec> = {
  backtracking: btSpec,
  'discrete-greedy': dgSpec,
};
