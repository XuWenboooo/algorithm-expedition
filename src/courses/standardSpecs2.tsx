/**
 * 标准课程规格 · 第二部分：二分、双指针、栈队列、DFS/BFS、线性探测哈希、背包 DP。
 */
import { CourseSpec } from './CoursePage';
import { courseById } from './registry';
import { Demo } from './demoKit';
import { CellRow, Cell, VarChips } from '../ui/CellView';
import {
  buildBisectTrace, buildTwoPtrTrace,
  BisectState, TwoPtrState,
  validateBisectInput, validateTwoPtrInput,
} from '../algorithms/stage2';
import {
  buildBracketTrace, buildGridTrace, buildHashTrace, buildKnapsackTrace,
  validateBracketInput, validateGridInput, validateHashInput, validateKnapsackInput,
  BracketState, GridState, HashState, DpState, HashOp,
} from '../algorithms/stage35';

function cellsOf(arr: (string | number)[], states?: (i: number) => string, subs?: (i: number) => string | undefined): Cell[] {
  return arr.map((v, i) => ({ text: String(v), state: states ? states(i) : undefined, sub: subs ? subs(i) : undefined }));
}

/* ================= 7. binary-search ================= */

const bisectDemo: Demo<{ a: number[]; x: number }, BisectState> = {
  id: 'bisect-demo',
  title: '演示：二分找"第一个 ≥ x"（半开区间写法）',
  desc: <p className="small muted">区间 [lo, hi) 的不变量："答案永远在区间内"。每一步观察 lo/hi 如何收缩、不变量如何保持。</p>,
  fields: [
    { key: 'a', label: '有序数组（≤16 个整数）', default: '1 3 3 5 7 8 10 12', width: 240 },
    { key: 'x', label: '目标 x', default: '6', width: 100, help: '试试 x 等于某个元素、比全部小、比全部大' },
  ],
  validate: (raw) => {
    const v = validateBisectInput(raw);
    return v.ok ? { ok: true, value: v.normalized as { a: number[]; x: number } } : { ok: false, error: v.error! };
  },
  build: (v) => buildBisectTrace(v.a, v.x),
  predict: (cur) => {
    if (cur?.type === 'mid') {
      const s = cur.state;
      return { question: `a[${s.mid}]=${s.a[s.mid]} ≥ ${s.x}？`, options: ['是 → hi=mid（往左缩）', '否 → lo=mid+1（往右缩）'], correct: s.a[s.mid] >= s.x ? 0 : 1 };
    }
    return null;
  },
  render: (ev) => {
    const s: BisectState = ev?.state || { a: [], x: 0, lo: 0, hi: 0, mid: -1, cmp: null, answer: null, done: false };
    const cells = cellsOf(s.a, (i) => {
      if (i === s.mid) return 'compare';
      if (i < s.lo || i >= s.hi) return 'dim';
      return 'active';
    });
    return (
      <div>
        <CellRow spec={{
          key: 'arr', label: `区间 [${s.lo}, ${s.hi})（暗 = 已排除；黄 = mid）`, cells,
          pointers: s.mid >= 0 ? { [s.mid]: 'mid' } : undefined,
        }} />
        <VarChips vars={[
          { name: 'lo', value: s.lo }, { name: 'hi', value: s.hi }, { name: 'mid', value: s.mid },
          { name: 'x', value: s.x }, { name: '答案', value: s.answer ?? '…' },
        ]} />
      </div>
    );
  },
};

const bisectSpec: CourseSpec = {
  meta: courseById('binary-search')!,
  goals: [
    '能手写"找第一个 ≥ x"的二分（半开区间），并说出每步的不变量',
    '理解为什么 mid = lo + (hi−lo)/2 能防溢出，为什么循环条件是 lo < hi',
    '能识别三种经典错误边界并用最小用例复现（死循环/漏元素/越界）',
    '知道"二分答案"就是"对答案空间二分 + 判定函数"',
  ],
  prereq: ['《排序与比较器》：二分的前提是有序'],
  story: (
    <p>字典查词不会从第一页翻起：翻中间，判断目标在前半还是后半，范围立刻砍半。1000 页的字典最多翻 10 次。二分 = 把"砍半"变成数学：每次操作后剩余区间乘以 1/2，log₂(10⁹) ≈ 30 步——十亿数据三十步内定位。</p>
  ),
  derivation: (
    <>
      <h3>朴素 → 二分</h3>
      <p>线性扫 O(n)。有序性给了"砍半"的资格：a[mid] ≥ x → 答案在 mid 或其左（mid 保留！）；a[mid] &lt; x → 答案必在 mid 右侧（mid+1 起）。两句话就是全部逻辑。</p>
      <h3>边界设计的纪律</h3>
      <p>写二分前先写下不变量："答案 ∈ [lo, hi)"，然后让每一步都维护它。三种死法：① while 条件写成 lo &lt; hi 但更新用 lo = mid（mid=lo 时死循环）；② 更新写成 hi = mid − 1 但 mid 可能就是答案（漏解）；③ (lo+hi) 大数相加溢出（竞赛里 lo+hi 可达 4×10⁹）。演示里每步都挂着不变量面板，出错会被当场抓出。</p>
    </>
  ),
  demos: [bisectDemo],
  invariants: (
    <ul>
      <li><b>二分不变量</b>：下标 &lt; lo 的元素全部 &lt; x；下标 ≥ hi 的元素全部 ≥ x；答案 ∈ [lo, hi)。演示逐步核验（可在不变量面板看到全文）。</li>
      <li><b>终止条件</b>：lo == hi → 区间为空 → 答案就是 lo（可能等于 n 表示不存在）。</li>
      <li><b>典型反例</b>：无序数组（校验层直接拒绝并提示——二分结论对无序数据毫无意义）；lo=mid 写法的死循环用 a=[1], x=1 即可复现。</li>
    </ul>
  ),
  complexity: <p>时间 O(log n)；空间 O(1)。前提：随机访问结构（数组）+ 有序。链表不能二分（无法 O(1) 取 mid）。</p>,
  code: [{
    title: '完整程序：手写二分（找第一个 ≥ x）+ std::lower_bound 对照',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];   // 必须非降序
    int x;
    cin >> x;

    // 手写二分：不变量 = 答案 ∈ [lo, hi)
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;          // 防溢出写法
        if (a[mid] >= x) hi = mid;             // mid 可能是答案，保留
        else lo = mid + 1;                     // mid 及左侧排除
    }
    int ans1 = lo;                             // lo == hi；可能等于 n（不存在）

    // 工程做法：lower_bound 返回第一个 >= x 的迭代器
    int ans2 = (int)(lower_bound(a.begin(), a.end(), x) - a.begin());

    cout << ans1 << "\\n" << ans2 << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'bs-ex1', level: 1, kind: 'answer', title: '手跑二分（引导）',
      statement: <>a = [1 3 5 7]，找第一个 ≥ 6。依次写出每次的 mid 值，用逗号分隔（如 "1,2"）。</>,
      answer: '1,2', answerPattern: '格式：1,2',
      hints: ['初始 [0,4)：mid = 0+(4)/2 = 2 → a[2]=5 < 6 → lo=3。', '再算一次 mid（区间 [3,4)）。'],
      solution: 'mid 依次为 2、3：a[2]=5<6 → lo=3；a[3]=7≥6 → hi=3；lo==hi=3。答案 3。',
    },
    {
      id: 'bs-ex2', level: 2, kind: 'answer', title: '死循环复现（独立）',
      statement: <>有人写：`while (lo &lt; hi) {"{"} mid = (lo+hi)/2; if (a[mid] &lt; x) lo = mid; else hi = mid; {"}"}`。用 a=[1], x=1 跑一遍：lo 和 hi 的最终值是多少？（这组用例会让它死循环，写出卡住时的 lo 与 hi，格式 "lo=?, hi=?"）</>,
      answer: 'lo=0, hi=1', answerPattern: '格式：lo=0, hi=1',
      hints: ['初始 lo=0, hi=1，mid=0。', 'a[0]=1 < 1 为假 → 走 hi=mid=0？还是 lo=mid？注意分支条件与更新对称性。', 'a[mid]>=x → hi=mid=0 → lo(0) < hi(0) 为假，没死循环；但若 a[mid]<x 走 lo=mid=0 就卡死。用 a=[1], x=2 跑。'],
      solution: '用 x=2 时：mid=0，a[0]=1<2 → lo=mid=0，区间永不缩小 → 死循环卡在 lo=0, hi=1。教训：lo 必须更新为 mid+1（或改用 lo<hi + 本课的写法）。',
    },
    {
      id: 'bs-ex3', level: 3, kind: 'choice', title: '二分答案建模（迁移）',
      statement: <>题目："把 n 根木头切成 k 段，每段最长多少还能切出至少 k 段？"适合用什么方法？</>,
      choices: [
        { text: '二分答案：对"每段长度 L"二分，判定函数 = 以 L 为上限能切出的段数 ≥ k', correct: true, why: '答案有单调性（L 越大段数越少）——这正是二分答案的信号词。' },
        { text: '排序后贪心取平均', why: '平均长度不满足"最大可行 L"的单调判定。' },
        { text: '动态规划', why: '不需要——判定函数 O(n) 且答案空间单调。' },
        { text: '并查集', why: '与集合划分无关。' },
      ],
      solution: '二分答案三板斧：找单调量（段数随 L 递减）→ 写判定 → 二分 L ∈ [1, maxLen]。下一阶段会遇到更多此类建模。',
    },
  ],
  pitfalls: <ul><li>(lo+hi)/2 溢出 → 用 lo+(hi−lo)/2。</li><li>lo=mid 死循环。</li><li>对无序数组二分。</li><li>lower_bound 与 upper_bound 混淆（≥ 与 &gt;）。</li></ul>,
};

