import { useState } from 'react';

/** 代码视图：显示完整代码 + 当前行高亮 + 一键复制 */
export function CodeView({ code, hotLine, testId }: { code: string; hotLine?: number; testId?: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 旧浏览器/非安全上下文回退
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <div className="codeview" data-testid={testId}>
      <button className="copybtn" onClick={doCopy} aria-label="复制代码">{copied ? '✓ 已复制' : '复制代码'}</button>
      <pre>
        {lines.map((l, i) => (
          <div key={i} className={`code-line ${hotLine === i + 1 ? 'hot' : ''}`}>
            <span className="ln">{i + 1}</span>
            <span className="ct">{l || ' '}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
