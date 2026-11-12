/**
 * 标准课程规格 · 第三部分：并查集、堆、拓扑排序、LIS（第二批扩展）。
 */
import { CourseSpec } from './CoursePage';
import { courseById } from './registry';
import { Demo } from './demoKit';
import { CellRow, Cell, VarChips } from '../ui/CellView';
import {
  buildDsuTrace, buildHeapTrace, buildTopoTrace, buildLisTrace,
  validateDsuInput, validateHeapInput, validateTopoInput, validateLisInput,
  DsuState, HeapState, TopoState, LisState, DsuOp, HeapOp,
} from '../algorithms/batch2';

function cellsOf(arr: (string | number)[], states?: (i: number) => string, subs?: (i: number) => string | undefined): Cell[] {
  return arr.map((v, i) => ({ text: String(v), state: states ? states(i) : undefined, sub: subs ? subs(i) : undefined }));
}

/* ================= 13. dsu 并查集 ================= */

const dsuDemo: Demo<{ ops: DsuOp[]; n: number }, DsuState> = {
  id: 'dsu-demo',
  title: '演示：并查集（路径压缩 + 按大小合并）',
  desc: <p className="small muted">+a b 合并、?a b 查询。合并前先展示两次 find 链（黄色 = 链上节点）；查询结果与独立分组模型逐步对照。试冗余合并（同根）看"防环"。</p>,
  fields: [
    { key: 'ops', label: '操作序列（≤12 条，如 +1 2 ?1 4）', default: '+1 2 +2 3 +3 4 ?1 4 ?1 5 +1 4 ?4 5', width: 300 },
    { key: 'n', label: '节点数 n（2~12）', default: '6', width: 100 },
  ],
  validate: (raw) => {
    const v = validateDsuInput(raw);
    return v.ok ? { ok: true, value: v.normalized as { ops: DsuOp[]; n: number } } : { ok: false, error: v.error! };
  },
  build: (v) => buildDsuTrace(v.ops, v.n),
  render: (ev, v) => {
    const s: DsuState = ev?.state || { n: v.n, fa: Array.from({ length: v.n + 1 }, (_, i) => i), size: new Array(v.n + 1).fill(1), op: null, findPath: [], compressed: false, rootsCompared: null, result: '', done: false };
    const faCells = cellsOf(s.fa.slice(1), (i) => (s.findPath.includes(i + 1) ? 'compare' : 'idle'), (i) => `${i + 1}→${s.fa[i + 1]}`);
    const szCells = cellsOf(s.size.slice(1), () => 'dim');
    return (
      <div>
        <CellRow spec={{ key: 'fa', label: 'fa 数组（格内小字 = i→fa[i]；黄 = 当前 find 链）', cells: faCells, showIndex: false }} />
        <CellRow spec={{ key: 'sz', label: 'size 数组（每棵树的大小）', cells: szCells, showIndex: false }} />
        <VarChips vars={[
          ...(s.op ? [{ name: '当前操作', value: ({ union: '+', find: '?' } as Record<string, string>)[s.op.kind] + `${s.op.a} ${s.op.b}` }] : []),
          ...(s.result ? [{ name: '结果', value: s.result }] : []),
          ...(s.rootsCompared ? [{ name: '涉及根', value: `${s.rootsCompared[0]} 与 ${s.rootsCompared[1]}` }] : []),
        ]} />
      </div>
    );
  },
};

