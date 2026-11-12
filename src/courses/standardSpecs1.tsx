/**
 * 标准课程规格 · 第一部分：阶段 0-2（C++ 地基 + 基础解题）
 * 每门课：目标/先修/引例/推导/演示/不变量/复杂度/完整 C++17/三道渐进练习。
 */
import { CourseSpec } from './CoursePage';
import { courseById } from './registry';
import { Demo } from './demoKit';
import { CellRow, Cell, VarChips } from '../ui/CellView';
import {
  buildVarTrace, buildLoopTrace, buildMaxTrace, buildFibTrace,
  validateVarInput, validateLoopInput, validateArrayInput, validateFibInput,
  VarState, LoopState, MaxState, FibState,
} from '../algorithms/basics';
import {
  buildBubbleTrace, buildPrefixTrace,
  SortState, PrefixState,
  validateSortInput, validatePrefixInput,
} from '../algorithms/stage2';

/* ---------- 通用渲染辅助 ---------- */

function cellsOf(arr: (string | number)[], states?: (i: number) => string, subs?: (i: number) => string | undefined): Cell[] {
  return arr.map((v, i) => ({ text: String(v), state: states ? states(i) : undefined, sub: subs ? subs(i) : undefined }));
}

/* ================= 1. cpp-io-var ================= */

const varDemo: Demo<{ a: number; b: number }, VarState> = {
  id: 'var-overflow',
  title: '演示：int 加法溢出观察器',
  desc: <p className="small muted">输入两个 int 范围内的整数，逐步执行 <code>cin → a+b → cout</code>。故意把范围放到能触发回绕的边界，观察"为什么竞赛里要开 long long"。</p>,
  fields: [
    { key: 'a', label: 'a', default: '2147483647', width: 160 },
    { key: 'b', label: 'b', default: '1', width: 160, help: '试试 2147483646+1（安全）、-2147483647-2（负溢出）' },
  ],
  validate: (raw) => {
    const v = validateVarInput(raw);
    return v.ok ? { ok: true, value: v.normalized as { a: number; b: number } } : { ok: false, error: v.error! };
  },
  build: (v) => buildVarTrace(v.a, v.b),
  render: (ev) => {
    const s: VarState = ev?.state || { a: '?', b: '?', ai: 0, bi: 0, rawSum: null, intSum: null, overflow: false, done: false, message: '' };
    return (
      <VarChips vars={[
        { name: 'a', value: s.ai },
        { name: 'b', value: s.bi },
        { name: '真实和（数学）', value: s.rawSum ?? '…' },
        { name: 'int 模拟结果', value: s.intSum ?? '…', note: s.overflow ? '溢出回绕！' : undefined },
      ]} />
    );
  },
};

function require0Removed() { return null; }
void require0Removed;

const varSpec: CourseSpec = {
  meta: courseById('cpp-io-var')!,
  goals: [
    '会使用 cin/cout 完成标准输入输出，知道 cin >> 遇空白停止的行为',
    '记住 int 约 ±2.1×10⁹、long long 约 ±9.2×10¹⁸，并主动判断"要不要开 long long"',
    '能解释整除向零取整与取模符号规则（-7/2 = -3，-7%2 = -1）',
    '见过一次溢出回绕的全过程，形成"先估范围再选类型"的习惯',
  ],
  prereq: ['无需任何编程基础——这是整个路线的起点'],
  story: (
    <p>你是仓库管理员。两个仓库各存了约 21 亿件货物，合并后有多少件？计算器（int）说结果是负数——因为计数器"绕回了零点"。
      编程里的每一个变量都有容量上限，选错容量，答案会悄悄变错而不是报错——这是竞赛里最隐蔽的失分点。</p>
  ),
  derivation: (
    <>
      <h3>从"能算"到"算得对"</h3>
      <p>第一步：程序能把输入读进来、算出来、打出去（cin / 表达式 / cout）。第二步：质疑每一步——读的是什么类型？中间结果会不会超范围？输出格式对不对？</p>
      <p>竞赛经验：看到 a,b ≤ 10⁵ 且要算乘积/和的题目，先估算最大可能值：10⁵ × 10⁵ = 10¹⁰ &gt; int → 必须 long long。</p>
    </>
  ),
  demos: [varDemo],
  invariants: (
    <ul>
      <li><b>类型范围不变量</b>：每一步中间值都必须落在类型范围内；本演示用 32 位回绕<b>模拟</b>溢出后果（真实 C++ 有符号溢出是未定义行为，不同编译器可能不同——这恰恰是要避免它的理由）。</li>
      <li><b>整除规则</b>：C++ 的 / 对负数向零取整；% 的符号跟被除数一致。JS 的 Math.trunc 与之一致，但 JS 的 % 结果符号也与被除数一致——可以直接互验。</li>
    </ul>
  ),
  complexity: <p>输入输出是 O(数据量)。本课的"复杂度"意识从估算范围开始：a+b 最大多少？a×b 最大多少？</p>,
  code: [{
    title: '完整程序：读入 a、b，输出它们的和（含 long long 提示）',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long a, b;              // 先按最大可能范围选类型
    cin >> a >> b;
    long long sum = a + b;       // long long + long long 不会溢出（本题范围内）
    cout << sum << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'iovar-ex1', level: 1, kind: 'answer', title: '估算范围（引导）',
      statement: <>a, b ≤ 10⁵，要计算 a × b。用 int 存结果安全吗？回答"安全"或"不安全"。</>,
      answer: '不安全', answerPattern: '输入：安全 / 不安全',
      hints: ['算一算最大可能值：10⁵ × 10⁵ = ?', 'int 上限约 2.1 × 10⁹。'],
      solution: '不安全：10¹⁰ 远超 int 上限 2147483647，必须用 long long。',
    },
    {
      id: 'iovar-ex2', level: 2, kind: 'answer', title: '整除与取模（独立）',
      statement: <>C++ 中 <code>cout &lt;&lt; -7 / 2 &lt;&lt; " " &lt;&lt; -7 % 2;</code> 输出什么？格式：两个数字空格分隔，如 "3 1"。</>,
      answer: '-3 -1', answerPattern: '格式：-3 -1',
      hints: ['C++ 整除向零取整（不是向下取整）。', '% 的符号与被除数相同：-7 = (-3)×2 + (-1)。'],
      solution: '-3 -1。-7/2 向零取整得 -3（不是 -4），余数 -1 满足 (-3)×2+(-1) = -7。',
    },
    {
      id: 'iovar-ex3', level: 3, kind: 'choice', title: '溢出诊断（迁移）',
      statement: <>某程序读入 n ≤ 10⁹，计算 1+2+…+n 用 int 存 sum，输出结果为负数。最可能的病因是？</>,
      choices: [
        { text: 'sum 溢出：n(n+1)/2 最大约 5×10¹⁷，远超 int', correct: true, why: 'n=10⁹ 时和约 5×10¹⁷，int 装不下会回绕变负。应使用 long long。' },
        { text: 'cin 读错了 n', why: '输入行为稳定，n ≤ 10⁹ 在 int 范围内能正常读入。' },
        { text: '循环写错导致死循环', why: '死循环不会有输出，与"输出负数"矛盾。' },
        { text: 'cout 格式问题', why: '格式问题不会把正数变成负数。' },
      ],
      solution: '先估范围再选类型：Σn = n(n+1)/2 ≈ 5×10¹⁷ → long long。这也是演示里你亲手看到的回绕现象。',
    },
  ],
  pitfalls: <ul><li>用 int 存 10⁹ 级别的乘积/求和（应 long long）。</li><li>认为负数除法"向下取整"（实际向零）。</li></ul>,
};

