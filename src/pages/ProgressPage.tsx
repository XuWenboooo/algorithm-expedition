import { useRef, useState } from 'react';
import { COURSES, courseById } from '../courses/registry';
import { useProgress, downloadText, validateImported, DIMENSIONS } from '../progress/store';

/** 训练记录页（进度总览 + 全局备份导入导出） */
export function ProgressPage({ mode }: { mode: 'progress' | 'practice' }) {
  const { data, importData, resetAll, exportJSON } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const doImport = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const v = validateImported(String(reader.result));
      if (v.ok) {
        importData(v.data);
        setImportMsg('✅ 导入成功，进度已恢复。');
      } else {
        setImportMsg(`❌ ${v.error}`);
      }
    };
    reader.readAsText(f);
  };

  const readyCourses = COURSES.filter((c) => c.status === 'READY');

  return (
    <div className="container">
      <h1 style={{ marginTop: 24 }}>{mode === 'progress' ? '📈 训练记录' : '✏️ 练习总览'}</h1>

      {mode === 'progress' && (
        <>
          <div className="card">
            <h2>各课程掌握维度（自评）</h2>
            <table className="course-map" data-testid="progress-table">
              <thead>
                <tr><th>课程</th>{DIMENSIONS.map((d) => <th key={d.key} style={{ textAlign: 'center' }}>{d.label}</th>)}<th>练习通过</th><th>自主实验</th></tr>
              </thead>
              <tbody>
                {readyCourses.map((c) => {
                  const p = data.courses[c.id];
                  const dims = p?.dims;
                  const solved = p ? Object.values(p.exercises).filter((e) => e.solved).length : 0;
                  return (
                    <tr key={c.id}>
                      <td><a href={`#/course/${c.id}`}>{c.title}</a></td>
                      {DIMENSIONS.map((d) => (
                        <td key={d.key} style={{ textAlign: 'center' }}>{dims?.[d.key] ? '✅' : '—'}</td>
                      ))}
                      <td>{solved}</td>
                      <td>{p?.experiments || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="muted small">维度含义：阅读 / 理解 / 实现 / 应用 / 迁移 —— 由你在课程页自行勾选，平台不以点击判定掌握。</p>
          </div>
        </>
      )}

      {mode === 'practice' && (
        <div className="card">
          <h2>全部练习索引（点击进入课程页完成）</h2>
          <table className="course-map">
            <thead><tr><th>课程</th><th>练习</th><th>状态</th></tr></thead>
            <tbody>
              {readyCourses.flatMap((c) => {
                const p = data.courses[c.id];
                const exs = Object.entries(p?.exercises || {});
                if (exs.length === 0) {
                  return [(
                    <tr key={c.id}>
                      <td><a href={`#/course/${c.id}`}>{c.title}</a></td>
                      <td className="muted small">3 道渐进练习待完成</td>
                      <td className="muted">—</td>
                    </tr>
                  )];
                }
                return exs.map(([exId, rec], i) => (
                  <tr key={`${c.id}-${exId}`}>
                    {i === 0 && <td rowSpan={exs.length}><a href={`#/course/${c.id}`}>{c.title}</a></td>}
                    <td className="small">{rec.title || exId}</td>
                    <td className="small">
                      {rec.solved ? <span className="result-ok">✓ 已通过</span> : rec.wrongFirst ? <span className="result-bad">曾答错</span> : '—'}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
          <p className="muted small">练习详细内容在各自课程页内（含分层提示与解析）。本页只做总览。</p>
        </div>
      )}

      <div className="card">
        <h2>💾 备份与恢复（重要！）</h2>
        <p className="small muted">
          所有数据保存在浏览器 localStorage（仅本机，不上传）。<b>清除浏览器数据会全部丢失</b>——建议每周导出一次 JSON 备份。
        </p>
        <div className="input-row">
          <button className="pbtn primary" data-testid="global-export" onClick={() => downloadText(`algo-expedition-backup-${new Date().toISOString().slice(0, 10)}.json`, exportJSON())}>
            导出备份 JSON
          </button>
          <button className="pbtn" data-testid="global-import" onClick={() => fileRef.current?.click()}>导入备份 JSON</button>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = ''; }} />
          <button
            className="pbtn" data-testid="global-reset"
            onClick={() => { if (window.confirm('确定清空全部学习记录吗？此操作不可恢复，建议先导出备份！')) resetAll(); }}
          >
            清空全部记录
          </button>
        </div>
        {importMsg && <p data-testid="import-msg">{importMsg}</p>}
        {mode === 'progress' && (
          <p className="muted small">最后保存时间：{data.savedAt ? new Date(data.savedAt).toLocaleString('zh-CN') : '—'} · 数据版本 v{data.version}</p>
        )}
      </div>
    </div>
  );
}

/** 错题与复习页：跨课程汇总错因与答错的练习 */
export function ReviewPage() {
  const { data } = useProgress();
  const mistakes = Object.entries(data.courses).flatMap(([cid, p]) =>
    (p.mistakes || []).map((m) => ({ ...m, courseId: cid }))
  );
  const wrongExs = Object.entries(data.courses).flatMap(([cid, p]) =>
    Object.entries(p.exercises).filter(([, r]) => r.wrongFirst).map(([exId, r]) => ({ courseId: cid, exId, ...r }))
  );

  return (
    <div className="container">
      <h1 style={{ marginTop: 24 }}>🔁 错题与复习</h1>
      <div className="card">
        <h2>错因本（跨课程汇总，{mistakes.length} 条）</h2>
        {mistakes.length === 0 ? (
          <p className="muted">还没有记录。在课程页底部"错因记录"里写下你踩过的坑——这是复习时最值钱的材料。</p>
        ) : (
          <table className="course-map" data-testid="review-mistakes">
            <thead><tr><th>日期</th><th>课程</th><th>错因</th></tr></thead>
            <tbody>
              {mistakes.map((m, i) => (
                <tr key={i}>
                  <td className="small">{m.date}</td>
                  <td className="small"><a href={`#/course/${m.courseId}`}>{courseById(m.courseId)?.title || m.courseId}</a></td>
                  <td className="small">{m.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="card">
        <h2>曾经答错的练习（{wrongExs.length} 道）—— 重做通过的会保留"曾答错"标记</h2>
        {wrongExs.length === 0 ? (
          <p className="muted">暂无。答错不是坏事，被记录下来的错误才是复习的靶子。</p>
        ) : (
          <ul data-testid="review-wrong">
            {wrongExs.map((w, i) => (
              <li key={i} className="small">
                <a href={`#/course/${w.courseId}`}>{courseById(w.courseId)?.title || w.courseId}</a> · {w.title || w.exId}
                {w.solved ? '（后来已通过 ✓）' : '（尚未通过）'} · 尝试 {w.attempts} 次
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <h2>复习节奏建议</h2>
        <ul className="small">
          <li><b>1 天后</b>：只看重温错因本，不看书。</li>
          <li><b>1 周后</b>：重做"曾答错"的练习；能讲清每个提示为什么对。</li>
          <li><b>1 月后</b>：用可视化实验室换一组输入重跑，能预测每一步。</li>
        </ul>
      </div>
    </div>
  );
}