const dsuSpec: CourseSpec = {
  meta: courseById('dsu')!,
  goals: [
    '能写出带路径压缩与按大小合并的并查集，并解释两者各自防止什么退化',
    '能陈述并维护核心不变量：fa 构成森林、每集合唯一根',
    '知道合并前必须先找根（同根合并会产生环）',
    '会估算复杂度：均摊 O(α(n))，近似常数',
  ],
  prereq: ['《DFS 与 BFS》（连通性直觉）、《数组、下标与字符串》'],
  story: (
    <p>社交网络的"朋友圈"：每查询两人是否连通、每添加一个好友关系。笨办法每次 BFS 全网扫描。并查集的洞察：连通性只需要记住"谁是代表"（根）——用一棵"代表树"维护每个圈子，查询就是"你们的代表是同一个人吗"。</p>
  ),
  derivation: (
    <>
      <h3>朴素 → fa 数组 → 两大优化</h3>
      <p>朴素：合并时把一整组成员改标签——O(n) 每次。优化一：只记 fa[i]（父节点），合并 = 改一个指针，但链会越接越长 → find 退化 O(n)。优化二：<b>路径压缩</b>（find 完顺路把链上所有人直接挂到根，树变扁）+ <b>按大小合并</b>（小树挂大树，树高受 log 控制）。两者合璧 = 均摊 O(α(n))。</p>
      <h3>为什么合并前必须查根？</h3>
      <p>直接 fa[a]=b 可能制造环（a 和 b 本来就在同一棵树里）。演示里做一次冗余合并，看 same-root 事件怎么拦住它。</p>
    </>
  ),
  demos: [dsuDemo],
  invariants: (
    <ul>
      <li><b>森林结构不变量</b>（每步核验）：fa 无环、每节点沿 fa 必达其集合唯一根。</li>
      <li><b>合并只改一个指针</b>：其余结构不变——这是 O(1) 合并的来源。</li>
      <li><b>典型反例</b>：不查根直接 fa[a]=b → 环 → find 死循环；不做按大小合并的链式合并 → 树退化成链。</li>
    </ul>
  ),
  complexity: <p>单次操作均摊 O(α(n))（α 为反阿克曼函数，实践中 ≤ 4）；空间 O(n)。</p>,
  code: [{
    title: '完整程序：路径压缩 + 按大小合并的并查集（含连通块计数）',
    code: `#include <bits/stdc++.h>
using namespace std;

struct DSU {
    vector<int> fa, sz;
    DSU(int n) : fa(n + 1), sz(n + 1, 1) { for (int i = 0; i <= n; i++) fa[i] = i; }
    int find(int x) {
        while (fa[x] != x) x = fa[x] = fa[fa[x]];   // 路径压缩（隔代跳两步，顺路压缩）
        return x;
    }
    // 返回是否真的发生了合并（同根 = 已在同一集合）
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;                    // 防环：先查根！
        if (sz[a] < sz[b]) swap(a, b);               // 按大小合并：小挂大
        fa[b] = a;
        sz[a] += sz[b];
        return true;
    }
};

int main() {
    int n, q;
    cin >> n >> q;
    DSU dsu(n);
    int extraEdges = 0;
    while (q--) {
        string op; int a, b;
        cin >> op >> a >> b;
        if (op == "+") {
            if (!dsu.unite(a, b)) extraEdges++;      // 冗余边（两端已连通）
        } else {
            cout << (dsu.find(a) == dsu.find(b) ? "YES" : "NO") << "\\n";
        }
    }
    int groups = 0;
    for (int i = 1; i <= n; i++) if (dsu.find(i) == i) groups++;
    cout << "groups=" << groups << " redundant=" << extraEdges << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'dsu-ex1', level: 1, kind: 'answer', title: '手算 find 链（引导）',
      statement: <>fa = [_,1,1,2,3]（fa[1]=1, fa[2]=1, fa[3]=2, fa[4]=3）。find(4) 的路径是？格式 "4-3-2-1"（用 - 连接）。</>,
      answer: '4-3-2-1', answerPattern: '格式：4-3-2-1',
      hints: ['从 4 出发：fa[4]=3，继续。', 'fa[3]=2，fa[2]=1，fa[1]=1 停。'],
      solution: '4→3→2→1（根是 1）。路径压缩后 fa[4]=fa[3]=fa[2]=1。',
    },
    {
      id: 'dsu-ex2', level: 2, kind: 'answer', title: '按大小合并决策（独立）',
      statement: <>两棵树：根 x（size=3）、根 y（size=7）。unite 后 fa[y] 应等于什么？直接回答节点名。</>,
      answer: 'x', answerPattern: '格式：x 或 y',
      hints: ['小树挂大树。', 'size 3 &lt; size 7。'],
      solution: 'fa[y] = x：小树（3）挂到大树（7）下，新树高最多增加小树的高度。',
    },
    {
      id: 'dsu-ex3', level: 3, kind: 'choice', title: '退化诊断（迁移）',
      statement: <>同学的并查集有时很慢，发现他把合并写成 `fa[find(a)] = b;`（b 是原编号不是根）。会产生什么问题？</>,
      choices: [
        { text: 'b 不是根 → 树结构被破坏，fa 可能出现环或使 find 越走越深', correct: true, why: '合并必须"根挂根"；挂到非根节点会让两个根共存，结构失去森林性质。' },
        { text: '没有问题，只是慢一点', why: '结构错误会导致查询结果错误，不只是慢。' },
        { text: '编译错误', why: '语法完全合法，是逻辑错误。' },
        { text: '只会影响按大小合并', why: '森林结构本身就是错的。' },
      ],
      solution: '合并的固定句式：a = find(a); b = find(b); if (a == b) return; fa[小根] = 大根;。任何一步省略都可能破坏不变量。',
    },
  ],
  pitfalls: <ul><li>合并忘记先 find（环）。</li><li>find 递归写法在大数据下爆栈（用循环或半压缩）。</li><li>只做压缩不做按大小合并（或反之）——两者配合才有 α 均摊。</li></ul>,
};

/* ================= 14. heap 堆 ================= */

const heapDemo: Demo<HeapOp[], HeapState> = {
  id: 'heap-demo',
  title: '演示：小根堆（上浮 swim / 下沉 sink）',
  desc: <p className="small muted">+k 插入（上浮）、-1 弹出最小（下沉）。数组形态展示（1-based，heap[0] 占位）；堆性质在每次调整完成后由平台实时核验。</p>,
  fields: [
    { key: 'ops', label: '操作序列（≤12 条，如 +5 +3 +8 -1）', default: '+5 +3 +8 +1 -1 -1 +2 -1', width: 280 },
  ],
  validate: (raw) => {
    const v = validateHeapInput(raw);
    return v.ok ? { ok: true, value: v.normalized as HeapOp[] } : { ok: false, error: v.error! };
  },
  build: (v) => buildHeapTrace(v),
  predict: (cur) => {
    if (cur?.type === 'compare' && cur.state.phase === 'swim') {
      const s = cur.state;
      const willSwap = s.heap[s.cmpIdx] > s.heap[s.activeIdx];
      return { question: `父 heap[${s.cmpIdx}]=${s.heap[s.cmpIdx]} > 当前 ${s.heap[s.activeIdx]}？会交换吗？`, options: ['交换（上浮一层）', '不交换（到位）'], correct: willSwap ? 0 : 1 };
    }
    return null;
  },
  render: (ev) => {
    const s: HeapState = ev?.state || { heap: [0], op: null, activeIdx: -1, cmpIdx: -1, phase: 'none', result: '', done: false };
    const cells = cellsOf(s.heap.slice(1), (i) => {
      const idx = i + 1;
      if (idx === s.activeIdx) return 'compare';
      if (idx === s.cmpIdx) return 'active';
      return 'idle';
    });
    return (
      <div>
        <CellRow spec={{
          key: 'heap', label: `堆数组（1-based；黄 = 当前节点，蓝 = 比较/交换对象；位置 i 的父 = i>>1）`,
          cells, showIndex: false,
        }} />
        <VarChips vars={[
          { name: '堆大小', value: Math.max(0, s.heap.length - 1) },
          ...(s.result ? [{ name: '结果', value: s.result }] : []),
          ...(s.activeIdx > 0 ? [{ name: '当前节点', value: `位置 ${s.activeIdx}（父 ${s.activeIdx >> 1}）` }] : []),
        ]} />
      </div>
    );
  },
};

const heapSpec: CourseSpec = {
  meta: courseById('heap')!,
  goals: [
    '能手写小根堆的 push（上浮）与 pop（下沉），数组 1-based 编号父子关系张口就来',
    '能陈述堆不变量（父 ≤ 子 + 完全二叉树）并解释为什么它保证堆顶最小',
    '理解上浮/下沉的中间态允许暂未满足堆序，调整完成才恢复',
    '知道复杂度 O(log n) 的来源（树高）与"堆 ≠ 排序好数组"的区别',
  ],
  prereq: ['《数组、下标与字符串》《二分查找与二分答案》（树高 = log 的直觉）'],
  story: (
    <p>医院分诊台：病人不断到来（插入），护士总要先处理病情最危急的（取最小编号）。每来一人不必全队重新排序——把新人先放队尾，再"往上顶"直到位置合理；处理完队首，把队尾的人放到队首"往下压"到合适位置。这就是堆：用 O(log n) 维护"随时可取最小"。</p>
  ),
  derivation: (
    <>
      <h3>为什么用数组存树？</h3>
      <p>完全二叉树可以压平进数组：位置 i 的父是 i&gt;&gt;1，左右子是 2i、2i+1——无需指针，缓存友好。</p>
      <h3>上浮与下沉只动一条路径</h3>
      <p>插入破坏性质的只可能是新节点与其祖先链 → 沿链上浮，最多树高 log n 步。弹出后末尾元素放堆顶 → 沿"较小的子节点"下沉。每一步平台都核验堆性质——注意 compare/swap 事件是<b>调整中间态</b>，性质在 push-done/sink-done 事件处恢复（与哈希删除修复同样的设计）。</p>
    </>
  ),
  demos: [heapDemo],
  invariants: (
    <ul>
      <li><b>堆性质</b>（调整完成事件核验）：任意父 ≤ 子 → 归纳可得堆顶是全局最小。</li>
      <li><b>完全二叉树</b>：数组前 size 项无空洞 → 父子下标公式成立。</li>
      <li><b>中间态</b>：place/compare/swap 事件允许暂时违反堆序——这正是上浮/下沉存在的意义；若看到"调整完成后仍违规"才是 bug。</li>
      <li><b>典型反例</b>：弹出后忘记把末尾元素放堆顶（直接删 heap[1] → 树断裂）；下沉时选错子节点（应与<b>较小</b>子交换）。</li>
    </ul>
  ),
  complexity: <p>push/pop 均摊 O(log n)；建堆（逐个插入）O(n log n)；堆顶查询 O(1)；空间 O(n)。</p>,
  code: [{
    title: '完整程序：手写小根堆（push/pop）+ std::priority_queue 对照',
    code: `#include <bits/stdc++.h>
using namespace std;

struct MinHeap {
    vector<int> h = { 0 };                    // 1-based：h[0] 占位
    void push(int x) {
        h.push_back(x);
        int i = (int)h.size() - 1;
        while (i > 1 && h[i >> 1] > h[i]) {   // 上浮 swim
            swap(h[i >> 1], h[i]);
            i >>= 1;
        }
    }
    int pop() {                                // 弹出最小；调用前保证非空
        int top = h[1];
        int last = h.back();
        h.pop_back();
        if (h.size() > 1) {
            h[1] = last;
            int i = 1, n = (int)h.size() - 1;
            while (true) {                     // 下沉 sink
                int l = 2 * i, r = 2 * i + 1, s = i;
                if (l <= n && h[l] < h[s]) s = l;
                if (r <= n && h[r] < h[s]) s = r;
                if (s == i) break;
                swap(h[i], h[s]);
                i = s;
            }
        }
        return top;
    }
    bool empty() const { return h.size() <= 1; }
};

int main() {
    int q;
    cin >> q;
    MinHeap my;
    priority_queue<int, vector<int>, greater<int>> stl;   // 小根堆（默认是大根堆！）
    while (q--) {
        string op;
        cin >> op;
        if (op[0] == '+') {
            int x = stoi(op.substr(1));
            my.push(x);
            stl.push(x);
        } else {
            cout << my.pop() << " " << stl.top() << "\\n";   // 两者应一致
            stl.pop();
        }
    }
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'heap-ex1', level: 1, kind: 'answer', title: '父子下标（引导）',
      statement: <>1-based 数组中，位置 7 的父节点位置与左右子位置分别是？格式如 "3, 6, 7"。</>,
      answer: '3, 14, 15', answerPattern: '格式：3, 14, 15',
      hints: ['父 = 7>>1（除以 2 取整）。', '左子 = 2×7，右子 = 左子+1。'],
      solution: '父 3，左子 14，右子 15。',
    },
    {
      id: 'heap-ex2', level: 2, kind: 'answer', title: '手跑上浮（独立）',
      statement: <>堆 [_, 2, 5, 6]，插入 1 后的数组是？格式如 "1, 2, 5, 6"（从 heap[1] 开始，逗号分隔）。</>,
      answer: '1, 5, 6, 2', answerPattern: '格式：1, 5, 6, 2',
      hints: ['1 先放到末尾：[2,5,6,1]。', '1 与父 5 交换，再与父 2 交换。'],
      solution: '插入后 [2,5,6,1] → 上浮：1 与 5 交换 → [2,1,6,5] → 1 与 2 交换 → [1,2,6,5]。即 heap[1..4] = 1,2,6,5。',
    },
    {
      id: 'heap-ex3', level: 3, kind: 'choice', title: '下沉选路（迁移）',
      statement: <>下沉时为什么必须与<b>较小</b>的子节点交换？（当前节点比两个子都大）</>,
      choices: [
        { text: '与较小子交换才能保证交换后那一子树恢复堆序；与较大子交换会把更小的值压到下面', correct: true, why: '例如父 9、子 3 和 5：与 5 交换后 3 变成 5 的子节点 → 5 > 3 违规。选最小子交换是下沉正确性的关键。' },
        { text: '随便选一个都能恢复堆序', why: '上面 3/5 的例子就是反例。' },
        { text: '必须与左子交换', why: '与大小有关，与左右无关。' },
        { text: '为了效率（少比较一次）', why: '正确性原因，不是效率原因。' },
      ],
      solution: '下沉方向选择 = 在"两个子树都合法"的前提下挑能保持合并后仍合法的那个——这是堆调整的核心论证。',
    },
  ],
  pitfalls: <ul><li>std::priority_queue 默认大根堆——小根要写 greater&lt;int&gt;。</li><li>下沉边界：子节点下标 ≤ size 才能比较。</li><li>弹出后忘放末尾元素到堆顶。</li></ul>,
};

/* ================= 15. graph-topo 拓扑排序 ================= */

const topoDemo: Demo<{ n: number; edges: { from: number; to: number }[] }, TopoState> = {
  id: 'topo-demo',
  title: '演示：拓扑排序（Kahn 算法 + 环检测）',
  desc: <p className="small muted">u-&gt;v 表示"u 必须先于 v"。入度归零的点入队；顺带完成环检测（队列空但没输出完 = 有环）。试环 1-&gt;2-&gt;3-&gt;1。</p>,
  fields: [
    { key: 'n', label: '节点数 n（2~8）', default: '6', width: 90 },
    { key: 'edges', label: '边（≤12 条，u->v）', default: '1->2, 1->3, 2->4, 3->4, 4->5, 5->6', width: 300 },
  ],
  validate: (raw) => {
    const v = validateTopoInput(raw);
    return v.ok ? { ok: true, value: v.normalized as { n: number; edges: { from: number; to: number }[] } } : { ok: false, error: v.error! };
  },
  build: (v) => buildTopoTrace(v.n, v.edges),
  render: (ev, v) => {
    const s: TopoState = ev?.state || {
      n: v.n, edges: v.edges,
      indeg: new Array(v.n + 1).fill(0), adj: Array.from({ length: v.n + 1 }, () => []), queue: [], order: [], cur: null, scanned: [], hasCycle: false, done: false,
    };
    const indegCells = cellsOf(s.indeg.slice(1), (i) => {
      const node = i + 1;
      if (s.order.includes(node)) return 'match';
      if (s.queue.includes(node)) return 'active';
      if (s.scanned.includes(node)) return 'compare';
      return 'idle';
    }, (i) => `d=${s.indeg[i + 1]}`);
    return (
      <div>
        <CellRow spec={{ key: 'indeg', label: '入度表（格内小字 = 当前入度；绿 = 已输出，蓝 = 队列中，黄 = 本步被减）', cells: indegCells, showIndex: false }} />
        <VarChips vars={[
          { name: '队列', value: s.queue.length ? `[${s.queue.join(', ')}]` : '空' },
          { name: '已输出', value: s.order.length ? `[${s.order.join(' → ')}]` : '—' },
          ...(s.cur !== null ? [{ name: '当前处理', value: s.cur }] : []),
          ...(s.done ? [{ name: '结论', value: s.hasCycle ? '存在环！' : '拓扑序完成 ✓' }] : []),
        ]} />
      </div>
    );
  },
};

const topoSpec: CourseSpec = {
  meta: courseById('graph-topo')!,
  goals: [
    '能手写 Kahn 算法（入度表 + 队列），并解释"入度 0 = 无未处理前驱"',
    '会构建邻接表与入度表（边每条只处理一次）',
    '能解释环检测原理：输出数 < n ⇔ 存在环',
    '会估算 O(n+m) 并识别拓扑序不唯一的含义',
  ],
  prereq: ['《DFS 与 BFS》《栈与队列》（BFS 用队列的同款容器）'],
  story: (
    <p>选课系统：先修课关系构成一张图——"数据结构"要求先学"程序设计"。排课顺序就是拓扑排序：每次只能排"没有未满足先修要求"的课（入度 0），排掉它之后，以它为先修的课少一个约束（入度减一）。如果排着排着所有剩余课程都互相等对方——课表无法排出，那就是环。</p>
  ),
  derivation: (
    <>
      <h3>朴素 → Kahn</h3>
      <p>朴素：每次找任意入度 0 的点都要全图扫 → O(n²)。优化：维护队列装"当前入度 0"的点，删边时顺路把新归零的点入队——每点入队出队恰一次、每边删一次 → O(n+m)。</p>
      <h3>环检测是免费的</h3>
      <p>环上的点互相等待，入度永远不归零 → Kahn 结束时输出数 &lt; n。这一特性常被直接用于"判断有向图有环"。</p>
    </>
  ),
  demos: [topoDemo],
  invariants: (
    <ul>
      <li><b>部分序合法性</b>（每步核验）：已输出序列中任意"两端均已输出"的边，起点先于终点。</li>
      <li><b>队列语义</b>：队列中的点入度均为 0（其所有前驱都已输出）——输出它们是安全的。</li>
      <li><b>典型反例</b>：图有环时强行输出（顺序违反边方向）；建邻接表漏算入度（起点不唯一）。用演示输入 1-&gt;2, 2-&gt;3, 3-&gt;1 看环检测。</li>
    </ul>
  ),
  complexity: <p>时间 O(n+m)；空间 O(n+m)（邻接表 + 入度 + 队列）。拓扑序通常不唯一——合法性才是唯一要求。</p>,
  code: [{
    title: '完整程序：Kahn 拓扑排序 + 环检测（与 DFS 解法对照说明）',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;                 // u 必须在 v 之前
        adj[u].push_back(v);
        indeg[v]++;
    }
    queue<int> q;
    for (int i = 1; i <= n; i++)
        if (indeg[i] == 0) q.push(i);  // 无前驱的点直接可选

    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            indeg[v]--;
            if (indeg[v] == 0) q.push(v);
        }
    }
    if ((int)order.size() < n) {
        cout << "CYCLE\\n";             // 有环：剩余点互相等待
        return 0;
    }
    for (int i = 0; i < n; i++)
        cout << order[i] << " \\n"[i + 1 == n];
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'topo-ex1', level: 1, kind: 'answer', title: '找初始队列（引导）',
      statement: <>n=5，边：1-&gt;3, 2-&gt;3, 3-&gt;4, 5-&gt;4。初始入度 0 的节点（从小到大，逗号分隔）？</>,
      answer: '1,2,5', answerPattern: '格式：1,2,5',
      hints: ['入度 = 被指向的次数。', '3 被指 2 次，4 被指 2 次。'],
      solution: '1、2、5 没有入边。3 和 4 有前驱，需要等待。',
    },
    {
      id: 'topo-ex2', level: 2, kind: 'answer', title: '环判定（独立）',
      statement: <>n=3，边：1-&gt;2, 2-&gt;3, 3-&gt;2。Kahn 输出多少个节点后队列变空？（回答数字）</>,
      answer: '1', answerPattern: '格式：1',
      hints: ['只有 1 入度 0。', '输出 1 后删 1-&gt;2：d[2]=0 → 2 入队？再看 2-&gt;3 与 3-&gt;2。'],
      solution: '输出 1 个（节点 1）。2 入队后输出，删 2-&gt;3 使 d[3]=0 → 3 入队输出后删 3->2 使 d[2] 变 -1？不——2 已输出，其出边已删。实际：2-&gt;3 使 d[3]=1→0？d[3] 初始 =1（来自 2），输出 2 后 d[3]=0，3 入队。3 输出后删 3-&gt;2：2 已输出。等等——2-&gt;3 与 3-&gt;2 构成环，d[2] 初始 =1（来自 1）+1（来自 3）=2！输出 1 后 d[2]=1 ≠ 0 → 队列空。答案：1。',
    },
    {
      id: 'topo-ex3', level: 3, kind: 'choice', title: '不唯一性（迁移）',
      statement: <>拓扑排序结果不唯一时，哪个操作是<b>安全</b>的？</>,
      choices: [
        { text: '用堆/最小编号优先从候选中取点，得到字典序最小的合法拓扑序', correct: true, why: '候选集合（入度 0）中任选都合法；用堆选择只是改变"选谁"，合法性不变——这也是常见题型"最小字典序拓扑序"。' },
        { text: '随意交换相邻两个已输出节点', why: '可能违反边方向。' },
        { text: '跳过入度不为 0 的点', why: '违反队列语义（会有前驱未处理）。' },
        { text: '把环上的点强行插入序列', why: '环上点没有合法位置。' },
      ],
      solution: '候选中任取都安全——这是拓扑序"不唯一但都合法"的正确用法。',
    },
  ],
  pitfalls: <ul><li>入度表与邻接表不同步（建图时漏 ++）。</li><li>环检测忘了比较 order.size() 与 n。</li><li>重边未去重（入度多算，Kahn 仍正确但演示不清晰）。</li></ul>,
};