/* ================= 2. cpp-if-loop ================= */

const loopDemo: Demo<number, LoopState> = {
  id: 'loop-sum',
  title: '演示：循环求和 1..n（循环不变量逐检查）',
  desc: <p className="small muted">每一单步都会核验循环不变量"sum = 前 i-1 个正整数的和"——这正是循环正确性的证明方法。</p>,
  fields: [{ key: 'n', label: 'n（1~20）', default: '5', width: 100 }],
  validate: (raw) => {
    const v = validateLoopInput(raw);
    return v.ok ? { ok: true, value: v.normalized as number } : { ok: false, error: v.error! };
  },
  build: (n) => buildLoopTrace(n),
  predict: (cur) => {
    if (cur?.type === 'check') {
      const s = cur.state;
      return { question: `i=${s.i} ≤ n=${s.n}？循环体会执行吗？`, options: ['执行', '不执行，退出'], correct: s.i <= s.n ? 0 : 1 };
    }
    return null;
  },
  render: (ev) => {
    const s: LoopState = ev?.state || { n: 5, i: 1, sum: 0, done: false };
    return <VarChips vars={[
      { name: 'i', value: s.i },
      { name: 'sum', value: s.sum },
      { name: 'n', value: s.n },
      { name: '理论值 i(i+1)/2', value: (s.i * (s.i + 1)) / 2, note: '用于自查' },
    ]} />;
  },
};

