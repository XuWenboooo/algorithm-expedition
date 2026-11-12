import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EXTERNAL_PROBLEMS, LEARNING_STAGES, filterProblems, parseProblemFilters } from '../src/practice/catalog';
import { COURSES, courseById } from '../src/courses/registry';
import { ProgressProvider } from '../src/progress/store';
import { ProblemsPage } from '../src/pages/ProblemsPage';
import { RoadmapPage } from '../src/pages/RoadmapPage';
import { CoursePracticeLinks } from '../src/practice/ProblemCard';

describe('Curated practice catalog', () => {
  it('has 23 unique stable identifiers and URLs across both platforms', () => {
    expect(EXTERNAL_PROBLEMS).toHaveLength(23);
    expect(new Set(EXTERNAL_PROBLEMS.map((p) => p.id)).size).toBe(23);
    expect(new Set(EXTERNAL_PROBLEMS.map((p) => p.url)).size).toBe(23);
    expect(new Set(EXTERNAL_PROBLEMS.map((p) => p.platform))).toEqual(new Set(['luogu', 'nowcoder']));
  });
  it('uses only HTTPS official platform links with no tracking or login data', () => {
    for (const p of EXTERNAL_PROBLEMS) {
      const url = new URL(p.url);
      expect(url.protocol).toBe('https:');
      expect(['www.luogu.com.cn', 'www.nowcoder.com', 'ac.nowcoder.com']).toContain(url.hostname);
      expect(url.search + url.hash + url.username + url.password).toBe('');
      if (p.platform === 'nowcoder' && url.pathname.startsWith('/practice/')) expect(p.id).toContain(url.pathname.split('/').pop());
    }
  });
  it('links existing courses and has dated original study guidance', () => {
    for (const p of EXTERNAL_PROBLEMS) {
      expect(p.courseIds.length).toBeGreaterThan(0);
      p.courseIds.forEach((id) => expect(courseById(id)).toBeDefined());
      expect(p.verifiedAt).toBe('2026-11-12');
      expect(p.goal.length).toBeGreaterThan(10);
      expect(p.hints.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('covers every selected problem exactly once in the learning route', () => {
    const ids = LEARNING_STAGES.flatMap((s) => s.problemIds);
    expect(ids.length).toBe(23);
    expect([...ids].sort()).toEqual(EXTERNAL_PROBLEMS.map((p) => p.id).sort());
    for (const s of LEARNING_STAGES) {
      s.courseIds.forEach((id) => expect(courseById(id)).toBeDefined());
      s.problemIds.forEach((id) => expect(EXTERNAL_PROBLEMS.find((p) => p.id === id)?.stage).toBe(s.id));
      expect(s.checkpoint.length).toBeGreaterThan(20);
    }
  });
  it('does not promote planned courses to ready', () => {
    expect(COURSES.filter((c) => c.status === 'READY')).toHaveLength(20);
    for (const id of ['fenwick', 'shortest-path', 'network-flow', 'hld']) expect(courseById(id)?.status).toBe('PLANNED');
  });
  it('preserves platform-specific indexing and KMP overlap guidance', () => {
    expect(EXTERNAL_PROBLEMS.find((p) => p.id === 'luogu-p2249')?.hints.join(' ')).toContain('1 起始');
    expect(EXTERNAL_PROBLEMS.find((p) => p.id.startsWith('nowcoder-d3df'))?.hints.join(' ')).toContain('0 起始');
    expect(EXTERNAL_PROBLEMS.find((p) => p.id === 'luogu-p3375')?.hints.join(' ')).toContain('重叠');
  });
});

describe('Problem filters', () => {
  it('defaults to all problems and ignores unrelated query parameters', () => {
    expect(filterProblems(EXTERNAL_PROBLEMS, parseProblemFilters('unused=x'))).toHaveLength(23);
  });
  it('finds titles case-insensitively and trims search input', () => {
    expect(filterProblems(EXTERNAL_PROBLEMS, parseProblemFilters('q=%20kmp%20')).map((p) => p.id)).toEqual(['luogu-p3375']);
  });
  it('combines platform, station, and course filters', () => {
    const result = filterProblems(EXTERNAL_PROBLEMS, parseProblemFilters('platform=nowcoder&stage=2&course=binary-search'));
    expect(result).toHaveLength(2);
  });
  it('keeps unrecorded problems as todo and uses only manual solved state', () => {
    expect(filterProblems(EXTERNAL_PROBLEMS, parseProblemFilters('status=solved'))).toHaveLength(0);
    const states = { 'luogu-p1001': { status: 'solved' as const } };
    expect(filterProblems(EXTERNAL_PROBLEMS, parseProblemFilters('status=solved'), states).map((p) => p.id)).toEqual(['luogu-p1001']);
    expect(filterProblems(EXTERNAL_PROBLEMS, parseProblemFilters('status=todo'), states)).toHaveLength(22);
  });
  it('returns no matches for incompatible or unknown filter combinations', () => {
    expect(filterProblems(EXTERNAL_PROBLEMS, parseProblemFilters('platform=nowcoder&stage=6'))).toHaveLength(0);
    expect(filterProblems(EXTERNAL_PROBLEMS, parseProblemFilters('course=not-a-course'))).toHaveLength(0);
  });
});

describe('Learning screens render safely', () => {
  const render = (child: React.ReactNode) => renderToStaticMarkup(<ProgressProvider>{child}</ProgressProvider>);
  it('renders the filtered problem with attribution, safe external link, manual controls', () => {
    const html = render(<ProblemsPage search="q=P3375" />);
    expect(html).toContain('P3375');
    expect(html).toContain('noopener noreferrer');
    expect(html).toContain('2026-11-12');
    expect(html).toContain('我的状态（手动记录）');
    expect(html).not.toContain('data-testid="problem-luogu-p1001"');
  });
  it('renders empty-state recovery instead of a blank page', () => {
    expect(render(<ProblemsPage search="q=zzzznoresults" />)).toContain('查看全部题目');
  });
  it('renders all eight route stations and honest planned-course labels', () => {
    const html = render(<RoadmapPage />);
    expect(html).toContain('id="route-stage-7"');
    expect(html).toContain('课程规划中');
    expect(html).toContain('P3376');
    expect(html).toContain('不承诺竞赛奖项');
  });
  it('adds related practice only where it exists', () => {
    expect(render(<CoursePracticeLinks courseId="kmp" />)).toContain('P3375');
    expect(render(<CoursePracticeLinks courseId="not-a-course" />)).toBe('');
  });
  it('does not tell learners to do missing exercises in a planned course', () => {
    const html = render(<CoursePracticeLinks courseId="fenwick" />);
    expect(html).toContain('本课尚未实现');
    expect(html).not.toContain('先做本站交互练习');
  });
  it('opens the exact problem rather than the first of several associated courses', () => {
    const html = render(<CoursePracticeLinks courseId="cpp-if-loop" />);
    expect(html).toContain('href="#/problems?q=luogu-p1046"');
  });
});
