/**
 * 标准课程规格注册表：合并四部分规格。App 通过 buildStandardSpec(id) 取用。
 */
import { CourseSpec } from './CoursePage';
import { SPECS_PART1 } from './standardSpecs1';
import { SPECS_PART2 } from './standardSpecs2';
import { SPECS_PART3 } from './standardSpecs3';
import { SPECS_PART4 } from './standardSpecs4';

const ALL: Record<string, CourseSpec> = { ...SPECS_PART1, ...SPECS_PART2, ...SPECS_PART3, ...SPECS_PART4 };

export function buildStandardSpec(id: string): CourseSpec | undefined {
  return ALL[id];
}