const loopSpec: CourseSpec = {
  meta: courseById('cpp-if-loop')!,
  goals: [
    '会用 for/while 写计数循环与累加循环',
    '能陈述并用它检查一个简单循环的循环不变量',
    '能识别两类典型错误：差一错误（i<=n vs i<n）与死循环（忘写 i++）',
  ],
  prereq: ['《C++ 起步：输入输出与变量》'],
  story: (
    <p>100 米跑道每 5 米放一瓶水，要放多少瓶？人脑会跳着数：5,10,…,100 → 20 瓶。循环就是把"跳着数"交给机器：一个计数器 i、一个累加器 sum、一个明确的停止条件。三者缺一都会出事——没有停止条件就是死循环。</p>
  ),
  derivation: (
    <>
      <h3>为什么"写对循环"需要证明？</h3>
      <p>朴素方法：手算 n=1,2,3 都对 → 就认为对。但 n=1000 呢？循环正确性来自<b>循环不变量</b>：一个在每次迭代前后都成立的断言。求和例：进入第 i 次迭代前 sum = 1+…+(i-1)。初始成立（sum=0, i=1）；保持成立（加上第 i 项后对 i+1 仍成立）；结束时 i=n+1 → sum = 1+…+n。三段论证完，循环对任意 n 正确。</p>
      <p>演示里平台在每个单步自动检查该不变量——你要练习的是"自己说得出它是什么"。</p>
    </>
  ),
  demos: [loopDemo],
  invariants: (
    <ul>
      <li><b>循环不变量</b>（本例）：循环头处 sum = 1+…+(i−1)。平台逐步核验；退出时由不变量直接得到正确性。</li>
      <li><b>典型反例</b>：条件写成 i &lt; n 少加最后一项（差一错误）；忘写 i++ 死循环。两者在 n=1 这类最小输入下最容易暴露——先测最小输入！</li>
    </ul>
  ),
  complexity: <p>循环 n 次、每次 O(1) → O(n)。粗算循环体执行次数是复杂度分析的第一课。</p>,
  code: [{
    title: '完整程序：求 1+2+…+n（含 long long 版本）',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long n;
    cin >> n;
    long long sum = 0;
    for (long long i = 1; i <= n; i++) {   // 注意 i 也用 long long：i<=n 且 n 大时 int i 会比较溢出
        sum += i;                           // 不变量：进入第 i 轮前 sum = 1+...+(i-1)
    }
    cout << sum << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'loop-ex1', level: 1, kind: 'answer', title: '手跑循环（引导）',
      statement: <>n = 4 时，循环结束后 i 和 sum 各是多少？格式 "i=?, sum=?" 如 "i=5, sum=10"。</>,
      answer: 'i=5, sum=10', answerPattern: '格式：i=5, sum=10',
      hints: ['循环退出时 i 是第一个不满足 i<=n 的值。', 'sum = 1+2+3+4。'],
      solution: 'i=5, sum=10。退出条件 i>n 第一次成立即 i=5。',
    },
    {
      id: 'loop-ex2', level: 2, kind: 'answer', title: '找 bug（独立）',
      statement: <>下面的循环想求 1..n 之和但输出偏小 1（n=5 时输出 10 而不是 15？不对——输出是 10 且 n=5 时正确答案是 15，输出 10 说明少加了）。代码：<code>for (int i = 1; i &lt; n; i++) sum += i;</code> 问：条件应改成什么？只回答修改后的条件表达式。</>,
      answer: 'i<=n', answerPattern: '格式：i<=n',
      hints: ['n=5 时它加到了几？', '差一错误：少加了 i=n 这一项。'],
      solution: 'i<=n。原条件 i<n 漏加第 n 项（这是最常见的差一错误）。',
    },
    {
      id: 'loop-ex3', level: 3, kind: 'choice', title: '不变量思维（迁移）',
      statement: <>循环 <code>while (i &lt;= n) {"{"} sum += a[i]; i += 2; {"}"}</code>（i 从 1 开始）计算的是？</>,
      choices: [
        { text: '下标为奇数的元素之和 a[1]+a[3]+…', correct: true, why: 'i 每次跳 2，从 1 出发只访问奇数下标（1-based）。不变量：sum = 已访问的奇数下标元素之和。' },
        { text: '数组前一半元素之和', why: '步长 2 与"前一半"无关。' },
        { text: '全部元素之和', why: '步长为 2 会跳过一半元素。' },
        { text: '偶数下标元素之和', why: 'i 从 1 开始（奇数），不是从 0/2 开始。' },
      ],
      solution: '奇数下标之和。判断循环行为的最快方法：写出它的不变量/访问序列（i = 1,3,5,…）。',
    },
  ],
  pitfalls: <ul><li>i&lt;n 与 i&lt;=n 混淆（差一）。</li><li>循环体内忘更新计数器（死循环）。</li><li>大 n 时 int 溢出。</li></ul>,
};

/* ================= 3. cpp-array-string ================= */

const maxDemo: Demo<{ a: number[]; offByOne: boolean }, MaxState> = {
  id: 'array-max',
  title: '演示：数组求最大值（含越界反例模式）',
  desc: <p className="small muted">正确模式逐格扫描并维护不变量；勾选反例模式则故意使用 i&lt;=n 的错误边界，亲眼看"越界"发生在哪一步。</p>,
  fields: [
    { key: 'a', label: '数组（≤10 个整数）', default: '3 -1 4 1 -5 9', width: 220 },
    { key: 'bug', label: '反例模式', default: 'false', width: 100, help: 'true = 使用错误边界 i<=n' },
  ],
  validate: (raw) => {
    const v = validateArrayInput(raw);
    if (!v.ok) return { ok: false, error: v.error! };
    const offByOne = (raw.bug || 'false').trim().toLowerCase() === 'true';
    return { ok: true, value: { a: v.normalized as number[], offByOne } };
  },
  build: (v) => buildMaxTrace(v.a, v.offByOne),
  predict: (cur) => {
    if (cur?.type === 'compare') {
      const s = cur.state;
      return { question: `a[${s.cmpIdx}]=${s.a[s.cmpIdx]} 与 best=${s.best} 谁大？`, options: ['更新 best', '保持不变'], correct: s.a[s.cmpIdx] > s.best ? 0 : 1 };
    }
    return null;
  },
  render: (ev) => {
    const s: MaxState = ev?.state || { a: [], i: 0, best: 0, bestIdx: 0, cmpIdx: -1, offByOne: false, outOfBounds: false, done: false };
    const cells = cellsOf(s.a, (i) => {
      if (i === s.cmpIdx) return 'compare';
      if (i === s.bestIdx) return 'match';
      if (i < s.i) return 'done';
      return 'idle';
    }, (i) => (i === s.bestIdx ? 'best' : undefined));
    return (
      <div>
        <CellRow spec={{ key: 'arr', label: '数组（绿色 = 当前 best）', cells }} />
        <VarChips vars={[
          { name: 'i', value: s.i },
          { name: 'best', value: s.outOfBounds ? '???（越界）' : s.best },
          { name: 'bestIdx', value: s.bestIdx },
        ]} />
      </div>
    );
  },
};

