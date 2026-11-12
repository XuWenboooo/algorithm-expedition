import { emptyCourseProgress, normalizeAppData, validateImported } from './validation';
export { validateImported } from './validation';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * 学习进度存储（localStorage，本地优先）。
 * 设计原则：阅读/理解/实现/应用/迁移五个维度【由学习者自主勾选】，
 * 不以点击页面判定掌握；练习结果自动记录但单独展示。
 * 支持 JSON 导出/导入与备份提示。
 */

export const DIMENSIONS = [
  { key: 'read', label: '阅读', desc: '通读了全部章节（目标/引例/推导/代码）' },
  { key: 'understand', label: '理解', desc: '能独立复述关键不变量与适用条件' },
  { key: 'implement', label: '实现', desc: '不看参考代码手写实现并通过手动验证' },
  { key: 'apply', label: '应用', desc: '完成引导+独立练习，能解释每一步' },
  { key: 'transfer', label: '迁移', desc: '完成迁移练习 / 能在变体问题中识别该模型' },
] as const;

export type DimKey = (typeof DIMENSIONS)[number]['key'];

export interface ExerciseRecord {
  solved: boolean;
  wrongFirst: boolean;
  attempts: number;
  /** 练习标题（用于复习页展示，来自首次记录） */
  title?: string;
}

export interface MistakeEntry {
  date: string;
  courseId: string;
  text: string;
}

export interface CourseProgress {
  dims: Record<DimKey, boolean>;
  exercises: Record<string, ExerciseRecord>;
  notes: string;
  mistakes: MistakeEntry[];
  experiments: number; // 自主修改输入并完整观看的次数（仅作参考记录）
}

export type ExternalProblemStatus = 'todo' | 'attempted' | 'solved';
export interface ExternalProblemRecord { status: ExternalProblemStatus; notes: string; updatedAt: string; }

export interface AppData {
  version: 1;
  savedAt: string;
  courses: Record<string, CourseProgress>;
  externalProblems?: Record<string, ExternalProblemRecord>;
}

const STORAGE_KEY = 'algo-expedition-v1';

export function emptyAppData(): AppData {
  return { version: 1, savedAt: new Date().toISOString(), courses: {}, externalProblems: {} };
}

export interface StorageSnapshot { data: AppData; error: string | null; blocked: boolean; }
/** Preserve corrupt raw data rather than silently replacing it with an empty record. */
export function readStorageSnapshot(): StorageSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: emptyAppData(), error: null, blocked: false };
    const parsed = validateImported(raw);
    if (!parsed.ok) return { data: emptyAppData(), error: '本地记录格式损坏，原数据未覆盖。请先保留原备份，再导入有效备份或明确重置。' + parsed.error, blocked: true };
    return { data: parsed.data, error: null, blocked: false };
  } catch {
    return { data: emptyAppData(), error: '无法读取浏览器存储。当前记录仅在本次页面中，请及时导出备份。', blocked: true };
  }
}

export function loadAppData(): AppData { return readStorageSnapshot().data; }
export function persistAppData(data: AppData): string | null {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return null; }
  catch { return '保存失败，浏览器存储不可用或空间不足。当前修改仍在本页，请立即导出备份，避免刷新后丢失。'; }
}

interface ProgressContextValue {
  data: AppData;
  storageError: string | null;
  setExternalProblem: (id: string, status: ExternalProblemStatus, notes?: string) => void;
  get: (courseId: string) => CourseProgress;
  toggleDim: (courseId: string, dim: DimKey) => void;
  recordExercise: (courseId: string, exId: string, solved: boolean, wrongFirst: boolean, title?: string) => void;
  setNotes: (courseId: string, notes: string) => void;
  addMistake: (courseId: string, text: string) => void;
  removeMistake: (courseId: string, date: string, text: string) => void;
  bumpExperiment: (courseId: string) => void;
  importData: (d: AppData) => void;
  resetAll: () => void;
  exportJSON: () => string;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(readStorageSnapshot);
  const [data, setData] = useState<AppData>(initial.data);
  const [storageError, setStorageError] = useState<string | null>(initial.error);
  const [persistenceBlocked, setPersistenceBlocked] = useState(initial.blocked);

  useEffect(() => {
    if (!persistenceBlocked) setStorageError(persistAppData(data));
  }, [data, persistenceBlocked]);

  const get = useCallback((courseId: string): CourseProgress => {
    return data.courses[courseId] || emptyCourseProgress();
  }, [data]);

  const mutate = useCallback((courseId: string, fn: (p: CourseProgress) => CourseProgress) => {
    setData((old) => {
      const base = old.courses[courseId] || emptyCourseProgress();
      return { ...old, savedAt: new Date().toISOString(), courses: { ...old.courses, [courseId]: fn(base) } };
    });
  }, []);

  const value = useMemo<ProgressContextValue>(() => ({
    data,
    storageError,
    get,
    setExternalProblem: (id, status, notes) => {
      if (!id || ['__proto__', 'constructor', 'prototype'].includes(id)) return;
      setData((old) => {
        const now = new Date().toISOString();
        return { ...old, savedAt: now, externalProblems: { ...old.externalProblems, [id]: { status, notes: notes ?? old.externalProblems?.[id]?.notes ?? '', updatedAt: now } } };
      });
    },
    toggleDim: (courseId, dim) => mutate(courseId, (p) => ({ ...p, dims: { ...p.dims, [dim]: !p.dims[dim] } })),
    recordExercise: (courseId, exId, solved, wrongFirst, title) =>
      mutate(courseId, (p) => {
        const old = p.exercises[exId] || { solved: false, wrongFirst: false, attempts: 0, title };
        return {
          ...p,
          exercises: {
            ...p.exercises,
            [exId]: {
              solved: old.solved || solved,
              wrongFirst: (wrongFirst && !old.solved) || old.wrongFirst,
              attempts: old.attempts + 1,
              title: old.title || title,
            },
          },
        };
      }),
    setNotes: (courseId, notes) => mutate(courseId, (p) => ({ ...p, notes })),
    addMistake: (courseId, text) =>
      mutate(courseId, (p) => ({ ...p, mistakes: [...p.mistakes, { date: new Date().toISOString().slice(0, 10), courseId, text }] })),
    removeMistake: (courseId, date, text) =>
      mutate(courseId, (p) => ({ ...p, mistakes: p.mistakes.filter((m) => !(m.date === date && m.text === text)) })),
    bumpExperiment: (courseId) => mutate(courseId, (p) => ({ ...p, experiments: p.experiments + 1 })),
    importData: (d) => {
      // Validate even callers that did not use the file-import helper.
      const normalized = normalizeAppData(d);
      setData(normalized);
      setPersistenceBlocked(false);
    },
    resetAll: () => { setData(emptyAppData()); setPersistenceBlocked(false); },
    exportJSON: () => JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2),
  }), [data, get, mutate, storageError]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress 必须在 ProgressProvider 内使用');
  return ctx;
}

/** 下载文本为文件（备份导出） */
export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