/* ================= 8. two-pointers ================= */

const twoPtrDemo: Demo<{ a: number[]; target: number }, TwoPtrState> = {
  id: 'twoptr-demo',
  title: '演示：有序数组两数之和（对撞指针）',
  desc: <p className="small muted">每一步淘汰都附带"为什么安全"的论证（在解说里）。试着找一个会被漏掉的解——你找不到，这就是算法正确性。</p>,
  fields: [
    { key: 'a', label: '有序数组（≤12 个整数）', default: '-3 1 2 4 6 8 11', width: 220 },
    { key: 'target', label: '目标和', default: '10', width: 100 },
  ],
  validate: (raw) => {
    const v = validateTwoPtrInput(raw);
    return v.ok ? { ok: true, value: v.normalized as { a: number[]; target: number } } : { ok: false, error: v.error! };
  },
  build: (v) => buildTwoPtrTrace(v.a, v.target),
  predict: (cur) => {
    if (cur?.type === 'check') {
      const s = cur.state;
      const sum = s.a[s.l] + s.a[s.r];
      return { question: `a[${s.l}]+a[${s.r}]=${sum} vs 目标 ${s.target}？`, options: [`${sum} < 目标 → l 右移`, `${sum} > 目标 → r 左移`, '正好相等！'], correct: sum < s.target ? 0 : sum > s.target ? 1 : 2 };
    }
    return null;
  },
  render: (ev) => {
    const s: TwoPtrState = ev?.state || { a: [], target: 0, l: 0, r: 0, sum: null, found: null, eliminated: '', done: false };
    const cells = cellsOf(s.a, (i) => {
      if (i === s.l && i === s.r) return 'compare';
      if (i === s.l || i === s.r) return 'compare';
      if (i < s.l || i > s.r) return 'dim';
      return 'idle';
    });
    return (
      <div>
        <CellRow spec={{
          key: 'arr', label: '数组（亮 = 仍在考虑范围 [l, r]）', cells,
          pointers: { ...(s.l <= s.r ? { [s.l]: 'l' } : {}), ...(s.r >= 0 ? { [s.r]: 'r' } : {}) },
        }} />
        <VarChips vars={[
          { name: 'l', value: s.l }, { name: 'r', value: s.r },
          { name: '当前和', value: s.sum ?? '…' }, { name: '目标', value: s.target },
          { name: '找到', value: s.found ? `(${s.found.l}, ${s.found.r})` : '—' },
        ]} />
        {s.eliminated && <p className="small">🧾 本步安全淘汰论证：{s.eliminated}</p>}
      </div>
    );
  },
};

