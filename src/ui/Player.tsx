import React, { useEffect, useMemo, useReducer } from 'react';
import { PlayerState, PlayerAction, initialPlayerState, playerReducer, TraceEvent } from '../kernel/trace';

/**
 * 通用轨迹播放器：
 * - 单步前进/后退、播放/暂停、重置、速度调整、关键步跳转（下拉列出 type 事件）
 * - 后退 = 直接取 index-1 快照，状态恢复精确一致
 * - 解说与不变量面板；可选"预测下一步"交互（predict 返回 null 时隐藏）
 */
export interface PlayerProps<S> {
  events: TraceEvent<S>[];
  predict?: (cur: TraceEvent<S> | null, next: TraceEvent<S> | null) => { question: string; options: string[]; correct: number } | null;
  children: (cur: TraceEvent<S> | null) => React.ReactNode;
  /** 播放结束回调（可用于进度记录） */
  onFinish?: () => void;
  resetKey?: string;
}

export function Player<S>({ events, predict, children, onFinish, resetKey }: PlayerProps<S>) {
  const [st, dispatch] = useReducer(
    (s: PlayerState, a: PlayerAction) => playerReducer(s, a, events.length),
    initialPlayerState
  );
  const cur = st.index >= 0 && st.index < events.length ? events[st.index] : null;
  const next = st.index + 1 < events.length ? events[st.index + 1] : null;

  // 播放循环
  useEffect(() => {
    if (!st.playing) return;
    if (st.index >= events.length - 1) {
      dispatch({ type: 'pause' });
      onFinish?.();
      return;
    }
    const t = setTimeout(() => dispatch({ type: 'tick' }), st.speed);
    return () => clearTimeout(t);
  }, [st.playing, st.index, st.speed, events.length, onFinish]);

  // 输入变化或 resetKey 变化 → 重置
  useEffect(() => {
    dispatch({ type: 'reset' });
  }, [resetKey]);

  const keyEvents = useMemo(() => {
    // 关键步：每种事件类型第一次出现 + 所有 full-match/match/done 类
    const seen = new Set<string>();
    const out: { idx: number; label: string }[] = [];
    events.forEach((e, idx) => {
      const important = /match|done|found|swap|assign|full/i.test(e.type);
      if (!seen.has(e.type) || important) {
        seen.add(e.type);
        out.push({ idx, label: `#${idx} ${e.type}` });
      }
    });
    return out;
  }, [events]);

  const [prediction, setPrediction] = React.useState<'idle' | 'right' | 'wrong'>('idle');
  const pred = predict ? predict(cur, next) : null;
  useEffect(() => setPrediction('idle'), [st.index, resetKey]);

  const total = events.length;
  const pct = total > 0 ? Math.round(((st.index + 1) / total) * 100) : 0;

  // 键盘操作：← 后退 / → 前进（输入控件聚焦时忽略，避免打字冲突）
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        dispatch({ type: 'next' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        dispatch({ type: 'prev' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div>
      <div className="player-controls" role="toolbar" aria-label="播放控制">
        <button className="pbtn" data-testid="btn-prev" onClick={() => dispatch({ type: 'prev' })} disabled={st.index < 0} aria-label="后退一步">⏮ 后退</button>
        <button className="pbtn primary" data-testid="btn-next" onClick={() => dispatch({ type: 'next' })} disabled={total === 0 || st.index >= total - 1} aria-label="前进一步">前进一步 ⏭</button>
        {st.playing ? (
          <button className="pbtn" data-testid="btn-pause" onClick={() => dispatch({ type: 'pause' })} aria-label="暂停">⏸ 暂停</button>
        ) : (
          <button className="pbtn" data-testid="btn-play" onClick={() => dispatch({ type: 'play' })} disabled={total === 0} aria-label="播放">▶ 播放</button>
        )}
        <button className="pbtn" data-testid="btn-reset" onClick={() => dispatch({ type: 'reset' })} aria-label="重置">↺ 重置</button>
        <select
          className="speedsel" data-testid="speed"
          value={st.speed} aria-label="播放速度"
          onChange={(e) => dispatch({ type: 'setSpeed', speed: Number(e.target.value) })}
        >
          <option value={1400}>慢 (1.4s/步)</option>
          <option value={800}>标准 (0.8s/步)</option>
          <option value={400}>快 (0.4s/步)</option>
          <option value={120}>极快 (0.12s/步)</option>
        </select>
        <select
          className="speedsel" data-testid="jump"
          value="" aria-label="跳转到关键步骤"
          onChange={(e) => { if (e.target.value !== '') dispatch({ type: 'goto', index: Number(e.target.value) }); }}
        >
          <option value="">跳到关键步…</option>
          {keyEvents.map((k) => (
            <option key={k.idx} value={k.idx}>{k.label}</option>
          ))}
        </select>
        <span className="muted small" data-testid="step-indicator" aria-live="polite">
          步 {st.index + 1} / {total}（{pct}%）
        </span>
      </div>
      <div className="progressbar" role="progressbar" aria-label="轨迹播放进度"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
        data-testid="progress-bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <input
        className="stepslider" type="range" min={-1} max={total - 1} value={st.index}
        aria-label="步骤滑块"
        aria-valuetext={`第 ${st.index + 1} 步，共 ${total} 步`}
        data-testid="step-slider"
        onChange={(e) => dispatch({ type: 'goto', index: Number(e.target.value) })}
      />

      {pred && prediction === 'idle' && st.index < total - 1 && (
        <div className="card" style={{ background: '#fffbe8', borderColor: '#ecd9a0' }} data-testid="predict-panel">
          <b>🔮 预测下一步：</b>{pred.question}
          <div style={{ marginTop: 8 }}>
            {pred.options.map((o, i) => (
              <button key={i} className="pbtn" style={{ marginRight: 8 }} onClick={() => setPrediction(i === pred.correct ? 'right' : 'wrong')}>
                {o}
              </button>
            ))}
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>先预测，再点击"前进一步"验证。</div>
        </div>
      )}
      {pred && prediction === 'right' && (
        <div className="invariant-box" data-testid="predict-result">✅ 预测正确！可以继续前进一步验证。</div>
      )}
      {pred && prediction === 'wrong' && (
        <div className="invariant-box bad" data-testid="predict-result">❌ 预测错误——回想一下该情形的规则，再看下一步执行结果。</div>
      )}

      {children(cur)}

      {cur && (
        <>
          <div className="explain-box" data-testid="explain" aria-live="polite">{cur.explain}</div>
          {cur.invariant && (
            <div className={`invariant-box ${cur.invariant.ok ? '' : 'bad'}`} data-testid="invariant">
              <b>🔒 不变量 [{cur.invariant.name}]</b>{cur.invariant.ok ? '：' : '（被破坏！）：'}{cur.invariant.detail}
            </div>
          )}
        </>
      )}
      {!cur && total > 0 && (
        <div className="explain-box muted">点击"前进一步"或"播放"开始。当前显示初始输入，尚未执行任何操作。</div>
      )}
    </div>
  );
}
