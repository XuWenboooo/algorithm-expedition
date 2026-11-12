import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyAppData, loadAppData, persistAppData, readStorageSnapshot, validateImported } from '../src/progress/store';
import { normalizeAppData } from '../src/progress/validation';

const valid = () => ({ version: 1, savedAt: '2026-11-12T04:00:00.000Z', courses: { kmp: { dims: { read: true }, notes: '保留中文与换行\n笔记', exercises: { test: { solved: true, wrongFirst: true, attempts: 3, title: 'pi 表' } }, mistakes: [{ date: '2026-11-12', courseId: 'kmp', text: '边界错误' }], experiments: 2 } } });
const parse = (data: unknown) => validateImported(JSON.stringify(data));
afterEach(() => vi.unstubAllGlobals());

describe('Learning backup validation', () => {
  it('keeps all old course data while filling only missing v1 fields', () => {
    const data = normalizeAppData(valid());
    expect(data.courses.kmp).toEqual({ dims: { read: true, understand: false, implement: false, apply: false, transfer: false }, notes: '保留中文与换行\n笔记', exercises: { test: { solved: true, wrongFirst: true, attempts: 3, title: 'pi 表' } }, mistakes: [{ date: '2026-11-12', courseId: 'kmp', text: '边界错误' }], experiments: 2 });
    expect(data.externalProblems).toEqual({});
    expect(data.savedAt).toBe(valid().savedAt);
  });
  it('supports minimal older v1 backups and unknown course IDs without dropping them', () => {
    const data = normalizeAppData({ version: 1, courses: { archived: {} } }, '2026-01-01T00:00:00Z');
    expect(data.courses.archived.exercises).toEqual({});
    expect(data.courses.archived.notes).toBe('');
    expect(data.savedAt).toBe('2026-01-01T00:00:00Z');
  });
  it('round-trips external statuses and notes with the same stable URL/UUID identifiers', () => {
    const data = { ...valid(), externalProblems: { 'https://www.nowcoder.com/practice/123': { status: 'attempted', notes: '边界待检查', updatedAt: '2026-11-12T05:00:00Z' }, 'luogu:P1001': { status: 'solved', notes: '', updatedAt: '2026-11-12T06:00:00Z' } } };
    const result = parse(data);
    expect(result.ok).toBe(true);
    if (result.ok) expect(parse(result.data)).toEqual(result);
  });
  it('rejects non-JSON input without throwing', () => expect(validateImported('{bad').ok).toBe(false));
  it.each([null, [], false, 'text', {}, { version: 2, courses: {} }, { version: 1, courses: [] }, { version: 1, courses: null }])('rejects invalid root shape %j', (data) => expect(parse(data).ok).toBe(false));
  it.each([
    { notes: {} }, { notes: null }, { dims: [] }, { dims: { read: 'yes' } },
    { exercises: [] }, { exercises: { bad: null } }, { exercises: { bad: { solved: 'true' } } },
    { exercises: { bad: { attempts: -1 } } }, { experiments: 1.5 }, { experiments: Number.MAX_SAFE_INTEGER + 1 },
    { mistakes: {} }, { mistakes: [null] }, { mistakes: [{ text: {} }] },
  ])('rejects malformed nested course fields %j', (course) => {
    expect(parse({ version: 1, courses: { kmp: course } }).ok).toBe(false);
  });
  it.each([[], null, { a: null }, { a: { status: 'accepted' } }, { a: { notes: [] } }, { a: { updatedAt: 'yesterday' } }])('rejects malformed external records %j', (externalProblems) => {
    expect(parse({ ...valid(), externalProblems }).ok).toBe(false);
  });
  it('rejects unsafe dictionary keys without prototype pollution', () => {
    for (const key of ['__proto__', 'constructor', 'prototype']) {
      expect(validateImported(`{"version":1,"courses":{"${key}":{}}}`).ok).toBe(false);
      expect(validateImported(`{"version":1,"courses":{"kmp":{"exercises":{"${key}":{}}}}}`).ok).toBe(false);
      expect(validateImported(`{"version":1,"courses":{},"externalProblems":{"${key}":{}}}`).ok).toBe(false);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it('does not mutate the object supplied to normalization', () => {
    const original = valid(); const snapshot = JSON.stringify(original); normalizeAppData(original); expect(JSON.stringify(original)).toBe(snapshot);
  });
  it('rejects a malformed saved timestamp', () => expect(parse({ ...valid(), savedAt: 'not a date' }).ok).toBe(false));
});

describe('Browser persistence failures', () => {
  it('loads old stored data without writing it', () => {
    const setItem = vi.fn(); vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(valid()), setItem });
    const loaded = readStorageSnapshot(); expect(loaded.blocked).toBe(false); expect(loaded.error).toBeNull(); expect(loaded.data.courses.kmp.notes).toContain('保留'); expect(setItem).not.toHaveBeenCalled();
  });
  it('keeps corrupt stored data untouched and exposes a blocking error', () => {
    const setItem = vi.fn(); vi.stubGlobal('localStorage', { getItem: () => '{broken', setItem });
    const loaded = readStorageSnapshot(); expect(loaded.blocked).toBe(true); expect(loaded.error).toContain('原数据未覆盖'); expect(setItem).not.toHaveBeenCalled();
  });
  it('exposes a storage read denial without crashing', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('SecurityError'); } });
    expect(readStorageSnapshot().error).toContain('无法读取'); expect(loadAppData().courses).toEqual({});
  });
  it('starts clean only when the key is absent', () => {
    vi.stubGlobal('localStorage', { getItem: () => null }); expect(readStorageSnapshot().blocked).toBe(false); expect(loadAppData().externalProblems).toEqual({});
  });
  it('returns actionable quota error and preserves in-memory input', () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('QuotaExceededError'); } });
    const data = normalizeAppData(valid()); expect(persistAppData(data)).toContain('导出备份'); expect(data.courses.kmp.experiments).toBe(2);
  });
  it('persists the entire normalized state including external problems', () => {
    const setItem = vi.fn(); vi.stubGlobal('localStorage', { setItem }); const data = emptyAppData(); data.externalProblems = { 'uuid-1': { status: 'todo', notes: '下一题', updatedAt: data.savedAt } };
    expect(persistAppData(data)).toBeNull(); expect(setItem).toHaveBeenCalledWith('algo-expedition-v1', JSON.stringify(data));
  });
});
