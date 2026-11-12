import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './ui/styles.css';

/** 全局错误边界：任何未捕获渲染错误显示中文提示而非白屏 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, maxWidth: 640, margin: '0 auto', fontFamily: 'sans-serif' }}>
          <h1>⚠ 页面出现意外错误</h1>
          <p>错误信息：<code>{this.state.error.message}</code></p>
          <p>建议：刷新页面重试；学习记录保存在浏览器本地，刷新不会丢失。</p>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', fontSize: 15 }}>刷新页面</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
