import type { AppData, CourseProgress, ExerciseRecord, ExternalProblemRecord, MistakeEntry } from './store';

const dimensions = ['read', 'understand', 'implement', 'apply', 'transfer'] as const;
const reserved = new Set(['__proto__', 'prototype', 'constructor']);
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
function fail(path: string): never { throw new Error(`备份字段 ${path} 格式不正确，未导入任何数据。`); }
function object(v: unknown, path: string): Record<string, unknown> { if (!record(v)) fail(path); return v; }
function string(v: unknown, path: string, fallback = ''): string { if (v === undefined) return fallback; if (typeof v !== 'string') fail(path); return v; }
function bool(v: unknown, path: string): boolean { if (v === undefined) return false; if (typeof v !== 'boolean') fail(path); return v; }
function count(v: unknown, path: string): number { if (v === undefined) return 0; if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) fail(path); return v; }
function key(k: string, path: string) { if (!k || reserved.has(k)) fail(path); }
function timestamp(v: unknown, path: string, fallback: string): string { const s = string(v, path, fallback); if (!s || !Number.isFinite(Date.parse(s))) fail(path); return s; }

export function emptyCourseProgress(): CourseProgress {
  return { dims: { read: false, understand: false, implement: false, apply: false, transfer: false }, exercises: {}, notes: '', mistakes: [], experiments: 0 };
}

/** Missing fields from older v1 backups receive defaults; invalid supplied fields reject the whole import. */
export function normalizeAppData(value: unknown, now = new Date().toISOString()): AppData {
  const root = object(value, '根对象');
  if (root.version !== 1) fail('version（仅支持 v1）');
  const rawCourses = object(root.courses, 'courses');
  const courses: Record<string, CourseProgress> = {};
  for (const [id, raw] of Object.entries(rawCourses)) {
    key(id, 'courses 的课程 ID');
    const p = object(raw, `courses.${id}`);
    const dims = p.dims === undefined ? {} : object(p.dims, `${id}.dims`);
    const result = emptyCourseProgress();
    for (const d of dimensions) result.dims[d] = bool(dims[d], `${id}.dims.${d}`);
    const exs = p.exercises === undefined ? {} : object(p.exercises, `${id}.exercises`);
    for (const [eid, rawEx] of Object.entries(exs)) {
      key(eid, `${id}.exercises 的练习 ID`);
      const ex = object(rawEx, `${id}.exercises.${eid}`);
      const normalized: ExerciseRecord = { solved: bool(ex.solved, `${eid}.solved`), wrongFirst: bool(ex.wrongFirst, `${eid}.wrongFirst`), attempts: count(ex.attempts, `${eid}.attempts`) };
      if (ex.title !== undefined) normalized.title = string(ex.title, `${eid}.title`);
      result.exercises[eid] = normalized;
    }
    result.notes = string(p.notes, `${id}.notes`);
    result.experiments = count(p.experiments, `${id}.experiments`);
    if (p.mistakes !== undefined) {
      if (!Array.isArray(p.mistakes)) fail(`${id}.mistakes`);
      result.mistakes = p.mistakes.map((rawMistake, i): MistakeEntry => {
        const m = object(rawMistake, `${id}.mistakes[${i}]`);
        // Dates are display text in existing backups, not executable or scheduling data.
        return { date: string(m.date, `${id}.mistakes.date`), courseId: string(m.courseId, `${id}.mistakes.courseId`, id), text: string(m.text, `${id}.mistakes.text`) };
      });
    }
    courses[id] = result;
  }
  const externalProblems: Record<string, ExternalProblemRecord> = {};
  if (root.externalProblems !== undefined) {
    const rawProblems = object(root.externalProblems, 'externalProblems');
    for (const [id, raw] of Object.entries(rawProblems)) {
      key(id, 'externalProblems 的题目 ID');
      const p = object(raw, `externalProblems.${id}`);
      const status = p.status === undefined ? 'todo' : p.status;
      if (status !== 'todo' && status !== 'attempted' && status !== 'solved') fail(`${id}.status`);
      externalProblems[id] = { status, notes: string(p.notes, `${id}.notes`), updatedAt: timestamp(p.updatedAt, `${id}.updatedAt`, now) };
    }
  }
  return { version: 1, savedAt: timestamp(root.savedAt, 'savedAt', now), courses, externalProblems };
}

export function validateImported(text: string): { ok: true; data: AppData } | { ok: false; error: string } {
  let value: unknown;
  try { value = JSON.parse(text); } catch { return { ok: false, error: '不是合法的 JSON 文件。' }; }
  try { return { ok: true, data: normalizeAppData(value) }; } catch (error) { return { ok: false, error: error instanceof Error ? error.message : '备份格式不正确。' }; }
}
