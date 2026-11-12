import { courseById } from '../courses/registry';
import { useProgress } from '../progress/store';
import { EXTERNAL_PROBLEMS, LEARNING_STAGES, PLATFORM_LABELS } from '../practice/catalog';

export function RoadmapPage() {
  const { data } = useProgress();
  const done = (id: string) => data.externalProblems?.[id]?.status === 'solved';
  return <div className="container">
    <header className="page-intro"><p className="eyebrow">YOUR NEXT STEP</p><h1>从会看演示，到能独立解题</h1><p>用「学一课 → 做一题 → 讲清思路 → 隔天重写」形成闭环。按达标标准前进，不用赶固定天数。</p><div className="hero-actions"><a className="pbtn primary" href="#/problems">打开洛谷 · 牛客题单</a><a href="#/">浏览完整课程地图 →</a></div></header>
    <section className="card"><h2>选一个合适的起点</h2><div className="route-entry-grid"><div><h3>刚开始学 C++</h3><p>从输入输出和循环开始。先写对小程序，再追求速度。</p></div><div><h3>会语法，做题没思路</h3><p>从排序、前缀和、二分开始，每题先写暴力，再解释优化依据。</p></div><div><h3>准备组队打比赛</h3><p>基础训练与团队模拟并行；规划中的高级课程不要当作已学完。</p></div></div></section>
    <nav className="route-jumps" aria-label="学习路线目录">{LEARNING_STAGES.map((stage) => <a key={stage.id} href={`#route-stage-${stage.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`route-stage-${stage.id}`)?.scrollIntoView({ behavior: 'auto', block: 'start' }); }}>{stage.id} · {stage.title}</a>)}</nav>
    <div className="learning-timeline">{LEARNING_STAGES.map((stage) => {
      const problems = stage.problemIds.map((id) => EXTERNAL_PROBLEMS.find((p) => p.id === id)).filter((p) => p !== undefined);
      const count = problems.filter((p) => done(p.id)).length;
      return <section className="card route-stage" id={`route-stage-${stage.id}`} key={stage.id}>
        <div className="section-heading"><div><span className="eyebrow">第 {stage.id} 站</span><h2>{stage.title}</h2></div><span className="tag">{count} / {problems.length} 题已通过（自评）</span></div>
        <p>{stage.objective}</p><h3>① 先学什么</h3><ul className="route-course-list">{stage.courseIds.map((id) => { const c = courseById(id); return <li key={id}><a href={`#/course/${id}`}>{c?.title || id}</a><span className={`tag ${c?.status === 'READY' ? 'ready' : 'planned'}`}>{c?.status === 'READY' ? '可交互学习' : '课程规划中'}</span></li>; })}</ul>
        <h3>② 按顺序练习</h3>{problems.length ? <ol className="route-problems">{problems.map((p) => <li key={p.id}><span aria-label={done(p.id) ? '已通过' : '待练习'}>{done(p.id) ? '✓' : '○'}</span><a href={p.url} target="_blank" rel="noopener noreferrer">{p.title} ↗</a><span className="small muted">{PLATFORM_LABELS[p.platform]}</span><p className="small muted">{p.goal}</p></li>)}</ol> : <p className="muted">本阶段以团队训练和复盘为主。</p>}
        <div className="checkpoint"><h3>③ 达标再往前</h3><p>{stage.checkpoint}</p></div><p className="small muted">训练建议：{stage.trainingAdvice}</p><a href={`#/problems?stage=${stage.id}`}>记录本站练习与复盘 →</a>
      </section>;
    })}</div>
    <section className="card"><h2>每次训练，留下三个东西</h2><ol><li>不看题解写出的思路，包含复杂度与适用条件。</li><li>一个最容易写错的边界或反例。</li><li>下次重做日期：建议 1 天、1 周后各独立重写一次。</li></ol><p className="muted">路线只是建议，不承诺竞赛奖项，也不把刷题数量等同于掌握。题面、约束和评测规则以原平台为准。</p></section>
  </div>;
}
