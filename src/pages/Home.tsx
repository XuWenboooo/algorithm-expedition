import { EXTERNAL_PROBLEMS, LEARNING_STAGES } from '../practice/catalog';
import { COURSES, STAGES, READY_COUNT } from '../courses/registry';

export function Home() {
  const ready = COURSES.filter((c) => c.status === 'READY');
  const inProgress = COURSES.filter((c) => c.status === 'IN_PROGRESS');
  const planned = COURSES.filter((c) => c.status === 'PLANNED');

  return (
    <div className="container">
      <header className="page-intro home-intro"><p className="eyebrow">ALGORITHM EXPEDITION</p><h1>每一步，都看懂算法</h1><p>先看轨迹、再写代码、最后到真实题目中验证。把零散知识变成一条走得下去的学习路线。</p><div className="hero-actions"><a className="pbtn primary" href="#/roadmap">从学习路线开始 →</a><a className="pbtn" href="#/problems">洛谷 · 牛客题单</a></div><div className="hero-stats"><span><b>{READY_COUNT}</b> 门已实现课程</span><span><b>{EXTERNAL_PROBLEMS.length}</b> 道精选外部题</span><span><b>{LEARNING_STAGES.length}</b> 站学习与训练路线</span></div></header><h2>完整课程地图</h2>
      <p>
        从零基础 C++ 到区域赛训练的完整知识路线图。<b>{READY_COUNT} 门课程已真正实现</b>
        （其中 {ready.filter((c) => c.id !== 'team-training').length} 门含可交互可视化实验室 + 完整推导 + 渐进练习 + 测试验证；1 门为团队训练工具课），
        其余课程诚实标注为"仅规划"，绝不冒充完成。
      </p>
      <div className="card">
        <p className="small">
          <span className="tag ready">READY {ready.length} 门</span>
          <span className="tag inprogress">IN_PROGRESS {inProgress.length} 门</span>
          <span className="tag planned">PLANNED {planned.length} 门</span>
        </p>
        <p className="small muted">
          ⚠️ 诚实声明：本平台是<b>训练工具</b>，不是承诺书。"用本平台"不能保证 CCPC 金牌；金牌只来自长期、大量、高质量的训练与复盘。
          课程难度标签只描述内容相对位置，不与任何在线评测颜色或奖牌机械等同。
        </p>
      </div>

      {STAGES.map((st) => {
        const cs = COURSES.filter((c) => c.stage === st.id);
        if (cs.length === 0) return null;
        return (
          <div className="card" key={st.id} data-testid={`stage-${st.id}`}>
            <h2 style={{ color: st.color }}>阶段 {st.id} · {st.name}</h2>
            <div className="table-scroll" tabIndex={0} aria-label="课程地图，可横向滚动"><table className="course-map">
              <thead>
                <tr><th style={{ width: '26%' }}>课程</th><th style={{ width: '12%' }}>状态</th><th>内容</th><th style={{ width: '22%' }}>先修</th></tr>
              </thead>
              <tbody>
                {cs.map((c) => (
                  <tr key={c.id}>
                    <td>{c.status === 'READY' ? <a href={`#/course/${c.id}`}><b>{c.title}</b></a> : <b>{c.title}</b>}</td>
                    <td>
                      {c.status === 'READY' && <span className="tag ready">READY</span>}
                      {c.status === 'IN_PROGRESS' && <span className="tag inprogress">进行中</span>}
                      {c.status === 'PLANNED' && <span className="tag planned">规划</span>}
                    </td>
                    <td className="small">{c.summary}{c.missing && <div className="muted">缺失：{c.missing.join('、')}</div>}</td>
                    <td className="small muted">
                      {c.deps.length === 0 ? '无（可直接开始）' : c.deps.map((d) => COURSES.find((x) => x.id === d)?.title || d).join('、')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        );
      })}

      <div className="card">
        <h2>🚀 从哪里开始？</h2>
        <ul>
          <li><b>完全零基础</b>：从阶段 0《C++ 起步》按顺序学习。</li>
          <li><b>会一点 C++</b>：可以直接进入阶段 1《复杂度与递归》，然后按依赖图自由跳转。</li>
          <li><b>刚学过 KMP</b>：先做<a href="#/course/kmp">《KMP 字符串匹配》</a>的自查与练习，再横向扩展字符串方向。</li>
          <li><b>想马上感受团队赛</b>：《团队训练》从第 1 天就可以开始，不需要等高级知识。</li>
        </ul>
        <p className="muted small">诊断原则：先做目标课程的"引导练习"，能全对再学本课；答错就先回先修课——平台从不自动宣称"你已掌握"。</p>
      </div>
    </div>
  );
}