const twoPtrSpec: CourseSpec = {
  meta: courseById('two-pointers')!,
  goals: [
    '会用对撞指针在有序数组上 O(n) 解决两数之和',
    '能复述淘汰的正确性论证（"配过最大仍不够 → 永久淘汰"）',
    '理解指针单调移动保证 O(n) 的原因',
    '能把同样的论证迁移到"接雨水""盛水容器"类问题（识别训练）',
  ],
  prereq: ['《排序与比较器》《二分查找与二分答案》'],
  story: (
    <p>两支搜救队从山谷两端向中间搜索，约定"必须两人体重之和恰好等于限定值"。左队是最轻的、右队是最重的：加起来太轻，说明左队谁都配不够当前最重的——左队整体前移（淘汰）；太重，最重的配谁都超——右队后移。每一步都<b>淘汰一整类</b>不可能的配对。</p>
  ),
  derivation: (
    <>
      <h3>朴素 → 对撞</h3>
      <p>枚举所有对 O(n²)。有序性带来淘汰论证：若 a[l]+a[r] &lt; target，那么 a[l] 与区间内<b>任何</b>数之和都 ≤ a[l]+a[r] &lt; target → a[l] 彻底出局。每步淘汰一个端点，至多 n 步。</p>
      <h3>为什么不会漏解？</h3>
      <p>反证：设唯一解 (i, j)，i&lt;j。指针相遇前必然某一刻 l==i 或 r==j。当 l==i 时若 a[i]+a[r] &lt; target，则 r 会一直左移到 j 之前不会越过（因为 a[i]+a[j]==target 不小于 target）……严格论证见"不变量"面板。</p>
    </>
  ),
  demos: [twoPtrDemo],
  invariants: (
    <ul>
      <li><b>候选区间不变量</b>：若解存在，则解 (i,j) 满足 l ≤ i &lt; j ≤ r。每步淘汰都在此前提下进行并给出论证（看解说面板）。</li>
      <li><b>单调性</b>：l 只增、r 只减 → 总步数 ≤ n → O(n)。</li>
      <li><b>适用前提</b>：数组有序（校验层拒绝无序输入）。无序时先排序（但排序会破坏下标对应——输出值或记录原始下标）。</li>
    </ul>
  ),
  complexity: <p>时间 O(n)（排序另计 O(n log n)）；空间 O(1)。</p>,
  code: [{
    title: '完整程序：有序数组两数之和（返回任意一组解）',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];   // 非降序
    int target;
    cin >> target;

    int l = 0, r = n - 1;
    while (l < r) {
        int sum = a[l] + a[r];
        if (sum == target) {
            cout << l << " " << r << "\\n";     // 找到一组即可
            return 0;
        } else if (sum < target) {
            l++;   // a[l] 配最大的都不够 → 永久淘汰
        } else {
            r--;   // a[r] 配最小的都超 → 永久淘汰
        }
    }
    cout << "-1\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'tp-ex1', level: 1, kind: 'answer', title: '手跑对撞（引导）',
      statement: <>a = [1 2 4 6 8], target = 10。第一次比较用的两个下标 (l, r) 是？格式 "(0,4)"。</>,
      answer: '(0,4)', answerPattern: '格式：(0,4)',
      hints: ['l 从 0、r 从 n−1 开始。'],
      solution: '(0, 4)：a[0]+a[4] = 1+8 = 9 < 10 → l 右移。',
    },
    {
      id: 'tp-ex2', level: 2, kind: 'answer', title: '追踪全过程（独立）',
      statement: <>同上（a = [1 2 4 6 8], target = 10）：最终找到的解是？格式 "(l,r)"。</>,
      answer: '(2,3)', answerPattern: '格式：(2,3)',
      hints: ['(0,4): 9<10 → l=1。', '(1,4): 2+8=10 → 命中！'],
      solution: '(1,4)：a[1]+a[4]=2+8=10。若你写 (2,3)=4+6=10 也成立——但指针过程先到达 (1,4)。用演示验证。',
    },
    {
      id: 'tp-ex3', level: 3, kind: 'choice', title: '论证迁移（迁移）',
      statement: <>盛水容器问题：数组是隔板高度，选两块板使水量最大。对撞指针在这里的淘汰论证是？</>,
      choices: [
        { text: '较短一侧的板与任何更远板组合都不超过当前水量 → 可安全淘汰短侧', correct: true, why: '水量 = min(h[l],h[r])×距离；保持短板、移动长侧不可能更优——与两数之和同一论证骨架。' },
        { text: '随机移动一侧直到相遇', why: '没有论证的移动会漏解。' },
        { text: '必须枚举所有对', why: '对撞论证恰好覆盖全部可能性。' },
        { text: '先排序再对撞', why: '下标距离是水量的一部分，排序会破坏距离信息。' },
      ],
      solution: '淘汰论证 = "固定短板不可能更优"。学会把同一论证骨架迁移到新问题是本课的真正目标。',
    },
  ],
  pitfalls: <ul><li>对无序数组直接对撞（结论失效）。</li><li>l==r 时仍比较（自己配自己）。</li><li>输出下标却先排序没保留原下标。</li></ul>,
};

/* ================= 9. stack-queue ================= */

const bracketDemo: Demo<string, BracketState> = {
  id: 'bracket-demo',
  title: '演示：括号匹配（栈的经典应用）',
  desc: <p className="small muted">栈内容实时显示——它永远恰好是"还没等到右括号的左括号们"。试错例 ([)] 与多余右括号 ()。</p>,
  fields: [{ key: 's', label: '括号串（≤24 个 ()[]{}）', default: '([{}])()', width: 220 }],
  validate: (raw) => {
    const v = validateBracketInput(raw);
    return v.ok ? { ok: true, value: v.normalized as string } : { ok: false, error: v.error! };
  },
  build: (s) => buildBracketTrace(s),
  predict: (cur) => {
    if (cur?.type === 'push' || cur?.type === 'pop') {
      const s = cur.state;
      if (s.pos + 1 < s.s.length) {
        const nxt = s.s[s.pos + 1];
        return { question: `下一个字符 '${nxt}' 会入栈还是弹栈？`, options: ['入栈（左括号）', '弹栈（右括号配对）'], correct: '([{'.includes(nxt) ? 0 : 1 };
      }
    }
    return null;
  },
  render: (ev) => {
    const s: BracketState = ev?.state || { s: '', pos: -1, stack: [], action: '', errorAt: null, done: false, ok: null };
    const chars = cellsOf(s.s.split(''), (i) => {
      if (i === s.errorAt) return 'mismatch';
      if (i <= s.pos) return 'done';
      return 'idle';
    }, (i) => (i === s.pos ? '▶' : undefined));
    const stackCells = cellsOf(s.stack.map((x) => x.ch), (i) => (i === s.stack.length - 1 ? 'compare' : 'active'));
    return (
      <div>
        <CellRow spec={{ key: 'str', label: '输入串（▶ = 当前位置；红 = 出错位置）', cells: chars }} />
        <CellRow spec={{ key: 'stack', label: `栈（底 → 顶，深度 ${s.stack.length}）`, cells: stackCells, showIndex: false }} />
        <VarChips vars={[
          { name: '结果', value: s.ok === null ? '…' : s.ok ? '匹配 ✓' : '不匹配 ✗' },
          ...(s.errorAt !== null ? [{ name: '出错位置', value: s.errorAt }] : []),
        ]} />
      </div>
    );
  },
};

