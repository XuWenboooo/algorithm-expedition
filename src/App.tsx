import React, { useEffect, useState } from 'react';
import { ProgressProvider } from './progress/store';
import { Home } from './pages/Home';
import { KmpPage } from './pages/KmpPage';
import { ProgressPage, ReviewPage } from './pages/ProgressPage';
import { TeamPage } from './pages/TeamPage';
import { courseById } from './courses/registry';
import { buildStandardSpec } from './courses/standardSpecs';
import { StandardCoursePage } from './courses/CoursePage';

function useHashRoute(): string {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const fn = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return hash;
}

function TopBar({ route }: { route: string }) {
  const link = (href: string, label: string) => (
    <a href={href} className={route === href || (href === '#/' && route === '#/') ? 'active' : ''}>{label}</a>
  );
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <a href="#/" className="logo">⛰️ 算法远征<span className="sub">Algorithm Expedition · 本地优先 · 中文</span></a>
        <nav className="nav" aria-label="主导航">
          {link('#/', '总览地图')}
          {link('#/practice', '练习')}
          {link('#/review', '错题与复习')}
          {link('#/progress', '训练记录')}
          {link('#/team', '团队训练')}
        </nav>
      </div>
    </div>
  );
}

function CoursePageRouter({ id }: { id: string }) {
  const meta = courseById(id);
  if (!meta) {
    return (
      <div className="container">
        <h1>课程不存在</h1>
        <p><a href="#/">← 返回总览地图</a></p>
      </div>
    );
  }
  if (meta.status === 'PLANNED') {
    return (
      <div className="container">
        <h1 style={{ marginTop: 24 }}>{meta.title} <span className="tag planned">PLANNED · 仅路线规划</span></h1>
        <div className="card">
          <p>{meta.summary}</p>
          <p className="muted">这门课还处于路线图规划阶段：<b>没有课程内容、没有演示、没有练习</b>。
            平台诚实标注它的状态，不会用占位页面冒充课程。先修课程：{meta.deps.map((d) => courseById(d)?.title).join('、') || '无'}。</p>
          <p><a href="#/">← 返回总览地图</a></p>
        </div>
      </div>
    );
  }
  if (id === 'kmp') return <KmpPage />;
  if (id === 'team-training') return <TeamPage />;
  const spec = buildStandardSpec(id);
  if (spec) return <StandardCoursePage spec={spec} />;
  return (
    <div className="container">
      <h1 style={{ marginTop: 24 }}>{meta.title} <span className="tag inprogress">IN_PROGRESS</span></h1>
      <div className="card">
        <p>{meta.summary}</p>
        <p className="muted">课程内容尚未完成，缺失：{meta.missing?.join('、') || '见交付报告待办清单'}。</p>
        <p><a href="#/">← 返回总览地图</a></p>
      </div>
    </div>
  );
}

export function App() {
  const route = useHashRoute();
  let page: React.ReactNode;
  if (route.startsWith('#/course/')) {
    page = <CoursePageRouter id={route.slice('#/course/'.length)} />;
  } else if (route === '#/practice') page = <ProgressPage mode="practice" />;
  else if (route === '#/review') page = <ReviewPage />;
  else if (route === '#/progress') page = <ProgressPage mode="progress" />;
  else if (route === '#/team') page = <TeamPage />;
  else page = <Home />;

  return (
    <ProgressProvider>
      <TopBar route={route.split('/').slice(0, 2).join('/')} />
      {page}
    </ProgressProvider>
  );
}