/* ================= 16. dp-lis-lcs 序列 DP ================= */

const lisDemo: Demo<number[], LisState> = {
  id: 'lis-demo',
  title: '演示：最长上升子序列 LIS（O(n²) 填表）',
  desc: <p className="small muted">dp[i] = 以 a[i] 结尾的 LIS 长度。每格转移都展示"从哪个 j 接过来"；平台核验 prev 链可还原真实子序列。</p>,
  fields: [{ key: 'a', label: '序列（≤10 个整数）', default: '3 1 4 1 5 9 2 6', width: 220 }],
  validate: (raw) => {
    const v = validateLisInput(raw);
    return v.ok ? { ok: true, value: v.normalized as number[] } : { ok: false, error: v.error! };
  },
  build: (a) => buildLisTrace(a),
  render: (ev) => {
    const s: LisState = ev?.state || { a: [], dp: [], prev: [], i: 0, j: -1, cmpIdx: -1, done: false, answer: 0 };
    const aCells = cellsOf(s.a, (i) => (i === s.j ? 'compare' : i === s.i ? 'active' : 'idle'));
    const dpCells = cellsOf(s.dp, (i) => (i === s.i ? 'compare' : i < s.i ? 'done' : 'idle'), (i) => (s.prev[i] >= 0 ? `←${s.prev[i]}` : undefined));
    return (
      <div>
        <CellRow spec={{ key: 'a', label: '序列 a（黄 = 当前 i，蓝 = 正在比较的 j）', cells: aCells }} />
        <CellRow spec={{ key: 'dp', label: 'dp（格内小字 = 前驱 prev；绿 = 已完成行）', cells: dpCells }} />
        <VarChips vars={[
          { name: 'i', value: Math.min(s.i, s.a.length - 1) },
          ...(s.j >= 0 ? [{ name: 'j', value: s.j }] : []),
          ...(s.done ? [{ name: '答案', value: s.answer, note: 'max(dp)' }] : []),
        ]} />
      </div>
    );
  },
};

