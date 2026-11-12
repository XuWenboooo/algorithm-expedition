/**
 * 课程注册表：完整知识路线图（0-9 阶段）。
 * 状态严格区分：
 *  - READY        真正实现并通过约定验收（可视化+不变量+完整代码+练习+测试）
 *  - IN_PROGRESS  部分实现（缺失内容在 missing 字段列明）
 *  - PLANNED      只有路线规划，不冒充完整课程
 *
 * 注意：难度标签仅描述课程内容的相对位置，不与任何平台颜色或
 * "CCPC 金牌"机械等同——金牌来自长期训练，不是软件效果保证。
 */

export type CourseStatus = 'READY' | 'IN_PROGRESS' | 'PLANNED';

export interface CourseMeta {
  id: string;
  title: string;
  stage: number;          // 0..9 对应路线图阶段
  status: CourseStatus;
  deps: string[];         // 先修课程 id
  summary: string;
  /** IN_PROGRESS 时列明缺失内容 */
  missing?: string[];
  /** 供阶段地图使用的短标签 */
  refDifficulty?: string;
}

export const COURSES: CourseMeta[] = [
  /* ---- 阶段 0：C++ 语法地基 ---- */
  { id: 'cpp-io-var', title: 'C++ 起步：输入输出与变量', stage: 0, status: 'READY', deps: [],
    summary: 'cin/cout、int/long long/double、运算符与类型陷阱（整除、溢出）。', refDifficulty: '零基础' },
  { id: 'cpp-if-loop', title: '条件与循环', stage: 0, status: 'READY', deps: ['cpp-io-var'],
    summary: 'if/else、while、for、循环不变量思想，常见死循环与差一错误。', refDifficulty: '零基础' },
  { id: 'cpp-array-string', title: '数组、下标与字符串', stage: 0, status: 'READY', deps: ['cpp-if-loop'],
    summary: '数组寻址、越界危害、string 基本操作、字符 ASCII。', refDifficulty: '零基础' },
  { id: 'cpp-func', title: '函数、参数与作用域', stage: 0, status: 'PLANNED', deps: ['cpp-array-string'],
    summary: '函数封装、传值/传引用、多文件组织（规划中）。' },

  /* ---- 阶段 1：算法基础 ---- */
  { id: 'complexity', title: '复杂度与递归', stage: 1, status: 'READY', deps: ['cpp-if-loop', 'cpp-array-string'],
    summary: '大 O 直觉、递归调用树、斐波那契朴素 vs 记忆化。', refDifficulty: '入门' },
  { id: 'stl-basics', title: 'STL 入门与调试', stage: 1, status: 'PLANNED', deps: ['cpp-array-string'],
    summary: 'vector/set/map/stack/queue 常用操作与调试方法（规划中）。' },

  /* ---- 阶段 2：基础解题 ---- */
  { id: 'sorting', title: '排序与比较器', stage: 2, status: 'READY', deps: ['cpp-array-string', 'complexity'],
    summary: '冒泡/选择排序逐步执行、正确性不变量、sort+比较器、稳定性。', refDifficulty: '入门' },
  { id: 'prefix-sum', title: '前缀和与差分', stage: 2, status: 'READY', deps: ['cpp-array-string'],
    summary: 'O(1) 区间和查询与 O(1) 区间加；重建不变量与经典错序反例。', refDifficulty: '入门' },
  { id: 'binary-search', title: '二分查找与二分答案', stage: 2, status: 'READY', deps: ['sorting'],
    summary: '区间不变量、左右边界写法、错误边界示例、二分答案初步。', refDifficulty: '普及−' },
  { id: 'two-pointers', title: '双指针与滑动窗口', stage: 2, status: 'READY', deps: ['sorting'],
    summary: '有序数组两数之和的对撞指针，为什么不会漏解（核心论证）。', refDifficulty: '普及−' },
  { id: 'discrete-greedy', title: '离散化与贪心入门', stage: 2, status: 'READY', deps: ['sorting', 'binary-search'],
    summary: '区间调度按右端点贪心（交换论证）+ 离散化映射（保序不变量）双演示。', refDifficulty: '普及−' },

  /* ---- 阶段 3：搜索与图入门 ---- */
  { id: 'stack-queue', title: '栈与队列', stage: 3, status: 'READY', deps: ['cpp-array-string'],
    summary: 'LIFO/FIFO 行为、括号匹配（栈经典应用）、队列模拟。', refDifficulty: '入门' },
  { id: 'dfs-bfs', title: 'DFS 与 BFS', stage: 3, status: 'READY', deps: ['stack-queue', 'cpp-if-loop'],
    summary: '网格洪水填入（DFS 栈行为 vs BFS 队列行为）、访问标记不变量。', refDifficulty: '普及−' },
  { id: 'backtracking', title: '回溯与剪枝', stage: 3, status: 'READY', deps: ['dfs-bfs', 'complexity'],
    summary: 'N 皇后回溯全轨迹、冲突剪枝计数、互不攻击不变量核验、撤销一致性。', refDifficulty: '普及/提高−' },
  { id: 'graph-topo', title: '图存储与拓扑排序', stage: 3, status: 'READY', deps: ['dfs-bfs'],
    summary: '邻接表/入度表构建、Kahn 逐步删边、部分序不变量核验、免费环检测。', refDifficulty: '普及−' },

  /* ---- 阶段 4：数据结构与图论 ---- */
  { id: 'hash-linear-probe', title: '哈希表（线性探测）', stage: 4, status: 'READY', deps: ['cpp-array-string', 'cpp-if-loop'],
    summary: '取模散列、冲突探测、删除后的探测链修复（无墓碑方案）。', refDifficulty: '普及−' },
  { id: 'dsu', title: '并查集', stage: 4, status: 'READY', deps: ['dfs-bfs'],
    summary: '路径压缩 + 按大小合并全轨迹、森林不变量核验、防环合并、冗余边检测。', refDifficulty: '普及−' },
  { id: 'heap', title: '堆与优先队列', stage: 4, status: 'READY', deps: ['cpp-array-string'],
    summary: '小根堆数组形态、上浮/下沉逐步交换、堆性质实时核验、中间态语义。', refDifficulty: '普及−' },
  { id: 'fenwick', title: '树状数组', stage: 4, status: 'PLANNED', deps: ['prefix-sum'],
    summary: 'lowbit、单点加区间和（规划中）。' },
  { id: 'segment-tree', title: '线段树', stage: 4, status: 'PLANNED', deps: ['fenwick'],
    summary: '分治结构、区间查询与懒标记（规划中）。' },
  { id: 'shortest-path', title: '最短路（Dijkstra/SPFA/Floyd）', stage: 4, status: 'PLANNED', deps: ['heap', 'graph-topo'],
    summary: '非负权 Dijkstra、负权陷阱（规划中）。' },
  { id: 'mst', title: '最小生成树（Kruskal/Prim）', stage: 4, status: 'PLANNED', deps: ['dsu'],
    summary: '割性质与环性质（规划中）。' },
  { id: 'lca', title: 'LCA 与树上距离', stage: 4, status: 'PLANNED', deps: ['dfs-bfs', 'graph-topo'],
    summary: '倍增法（规划中）。' },

  /* ---- 阶段 5：动态规划 ---- */
  { id: 'dp-knapsack', title: '背包 DP（0/1 背包）', stage: 5, status: 'READY', deps: ['cpp-if-loop', 'complexity'],
    summary: '状态定义、转移依赖方向、一维滚动的遍历顺序反例。', refDifficulty: '普及/提高−' },
  { id: 'dp-lis-lcs', title: '序列 DP（LIS/LCS）', stage: 5, status: 'READY', deps: ['dp-knapsack'],
    summary: 'LIS 状态设计（以 i 结尾）、prev 回溯还原方案、可达性不变量核验、O(n²) 教学版。', refDifficulty: '普及/提高−' },
  { id: 'dp-interval-tree', title: '区间 DP 与树形 DP', stage: 5, status: 'PLANNED', deps: ['dp-lis-lcs', 'dfs-bfs'],
    summary: '区间合并、树上依赖背包（规划中）。' },

  /* ---- 阶段 6：字符串与数学 ---- */
  { id: 'kmp', title: 'KMP 字符串匹配', stage: 6, status: 'READY', deps: ['cpp-array-string'],
    summary: '前缀表（本站定义：最长相等真前后缀）、构造与匹配全轨迹、指针回退=模式串滑动。', refDifficulty: '普及/提高−' },
  { id: 'string-hash-trie', title: '字符串哈希与 Trie', stage: 6, status: 'PLANNED', deps: ['kmp'],
    summary: '多项式哈希与碰撞风险、Trie（规划中）。' },
  { id: 'math-gcd-sieve', title: 'gcd、筛法与模运算', stage: 6, status: 'PLANNED', deps: ['cpp-io-var'],
    summary: '欧几里得、埃氏筛、快速幂（规划中）。' },
  { id: 'math-combinatorics', title: '逆元与组合计数', stage: 6, status: 'PLANNED', deps: ['math-gcd-sieve'],
    summary: '费马小定理求逆元、杨辉三角（规划中）。' },

  /* ---- 阶段 7：区域赛专题 ---- */
  { id: 'scc-bridge', title: 'SCC、桥与割点', stage: 7, status: 'PLANNED', deps: ['dfs-bfs', 'graph-topo'],
    summary: 'Tarjan 双路（规划中）。' },
  { id: 'bipartite', title: '二分图判定与匹配', stage: 7, status: 'PLANNED', deps: ['dfs-bfs'],
    summary: '染色法、匈牙利算法（规划中）。' },
  { id: 'network-flow', title: '网络流', stage: 7, status: 'PLANNED', deps: ['bipartite'],
    summary: '增广路、Dinic（规划中）。' },
  { id: 'hld', title: '树链剖分', stage: 7, status: 'PLANNED', deps: ['lca', 'segment-tree'],
    summary: '重链剖分（规划中）。' },
  { id: 'dp-advanced', title: '状压/数位/换根 DP', stage: 7, status: 'PLANNED', deps: ['dp-interval-tree', 'math-combinatorics'],
    summary: '位运算状态、数位统计、二次扫描（规划中）。' },
  { id: 'ac-automaton', title: 'AC 自动机', stage: 7, status: 'PLANNED', deps: ['kmp', 'graph-topo'],
    summary: 'Trie + 失配指针成图（规划中）。' },

  /* ---- 阶段 8：高级综合 ---- */
  { id: 'divide-offline', title: '分治与离线', stage: 8, status: 'PLANNED', deps: ['complexity', 'sorting'],
    summary: 'CDQ 分治、离线询问（规划中）。' },
  { id: 'mo-algo', title: '莫队算法', stage: 8, status: 'PLANNED', deps: ['two-pointers', 'sorting'],
    summary: '询问排序与指针移动（规划中）。' },
  { id: 'sweep', title: '扫描线', stage: 8, status: 'PLANNED', deps: ['segment-tree', 'sorting'],
    summary: '事件排序+数据结构维护（规划中）。' },
  { id: 'dp-optimize', title: 'DP 优化（单调队列/斜率/决策单调）', stage: 8, status: 'PLANNED', deps: ['dp-lis-lcs'],
    summary: '把转移加速一个 log（规划中）。' },
  { id: 'fft-ntt', title: 'FFT/NTT', stage: 8, status: 'PLANNED', deps: ['divide-offline', 'math-combinatorics'],
    summary: '多项式乘法（规划中）。' },
  { id: 'geometry', title: '计算几何', stage: 8, status: 'PLANNED', deps: ['cpp-io-var'],
    summary: '叉积、凸包（规划中）。' },
  { id: 'game-random', title: '博弈论与随机化', stage: 8, status: 'PLANNED', deps: ['dp-interval-tree'],
    summary: 'Nim、SG 函数、随机化技巧（规划中）。' },

  /* ---- 阶段 9：团队训练（可从早期开始！）---- */
  { id: 'team-training', title: '团队训练与比赛策略', stage: 9, status: 'READY', deps: [],
    summary: '读题分工、单机协作、罚时规则、限时模拟与复盘；配模拟赛计时器。无需等高级知识学完，随时可以开始。' },
];

export const STAGES = [
  { id: 0, name: 'C++ 语法地基', color: '#2e7d32' },
  { id: 1, name: '算法基础', color: '#558b2f' },
  { id: 2, name: '基础解题', color: '#9e9d24' },
  { id: 3, name: '搜索与图入门', color: '#ef6c00' },
  { id: 4, name: '数据结构与图论', color: '#c62828' },
  { id: 5, name: '动态规划', color: '#6a1b9a' },
  { id: 6, name: '字符串与数学', color: '#283593' },
  { id: 7, name: '区域赛专题', color: '#00695c' },
  { id: 8, name: '高级综合', color: '#37474f' },
  { id: 9, name: '团队训练', color: '#00838f' },
] as const;

export function courseById(id: string): CourseMeta | undefined {
  return COURSES.find((c) => c.id === id);
}

/** READY 课程数量 */
export const READY_COUNT = COURSES.filter((c) => c.status === 'READY').length;
