import { ReactNode, useMemo, useRef, useState } from 'react';
import { TraceEvent } from '../kernel/trace';
import { Player } from '../ui/Player';
import { useProgress, downloadText } from '../progress/store';

/* ================= 演示（实验室）框架 ================= */

export interface FieldDef {
  key: string;
  label: string;
  default: string;
  width?: number;
  help?: string;
}

export interface PredictionSpec {
  question: string;
  options: string[];
  correct: number;
}

export interface Demo<I, S> {
  id: string;
  title: string;
  desc?: ReactNode;
  fields: FieldDef[];
  validate: (raw: Record<string, string>) => { ok: true; value: I } | { ok: false; error: string };
  build: (v: I) => TraceEvent<S>[];
  render: (ev: TraceEvent<S> | null, v: I) => ReactNode;
  predict?: (cur: TraceEvent<S> | null, next: TraceEvent<S> | null) => PredictionSpec | null;
}

/**
 * 演示面板：管理输入、校验、构建轨迹、播放。
 * 轨迹构建是纯同步计算（规模受输入上限约束，<50ms），无需 Worker；
 * 页面上不允许任何"先算答案再拼动画"的逻辑。
 */
export function DemoPanel<I, S>({ demo, courseId }: { demo: Demo<I, S>; courseId: string }) {
  const defaults = useMemo(() => {
    const d: Record<string, string> = {};
    demo.fields.forEach((f) => (d[f.key] = f.default));
    return d;
  }, [demo]);
  const [raw, setRaw] = useState<Record<string, string>>(defaults);
  const runCounter = useRef(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ value: I; key: string } | null>(() => {
    const v = demo.validate(defaults);
    return v.ok ? { value: v.value, key: 'init' } : null;
  });

  const { bumpExperiment } = useProgress();
  const bump = () => bumpExperiment(courseId);

  const run = () => {
    try {
      const v = demo.validate(raw);
      if (!v.ok) {
        setLastError(v.error);
        setApplied(null);
        return;
      }
      setLastError(null);
      runCounter.current += 1;
      setApplied({ value: v.value, key: `run-${runCounter.current}` });
      bump();
    } catch (err) {
      setLastError(`输入处理出现意外错误：${err instanceof Error ? err.message : String(err)}（请检查输入格式）`);
      setApplied(null);
    }
  };

  const events = useMemo(() => {
    if (!applied) return [];
    try {
      return demo.build(applied.value);
    } catch (err) {
      console.error('轨迹构建异常', err);
      return [];
    }
  }, [applied, demo]);

  return (
    <div className="card" data-testid={`demo-${demo.id}`}>
      <h3>{demo.title}</h3>
      {demo.desc}
      <div className="input-row">
        {demo.fields.map((f) => (
          <span className="field" key={f.key}>
            <label htmlFor={`f-${demo.id}-${f.key}`}>{f.label}</label>
            <input
              id={`f-${demo.id}-${f.key}`}
              data-testid={`input-${f.key}`}
              value={raw[f.key]}
              style={f.width ? { width: f.width } : undefined}
              onChange={(e) => setRaw((r) => ({ ...r, [f.key]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
            />
            {f.help && <span className="muted small">{f.help}</span>}
          </span>
        ))}
        <button className="pbtn primary" data-testid="btn-run" onClick={run}>生成轨迹并运行</button>
      </div>
      {lastError && <div className="err-text" data-testid="input-error" role="alert">⚠ {lastError}</div>}
      {applied && (
        <Player
          events={events}
          predict={demo.predict ? (cur, next) => demo.predict!(cur, next) as PredictionSpec | null : undefined}
          resetKey={applied.key}
        >
          {(cur) => demo.render(cur, applied.value)}
        </Player>
      )}
    </div>
  );
}

/* ================= 练习框架 ================= */

export interface Choice {
  text: string;
  correct?: boolean;
  why: string;
}

export interface ExerciseSpec {
  id: string;
  level: 1 | 2 | 3; // 1 引导 2 独立 3 迁移
  title: string;
  statement: ReactNode;
  kind: 'answer' | 'choice';
  /** 逐层提示：不默认展开 */
  hints?: string[];
  /** answer 类型：归一化后比较 */
  answer?: string;
  /** 自定义判定（用于特殊输入格式） */
  check?: (input: string) => boolean;
  answerPattern?: string; // 输入格式提示
  choices?: Choice[];
  /** 参考答案与解析（明确展开后才显示） */
  solution: ReactNode;
}

/** 练习答案归一化（有意宽松）：去空白、中文逗号→英文、大小写不敏感。导出供测试固定行为。 */
export function normalizeAnswer(s: string): string {
  return s.replace(/\s+/g, '').replace(/，/g, ',').toLowerCase();
}

export function Exercise({ spec, courseId }: { spec: ExerciseSpec; courseId: string }) {
  const { get, recordExercise } = useProgress();
  const prog = get(courseId).exercises[spec.id];
  const [hintLevel, setHintLevel] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<null | 'ok' | 'bad'>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const check = () => {
    const ok = spec.check ? spec.check(input) : spec.answer !== undefined && normalizeAnswer(input) === normalizeAnswer(spec.answer);
    const isFirstAttemptOfThisSession = result === null;
    setResult(ok ? 'ok' : 'bad');
    recordExercise(courseId, spec.id, ok, isFirstAttemptOfThisSession && !ok, spec.title);
  };

  const pick = (i: number) => {
    setPicked(i);
    const ok = !!spec.choices?.[i].correct;
    setResult(ok ? 'ok' : 'bad');
    recordExercise(courseId, spec.id, ok, true, spec.title);
  };

  const lvlLabel = spec.level === 1 ? '引导' : spec.level === 2 ? '独立' : '迁移';
  const hints = spec.hints || [];

  return (
    <div className="exercise" data-testid={`exercise-${spec.id}`}>
      <div>
        <span className={`lvl ${spec.level === 2 ? 'l2' : spec.level === 3 ? 'l3' : ''}`}>{lvlLabel}</span>
        <b>{spec.title}</b>
        {prog?.solved && <span className="result-ok" style={{ marginLeft: 10 }}>✓ 已通过</span>}
        {prog?.wrongFirst && !prog?.solved && <span className="muted small" style={{ marginLeft: 10 }}>曾答错，可重试</span>}
      </div>
      <div style={{ margin: '8px 0' }}>{spec.statement}</div>

      {spec.kind === 'answer' && (
        <div className="input-row">
          <input
            className="answer-input"
            data-testid={`ex-input-${spec.id}`}
            value={input}
            placeholder={spec.answerPattern || '输入答案'}
            onChange={(e) => { setInput(e.target.value); setResult(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') check(); }}
            style={{ maxWidth: 420 }}
          />
          <button className="pbtn primary" data-testid={`ex-check-${spec.id}`} onClick={check}>检查</button>
        </div>
      )}

      {spec.kind === 'choice' && spec.choices && (
        <div role="radiogroup" aria-label="选项">
          {spec.choices.map((c, i) => (
            <div key={i} style={{ margin: '4px 0' }}>
              <button
                className="pbtn" style={{ textAlign: 'left' }}
                data-testid={`ex-choice-${spec.id}-${i}`}
                onClick={() => pick(i)}
                aria-pressed={picked === i}
              >
                {String.fromCharCode(65 + i)}. {c.text}
              </button>
              {picked === i && (
                <div className={c.correct ? 'result-ok' : 'result-bad'} style={{ marginTop: 4 }}>
                  {c.correct ? '✓ 正确：' : '✗ 错误：'}{c.why}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {result === 'ok' && <div className="result-ok" data-testid={`ex-result-${spec.id}`}>✓ 回答正确！</div>}
      {result === 'bad' && (
        <div className="result-bad" data-testid={`ex-result-${spec.id}`}>
          ✗ 还不对。试试展开一层提示，或换一个角度想。
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        {hints.map((h, i) => (
          <div key={i}>
            {hintLevel > i ? (
              <div className="hintbox" data-testid={`hint-${i}`}>
                <b>提示 {i + 1}/{hints.length}：</b>{h}
              </div>
            ) : hintLevel === i && (
              <button className="pbtn" data-testid={`btn-hint-${i}`} onClick={() => setHintLevel(i + 1)}>
                展开提示 {i + 1}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        {showSolution ? (
          <div className="hintbox" data-testid="solution">
            <b>参考答案与解析：</b>
            <div>{spec.solution}</div>
          </div>
        ) : (
          <button className="pbtn" data-testid={`btn-solution-${spec.id}`} onClick={() => setShowSolution(true)}>
            查看参考答案与解析（先自己试！）
          </button>
        )}
      </div>
    </div>
  );
}

export function ExerciseList({ exercises, courseId }: { exercises: ExerciseSpec[]; courseId: string }) {
  return (
    <div>
      <p className="muted small">
        练习按 引导 → 独立 → 迁移 递进；提示逐层展开，不会默认暴露答案。教学演示用的样例和这里的验收样例是分开的。
      </p>
      {exercises.map((e) => <Exercise key={e.id} spec={e} courseId={courseId} />)}
    </div>
  );
}

/* ================= 笔记与错因 ================= */

export function NotesAndMistakes({ courseId }: { courseId: string }) {
  const { get, setNotes, addMistake, removeMistake, exportJSON } = useProgress();
  const p = get(courseId);
  const [mistakeText, setMistakeText] = useState('');

  return (
    <div>
      <h3>本课笔记</h3>
      <textarea
        data-testid="notes"
        value={p.notes}
        onChange={(e) => setNotes(courseId, e.target.value)}
        rows={5}
        style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: 10, font: 'inherit' }}
        placeholder="用自己的话写下这个算法的关键点、易错点……（自动保存到本地）"
      />
      <h3>错因记录</h3>
      <div className="input-row">
        <input
          data-testid="mistake-input"
          value={mistakeText}
          onChange={(e) => setMistakeText(e.target.value)}
          placeholder="例如：把 pi[j-1] 写成了 pi[j]，导致死循环"
          style={{ flex: 1, minWidth: 240, border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px', font: 'inherit' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && mistakeText.trim()) { addMistake(courseId, mistakeText.trim()); setMistakeText(''); } }}
        />
        <button
          className="pbtn"
          data-testid="mistake-add"
          onClick={() => { if (mistakeText.trim()) { addMistake(courseId, mistakeText.trim()); setMistakeText(''); } }}
        >
          记录错因
        </button>
      </div>
      {p.mistakes.length === 0 && <p className="muted small">还没有错因记录。做错题时把"当时怎么想的"写下来，复习时最有用。</p>}
      <ul data-testid="mistake-list">
        {p.mistakes.map((m, i) => (
          <li key={i} className="small">
            [{m.date}] {m.text}{' '}
            <button className="pbtn" style={{ padding: '1px 8px', fontSize: 11 }} onClick={() => removeMistake(courseId, m.date, m.text)} aria-label="删除该条">删</button>
          </li>
        ))}
      </ul>
      <details className="fold">
        <summary>备份与恢复（建议定期导出）</summary>
        <p className="small muted">
          所有进度/笔记/错因保存在浏览器 localStorage（仅本机）。清浏览器数据会丢失！建议定期导出 JSON 备份。
        </p>
        <button className="pbtn" data-testid="export-json" onClick={() => downloadText(`algo-expedition-backup-${new Date().toISOString().slice(0, 10)}.json`, exportJSON())}>
          导出全部进度（JSON）
        </button>
      </details>
    </div>
  );
}