const lisSpec: CourseSpec = {
  meta: courseById('dp-lis-lcs')!,
  goals: [
    '能定义 LIS 的状态（dp[i] = 以 i 结尾的最长上升子序列长度）并写出 O(n²) 转移',
    '能解释为什么状态要"以 i 结尾"（保证无后效性）',
    '会用 prev 数组回溯还原具体方案',
    '知道 O(n log n) 的贪心+二分做法存在（本课实现 O(n²)）',
  ],
  prereq: ['《背包 DP》（状态与转移的基本功）'],
  story: (
    <p>叠罗汉：一排人按身高排队，想选最多的人站成一列严格递增的"人梯"——每人只能选一次、必须越来越矮。以"最后一个人是谁"给每个方案分类，就能把指数级的选择收敛成 n 个子问题。</p>
  ),
  derivation: (
    <>
      <h3>状态设计是关键一步</h3>
      <p>如果状态只定义"前 i 个的 LIS"，转移时不知道"能否接上"（需要知道结尾元素）→ 有后效性。改成 dp[i] = <b>以 i 结尾</b>的 LIS：结尾确定，转移就是扫所有 j&lt;i 且 a[j]&lt;a[i]，取 dp[j]+1 的最大值。</p>
      <h3>方案的还原</h3>
      <p>转移时记录 prev[i] = 从哪个 j 接过来；答案位置沿 prev 回溯即得具体子序列。演示中每个 dp 格下方就是 prev。</p>
    </>
  ),
  demos: [lisDemo],
  invariants: (
    <ul>
      <li><b>dp 可达性</b>（每步核验）：沿 prev 链回溯得到长度恰为 dp[i] 的严格上升子序列——dp 不是纸面数字，而是真实可构造的方案。</li>
      <li><b>边界</b>：dp[i] ≥ 1（自己一个元素）；"上升"为严格（相等不算）。</li>
      <li><b>典型反例</b>：状态定义漏掉"结尾"→ 无法转移；相等元素误用 a[j] ≤ a[i] → 得到"非降"而非"上升"。</li>
    </ul>
  ),
  complexity: <p>O(n²) 时间 / O(n) 空间（教学版）；贪心 + 二分可达 O(n log n)（LIS_ref 程序里已内置双实现互验）。</p>,
  code: [{
    title: '完整程序：LIS O(n²) + 贪心二分 O(n log n) 双实现互验',
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;

    // O(n²)：dp[i] = 以 i 结尾的 LIS 长度
    vector<int> dp(n, 1), prev(n, -1);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (a[j] < a[i] && dp[j] + 1 > dp[i]) {
                dp[i] = dp[j] + 1;
                prev[i] = j;
            }
        }
    }
    int best = 0, bestIdx = -1;
    for (int i = 0; i < n; i++) {
        if (dp[i] > best) { best = dp[i]; bestIdx = i; }
    }
    // 沿 prev 回溯还原方案
    vector<int> seq;
    for (int cur = bestIdx; cur != -1; cur = prev[cur]) seq.push_back(a[cur]);
    reverse(seq.begin(), seq.end());

    // O(n log n)：tails[k] = 长度 k+1 的上升子序列的最小结尾
    vector<int> tails;
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }

    cout << "len=" << best << "\\n";
    cout << "seq:";
    for (int x : seq) cout << " " << x;
    cout << "\\n";
    cout << "fast=" << tails.size() << "\\n";
    return 0;
}
`,
  }],
  exercises: [
    {
      id: 'lis-ex1', level: 1, kind: 'answer', title: '手算 dp 一行（引导）',
      statement: <>a = [2, 2, 3]，dp[0]=dp[1]=1。dp[2] 与 prev[2] 是？（格式 "dp=?, prev=?"，prev 用下标）</>,
      answer: 'dp=2, prev=0', answerPattern: '格式：dp=2, prev=0',
      hints: ['j=0：a[0]=2 < 3 → 候选 dp[0]+1=2。', 'j=1：a[1]=2 < 3 → 候选也是 2，不严格更大 → 不更新 prev。'],
      solution: 'dp[2]=2（前驱取最早的 j=0）。相等值不严格更优，保留先出现的——回溯方案是 [2,3]。',
    },
    {
      id: 'lis-ex2', level: 2, kind: 'answer', title: '全递减序列（独立）',
      statement: <>a = [5, 4, 3, 2, 1] 的 LIS 长度是？</>,
      answer: '1', answerPattern: '格式：1',
      hints: ['严格上升。', '任何两个数都构成下降对。'],
      solution: '1（只能取单个元素）。全递减是 LIS 的最小退化情形。',
    },
    {
      id: 'lis-ex3', level: 3, kind: 'choice', title: '状态改造（迁移）',
      statement: <>题目改成"最长<b>非降</b>子序列"（允许相等）。转移条件应改成？</>,
      choices: [
        { text: 'a[j] <= a[i]（把严格小于放宽为不大于）', correct: true, why: '非降允许相等元素相接，转移条件同步放宽；二分版用 upper_bound。' },
        { text: 'a[j] < a[i] 不变', why: '那样仍是严格上升。' },
        { text: 'a[j] >= a[i]', why: '方向反了，那是下降。' },
        { text: '状态要重新定义', why: '状态本身（以 i 结尾）不变，只放宽比较条件。' },
      ],
      solution: '识别"题目条件变化 → 只改转移的比较符"是 DP 迁移的基本功。',
    },
  ],
  pitfalls: <ul><li>状态漏"结尾"维度 → 无法转移。</li><li>严格/非降混淆。</li><li>忘了 prev 数组导致只能输出长度不能输出方案。</li></ul>,
};

/* ================= 注册 ================= */

export const SPECS_PART3: Record<string, CourseSpec> = {
  dsu: dsuSpec,
  heap: heapSpec,
  'graph-topo': topoSpec,
  'dp-lis-lcs': lisSpec,
};