const arraySpec: CourseSpec = {
  meta: courseById('cpp-array-string')!,
  goals: [
    '理解数组 = 连续下标 0..n-1，能画下标图',
    '会写"扫描数组并维护一个统计量"的模板（求最值/计数/求和）',
    '知道越界是未定义行为，能主动检查循环边界',
    '会用 string 完成遍历与字符比较（s[i]、s.size()）',
  ],
  prereq: ['《条件与循环》'],
  story: (
    <p>全班身高记在一张表上（数组），找最高的人：从第 1 个看起，手里拿一张"当前最高"的卡片，每看一个就更新卡片。看完整张表，卡片上就是答案——这就是"扫描 + 维护统计量"模式，几乎所有的数组入门题都是它的变体。</p>
  ),
  derivation: (
    <>
      <h3>从朴素到模板</h3>
      <p>朴素：每遇到一个人就和所有人比？O(n²)。优化：维护"目前见过的最高值"，一次扫描 O(n)。优化的正确性 = 不变量"best = a[0..i-1] 的最大值"。</p>
      <h3>边界就是生命线</h3>
      <p>写 for 时先回答三个问题：从哪开始？到哪结束？步长多少？反例模式演示了边界写错一个字符的后果——越界读在真实 C++ 里不会立刻报错，而是埋雷。</p>
    </>
  ),
  demos: [maxDemo],
  invariants: (
    <ul>
      <li><b>扫描不变量</b>：best = a[0..i-1] 的最大值（且 bestIdx 指向它）。演示逐步核验。</li>
      <li><b>越界反例</b>：条件 i&lt;=n 时 i=n 越界。真实 C++ 无报错、结果不可预测——所以"先测最小输入 n=1"是强制习惯。</li>
      <li><b>字符串同理</b>：s.size() 是无符号数，s.size()-1 在空串时会回绕成巨大值——判空要用 s.empty()。</li>
    </ul>
  ),
  complexity: <p>单次扫描 O(n)、空间 O(1)（不算输入）。这是"必须会的一维扫描"基线复杂度。</p>,
  code: [{
    title: '完整程序：读入 n 个数，输出最大值及其下标',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];   // 下标 0..n-1
    int best = a[0], bestIdx = 0;              // 不变量：best = a[0..i-1] 的最大值
    for (int i = 1; i < n; i++) {              // 注意：i < n，不是 i <= n
        if (a[i] > best) {
            best = a[i];
            bestIdx = i;
        }
    }
    cout << bestIdx << " " << best << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'arr-ex1', level: 1, kind: 'answer', title: '手跑扫描（引导）',
      statement: <>数组 [4, 9, 2, 9, 7]，求最大值的<b>第一次出现下标</b>（0 起始）。</>,
      answer: '1', answerPattern: '格式：1',
      hints: ['best 初始 = a[0] = 4。', '条件是 a[i] > best（严格大于），相等的 9 不会更新。'],
      solution: '下标 1。a[3] 的 9 不大于已记录的 9，所以第一次出现的下标胜出。',
    },
    {
      id: 'arr-ex2', level: 2, kind: 'answer', title: '字符串统计（独立）',
      statement: <>string s = "aAbBa"；统计其中大写字母个数（直接数即可，考验对字符比较的理解）。</>,
      answer: '2', answerPattern: '格式：2',
      hints: ["大写字母范围 'A' 到 'Z'。", '逐个看：a(否) A(是) b(否) B(是) a(否)。'],
      solution: '2 个：A、B 共 2 个大写字母。若你答 3，检查是否把下标和字符搞混了。',
    },
    {
      id: 'arr-ex3', level: 3, kind: 'choice', title: '越界诊断（迁移）',
      statement: <>程序在本地测 n=3 正确，提交后 n=1 时输出离谱的巨大数字。最可能原因？</>,
      choices: [
        { text: '循环边界或初始化访问了 a[n]（越界读到垃圾值）', correct: true, why: 'n=1 时越界面最大（如初始化 best = a[1]），本地测试恰未触发。测最小输入是最便宜的排错手段。' },
        { text: 'int 溢出', why: 'n=1 时数值很小，与溢出无关。' },
        { text: '编译器版本不同', why: '同一逻辑在两端的差异通常来自未定义行为，而越界正是典型 UB。' },
        { text: 'cin 读入失败', why: '读入失败不会稳定复现"巨大数字"这一特征。' },
      ],
      solution: '越界是未定义行为：可能恰好读到大值。先测 n=1、n=2 这类最小输入。',
    },
  ],
  pitfalls: <ul><li>best 初始化为 0 而不是 a[0]（全负数组会错）。</li><li>for 条件 i&lt;=n 越界。</li><li>s.size()-1 在空串时回绕。</li></ul>,
};

/* ================= 4. complexity ================= */

const fibDemo: Demo<{ n: number; mode: 'naive' | 'memo' }, FibState> = {
  id: 'fib-tree',
  title: '演示：斐波那契递归调用树（朴素 vs 记忆化）',
  desc: <p className="small muted">同一 n 跑两种模式，数一数函数调用次数——这就是"从指数到线性"的直观含义。调用栈实时显示递归深度。</p>,
  fields: [
    { key: 'n', label: 'n（1~18）', default: '10', width: 100 },
    { key: 'mode', label: '模式', default: 'naive', width: 120, help: 'naive / memo' },
  ],
  validate: (raw) => {
    const v = validateFibInput(raw);
    if (!v.ok) return { ok: false, error: v.error! };
    const mode = raw.mode === 'memo' ? 'memo' : 'naive';
    return { ok: true, value: { n: v.normalized as number, mode } };
  },
  build: (v) => buildFibTrace(v.n, v.mode),
  render: (ev) => {
    const s: FibState = ev?.state || { n: 10, mode: 'naive', stack: [], calls: 0, memo: {}, result: null, lastEvent: '', done: false };
    return (
      <div>
        <VarChips vars={[
          { name: '函数调用次数', value: s.calls },
          { name: '当前栈深', value: s.stack.length },
          { name: '栈内容', value: s.stack.map((x) => `f(${x.k})`).join(' → ') || '—' },
          { name: 'memo 已存', value: Object.keys(s.memo).length + ' 项' },
          { name: '结果', value: s.result ?? '…' },
        ]} />
        <p className="small muted">
          {s.mode === 'naive'
            ? '注意栈里反复出现相同的 f(k)——它们会被重复展开成整棵子树，这就是指数级爆炸的来源。'
            : 'memo 命中时调用立刻返回；每个 f(k) 只真正展开一次。'}
        </p>
      </div>
    );
  },
};