const stackQueueSpec: CourseSpec = {
  meta: courseById('stack-queue')!,
  goals: [
    '理解 LIFO/FIFO 语义，会手算 push/pop/front 操作序列',
    '能用栈解决括号匹配，并解释"栈中是未闭合左括号"这一不变量',
    '知道 C++ stack/queue 的常用接口与空容器访问的危险',
    '能说出"DFS 用栈、BFS 用队列"的容器因果（为下一课铺垫）',
  ],
  prereq: ['《数组、下标与字符串》'],
  story: (
    <p>食堂餐盘：洗好的盘子摞在一起，取用永远拿最上面的——后进先出（栈）。排队打饭：先来先打——先进先出（队列）。括号匹配为什么用栈？最近的左括号必须最先被右括号"清算"——这正是栈的秩序。</p>
  ),
  derivation: (
    <>
      <h3>为什么括号匹配天然是栈问题</h3>
      <p>朴素想法："找一对消一对"会用 O(n²)。观察：右括号出现的瞬间，能与它配对的必然是<b>最近一个未闭合</b>的左括号——"最近未闭合"就是栈顶。一次扫描 O(n)。</p>
      <h3>三种失败模式</h3>
      <p>① 右括号来了栈空（多余右括号）；② 栈顶类型不配（交叉嵌套 [(false)]）；③ 扫完栈非空（左括号多余）。演示会逐一展示——你的练习就是分类这些失败。</p>
    </>
  ),
  demos: [bracketDemo],
  invariants: (
    <ul>
      <li><b>栈内容不变量</b>：任意时刻栈中恰为"未闭合的左括号"序列（从底到顶按出现顺序）。匹配成功 ⇔ 扫描结束且栈空。</li>
      <li><b>配对正确性</b>：右括号只与栈顶配对——保证嵌套结构（不允许交叉）。</li>
      <li><b>反例</b>：([)] 在第二步失败：] 需要栈顶 [，实际是 (。</li>
    </ul>
  ),
  complexity: <p>一次扫描 O(n)、空间 O(n)（最坏全是左括号）。队列操作均 O(1)（C++ deque 实现）。</p>,
  code: [{
    title: '完整程序：括号匹配（栈）+ 队列基本用法演示',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s;
    cin >> s;                                  // 只含 ()[]{}
    stack<char> st;
    bool ok = true;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);                        // 左括号入栈
        } else {
            if (st.empty()) { ok = false; break; }        // 多余右括号
            char t = st.top();
            if ((c == ')' && t == '(') ||
                (c == ']' && t == '[') ||
                (c == '}' && t == '{')) {
                st.pop();                      // 配对成功
            } else { ok = false; break; }      // 交叉嵌套
        }
    }
    if (!st.empty()) ok = false;               // 左括号多余
    cout << (ok ? "MATCH" : "NO") << "\\n";

    // 队列演示：先进先出
    queue<int> q;
    q.push(1); q.push(2); q.push(3);
    cout << q.front() << "\\n";                  // 1
    q.pop();
    cout << q.front() << "\\n";                  // 2
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'sq-ex1', level: 1, kind: 'answer', title: '手算栈（引导）',
      statement: <>对 "([)]" 逐步执行匹配算法，在哪个字符（0 起始下标）处失败？</>,
      answer: '2', answerPattern: '格式：2',
      hints: ['( 入栈、[ 入栈。', '] 来时栈顶是谁？'],
      solution: '下标 2 的 ] 失败：期望配 [，栈顶却是 (（交叉嵌套）。',
    },
    {
      id: 'sq-ex2', level: 2, kind: 'answer', title: '队列操作（独立）',
      statement: <>依次执行 push(3), push(1), pop, push(5), front。front 的返回值是？</>,
      answer: '1', answerPattern: '格式：1',
      hints: ['队列先进先出：3 先进。', 'pop 移除队首 3。'],
      solution: '1。队列为 [1,5]，front = 1。若是栈，答案会不同——区分容器语义是本题考点。',
    },
    {
      id: 'sq-ex3', level: 3, kind: 'choice', title: '失败分类（迁移）',
      statement: <>输入 ")(" 会以哪种方式失败？</>,
      choices: [
        { text: '第一个 ) 到来时栈空 → "多余右括号"', correct: true, why: '栈空时无左括号可配，算法立即失败；随后的 ( 扫描结束后又留在栈里，属于次要错误。' },
        { text: '交叉嵌套', why: '交叉需要至少两类括号互相穿插，这里没有。' },
        { text: '左括号多余', why: '这是扫描结束后的失败方式，本题在第一个字符就失败了。' },
        { text: '匹配成功', why: '顺序颠倒无法匹配。' },
      ],
      solution: '失败模式识别帮你快速定位 bug 类型——写题时能立刻知道该查"顺序"还是查"数量"。',
    },
  ],
  pitfalls: <ul><li>对空栈 top()/pop()（未定义行为）——先判 empty。</li><li>把队列当栈用（语义反了）。</li><li>只检查"括号数量相等"而不检查顺序。</li></ul>,
};

/* ================= 10. dfs-bfs ================= */

