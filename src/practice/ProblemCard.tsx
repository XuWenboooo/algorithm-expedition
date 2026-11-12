import { courseById } from '../courses/registry';
import { useProgress } from '../progress/store';
import { EXTERNAL_PROBLEMS, ExternalProblem, PLATFORM_LABELS, ProblemStatus, PROBLEM_STATUS_LABELS } from './catalog';

export function ProblemCard({ problem, compact = false }: { problem: ExternalProblem; compact?: boolean }) {
  const { data, setExternalProblem } = useProgress();
  const record = data.externalProblems?.[problem.id];
  const status = record?.status || 'todo';
  return (
    <article className={`problem-card${compact ? ' compact' : ''}`} data-testid={`problem-${problem.id}`}>
      <div className="problem-meta"><span className="tag">{PLATFORM_LABELS[problem.platform]}</span><span className="muted small">路线第 {problem.stage} 站</span><span className={`tag ${status === 'solved' ? 'ready' : 'planned'}`}>{PROBLEM_STATUS_LABELS[status]}</span></div>
      <h3><a href={problem.url} target="_blank" rel="noopener noreferrer">{problem.title} <span aria-label="在新标签页打开">↗</span></a></h3>
      <p>{problem.goal}</p>
      <div className="course-chips">{problem.courseIds.map((id) => <a key={id} href={`#/course/${id}`}>{courseById(id)?.title || id}{courseById(id)?.status === 'PLANNED' ? '（课程规划中）' : ''}</a>)}</div>
      {!compact && <>
        <details className="fold"><summary>练习提示与复盘方向</summary><ol>{problem.hints.map((h, i) => <li key={i}>{h}</li>)}</ol><p className="small muted">提示为本站学习建议，不是平台官方题解。先独立尝试，再展开。</p></details>
        <div className="field"><label htmlFor={`status-${problem.id}`}>我的状态（手动记录）</label><select id={`status-${problem.id}`} value={status} onChange={(e) => setExternalProblem(problem.id, e.target.value as ProblemStatus)}>{Object.entries(PROBLEM_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="field problem-notes"><label htmlFor={`notes-${problem.id}`}>一句复盘</label><textarea id={`notes-${problem.id}`} rows={2} maxLength={5000} placeholder="写下关键思路、错因或下一次要验证的边界。" value={record?.notes || ''} onChange={(e) => setExternalProblem(problem.id, status, e.target.value)} /></div>
      </>}
      <p className="small muted source-line">题面与评测：{PLATFORM_LABELS[problem.platform]} · 链接核查 {problem.verifiedAt}。提交可能需要平台账号。</p>
      {compact && <a className="small" href={`#/problems?q=${encodeURIComponent(problem.id)}`}>查看提示并记录进度 →</a>}
    </article>
  );
}

export function CoursePracticeLinks({ courseId }: { courseId: string }) {
  const problems = EXTERNAL_PROBLEMS.filter((p) => p.courseIds.includes(courseId));
  if (!problems.length) return null;
  return <section className="card" aria-label="关联外部实战题"><div className="section-heading"><h2>把这一课用到真题里</h2><a href={`#/problems?course=${encodeURIComponent(courseId)}`}>打开本课题单 →</a></div><p className="muted small">{courseById(courseId)?.status === 'PLANNED' ? '本课尚未实现，请先补学相关知识，再到官方平台实践。' : '先做本站交互练习，再到官方平台提交。'}打开链接不会自动标记通过。</p><div className="problem-grid">{problems.map((problem) => <ProblemCard key={problem.id} problem={problem} compact />)}</div></section>;
}