const complexitySpec: CourseSpec = {
  meta: courseById('complexity')!,
  goals: [
    '会用"操作次数随输入规模的增长速度"描述算法（O(n)、O(n²)、O(2ⁿ)）',
    '能画出小规模递归的调用树，并数出重复子问题',
    '能解释记忆化为什么把 O(φⁿ) 降到 O(n)（每个子问题只算一次）',
    '建立"数据范围 → 可接受复杂度"的条件反射（10⁸ 次基本操作 ≈ 1 秒）',
  ],
  prereq: ['《条件与循环》《数组、下标与字符串》：需要函数递归的语法直觉'],
  story: (
    <p>传话游戏：每人只告诉两个人。从你开始传 30 轮，会有多少人听到？2³⁰ ≈ 10 亿——不可能传完。斐波那契朴素递归就是这种"指数传话"：f(n) 喊 f(n-1) 和 f(n-2)，同样的消息被重复喊天文数字遍。记忆化 = 给每个听过的人发"已回话"名牌，每人只回一次。</p>
  ),
  derivation: (
    <>
      <h3>数调用，不数感觉</h3>
      <p>朴素 f(n)：调用树每层近乎翻倍 → 调用数 ≈ φⁿ（φ≈1.618）。n=40 时已超 3 亿次。优化：f 只依赖 f(1..n-1) 共 n 个子问题 → 每个子问题算一次存进 memo → O(n) 次调用。</p>
      <h3>复杂度 = 增长率，不是运行秒数</h3>
      <p>比较算法先看量级：O(n) 与 O(n²) 在 n=10⁵ 时是 10⁵ 与 10¹⁰ 的差距——量级错了，常数优化救不了。估算口诀：10⁸ 次简单操作 ≈ 1 秒。</p>
    </>
  ),
  demos: [fibDemo],
  invariants: (
    <ul>
      <li><b>记忆化不变量</b>：memo[k] 一旦写入就不再改变，且恒等于 f(k) 的真值——所以"查到即正确"。</li>
      <li><b>递归不变量</b>：调用栈上每个 f(k) 的正确性只依赖更小的 f(k-1)、f(k-2)——归纳成立，无环。</li>
      <li><b>反例</b>：朴素模式 n=18 时调用数已超过 5000（对比 memo 的 ~35 次）。你在演示里亲手数过。</li>
    </ul>
  ),
  complexity: (
    <ul>
      <li>朴素递归：时间 O(φⁿ)（指数），空间 O(n) 栈深。</li>
      <li>记忆化：时间 O(n)，空间 O(n)（memo + 栈）。</li>
    </ul>
  ),
  code: [{
    title: '完整程序：对比朴素与记忆化的调用次数',
    code: `#include <bits/stdc++.h>
using namespace std;

long long callsNaive = 0;
long long fibNaive(int n) {
    callsNaive++;
    if (n <= 2) return 1;
    return fibNaive(n - 1) + fibNaive(n - 2);
}

vector<long long> memo;
long long callsMemo = 0;
long long fibMemo(int n) {
    callsMemo++;
    if (n <= 2) return 1;
    if (memo[n] != 0) return memo[n];   // 已算过：直接返回
    return memo[n] = fibMemo(n - 1) + fibMemo(n - 2);
}

int main() {
    int n;
    cin >> n;
    memo.assign(n + 1, 0);
    long long a = fibNaive(n);
    long long b = fibMemo(n);
    cout << "value=" << a << "\\n";
    cout << "naive_calls=" << callsNaive << "\\n";
    cout << "memo_calls=" << callsMemo << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'cx-ex1', level: 1, kind: 'answer', title: '数调用（引导）',
      statement: <>朴素 f(5) 共调用多少次函数（含 f(5) 自己）？提示：用演示输入 n=5 数步数，或手画调用树。</>,
      answer: '15', answerPattern: '格式：15',
      hints: ['f(5)→f(4),f(3)；f(4)→f(3),f(2)；画出整棵树。', '调用次数 = 树的节点数。'],
      solution: '15 次。树：f(5)=1+f(4)+f(3)；展开后节点总数 15。可在演示里输入 n=5 验证（naive 模式最终 calls=15）。',
    },
    {
      id: 'cx-ex2', level: 2, kind: 'answer', title: '复杂度判断（独立）',
      statement: <>下面三个片段的复杂度分别是什么？按顺序回答，用逗号分隔（从 O(n), O(n²), O(log n), O(n log n) 中选）：① 单层 for 循环 n 次；② 两层嵌套 for 各 n 次；③ 每次把 n 减半的 while 循环。</>,
      answer: 'o(n),o(n^2),o(log n)', answerPattern: '格式：O(n), O(n^2), O(log n)',
      check: (s) => {
        const t = s.replace(/\s+/g, '').toLowerCase();
        return t === 'o(n),o(n^2),o(logn)' || t === 'o(n),o(n²),o(logn)';
      },
      hints: ['嵌套层数 = 指数相乘。', '每次减半 → 对数。'],
      solution: 'O(n)、O(n²)、O(log n)。这是竞赛里 90% 题目的复杂度来源。',
    },
    {
      id: 'cx-ex3', level: 3, kind: 'choice', title: '时限决策（迁移）',
      statement: <>题目 n ≤ 10⁵，时限 1 秒。下列哪种做法<b>不需要</b>重新设计？</>,
      choices: [
        { text: 'O(n log n) 的排序后处理', correct: true, why: '10⁵ × 17 ≈ 2×10⁶ 次操作，远低于 10⁸ 基准，安全。' },
        { text: 'O(n²) 的双重循环', why: '10¹⁰ 次操作 ≈ 100 秒量级，必须优化。' },
        { text: 'O(2^(n/2)) 的子集枚举', why: '指数级对 n=10⁵ 完全不可行。' },
        { text: 'O(n³)', why: '10¹⁵，完全不可行。' },
      ],
      solution: '用"10⁸ ≈ 1s"估算：n log n 安全，n² 以上必须换算法。这个估算习惯贯穿整个竞赛生涯。',
    },
  ],
  pitfalls: <ul><li>把递归当"免费午餐"——先问有没有重复子问题。</li><li>忽略栈深：n 很大的朴素递归会栈溢出。</li></ul>,
};

/* ================= 5. sorting ================= */

const sortDemo: Demo<number[], SortState> = {
  id: 'bubble-sort',
  title: '演示：冒泡排序（逐次交换 + 多重集合核验）',
  desc: <p className="small muted">每一步平台都在后台核对"元素多重集合不变"（排序只交换不增删）。绿色 = 已就位的后缀。</p>,
  fields: [{ key: 'a', label: '数组（≤10 个整数）', default: '5 2 9 1 5 6', width: 220 }],
  validate: (raw) => {
    const v = validateSortInput(raw);
    return v.ok ? { ok: true, value: v.normalized as number[] } : { ok: false, error: v.error! };
  },
  build: (a) => buildBubbleTrace(a),
  predict: (cur) => {
    if (cur?.type === 'compare') {
      const s = cur.state;
      return { question: `a[${s.cmpL}]=${s.a[s.cmpL]} 与 a[${s.cmpR}]=${s.a[s.cmpR]} 会交换吗？`, options: ['交换', '不交换'], correct: s.a[s.cmpL] > s.a[s.cmpR] ? 0 : 1 };
    }
    return null;
  },
  render: (ev) => {
    const s: SortState = ev?.state || { a: [], i: 0, j: -1, swapped: false, cmpL: -1, cmpR: -1, swapHappened: false, sortedFrom: 99, done: false };
    const cells = cellsOf(s.a, (i) => {
      if (i === s.cmpL || i === s.cmpR) return 'compare';
      if (i >= s.sortedFrom) return 'match';
      return 'idle';
    }, (i) => (i >= s.sortedFrom ? '✓' : undefined));
    return (
      <div>
        <CellRow spec={{ key: 'arr', label: `数组（第 ${s.i + 1} 轮；绿 = 已就位后缀）`, cells }} />
        <VarChips vars={[{ name: '轮次 i', value: s.i }, { name: '比较位置 j', value: s.j }, { name: '本轮有交换', value: s.swapped ? '是' : '否（将提前结束）' }]} />
      </div>
    );
  },
};

const sortSpec: CourseSpec = {
  meta: courseById('sorting')!,
  goals: [
    '能手写冒泡/选择排序并说明每轮结束后"什么已就位"',
    '理解排序的正确性不变量：输出非降序 + 多重集合与输入一致',
    '会用 std::sort 与自定义比较器（含"相等元素不交换"的稳定性话题）',
    '知道比较排序的下界 O(n log n)（在基于比较的模型内）',
  ],
  prereq: ['《数组、下标与字符串》《复杂度与递归》'],
  story: (
    <p>体育课排队：每次只比较<b>相邻</b>两人，个子高的往右换。一轮下来，最高的必然站到队尾——像气泡上浮。重复 n 轮，队伍有序。"每轮之后队尾一段已最终就位"就是排序的循环不变量。</p>
  ),
  derivation: (
    <>
      <h3>从交换到提前终止</h3>
      <p>朴素：固定跑 n-1 轮。观察：某一轮若一次交换都没发生 → 已有序 → 提前结束（演示里能看到）。最坏 O(n²)，最好 O(n)。</p>
      <h3>工程做法：std::sort</h3>
      <p>竞赛实际写 <code>sort(a.begin(), a.end())</code>（O(n log n)）。自定义规则用比较器：如按个子降序 <code>[](int x, int y) {'{'} return x &gt; y; {'}'}</code>。比较器必须满足"严格弱序"——cmp(x,x) 必须为 false，否则运行时崩溃（经典坑）。</p>
    </>
  ),
  demos: [sortDemo],
  invariants: (
    <ul>
      <li><b>多重集合保持</b>：每步事件都在核对（交换不改变元素集合）。这是"排序没把数据搞丢"的底线。</li>
      <li><b>已就位后缀</b>：第 i 轮后 a[n-i..n-1] 是全数组最大的 i 个元素且有序。</li>
      <li><b>稳定性</b>：冒泡交换条件用严格大于 → 相等元素不换位 → 稳定排序。std::sort 不稳定，需要稳定时用 stable_sort。</li>
      <li><b>比较器反例</b>：cmp 写成 &gt;= 会导致 std::sort 越界崩溃——务必用严格比较。</li>
    </ul>
  ),
  complexity: (
    <ul>
      <li>冒泡：最坏/平均 O(n²)，最好 O(n)（提前终止）；空间 O(1)；稳定。</li>
      <li>std::sort：O(n log n)（introsort）；不稳定。</li>
    </ul>
  ),
  code: [{
    title: '完整程序：冒泡排序 + std::sort 自定义比较器对照',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    // 手写冒泡（教学用）
    vector<int> b = a;
    for (int i = 0; i + 1 < (int)b.size(); i++) {
        bool swapped = false;
        for (int j = 0; j + 1 < (int)b.size() - i; j++) {
            if (b[j] > b[j + 1]) {          // 严格大于：相等不换 → 稳定
                swap(b[j], b[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;                // 一轮无交换 → 已有序
    }

    // 工程做法：std::sort + 自定义比较器（降序）
    sort(a.begin(), a.end(), [](int x, int y) { return x > y; });

    for (int i = 0; i < (int)b.size(); i++) cout << b[i] << " \\n"[i + 1 == (int)b.size()];
    for (int i = 0; i < (int)a.size(); i++) cout << a[i] << " \\n"[i + 1 == (int)a.size()];
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'sort-ex1', level: 1, kind: 'answer', title: '手跑一轮（引导）',
      statement: <>数组 [3, 1, 2] 跑冒泡：第 1 轮结束后数组是？格式如 "1 2 3"。</>,
      answer: '1 2 3', answerPattern: '格式：1 2 3',
      hints: ['比较 (3,1) 交换 → (1,3,2)；比较 (3,2) 交换。'],
      solution: '1 2 3。只有 3 个元素，一轮就把最大值 3 冒到最后并顺带完成排序。',
    },
    {
      id: 'sort-ex2', level: 2, kind: 'answer', title: '比较器改写（独立）',
      statement: <>要把学生按分数<b>从高到低</b>排序（pair&lt;int,string&gt;，first 是分数），比较器 lambda 的 return 应写什么？格式：<code>x.first ? y.first</code>（填 ? 为比较符）。</>,
      answer: 'x.first>y.first', answerPattern: '格式：x.first>y.first',
      hints: ['降序 = "前者更大算作不换"。', '必须严格比较。'],
      solution: 'x.first > y.first。注意不能用 >=（破坏严格弱序，std::sort 会崩溃）。',
    },
    {
      id: 'sort-ex3', level: 3, kind: 'choice', title: '稳定性应用（迁移）',
      statement: <>需要按分数排序，同分者保持报名顺序。用 std::sort 自定义 cmp(score) 会有什么问题？</>,
      choices: [
        { text: 'std::sort 不稳定，同分相对顺序可能被打乱；应改用 stable_sort', correct: true, why: '稳定性 = 相等元素保持原相对顺序。stable_sort 保证这一点。' },
        { text: 'std::sort 会崩溃', why: '只要比较器满足严格弱序就不会崩，只是顺序不保证。' },
        { text: '必须手写冒泡', why: 'stable_sort 就是为此设计的 O(n log n) 工具。' },
        { text: '没有问题', why: '同分顺序在本例正是需求，不稳定的排序会破坏它。' },
      ],
      solution: '用 stable_sort。识别"需要稳定性"是排序题的隐藏考点。',
    },
  ],
  pitfalls: <ul><li>比较器用 &gt;=（严格弱序破坏 → RE）。</li><li>冒泡内层边界写错（差一）。</li><li>忘记多重集合检查——交换写成赋值会丢元素。</li></ul>,
};

/* ================= 6. prefix-sum ================= */

const prefixDemo: Demo<number[], PrefixState> = {
  id: 'prefix-demo',
  title: '演示：前缀和构建与区间查询',
  desc: <p className="small muted">pre[k] = a[0..k-1] 之和。构建完后自动演示一次中段区间查询 sum(l..r) = pre[r+1] − pre[l]。</p>,
  fields: [{ key: 'a', label: '数组（≤12 个整数）', default: '3 -1 4 1 -5 9 2 6', width: 240 }],
  validate: (raw) => {
    const v = validatePrefixInput(raw);
    return v.ok ? { ok: true, value: v.normalized as number[] } : { ok: false, error: v.error! };
  },
  build: (a) => buildPrefixTrace(a),
  render: (ev) => {
    const s: PrefixState = ev?.state || { a: [], pre: [], i: 0, l: -1, r: -1, queryResult: null, done: false };
    const preCells = cellsOf(s.pre.map((v) => (v === null ? '?' : v)), (i) => (i <= s.i ? 'done' : 'idle'));
    return (
      <div>
        <CellRow spec={{ key: 'pre', label: '前缀和数组 pre（下标含义：pre[k] = 前 k 个元素之和）', cells: preCells }} />
        <VarChips vars={[
          { name: '查询区间', value: s.l >= 0 ? `[${s.l}, ${s.r}]` : '—' },
          { name: '查询结果', value: s.queryResult ?? '…' },
        ]} />
      </div>
    );
  },
};

const prefixSpec: CourseSpec = {
  meta: courseById('prefix-sum')!,
  goals: [
    '会构建前缀和数组并用 pre[r+1]−pre[l] 做 O(1) 区间和',
    '会构建差分数组并用"两端打标记 + 一次重建"做批量区间加',
    '能说出两者的适用边界：前缀和适合"多次查询"，差分适合"多次修改、最后统一还原"',
    '能复述并避免经典错误：重建时机错误、下标偏移错误',
  ],
  prereq: ['《数组、下标与字符串》'],
  story: (
    <p>高速服务区间距牌："距起点 37 km""距起点 52 km"——两块牌相减立刻知道两牌之间 15 km。前缀和就是一路"累计里程牌"：预付 O(n) 建牌，之后每个区间问题都变成一次减法。差分则是它的镜像：批量给区间"加里程"，只在两端记账。</p>
  ),
  derivation: (
    <>
      <h3>朴素 → 前缀和</h3>
      <p>每次查询直接加：O(r−l+1)。查询多了扛不住 → 预处理 pre[i] = pre[i−1] + a[i−1]，查询变减法。代价：数组不能边查边改（改一个要重算一串——那是树状数组的活）。</p>
      <h3>差分：区间加的"记账法"</h3>
      <p>给 [l,r] 整体加 x：不必改每个元素，记 d[l] += x、d[r+1] −= x；所有操作做完后跑一遍前缀和还原。本质：区间操作转成两个点操作。</p>
    </>
  ),
  demos: [prefixDemo],
  invariants: (
    <ul>
      <li><b>前缀和定义</b>：pre[k] = a[0..k−1] 之和（pre[0] = 0，"空前缀"）。演示每步与直接求和核对。</li>
      <li><b>差分重建不变量</b>：重建结果 = 原数组 + 全部区间加的总效果；平台在 verify 事件里与朴素模拟逐位核对（你能看到 ✓）。</li>
      <li><b>典型反例</b>：① 查询用 pre[r] − pre[l]（少算 a[l]，正确是 pre[r+1] − pre[l]）；② 差分改一半就去查询（未重建）。演示与练习都会锤这两点。</li>
    </ul>
  ),
  complexity: (
    <ul>
      <li>前缀和：构建 O(n)，查询 O(1)，空间 O(n)。</li>
      <li>差分：每次区间加 O(1)，一次重建 O(n)，空间 O(n)。</li>
    </ul>
  ),
  code: [{
    title: '完整程序：前缀和区间查询 + 差分批量区间加',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    // ---- 前缀和：pre[k] = a[0..k-1] 之和 ----
    vector<long long> pre(n + 1, 0);
    for (int k = 1; k <= n; k++) pre[k] = pre[k - 1] + a[k - 1];

    int q;
    cin >> q;
    while (q--) {
        int l, r;                       // 1-based，1 <= l <= r <= n
        cin >> l >> r;
        cout << pre[r] - pre[l - 1] << "\\n";   // 0-based 技巧：pre[r]-pre[l-1]
    }

    // ---- 差分：批量区间加后统一还原 ----
    int m;
    cin >> m;
    vector<long long> d(n + 2, 0);
    for (int i = 0; i < m; i++) {
        int l, r; long long x;
        cin >> l >> r >> x;
        d[l] += x;
        d[r + 1] -= x;                  // r+1 最大为 n+1，故 d 开 n+2
    }
    long long run = 0;
    for (int k = 1; k <= n; k++) {
        run += d[k];
        a[k - 1] += run;                // 原值 + 增量
    }
    for (int i = 0; i < n; i++) cout << a[i] << " \\n"[i + 1 == n];
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'ps-ex1', level: 1, kind: 'answer', title: '手算前缀和（引导）',
      statement: <>a = [2, 3, 1]，则 pre = [pre0, pre1, pre2, pre3] = ？格式如 "0 2 5 6"。</>,
      answer: '0 2 5 6', answerPattern: '格式：0 2 5 6',
      hints: ['pre[0] = 0（空前缀）。', 'pre[k] = pre[k−1] + a[k−1]。'],
      solution: '0 2 5 6。sum(1..2) = pre[2]−pre[0] = 5。',
    },
    {
      id: 'ps-ex2', level: 2, kind: 'answer', title: '差分打标记（独立）',
      statement: <>数组长度 5，要把区间 [2,4]（1-based）整体加 7。d[2] 和 d[?] 分别怎么改？格式如 "d[2]+=7, d[5]-=7"（填出第二个下标与数值）。</>,
      answer: 'd[2]+=7,d[5]-=7', answerPattern: '格式：d[2]+=7, d[5]-=7',
      hints: ['右端点的"下一个位置"减回去。', 'r+1 = 5。'],
      solution: 'd[2] += 7、d[5] -= 7。重建时增量在 [2,4] 内保持 7，到 5 归零。',
    },
    {
      id: 'ps-ex3', level: 3, kind: 'choice', title: '错序诊断（迁移）',
      statement: <>同学写差分：每做一次区间加，就立刻重建并查询。结果数值总是"少了一次操作"。病因？</>,
      choices: [
        { text: '重建时机错误：最后一次区间加之后没有再重建，查询用的是旧数组', correct: true, why: '差分约定"先做完所有修改，最后统一重建"；中途查询必须先重建当前增量。' },
        { text: 'd 数组开小了', why: '开小会越界崩溃，不是"少一次操作"。' },
        { text: '前缀和公式用错', why: '公式错会全错，不会恰好差一次操作。' },
        { text: 'int 溢出', why: '溢出表现为巨大负数。' },
      ],
      solution: '记住节奏：m 次修改全部做完 → 一次 O(n) 重建 → 再查询。',
    },
  ],
  pitfalls: <ul><li>pre[r]−pre[l] 少算 a[l]。</li><li>差分 d 开 n 而不是 n+2（r=n 时越界）。</li><li>边改边查忘重建。</li></ul>,
};

/* ================= 注册 ================= */

export const SPECS_PART1: Record<string, CourseSpec> = {
  'cpp-io-var': varSpec,
  'cpp-if-loop': loopSpec,
  'cpp-array-string': arraySpec,
  complexity: complexitySpec,
  sorting: sortSpec,
  'prefix-sum': prefixSpec,
};
