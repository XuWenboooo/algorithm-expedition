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

export interface AppData {
  version: 1;
  savedAt: string;
  courses: Record<string, CourseProgress>;
}

const STORAGE_KEY = 'algo-expedition-v1';

function emptyCourseProgress(): CourseProgress {
  return {
    dims: { read: false, understand: false, implement: false, apply: false, transfer: false },
    exercises: {},
    notes: '',
    mistakes: [],
    experiments: 0,
  };
}

export function emptyAppData(): AppData {
  return { version: 1, savedAt: new Date().toISOString(), courses: {} };
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAppData();
    const d = JSON.parse(raw) as AppData;
    if (d.version !== 1 || typeof d.courses !== 'object' || d.courses === null) return emptyAppData();
    // 合并缺失字段（向后兼容）
    const courses: Record<string, CourseProgress> = {};
    for (const [k, v] of Object.entries(d.courses)) {
      const base = emptyCourseProgress();
      courses[k] = {
        ...base,
        ...v,
        dims: { ...base.dims, ...(v.dims || {}) },
        exercises: v.exercises || {},
        mistakes: Array.isArray(v.mistakes) ? v.mistakes : [],
      };
    }
    return { version: 1, savedAt: d.savedAt || new Date().toISOString(), courses };
  } catch {
    return emptyAppData();
  }
}

/** 校验导入的 JSON（宽松结构校验） */
export function validateImported(text: string): { ok: true; data: AppData } | { ok: false; error: string } {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: '不是合法的 JSON 文件。' };
  }
  const d = obj as AppData;
  if (!d || typeof d !== 'object' || d.version !== 1 || typeof d.courses !== 'object' || d.courses === null) {
    return { ok: false, error: '结构不符合算法远征备份格式（需要 version:1 和 courses 字段）。' };
  }
  return { ok: true, data: d };
}

interface ProgressContextValue {
  data: AppData;
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
  const [data, setData] = useState<AppData>(() => loadAppData());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 隐私模式等场景下不可用：静默失败，导出功能仍可用
    }
  }, [data]);

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
    get,
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
    importData: (d) => setData(d),
    resetAll: () => setData(emptyAppData()),
    exportJSON: () => JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2),
  }), [data, get, mutate]);

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
