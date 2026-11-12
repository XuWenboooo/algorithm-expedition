import { ReactNode } from 'react';
import { CourseMeta } from './registry';
import { Demo, ExerciseSpec } from './demoKit';
import { DemoPanel, ExerciseList, NotesAndMistakes } from './demoKit';
import { CodeView } from '../ui/CodeView';
import { DIMENSIONS, useProgress } from '../progress/store';

/** READY 课程标准结构：所有 READY 课程都必须填满这些块 */
export interface CourseSpec {
  meta: CourseMeta;
  goals: string[];              // 学习目标
  prereq: string[];             // 先修知识（含课程 id 引用文案）
  story: ReactNode;             // 生活化引例
  derivation: ReactNode;        // 从具体例子→朴素方法→优化方法
  demos: Demo<any, any>[];      // 真实算法演示（可编辑输入）
  below?: ReactNode;            // 演示区下方的附加互动（可选）
  invariants: ReactNode;        // 关键不变量/适用条件/典型反例
  complexity: ReactNode;        // 时间/空间复杂度与最坏情况
  code: { title: string; code: string; note?: string }[]; // 完整可复制 C++17
  exercises: ExerciseSpec[];    // ≥3 道渐进练习
  pitfalls?: ReactNode;         // 常见错误
}

function statusTag(status: string) {
  if (status === 'READY') return <span className="tag ready">READY · 可直接学习</span>;
  if (status === 'IN_PROGRESS') return <span className="tag inprogress">IN_PROGRESS · 部分实现</span>;
  return <span className="tag planned">PLANNED · 仅路线规划</span>;
}

function ProgressChecklist({ courseId }: { courseId: string }) {
  const { get, toggleDim } = useProgress();
  const p = get(courseId);
  return (
    <div>
      <p className="muted small">
        掌握维度由你自己判断勾选——本平台不会因为"点过页面"就标记你已掌握。练习通过情况在下方单独显示。
      </p>
      {DIMENSIONS.map((d) => (
        <label key={d.key} className="prog-dim" data-testid={`dim-${d.key}`}>
          <input type="checkbox" checked={p.dims[d.key]} onChange={() => toggleDim(courseId, d.key)} />
          <span><b>{d.label}</b>：<span className="muted small">{d.desc}</span></span>
        </label>
      ))}
    </div>
  );
}

export function StandardCoursePage({ spec }: { spec: CourseSpec }) {
  const { meta } = spec;
  return (
    <div className="container">
      <p style={{ marginTop: 20 }} className="small">
        <a href="#/">← 返回总览地图</a>
        <span className="muted"> · 阶段 {meta.stage}</span>
      </p>
      <h1 style={{ marginTop: 8 }}>{meta.title} {statusTag(meta.status)}</h1>
      <p className="muted">{meta.summary}</p>

      <div className="card">
        <h2>🎯 学习目标</h2>
        <ul>{spec.goals.map((g, i) => <li key={i}>{g}</li>)}</ul>
        <h2>🧭 先修知识</h2>
        <ul>{spec.prereq.map((g, i) => <li key={i}>{g}</li>)}</ul>
        <h2>📖 生活化引例</h2>
        {spec.story}
      </div>

      <div className="card">
        <h2>🧠 从朴素到优化：推导</h2>
        {spec.derivation}
      </div>

      <h2 style={{ marginTop: 28 }}>🔬 可视化实验室（输入可修改，轨迹是真实算法执行）</h2>
      {spec.demos.map((d) => <DemoPanel key={d.id} demo={d} courseId={meta.id} />)}
      {spec.below}

      <div className="card">
        <h2>🔒 关键不变量、适用条件与典型反例</h2>
        {spec.invariants}
      </div>

      <div className="card">
        <h2>⏱ 复杂度</h2>
        {spec.complexity}
      </div>

      <div className="card">
        <h2>💻 完整 C++17 代码（可复制）</h2>
        {spec.code.map((c, i) => (
          <div key={i}>
            <h3>{c.title}</h3>
            {c.note && <p className="muted small">{c.note}</p>}
            <CodeView code={c.code} />
          </div>
        ))}
      </div>

      <div className="card">
        <h2>✏️ 练习（渐进：引导 → 独立 → 迁移）</h2>
        <ExerciseList exercises={spec.exercises} courseId={meta.id} />
        <ExerciseSummaryLine courseId={meta.id} total={spec.exercises.length} />
      </div>

      {spec.pitfalls && (
        <div className="card">
          <h2>⚠️ 常见错误清单</h2>
          {spec.pitfalls}
        </div>
      )}

      <div className="card">
        <h2>📈 学习进度（自评）</h2>
        <ProgressChecklist courseId={meta.id} />
        <NotesAndMistakes courseId={meta.id} />
      </div>
    </div>
  );
}

function ExerciseSummaryLine({ courseId, total }: { courseId: string; total: number }) {
  const { get } = useProgress();
  const p = get(courseId);
  const solved = Object.values(p.exercises).filter((e) => e.solved).length;
  return (
    <p className="muted small" data-testid="exercise-progress">
      已通过 {solved} / {total} 道练习（答错过但后来通过的也不算失败——错因已记入复盘）。
    </p>
  );
}
