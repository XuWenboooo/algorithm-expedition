import { useEffect, useRef, useState } from 'react';

/**
 * 团队训练页（READY）：读题分工、单机协作、罚时规则、限时模拟与复盘。
 * 配两个真实可用的小工具：模拟赛倒计时 + 罚时计算器。
 * 团队练习从第一天就可以开始，不需要等高级知识学完。
 */

interface ProblemRow {
  id: string;
  name: string;
  minutes: number;   // 从比赛开始到 AC 的分钟数
  wrong: number;     // AC 前的错误提交次数
  solved: boolean;
}

export function TeamPage() {
  /* ---------- 模拟赛倒计时（基于时间戳差值：后台节流后回到前台仍准确） ---------- */
  const [totalMin, setTotalMin] = useState(300);
  const [remaining, setRemaining] = useState(300 * 60);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    // 以真实时钟为锚：即使浏览器在后台标签节流了定时器，
    // 回到前台时显示的剩余时间仍与真实流逝时间一致
    endAtRef.current = Date.now() + remaining * 1000;
    const t = setInterval(() => {
      if (endAtRef.current === null) return;
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) setRunning(false);
    }, 500);
    return () => clearInterval(t);
    // remaining 仅在启动瞬间读取一次（作为锚点），运行中不重置锚点
  }, [running]);

  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const hh = String(Math.floor(remaining / 3600)).padStart(2, '0');

  /* ---------- 罚时计算器 ---------- */
  const [rows, setRows] = useState<ProblemRow[]>([
    { id: 'A', name: '签到题', minutes: 23, wrong: 0, solved: true },
    { id: 'B', name: '模拟', minutes: 71, wrong: 1, solved: true },
    { id: 'C', name: '没做出来', minutes: 0, wrong: 2, solved: false },
  ]);
  const totalTime = rows.filter((r) => r.solved).reduce((a, r) => a + r.minutes + 20 * r.wrong, 0);
  const solvedCount = rows.filter((r) => r.solved).length;

  return (
    <div className="container">
      <h1 style={{ marginTop: 24 }}>🤝 团队训练与比赛策略</h1>
      <p className="muted">本课从你入队第一天就可以开始——团队配合本身是一项独立技能，不需要等所有高级算法学完。</p>

      <div className="card">
        <h2>🧭 三人队的读题与分工（前 30 分钟标准流程）</h2>
        <ul>
          <li><b>开赛 0-10 分钟</b>：三人各领 1/3 题目通读，每人给每道题写一句话摘要（题意 + 数据范围 + 初步方向）。</li>
          <li><b>10-20 分钟</b>：按"最可能先做出来"排序，1 人主讲签到题，其他人补细节；明确谁写代码 / 谁检查。</li>
          <li><b>20-30 分钟</b>：签到题上机。写题人读代码思路，另一人同时读下一题，第三人准备对拍数据。</li>
        </ul>
        <h3>单机协作纪律（区域赛是 3 人 1 机）</h3>
        <ul>
          <li>上机前必须有：算法 + 复杂度 + 关键边界（口头 30 秒讲清楚）。</li>
          <li>一次只写一道题；写题人不看手机，另外两人负责盯语法错误和数据范围。</li>
          <li>被换下来的人立刻去读题/手算样例，不围观敲键盘。</li>
        </ul>
      </div>

      <div className="card">
        <h2>⏱ 罚时规则与计算器（ICPC 规则）</h2>
        <p className="small muted">
          通过一题记 = AC 时刻（分钟）+ 20 × 该题错误提交数；未通过题目不计入罚时。总罚时 = 各题之和（只在题数相同时比较）。
        </p>
        <table className="course-map" data-testid="penalty-table">
          <thead><tr><th>题</th><th>名称</th><th>AC 时刻(分)</th><th>错误提交</th><th>该题罚时</th><th>操作</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><input className="answer-input" style={{ width: 50 }} value={r.id} aria-label="题号" onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, id: e.target.value } : x))} /></td>
                <td><input className="answer-input" style={{ width: 130 }} value={r.name} aria-label="名称" onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></td>
                <td><input className="answer-input" style={{ width: 80 }} type="number" min={0} max={300} value={r.minutes} aria-label="AC 时刻" onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, minutes: Math.max(0, Math.min(300, Number(e.target.value) || 0)) } : x))} /></td>
                <td><input className="answer-input" style={{ width: 70 }} type="number" min={0} max={50} value={r.wrong} aria-label="错误次数" onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, wrong: Math.max(0, Math.min(50, Number(e.target.value) || 0)) } : x))} /></td>
                <td>{r.solved ? r.minutes + 20 * r.wrong : '—'}</td>
                <td>
                  <button className="pbtn" style={{ padding: '2px 8px' }} onClick={() => setRows((rs) => rs.map((x, j) => j === i ? { ...x, solved: !x.solved } : x))}>
                    {r.solved ? '已 AC ✓' : '未通过'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p data-testid="penalty-total" style={{ fontSize: 17 }}>
          当前：<b>{solvedCount} 题</b>，总罚时 <b>{totalTime}</b> 分钟。
        </p>
      </div>

      <div className="card">
        <h2>⏳ 模拟赛倒计时（默认 5 小时，标准 ICPC 赛制）</h2>
        <div className="timer-display" data-testid="timer" role="timer" aria-live="off">{hh}:{mm}:{ss}</div>
        <p className="muted small" style={{ textAlign: 'center', margin: '4px 0' }}>
          提示：若把页面切到后台，浏览器会节流定时器；计时基于真实时钟，回到前台后显示依然准确。
        </p>
        <div className="player-controls" style={{ justifyContent: 'center' }}>
          <label className="field">
            <span>时长（分钟）</span>
            <input type="number" min={30} max={600} value={totalMin} data-testid="timer-length"
              onChange={(e) => {
                const v = Math.max(30, Math.min(600, Number(e.target.value) || 30));
                setTotalMin(v);
                if (!running) setRemaining(v * 60);
              }} />
          </label>
          {!running ? (
            <button className="pbtn primary" data-testid="timer-start" onClick={() => setRunning(true)} disabled={remaining === 0}>▶ 开始</button>
          ) : (
            <button className="pbtn" data-testid="timer-pause" onClick={() => setRunning(false)}>⏸ 暂停</button>
          )}
          <button className="pbtn" data-testid="timer-reset" onClick={() => { setRunning(false); setRemaining(totalMin * 60); }}>↺ 重置</button>
        </div>
        {remaining === 0 && <p className="result-bad" style={{ textAlign: 'center' }}>时间到！进入封榜复盘。</p>}
      </div>

      <div className="card">
        <h2>📋 限时模拟流程（每周至少 1 次）</h2>
        <ol>
          <li>选 4-6 道题（难度覆盖：2 签到 + 2 中档 + 1-2 挑战），总时长按真实赛制设定。</li>
          <li>严格按上面的分工流程执行；全程只用 1 台机器。</li>
          <li>赛后当天写复盘：每道题三类结论——<b>会做没做对</b>（实现问题）/ <b>不会做</b>（知识缺口）/ <b>做对了但慢</b>（套路不熟）。</li>
          <li>把每条结论写进对应课程的错题本；知识缺口转入学习计划，补完在平台练迁移题。</li>
        </ol>
        <p className="muted small">题目来源请使用你有权使用的训练题库或公开题集，本平台只记录复盘，不代存受限题面。</p>
      </div>

      <div className="card">
        <h2>🧪 补题与复盘工具习惯</h2>
        <ul>
          <li>补题顺序：赛后 24h 内补"差一点就出"的题 → 72h 内补中档题 → 挑战题看题解后<b>关掉题解重写</b>。</li>
          <li>每道补完的题，在平台对应课程做一道迁移练习，检验是"会了这题"还是"会了这类"。</li>
          <li>数据生成 + 对拍是区域赛基本功：平台各课程的 C++ 参考代码都配了对拍测试，学会读 tests/ 里的对拍写法。</li>
        </ul>
      </div>
    </div>
  );
}