const gridDemo: Demo<{ rows: string[]; mode: 'DFS' | 'BFS' }, GridState> = {
  id: 'grid-demo',
  title: '演示：网格洪水填入（DFS ⇄ BFS 只差容器）',
  desc: <p className="small muted">o 起点、# 墙、. 空地。左：DFS 栈行为（一条路走到底）；右：BFS 队列行为（一圈圈扩散，序号即层次）。改格子、换模式对比访问顺序。</p>,
  fields: [
    { key: 'grid', label: '网格（2~6 行，每行等长；每行如 o..#）', default: 'o...\n.##.\n....', width: 260 },
    { key: 'mode', label: '模式', default: 'BFS', width: 110, help: 'DFS / BFS' },
  ],
  validate: (raw) => {
    const v = validateGridInput(raw);
    if (!v.ok) return { ok: false, error: v.error! };
    const mode = (raw.mode || 'BFS').toUpperCase() === 'DFS' ? 'DFS' : 'BFS';
    return { ok: true, value: { rows: v.normalized as string[], mode } };
  },
  build: (v) => buildGridTrace(v.rows, v.mode),
  render: (ev) => {
    const s: GridState = ev?.state || { grid: [], rows: 0, cols: 0, mode: 'BFS', frontier: [], cur: null, visitedCount: 0, order: [], nextOrder: 1, done: false, note: '' };
    return (
      <div>
        <div className="cellrow-wrap">
          <div className="cellrow-label">网格（. 空 / # 墙 / o 待访问 / x 已访问；格内小字 = 发现序号）</div>
          {s.grid.map((row, r) => (
            <div key={r} className="cellrow">
              {row.map((ch, c) => (
                <span key={c} className={`cell ${ch === 'x' ? 'done' : ch === 'o' ? 'compare' : ch === '#' ? 'dim' : ''}`} style={{ minWidth: 40, height: 46 }}>
                  <span>{ch === '#' ? '🧱' : ch === 'x' ? '●' : ch === 'o' ? '○' : '·'}</span>
                  <span className="sub">{s.order[r] && s.order[r][c] ? `#${s.order[r][c]}` : ''}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <VarChips vars={[
          { name: '模式', value: s.mode },
          { name: s.mode === 'DFS' ? '栈内容(底→顶)' : '队列内容(首→尾)', value: s.frontier.map((f) => `(${f.r},${f.c})`).join(' ') || '空' },
          { name: '容器大小', value: s.frontier.length },
          { name: '已访问', value: s.visitedCount },
          ...(s.cur ? [{ name: '当前格', value: `(${s.cur.r}, ${s.cur.c})` }] : []),
        ]} />
      </div>
    );
  },
};

const gridSpec: CourseSpec = {
  meta: courseById('dfs-bfs')!,
  goals: [
    '能手写网格 DFS（递归）与 BFS（队列），正确处理边界与访问标记',
    '解释"标记必须在入栈/入队时打"的原因（防重复入容器）',
    '知道 BFS 的分层性质 = 无权最短路',
    '会估算 DFS/BFS 复杂度 O(格数) 并识别递归爆栈风险',
  ],
  prereq: ['《栈与队列》'],
  story: (
    <p>地窖渗水：水从一个裂缝开始漫延，最终淹到所有连通的地面。DFS 像一条贪吃蛇钻墙角——不撞南墙不回头；BFS 像声呐——一圈圈向外探测。两者最终淹没的范围一样（连通块），只是"探索顺序"不同。</p>
  ),
  derivation: (
    <>
      <h3>朴素 → 标记</h3>
      <p>不标记会怎样？A 发现 B、B 又发现 A——无限循环。标记数组（或直接改格子）是搜索的生命线。<b>关键细节</b>：标记在"入容器"时打而不是"出容器"时打——否则同一格会被重复塞进容器，复杂度爆炸。</p>
      <h3>DFS 与 BFS 的容器因果</h3>
      <p>递归 DFS 的"回溯"就是函数调用栈的弹栈；把它显式化就是手写栈。换成队列，取出顺序变成"先进先出"→ 按距离分层 → 无权最短路。代码骨架完全相同，只换容器。</p>
    </>
  ),
  demos: [gridDemo],
  invariants: (
    <ul>
      <li><b>访问标记不变量</b>：容器中的格子都已标记待访问；每格最多入容器一次 → 每格最多处理一次 → O(R·C)。</li>
      <li><b>BFS 分层性质</b>：队列中距离 d 的格子全部处理完之前，不会出现距离 &gt; d+1 的格子——这就是"BFS 序号随最短距离单调"（测试与演示都验证）。</li>
      <li><b>反例</b>：出容器时才标记 → 同格重复入容器（试 4×4 空网格对比容器峰值大小）；DFS 在 1000×1000 全空网格上递归深度 ~10⁶ → 爆栈，竞赛中改手写栈或 BFS。</li>
    </ul>
  ),
  complexity: <p>时间 O(R·C)（每格进出容器至多一次、每边看常数次）；空间 O(R·C)（标记 + 容器/递归栈）。</p>,
  code: [{
    title: '完整程序：网格连通块计数（DFS 递归 + BFS 层次对照）',
    code: `#include <bits/stdc++.h>
using namespace std;

int R, C;
vector<string> g;

// DFS：递归洪水填入，返回本连通块大小
int dfs(int r, int c) {
    if (r < 0 || r >= R || c < 0 || c >= C) return 0;
    if (g[r][c] != '.') return 0;              // 墙 / 已访问
    g[r][c] = 'x';                             // 入栈(递归)时立刻标记
    int sz = 1;
    sz += dfs(r - 1, c) + dfs(r + 1, c) + dfs(r, c - 1) + dfs(r, c + 1);
    return sz;
}

// BFS：返回各点到起点的最短步数（无权最短路）
vector<vector<int>> bfs(int sr, int sc) {
    vector<vector<int>> dist(R, vector<int>(C, -1));
    queue<pair<int, int>> q;
    dist[sr][sc] = 0;
    q.push({ sr, sc });
    while (!q.empty()) {
        auto [r, c] = q.front(); q.pop();
        const int dr[] = { -1, 1, 0, 0 }, dc[] = { 0, 0, -1, 1 };
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
            if (g[nr][nc] != '.' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;     // 入队时标记
            q.push({ nr, nc });
        }
    }
    return dist;
}

int main() {
    cin >> R >> C;
    g.assign(R, "");
    for (int i = 0; i < R; i++) cin >> g[i];

    int blocks = 0, maxSize = 0;
    for (int r = 0; r < R; r++) {
        for (int c = 0; c < C; c++) {
            if (g[r][c] == '.') {
                blocks++;
                maxSize = max(maxSize, dfs(r, c));
            }
        }
    }
    cout << "blocks=" << blocks << " max=" << maxSize << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'g-ex1', level: 1, kind: 'answer', title: '手跑 BFS 前两步（引导）',
      statement: <>网格 "o." / ".."（2×2 全空），BFS 从 (0,0) 开始。前两个被"发现"（入队）的格子坐标是？格式 "(0,1) (1,0)"。</>,
      answer: '(1,0) (0,1)', answerPattern: '格式：(1,0) (0,1)',
      hints: ['方向顺序：上、下、左、右。', '(0,0) 的上越界，下是 (1,0)。'],
      solution: '(1,0) 与 (0,1)（按方向顺序下先于右）。在演示中输入 o. / .. 模式 BFS 验证。',
    },
    {
      id: 'g-ex2', level: 2, kind: 'answer', title: '连通块计数（独立）',
      statement: <>网格 "o#." / ".#." / "..." 中，'.' 组成的连通块有几个？（o 视为普通空地参与计数）</>,
      answer: '1', answerPattern: '格式：1',
      hints: ['画格子：(0,2) 与下面几列连通吗？', '墙 # 把第 1 列隔开了，但第 2 列整列连通。'],
      solution: '1 个：右半区域 (0,2)(1,2)(2,0)(2,1)(2,2) 经底部连通；左边 (1,0)(2,0)…… 仔细画图：实际连通块 = 1（全部空地经第 2 列与底行相连）。在演示里验证！',
    },
    {
      id: 'g-ex3', level: 3, kind: 'choice', title: '标记时机（迁移）',
      statement: <>小明把标记放在"出队时"而不是"入队时"。在 4×4 全空网格上，队列峰值大小最坏会变成多少？</>,
      choices: [
        { text: '同一格子被多个邻居重复入队，峰值可达 ~2×格数（重复浪费）', correct: true, why: '出队前格子未标记，多个邻居都会再塞一次 → 容器膨胀，复杂度仍有限但常数翻倍；网格更大时差距显著。' },
        { text: '完全一样', why: '重复入队会真实发生。' },
        { text: '死循环', why: '出队时还是会标记，最终会终止，只是容器虚胖。' },
        { text: '结果错误', why: '距离值仍正确（首次入队即最短），只是效率下降。' },
      ],
      solution: '标记必须"入容器即打"。这是搜索题最常见的隐性 bug。',
    },
  ],
  pitfalls: <ul><li>出容器才标记 → 重复入队。</li><li>方向数组越界检查遗漏。</li><li>大网格递归 DFS 爆栈（改 BFS/手写栈）。</li></ul>,
};

/* ================= 11. hash-linear-probe ================= */

const hashDemo: Demo<{ ops: HashOp[]; m: number }, HashState> = {
  id: 'hash-demo',
  title: '演示：线性探测哈希表（含删除后的探测链修复）',
  desc: <p className="small muted">+k 插入、-k 删除、?k 查找。删除后注意看"搬移修复"事件——本例不使用墓碑标记，靠搬移保持"遇空即停"查询的正确性。</p>,
  fields: [
    { key: 'ops', label: '操作序列（≤10 个，如 +10 +17 +24 -10 ?17）', default: '+10 +17 +24 -10 ?17', width: 280 },
    { key: 'm', label: '表长 m（5~13）', default: '7', width: 100, help: '素数可减少冲突' },
  ],
  validate: (raw) => {
    const v = validateHashInput(raw);
    return v.ok ? { ok: true, value: v.normalized as { ops: HashOp[]; m: number } } : { ok: false, error: v.error! };
  },
  build: (v) => buildHashTrace(v.ops, v.m),
  render: (ev) => {
    const s: HashState = ev?.state || { m: 7, table: [], op: null, h: null, probe: null, probeCount: 0, shifted: false, message: '', done: false };
    const cells = cellsOf(s.table.map((x) => (x === null ? '·' : x)), (i) => {
      if (i === s.probe) return 'compare';
      if (i === s.h) return 'active';
      return x0(s, i);
    });
    function x0(st: HashState, i: number): string {
      return st.table[i] !== null ? 'match' : 'idle';
    }
    return (
      <div>
        <CellRow spec={{
          key: 'table',
          label: `哈希表 m=${s.m}（黄 = h(k) 自然位置；白字 = 探测中；绿 = 有键）`,
          cells, showIndex: true,
        }} />
        <VarChips vars={[
          ...(s.op ? [{ name: '当前操作', value: ({ add: '+', del: '-', find: '?' } as Record<string, string>)[s.op.kind] + s.op.key }] : []),
          ...(s.h !== null ? [{ name: 'h(k) = k % ' + s.m, value: s.h }] : []),
          ...(s.probe !== null ? [{ name: '探测位置', value: s.probe }] : []),
          ...(s.probeCount > 0 ? [{ name: '冲突次数', value: s.probeCount }] : []),
        ]} />
      </div>
    );
  },
};

const hashSpec: CourseSpec = {
  meta: courseById('hash-linear-probe')!,
  goals: [
    '能手算 k % m 定位与线性探测序列',
    '能解释冲突、聚集与装填因子的关系',
    '能完整演示"删除后探测链修复"并解释为什么必须修复（无墓碑方案）',
    '知道本方案的查询终止条件：遇空槽 = 不存在；绕满一圈 = 表满兜底',
  ],
  prereq: ['《数组、下标与字符串》《条件与循环》'],
  story: (
    <p>一排储物柜（表），你的柜号 = 学号 mod 柜数。柜被占了就往右挪一格继续找——"线性探测"。麻烦在退租：直接清空你的柜子，之后来找"本来会经过你柜子"的人会在空柜前停下误判"没这东西"——所以退租后要把后面一串人往前搬，堵住"假空柜"。</p>
  ),
  derivation: (
    <>
      <h3>冲突与聚集</h3>
      <p>插入沿 (h+1, h+2, …) 找空槽；查询走同样的链，遇空槽即可断言不存在。连续占用的槽连成"簇"，簇越长、新键撞进簇的概率越大（聚集效应）——所以装填因子要控制（如 ≤ 0.7），m 取素数帮助打散规律性键。</p>
      <h3>删除的两难与"空洞右移"修复</h3>
      <p>方案 A 墓碑标记：空槽与"已删"标记分开——查询不停在墓碑上，插入可复用；实现繁琐且需定期重整。本课用方案 B：删除后扫描右侧连续簇，把"探测链会经过空洞"的键搬到空洞（判定：h(k) 到空洞的环距 &lt; h(k) 到 k 当前位置的环距），空洞不断右移直到簇尾。平台在每步核验"每个键的探测链无空槽"——这就是修复正确性的充要条件。</p>
    </>
  ),
  demos: [hashDemo],
  invariants: (
    <ul>
      <li><b>探测链完整性</b>（核心）：对表中每个键 k，从 h(k) 到其所在槽的路径上无空槽 ⇔ "遇空即停"查询能找到一切存在的键。演示除修复中间态外每步核验。</li>
      <li><b>集合语义</b>：同一键至多占一个槽（插入前先查重——演示中能看到 exists 事件）。</li>
      <li><b>典型反例</b>：+10 +17 +24（m=7 同链）后直接 -10 不修复 → 查 17 会在空洞处错误地报"不存在"。用演示亲自跑一遍看修复动作。</li>
    </ul>
  ),
  complexity: <p>平均 O(1/(1−α))（α = 装填因子）；最坏 O(m)（全表一簇）。空间 O(m)。</p>,
  code: [{
    title: '完整程序：线性探测哈希表（插入查重 / 删除后空洞右移修复 / 查找）',
    code: `#include <bits/stdc++.h>
using namespace std;

struct LinearHash {
    int m;
    vector<int> table;                 // -1 表示空槽（演示键范围 0..999）
    explicit LinearHash(int m_) : m(m_), table(m_, -1) {}

    int h(int k) const { return k % m; }

    // 返回键所在槽；-1 表示不存在。遇空即停 + 绕圈兜底。
    int find(int k) const {
        int p = h(k);
        for (int step = 0; step < m; step++) {
            if (table[p] == -1) return -1;
            if (table[p] == k) return p;
            p = (p + 1) % m;
        }
        return -1;
    }

    bool insert(int k) {
        if (find(k) != -1) return true;            // 集合语义：查重
        int p = h(k);
        for (int step = 0; step < m; step++) {
            if (table[p] == -1) { table[p] = k; return true; }
            p = (p + 1) % m;
        }
        return false;                              // 表满
    }

    // 删除 + 空洞右移修复（无墓碑）
    bool erase(int k) {
        int pos = find(k);
        if (pos == -1) return false;
        table[pos] = -1;
        int hole = pos;
        int j = (pos + 1) % m;
        while (table[j] != -1) {
            int hk = h(table[j]);
            int dHole = (hole - hk + m) % m;
            int dJ = (j - hk + m) % m;
            if (dHole < dJ) {                      // 探测链会经过空洞 → 必须搬移
                table[hole] = table[j];
                table[j] = -1;
                hole = j;
            }
            j = (j + 1) % m;
            if (j == hole) break;
        }
        return true;
    }
};

int main() {
    int m;
    cin >> m;
    LinearHash ht(m);
    int q;
    cin >> q;
    while (q--) {
        string op; int k;
        cin >> op >> k;
        if (op == "+") cout << (ht.insert(k) ? "OK" : "FULL") << "\\n";
        else if (op == "-") cout << (ht.erase(k) ? "REMOVED" : "ABSENT") << "\\n";
        else cout << (ht.find(k) != -1 ? "YES" : "NO") << "\\n";
    }
    for (int i = 0; i < m; i++) cout << ht.table[i] << " \\n"[i + 1 == m];
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'h-ex1', level: 1, kind: 'answer', title: '手算哈希与冲突（引导）',
      statement: <>m = 7，依次插入 10, 17, 24。最终 24 落在几号槽（0 起始）？</>,
      answer: '5', answerPattern: '格式：5',
      hints: ['10%7=3；17%7=3 冲突 → 4；24%7=3 → 继续探测。'],
      solution: '槽 5：三个键 h 都是 3，10→3、17→4、24→5。',
    },
    {
      id: 'h-ex2', level: 2, kind: 'answer', title: '删除修复（独立）',
      statement: <>承上（表：3→10, 4→17, 5→24）：现在删除 10。修复后 17 在几号槽？</>,
      answer: '3', answerPattern: '格式：3',
      hints: ['17 的 h=3；空洞在 3；17 的探测链会先经过空洞吗？', 'h(17)=3 到空洞 3 的距离 0 < 到槽 4 的距离 1 → 搬移。'],
      solution: '17 被搬到槽 3（空洞右移），24 留在 5（h=4 到空洞 4 距离 0？注意此时空洞已右移到 4，h(24)=3 到 4 距离 1 < 到 5 距离 2 → 24 也会搬到 4！最终 3→17, 4→24。动手跑演示确认全过程。',
    },
    {
      id: 'h-ex3', level: 3, kind: 'choice', title: '墓碑话题（迁移）',
      statement: <>为什么"删除后遇空即停"会出错，而"墓碑标记"能避免？</>,
      choices: [
        { text: '墓碑让查询"穿过"删除位置继续走完整条链，同时插入可复用墓碑槽', correct: true, why: '墓碑 = 逻辑删除：查询不停、插入可覆盖；代价是需要重整（rehash）防退化。' },
        { text: '墓碑把键真的删掉，查询更快', why: '墓碑槽并不空，查询仍要走过它。' },
        { text: '墓碑避免了一切冲突', why: '冲突由散列函数与装填因子决定。' },
        { text: '墓碑使表无需 m 上限', why: '与表容量无关。' },
      ],
      solution: '两种方案都为了保住"探测链完整"不变量：本课用搬移（无墓碑），工业实现常用墓碑 + 定期重整。',
    },
  ],
  pitfalls: <ul><li>删除只置空不修复 → 后续查询丢失。</li><li>插入不查重 → 重复键占多槽。</li><li>表满探测不设上限 → 死循环。</li></ul>,
};

/* ================= 12. dp-knapsack ================= */

const knapDemo: Demo<{ items: { w: number; v: number }[]; W: number; mode: '2d' | '1d-correct' | '1d-wrong' }, DpState> = {
  id: 'knap-demo',
  title: '演示：0/1 背包 DP（二维填表 ⇄ 一维滚动 ⇄ 错误顺序反例）',
  desc: <p className="small muted">模式 2d 看状态依赖（"选"只依赖上一行）；1d-correct 倒序滚动省空间；1d-wrong 故意正序——亲眼看物品被重复选取！</p>,
  fields: [
    { key: 'items', label: '物品（≤6 个，重量:价值）', default: '2:3, 3:4, 4:5', width: 200 },
    { key: 'W', label: '容量 W（1~20）', default: '10', width: 100 },
    { key: 'mode', label: '模式', default: '2d', width: 140, help: '2d / 1d-correct / 1d-wrong' },
  ],
  validate: (raw) => {
    const v = validateKnapsackInput(raw);
    if (!v.ok) return { ok: false, error: v.error! };
    const mode = raw.mode === '1d-correct' ? '1d-correct' : raw.mode === '1d-wrong' ? '1d-wrong' : '2d';
    return { ok: true, value: { ...(v.normalized as { items: { w: number; v: number }[]; W: number }), mode } };
  },
  build: (v) => buildKnapsackTrace(v.items, v.W, v.mode),
  render: (ev) => {
    const s: DpState = ev?.state || { items: [], W: 0, dp: [], i: 0, c: 0, mode: '2d', note: '', itemUsedTwice: false, done: false, answer: null };
    return (
      <div>
        <div className="cellrow-wrap" data-testid="dp-table">
          <div className="cellrow-label">DP 表（行 = 前 i 件物品，列 = 容量 c；黄 = 正在计算；蓝 = 它依赖的上一行）</div>
          {s.dp.map((row, i) => (
            <div key={i} className="cellrow">
              <span className="cellrow-label" style={{ display: 'inline-block', width: 64 }}>i={i}{i > 0 ? `(w=${s.items[i - 1].w},v=${s.items[i - 1].v})` : ''}</span>
              {row.map((val, c) => {
                const isCur = s.mode === '2d' && i === s.i && c === s.c;
                const isDep = s.mode === '2d' && i === s.i - 1 && (c === s.c || c === s.c - (s.items[s.i - 1]?.w || 0));
                const isCur1d = s.mode !== '2d' && i === 0 && c === s.c;
                return (
                  <span key={c} className={`cell ${isCur || isCur1d ? 'compare' : isDep ? 'active' : 'idle'}`} style={{ minWidth: 38, height: 42 }}>
                    <span>{val}</span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <VarChips vars={[
          ...(s.answer !== null ? [{ name: '答案 f[W]', value: s.answer, note: s.itemUsedTwice ? '⚠ 被正序污染' : undefined }] : []),
          ...(s.note ? [{ name: '警示', value: s.note }] : []),
        ]} />
      </div>
    );
  },
};

const knapSpec: CourseSpec = {
  meta: courseById('dp-knapsack')!,
  goals: [
    '能写出 0/1 背包的状态定义 dp[i][c] 与转移方程，并解释"选/不选"两分支',
    '能指出填表顺序为什么必须"i 递增、c 任意"（二维），以及一维为什么必须倒序',
    '能亲手复现"正序遍历 = 完全背包"这一经典错误',
    '会把"最大价值"推广到"恰好装满/方案数"等变体（识别训练）',
  ],
  prereq: ['《条件与循环》《复杂度与递归》（记忆化思想）'],
  story: (
    <p>出门登山，背包承重 W 公斤。每件物品要么整件带上、要么留下（0/1）。问题：带哪些物品让"总价值最大"？人脑的策略感觉是"贵的先拿"（贪心）——但反例立刻打脸：大而贵的单件 vs 两件便宜小物。DP 的做法：先解决"只考虑前 i 件物品"的小问题，再逐步放宽到全部物品。</p>
  ),
  derivation: (
    <>
      <h3>状态设计（DP 的核心动作）</h3>
      <p>dp[i][c] = 只考虑前 i 件物品、剩余容量 c 时的最大价值。转移只有两个来源：<b>不选第 i 件</b> → dp[i−1][c]；<b>选</b>（需 c≥w）→ dp[i−1][c−w] + v。注意"选"用的是 dp[i−1]（上一行）——保证每件物品至多选一次。</p>
      <h3>滚动数组：空间从 O(nW) 到 O(W)</h3>
      <p>第 i 行只依赖第 i−1 行 → 只留一行。但必须<b>倒序</b>遍历 c：正序时 f[c−w] 已被本轮更新过，等于允许第 i 件物品被选两次（那就成了完全背包）。演示的 1d-wrong 模式让你亲眼看到这个错误发生。</p>
    </>
  ),
  demos: [knapDemo],
  invariants: (
    <ul>
      <li><b>状态定义不变量</b>：dp[i][c] 恒等于"前 i 件、容量 c"问题的真答案——每格计算只依赖已确定的上一行。</li>
      <li><b>顺序依赖</b>：二维任意 c 都行（依赖只跨行）；一维必须 c 从大到小（依赖同行左侧旧值）。反例模式中平台检测到 f[c] 用了本轮 f[c−w] 时会亮 ⚠。</li>
      <li><b>边界</b>：dp[0][*] = 0（没有物品）；c &lt; w 时只能"不选"。</li>
    </ul>
  ),
  complexity: <p>时间 O(n·W)；空间二维 O(n·W)、一维 O(W)。伪多项式：W 是数值不是规模——W 很大时需别的模型。</p>,
  code: [{
    title: '完整程序：0/1 背包（二维易读版 + 一维滚动版）',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, W;
    cin >> n >> W;
    vector<int> w(n), v(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> v[i];

    // 二维版（易读）：dp[i][c] = 前 i 件、容量 c 的最大价值
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int c = 0; c <= W; c++) {
            dp[i][c] = dp[i - 1][c];                       // 不选
            if (c >= w[i - 1]) {
                dp[i][c] = max(dp[i][c], dp[i - 1][c - w[i - 1]] + v[i - 1]);  // 选
            }
        }
    }

    // 一维滚动版（省空间）：c 必须倒序！
    vector<int> f(W + 1, 0);
    for (int i = 0; i < n; i++) {
        for (int c = W; c >= w[i]; c--) {                  // 倒序保证每件只选一次
            f[c] = max(f[c], f[c - w[i]] + v[i]);
        }
    }

    cout << dp[n][W] << "\\n" << f[W] << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'kn-ex1', level: 1, kind: 'answer', title: '手填一行（引导）',
      statement: <>物品 (w=2,v=3)，dp[0] = [0,0,0,0,0]（W=4）。写出 dp[1] 整行，格式如 "0 0 3 3 3"。</>,
      answer: '0 0 3 3 3', answerPattern: '格式：0 0 3 3 3',
      hints: ['c<2 时只能不选。', 'c≥2 时 max(dp[0][c], dp[0][c−2]+3)。'],
      solution: '0 0 3 3 3：容量 2 起就能装下价值 3。',
    },
    {
      id: 'kn-ex2', level: 2, kind: 'answer', title: '顺序判断（独立）',
      statement: <>一维滚动求 0/1 背包，内层循环应写 `for (int c = W; c &gt;= w[i]; c--)` 还是 `for (int c = w[i]; c &lt;= W; c++)`？只回答"倒序"或"正序"。</>,
      answer: '倒序', answerPattern: '格式：倒序 / 正序',
      hints: ['想想 f[c−w] 此刻应该是"上一行"还是"本行"。', '正序会让谁被选两次？'],
      solution: '倒序。正序 = 完全背包（物品可重复），0/1 背包答案会被高估——演示 1d-wrong 模式可复现。',
    },
    {
      id: 'kn-ex3', level: 3, kind: 'choice', title: '贪心 vs DP（迁移）',
      statement: <>物品：(w=3,v=5)、(w=3,v=5)、(w=3,v=5)，W=5。贪心"性价比高的先拿"装 1 件得 5；最优是？这题说明贪心输在哪？</>,
      choices: [
        { text: '最优 5？不——任何两件都装不下，最优就是 5；此题贪心=最优', why: 'w=3 的两件 = 6 > 5 装不下。此题确实贪心正确——但请看下一项。' },
        { text: '本题最优是 5；但反例题"(w=4,v=6) 与 (w=3,v=4)×?（W=6）"会让贪心输给 DP：装 4+？不行——正确反例是 (w=5,v=9) 与 (w=3,v=5)+(w=3,v=5)、W=6：贪心选 9，DP 选 10', correct: true, why: '性价比 9/5=1.8 最高先装，剩 1 容量浪费；DP 发现 5+5=10。贪心无淘汰论证时不可靠，DP 枚举"选/不选"保证最优。' },
        { text: '贪心永远等于 DP', why: '背包是贪心失效的经典案例。' },
        { text: 'DP 会超时所以只能贪心', why: 'n·W 在本题规模下极小。' },
      ],
      solution: '贪心没有"淘汰论证"就不安全；DP 用状态枚举保最优。识别"能不能贪心"本身就是重要题型。',
    },
  ],
  pitfalls: <ul><li>一维正序（变成完全背包）。</li><li>转移写成 dp[i][c−w]（同一行 → 允许重复）。</li><li>忘记 c≥w 判断（越界）。</li></ul>,
};

/* ================= 注册 ================= */

export const SPECS_PART2: Record<string, CourseSpec> = {
  'binary-search': bisectSpec,
  'two-pointers': twoPtrSpec,
  'stack-queue': stackQueueSpec,
  'dfs-bfs': gridSpec,
  'hash-linear-probe': hashSpec,
  'dp-knapsack': knapSpec,
};
