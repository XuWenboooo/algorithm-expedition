export type ProblemPlatform = 'luogu' | 'nowcoder';
export interface ExternalProblem { id: string; platform: ProblemPlatform; title: string; url: string; courseIds: string[]; stage: number; goal: string; hints: string[]; verifiedAt: string; }
export interface LearningStage { id: number; title: string; objective: string; courseIds: string[]; problemIds: string[]; checkpoint: string; trainingAdvice: string; }
// Source titles/links checked 2026-11-12. Study advice is original; full statements stay with the platforms.
export const EXTERNAL_PROBLEMS: ExternalProblem[] = [
  {
    "id": "luogu-p1001",
    "platform": "luogu",
    "title": "P1001 · A+B Problem",
    "url": "https://www.luogu.com.cn/problem/P1001",
    "courseIds": [
      "cpp-io-var"
    ],
    "stage": 0,
    "goal": "完成第一个标准输入输出程序，分清输入数据与输出格式。",
    "hints": [
      "只输出题目要求的结果，不打印提示语。",
      "确认数据范围，分别用零、正数和允许范围内的边界值手测。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "nowcoder-contest-66961-a",
    "platform": "nowcoder",
    "title": "实践出真知 · 固定输出",
    "url": "https://ac.nowcoder.com/acm/contest/66961/A",
    "courseIds": [
      "cpp-io-var"
    ],
    "stage": 0,
    "goal": "练习逐字符检查输出，建立编译、运行、提交的最小流程。",
    "hints": [
      "留意换行、空格和标点，固定输出题也需要完全符合格式。",
      "独立写出 main 函数后，再对照官方输出要求检查。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p5712",
    "platform": "luogu",
    "title": "P5712 · Apples",
    "url": "https://www.luogu.com.cn/problem/P5712",
    "courseIds": [
      "cpp-if-loop"
    ],
    "stage": 0,
    "goal": "把文字条件翻译为分支，练习英文单复数输出。",
    "hints": [
      "先列出哪些输入会走不同分支，再写 if/else。",
      "至少检查 0、1、2；具体输出句式以题面为准。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p1046",
    "platform": "luogu",
    "title": "P1046 · 陶陶摘苹果",
    "url": "https://www.luogu.com.cn/problem/P1046",
    "courseIds": [
      "cpp-array-string",
      "cpp-if-loop"
    ],
    "stage": 1,
    "goal": "通过遍历、比较与计数，把生活条件翻译为数组操作。",
    "hints": [
      "先明确能够摘到的高度边界。",
      "相等时是否能摘到？用边界样例验证比较符。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p1427",
    "platform": "luogu",
    "title": "P1427 · 小鱼的数字游戏",
    "url": "https://www.luogu.com.cn/problem/P1427",
    "courseIds": [
      "cpp-array-string"
    ],
    "stage": 1,
    "goal": "练习终止标记、数组存储和逆序输出。",
    "hints": [
      "终止标记是数据的一部分，还是停止读取的信号？",
      "检查最短输入和输出空格，不要在倒序循环中越界。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p1089",
    "platform": "luogu",
    "title": "P1089 · 津津的储蓄计划",
    "url": "https://www.luogu.com.cn/problem/P1089",
    "courseIds": [
      "cpp-if-loop",
      "cpp-array-string"
    ],
    "stage": 1,
    "goal": "按月份维护现金和储蓄状态，练习完整模拟及提前失败处理。",
    "hints": [
      "每个月按题面顺序更新余额，不要把存款规则写反。",
      "手算一个恰好够花和一个中途不足的例子，再比较程序状态。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "nowcoder-contest-6238-e",
    "platform": "nowcoder",
    "title": "线段图案",
    "url": "https://ac.nowcoder.com/acm/contest/6238/E",
    "courseIds": [
      "cpp-if-loop"
    ],
    "stage": 1,
    "goal": "用循环生成指定长度图案，练习多组输入与格式检查。",
    "hints": [
      "以官方题面为准确认是一组输入，还是需要读到文件结束。",
      "先输出最短合法图案，再检查循环执行次数。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p2249",
    "platform": "luogu",
    "title": "P2249 · 【模板】查找",
    "url": "https://www.luogu.com.cn/problem/P2249",
    "courseIds": [
      "sorting",
      "binary-search"
    ],
    "stage": 2,
    "goal": "在非递减数组中找首次出现的位置，建立二分边界不变量。",
    "hints": [
      "重复元素存在时，找到一个相等元素不等于找到第一个。",
      "该题位置按 1 起始，未找到按官方约定输出；检查首尾和连续重复值。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "nowcoder-d3df40bd23594118b57554129cadf47b",
    "platform": "nowcoder",
    "title": "二分查找-I",
    "url": "https://www.nowcoder.com/practice/d3df40bd23594118b57554129cadf47b",
    "courseIds": [
      "binary-search"
    ],
    "stage": 2,
    "goal": "将二分模板适配到无重复数组和函数补全接口。",
    "hints": [
      "与 P2249 区别：这里是无重复数组，返回下标按 0 起始。",
      "按页面给定函数签名返回结果，不直接套用完整输入输出程序。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "nowcoder-abc3fe2ce8e146608e868a70efebf62e",
    "platform": "nowcoder",
    "title": "二维数组中的查找",
    "url": "https://www.nowcoder.com/practice/abc3fe2ce8e146608e868a70efebf62e",
    "courseIds": [
      "binary-search",
      "two-pointers"
    ],
    "stage": 2,
    "goal": "利用行列有序性排除不可能区域，而不是机械套一维模板。",
    "hints": [
      "从一个角落出发时，一次比较能排除哪一行或哪一列？",
      "这是函数补全题；检查空数组和目标小于/大于全部元素的情况。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p1219",
    "platform": "luogu",
    "title": "P1219 · 八皇后 Checker Challenge",
    "url": "https://www.luogu.com.cn/problem/P1219",
    "courseIds": [
      "backtracking"
    ],
    "stage": 3,
    "goal": "从 N 皇后演示迁移到真实回溯程序，正确维护占用与撤销。",
    "hints": [
      "每放置一个皇后，列和两条对角线的状态要一起更新和恢复。",
      "注意题面要求的方案输出数量、输出顺序及总方案数，不能只求是否存在。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p1443",
    "platform": "luogu",
    "title": "P1443 · 马的遍历",
    "url": "https://www.luogu.com.cn/problem/P1443",
    "courseIds": [
      "dfs-bfs",
      "stack-queue"
    ],
    "stage": 3,
    "goal": "将网格 BFS 扩展为八种移动，求无权图最短步数。",
    "hints": [
      "先列出八个方向偏移，再统一检查棋盘边界。",
      "首次入队时记录距离并标记，区分不可达与起点距离 0。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "nowcoder-d77d11405cc7470d82554cb392585106",
    "platform": "nowcoder",
    "title": "栈的压入、弹出序列",
    "url": "https://www.nowcoder.com/practice/d77d11405cc7470d82554cb392585106",
    "courseIds": [
      "stack-queue"
    ],
    "stage": 3,
    "goal": "用辅助栈模拟操作序列，检查是否存在合法弹出顺序。",
    "hints": [
      "每次压入后，能否连续匹配并弹出多个目标元素？",
      "比较栈顶前先判空；用一个合法和一个非法顺序手工模拟。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p1048",
    "platform": "luogu",
    "title": "P1048 · 采药",
    "url": "https://www.luogu.com.cn/problem/P1048",
    "courseIds": [
      "dp-knapsack"
    ],
    "stage": 4,
    "goal": "把时间容量和药草收益映射为 0/1 背包，解释转移方向。",
    "hints": [
      "每种药只能选择一次，正序更新容量可能把它重复使用。",
      "构造只有一件物品但容量足够放两次的反例，检查实现。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p2678",
    "platform": "luogu",
    "title": "P2678 · 跳石头",
    "url": "https://www.luogu.com.cn/problem/P2678",
    "courseIds": [
      "binary-search",
      "discrete-greedy"
    ],
    "stage": 4,
    "goal": "把最优答案转为可行性判定，联合二分与贪心。",
    "hints": [
      "先问：给定最小跳跃距离，能否在移走数量限制内完成？",
      "端点不能当成普通可移石头处理；说明判定的单调性，再写二分。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p3375",
    "platform": "luogu",
    "title": "P3375 · 【模板】KMP",
    "url": "https://www.luogu.com.cn/problem/P3375",
    "courseIds": [
      "kmp"
    ],
    "stage": 4,
    "goal": "从本站双视角演示迁移到输出全部匹配位置和前缀表的标准题。",
    "hints": [
      "本站算法支持全部及重叠匹配；完整匹配后继续沿前缀表回退，不应一律清零。",
      "核对题面 1-based 位置与本站演示 0-based 下标，以及前缀表输出格式。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "nowcoder-8c82a5b80378478f9484d87d1c5f12a4",
    "platform": "nowcoder",
    "title": "跳台阶",
    "url": "https://www.nowcoder.com/practice/8c82a5b80378478f9484d87d1c5f12a4",
    "courseIds": [
      "complexity",
      "dp-knapsack"
    ],
    "stage": 4,
    "goal": "用最后一步分类建立递推，把重复递归改成保存状态。",
    "hints": [
      "用 n=1 和 n=2 确定初值，再写清状态含义。",
      "注意计数递推不等同于背包最值；检查函数接口和数值范围。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p1886",
    "platform": "luogu",
    "title": "P1886 · 滑动窗口 /【模板】单调队列",
    "url": "https://www.luogu.com.cn/problem/P1886",
    "courseIds": [
      "two-pointers",
      "stack-queue"
    ],
    "stage": 5,
    "goal": "进阶迁移：在窗口滑动中维护最大值和最小值，需要补学单调队列。",
    "hints": [
      "本站当前栈/队列与双指针课是先修，不包含完整单调队列课程。",
      "队列保存下标以便判断过期；区分队首过期和队尾失去竞争力两种删除。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p3367",
    "platform": "luogu",
    "title": "P3367 · 【模板】并查集",
    "url": "https://www.luogu.com.cn/problem/P3367",
    "courseIds": [
      "dsu"
    ],
    "stage": 5,
    "goal": "实现合并与连通性查询，正确维护代表元。",
    "hints": [
      "判断连通应比较根，而不是直接比较 parent 数组中的值。",
      "测试重复合并、自己与自己、跨多个合并链的查询。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p3374",
    "platform": "luogu",
    "title": "P3374 · 【模板】树状数组 1",
    "url": "https://www.luogu.com.cn/problem/P3374",
    "courseIds": [
      "fenwick",
      "prefix-sum"
    ],
    "stage": 5,
    "goal": "从静态前缀和迈向单点修改与区间求和，需补学树状数组。",
    "hints": [
      "本站树状数组课仍是规划状态，不能仅凭前缀和演示完成本题。",
      "注意 lowbit、1-based 索引和数值范围，先验证一次更新后的全部前缀。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p4779",
    "platform": "luogu",
    "title": "P4779 · 【模板】单源最短路径（标准版）",
    "url": "https://www.luogu.com.cn/problem/P4779",
    "courseIds": [
      "shortest-path",
      "heap",
      "graph-topo"
    ],
    "stage": 5,
    "goal": "补学堆优化 Dijkstra，把最短路模型和优先队列连接起来。",
    "hints": [
      "本站最短路课尚未实现；先学习非负权条件、松弛和过期堆条目的处理。",
      "确认图的方向、重边、不可达节点和官方输出约定。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p3376",
    "platform": "luogu",
    "title": "P3376 · 【模板】网络最大流",
    "url": "https://www.luogu.com.cn/problem/P3376",
    "courseIds": [
      "network-flow",
      "dfs-bfs"
    ],
    "stage": 6,
    "goal": "远期专题示例：理解容量、残量网络和增广，再实现网络流。",
    "hints": [
      "网络流课程仍在规划，本题不是当前基础路线的必做门槛。",
      "先手画正反边和一次增广过程，解释为什么需要反向残量边。"
    ],
    "verifiedAt": "2026-11-12"
  },
  {
    "id": "luogu-p3384",
    "platform": "luogu",
    "title": "P3384 · 【模板】重链剖分/树链剖分",
    "url": "https://www.luogu.com.cn/problem/P3384",
    "courseIds": [
      "hld",
      "lca",
      "segment-tree"
    ],
    "stage": 6,
    "goal": "远期综合示例：组合树链剖分、线段树和模运算处理树上操作。",
    "hints": [
      "需要先学树上遍历、区间数据结构与懒标记；相关课程当前仍在规划。",
      "区分子树区间与链上路径分解，先在小树手工核对映射。"
    ],
    "verifiedAt": "2026-11-12"
  }
];
export const LEARNING_STAGES: LearningStage[] = [
  {
    "id": 0,
    "title": "语法与第一份提交",
    "objective": "先能独立完成编译、运行、读取和输出，再处理简单条件。",
    "courseIds": [
      "cpp-io-var",
      "cpp-if-loop"
    ],
    "problemIds": [
      "luogu-p1001",
      "nowcoder-contest-66961-a",
      "luogu-p5712"
    ],
    "checkpoint": "不看参考写出完整程序；能解释输入、计算和输出各在哪一行，并验证至少两个边界。",
    "trainingAdvice": "一次只解决一个新问题。提交失败时先检查编译错误和输出格式。"
  },
  {
    "id": 1,
    "title": "循环、数组与模拟",
    "objective": "把题目描述变成按顺序更新的状态，练好边界和下标。",
    "courseIds": [
      "cpp-array-string",
      "cpp-if-loop"
    ],
    "problemIds": [
      "luogu-p1046",
      "luogu-p1427",
      "nowcoder-contest-6238-e",
      "luogu-p1089"
    ],
    "checkpoint": "能手算每一步状态，独立通过数组遍历和模拟题；说清终止条件、越界风险和提前失败处理。",
    "trainingAdvice": "先列状态表再编码；每题至少保留一个曾写错的反例。"
  },
  {
    "id": 2,
    "title": "基础算法与有序性",
    "objective": "从遍历过渡到排序、前缀和、二分和双指针，学会利用结构减少搜索。",
    "courseIds": [
      "sorting",
      "prefix-sum",
      "binary-search",
      "two-pointers"
    ],
    "problemIds": [
      "luogu-p2249",
      "nowcoder-d3df40bd23594118b57554129cadf47b",
      "nowcoder-abc3fe2ce8e146608e868a70efebf62e"
    ],
    "checkpoint": "能解释二分区间不变量；分清首次出现与任意命中、0/1 起始下标、函数补全与标准输入输出。",
    "trainingAdvice": "先写暴力版本作对照，再检查空、单元素、重复值、首尾命中和不存在。"
  },
  {
    "id": 3,
    "title": "搜索与状态恢复",
    "objective": "理解栈、队列、访问标记、回溯撤销和无权最短路。",
    "courseIds": [
      "stack-queue",
      "dfs-bfs",
      "backtracking"
    ],
    "problemIds": [
      "nowcoder-d77d11405cc7470d82554cb392585106",
      "luogu-p1443",
      "luogu-p1219"
    ],
    "checkpoint": "能独立写 BFS 和一类回溯；解释何时标记访问、何时撤销状态，及为何不会漏解或重复计数。",
    "trainingAdvice": "先在小网格或小棋盘跑通，记录队列/递归栈变化，再扩大输入。"
  },
  {
    "id": 4,
    "title": "递推与综合建模",
    "objective": "连接递推、背包、二分答案和字符串匹配，不依赖只会背模板。",
    "courseIds": [
      "complexity",
      "dp-knapsack",
      "dp-lis-lcs",
      "discrete-greedy",
      "kmp"
    ],
    "problemIds": [
      "nowcoder-8c82a5b80378478f9484d87d1c5f12a4",
      "luogu-p1048",
      "luogu-p2678",
      "luogu-p3375"
    ],
    "checkpoint": "对每题写清状态或判定含义、转移/不变量、复杂度；独立构造能击穿错误实现的边界例。",
    "trainingAdvice": "做完不要立刻抄下一题。隔天不看题解重写，并讲清为什么这样写。"
  },
  {
    "id": 5,
    "title": "数据结构与图论进阶",
    "objective": "在已掌握基础上学习并查集、单调队列、树状数组和最短路。",
    "courseIds": [
      "dsu",
      "heap",
      "graph-topo",
      "fenwick",
      "shortest-path"
    ],
    "problemIds": [
      "luogu-p3367",
      "luogu-p1886",
      "luogu-p3374",
      "luogu-p4779"
    ],
    "checkpoint": "能说明每个操作维护的性质和复杂度；处理重复操作、过期状态、不可达及数值范围。",
    "trainingAdvice": "含尚未实现课程，先补官方题解/教材中的必要知识。单调队列不能用普通双指针课替代。"
  },
  {
    "id": 6,
    "title": "远期专题，不急着跳级",
    "objective": "逐步补齐进阶图论、区间/树形 DP、数论、网络流和树链剖分。",
    "courseIds": [
      "dp-interval-tree",
      "math-gcd-sieve",
      "math-combinatorics",
      "network-flow",
      "hld",
      "segment-tree"
    ],
    "problemIds": [
      "luogu-p3376",
      "luogu-p3384"
    ],
    "checkpoint": "先完成所有先修，再能解释核心模型和正确性；不要把模板 AC 当作掌握整类问题。",
    "trainingAdvice": "两题仅为远期方向示例，相关课程当前是规划。遇到多个陌生前置知识时先返回补基础。"
  },
  {
    "id": 7,
    "title": "团队限时训练与复盘",
    "objective": "从基础阶段就可并行练习读题分工、单机协作、限时决策和赛后复盘。",
    "courseIds": [
      "team-training"
    ],
    "problemIds": [],
    "checkpoint": "训练后能列出读题、建模、实现、调试和协作方面的具体改进，并在下一场验证。",
    "trainingAdvice": "从已学题中选少量未做题组成模拟训练，赛后独立补题。不把任何题单包装为已核实 CCPC 真题或奖牌保证。"
  }
];
export const PLATFORM_LABELS: Record<ProblemPlatform, string> = { luogu: '洛谷', nowcoder: '牛客' };
export const PROBLEM_STATUS_LABELS = { todo: '待开始', attempted: '练习中', solved: '已通过（自评）' } as const;
export type ProblemStatus = keyof typeof PROBLEM_STATUS_LABELS;
export interface ProblemFilters { query: string; platform: string; stage: string; status: string; course: string }
export function parseProblemFilters(search: string): ProblemFilters {
 const p = new URLSearchParams(search);
 return { query:p.get('q') || '', platform:p.get('platform') || 'all', stage:p.get('stage') || 'all', status:p.get('status') || 'all', course:p.get('course') || 'all' };
}
export function filterProblems(problems:ExternalProblem[], filters:ProblemFilters, statuses:Record<string,{status:ProblemStatus}> = {}): ExternalProblem[] {
 const q=filters.query.trim().toLocaleLowerCase();
 return problems.filter((p)=>
 (filters.platform==='all'||p.platform===filters.platform) &&
 (filters.stage==='all'||String(p.stage)===filters.stage) &&
 (filters.course==='all'||p.courseIds.includes(filters.course)) &&
 (filters.status==='all'||(statuses[p.id]?.status||'todo')===filters.status) &&
 (!q || `${p.title} ${p.id} ${p.goal} ${PLATFORM_LABELS[p.platform]}`.toLocaleLowerCase().includes(q)));
}
