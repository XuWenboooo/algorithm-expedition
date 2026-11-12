import { useMemo } from 'react';
import { COURSES } from '../courses/registry';
import { useProgress } from '../progress/store';
import { EXTERNAL_PROBLEMS, LEARNING_STAGES, filterProblems, parseProblemFilters, PLATFORM_LABELS, PROBLEM_STATUS_LABELS, ProblemFilters } from '../practice/catalog';
import { ProblemCard } from '../practice/ProblemCard';

export function ProblemsPage({ search }: { search: string }) {
  const { data } = useProgress();
  const filters = useMemo(() => parseProblemFilters(search), [search]);
  const results = useMemo(() => filterProblems(EXTERNAL_PROBLEMS, filters, data.externalProblems), [filters, data.externalProblems]);
  const solved = EXTERNAL_PROBLEMS.filter((p) => data.externalProblems?.[p.id]?.status === 'solved').length;
  const update = (next: ProblemFilters) => {
    const params = new URLSearchParams();
    if (next.query) params.set('q', next.query);
    for (const key of ['platform', 'stage', 'status', 'course'] as const) if (next[key] !== 'all') params.set(key, next[key]);
    window.history.replaceState(null, '', `#/problems${params.size ? `?${params}` : ''}`);
    // replaceState does not emit hashchange. Keep the router in sync without remounting the input.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  const change = (key: keyof ProblemFilters, value: string) => update({ ...filters, [key]: value });
  return <div className="container">
    <header className="page-intro"><p className="eyebrow">LEARN → PRACTISE → REVIEW</p><h1>题单实战</h1><p>把可视化里的理解，变成能独立提交的代码。精选洛谷与牛客题目，按本站学习路线练习。</p><div className="hero-actions"><a className="pbtn" href="#/roadmap">查看学习路线</a><a href="#/practice">回到本站交互练习 →</a></div></header>
    <div className="notice"><b>这是学习导引，不是题面镜像或在线判题。</b> 题目版权与评测归原平台。站次和顺序是本站建议，不代表洛谷颜色或牛客官方评级。状态由你手动记录，不自动同步账号。</div>
    <section className="card" aria-label="筛选题目">
      <div className="section-heading"><h2>找到下一道题</h2><span className="small muted">已通过 {solved} / {EXTERNAL_PROBLEMS.length}（自评）</span></div>
      <div className="problem-filters">
        <div className="field search-field"><label htmlFor="problem-search">搜索题名、知识点或题号</label><input id="problem-search" type="search" value={filters.query} onChange={(e) => change('query', e.target.value)} placeholder="例如：二分、KMP、P3375" /></div>
        <div className="field"><label htmlFor="platform-filter">平台</label><select id="platform-filter" value={filters.platform} onChange={(e) => change('platform', e.target.value)}><option value="all">全部平台</option>{Object.entries(PLATFORM_LABELS).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></div>
        <div className="field"><label htmlFor="stage-filter">路线站次</label><select id="stage-filter" value={filters.stage} onChange={(e) => change('stage', e.target.value)}><option value="all">全部站次</option>{LEARNING_STAGES.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.title}</option>)}</select></div>
        <div className="field"><label htmlFor="status-filter">我的状态</label><select id="status-filter" value={filters.status} onChange={(e) => change('status', e.target.value)}><option value="all">全部状态</option>{Object.entries(PROBLEM_STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>
        <div className="field"><label htmlFor="course-filter">关联课程</label><select id="course-filter" value={filters.course} onChange={(e) => change('course', e.target.value)}><option value="all">全部课程</option>{COURSES.filter((c) => EXTERNAL_PROBLEMS.some((p) => p.courseIds.includes(c.id))).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
      </div>
      <div className="section-heading"><p className="small muted" aria-live="polite">显示 {results.length} 道题</p><button className="pbtn" onClick={() => update(parseProblemFilters(''))}>清除筛选</button></div>
    </section>
    {results.length ? <div className="problem-grid">{results.map((problem) => <ProblemCard key={problem.id} problem={problem} />)}</div> : <div className="card empty-state"><h2>没有符合筛选条件的题目</h2><p>试试更短的关键词，或清除平台、站次和状态筛选。</p><button className="pbtn primary" onClick={() => update(parseProblemFilters(''))}>查看全部题目</button></div>}
    <p className="small muted">状态和复盘仅保存在此浏览器，已纳入「训练记录」的 JSON 备份。跨浏览器使用前请先导出。若官方链接变化，可用题名在原平台检索。</p>
  </div>;
}
