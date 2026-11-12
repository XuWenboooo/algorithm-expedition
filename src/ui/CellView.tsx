import React from 'react';

/** 单元格规格 */
export interface Cell {
  text: string;
  /** idle | compare | match | mismatch | active | done | dim */
  state?: string;
  sub?: string;
  /** 状态文字徽标（不只靠颜色区分） */
  mark?: string;
}
export interface CellRowSpec {
  key: string;
  label?: string;
  cells: Cell[];
  /** 下标行是否显示（默认显示） */
  showIndex?: boolean;
  /** 额外指针：index → 文本（如 "i" / "j"），渲染在格子下方 */
  pointers?: Record<number, string>;
}

export function CellRow({ spec }: { spec: CellRowSpec }) {
  const showIndex = spec.showIndex !== false;
  // 屏幕阅读器可读：格子内容 + 下标 + 指针 + 状态（不只依赖颜色）
  const stateText: Record<string, string> = {
    compare: '比较中', match: '匹配', mismatch: '失配', active: '当前', done: '已处理', dim: '已排除',
  };
  const aria = [
    spec.label || '数据',
    ...spec.cells.map((c, idx) => {
      const parts = [`第 ${idx} 格 ${c.text}`];
      if (c.sub) parts.push(`值 ${c.sub}`);
      if (spec.pointers?.[idx]) parts.push(`指针 ${spec.pointers[idx]}`);
      if (c.state && stateText[c.state]) parts.push(stateText[c.state]);
      return parts.join('，');
    }),
  ].join('；');
  return (
    <div className="cellrow-wrap">
      {spec.label && <div className="cellrow-label">{spec.label}</div>}
      <div className="cellrow" role="img" aria-label={aria}>
        {spec.cells.map((c, idx) => (
          <span key={idx} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className={`cell ${c.state || ''}`}>
              {showIndex && <span className="idx">{idx}</span>}
              <span>{c.text}</span>
              {c.sub && <span className="sub">{c.sub}</span>}
              {c.mark && <span className="state-mark">{c.mark}</span>}
            </span>
            {spec.pointers && spec.pointers[idx] && (
              <span className="pointer">▲{spec.pointers[idx]}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 变量芯片 */
export function VarChips({ vars }: { vars: { name: string; value: React.ReactNode; note?: string }[] }) {
  return (
    <div className="input-row" role="list" aria-label="当前变量">
      {vars.map((v) => (
        <span key={v.name} className="tag" role="listitem" style={{ fontSize: 14 }}>
          <b>{v.name}</b> = {v.value}
          {v.note && <span className="muted small">（{v.note}）</span>}
        </span>
      ))}
    </div>
  );
}
