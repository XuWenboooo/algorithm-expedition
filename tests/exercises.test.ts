/**
 * 练习答案归一化行为（改进闭环 #13）：宽松匹配是设计决策，测试固定它。
 */
import { describe, it, expect } from 'vitest';
import { normalizeAnswer } from '../src/courses/demoKit';

describe('练习答案归一化', () => {
  it('去空白：允许 "0, 0, 1, 2, 0" 与 "0,0,1,2,0" 等价', () => {
    expect(normalizeAnswer('0, 0, 1, 2, 0')).toBe(normalizeAnswer('0,0,1,2,0'));
  });
  it('中文逗号与英文逗号等价', () => {
    expect(normalizeAnswer('0，0，1')).toBe(normalizeAnswer('0,0,1'));
  });
  it('大小写不敏感（有意宽松：i<=N 与 i<=n 等价）', () => {
    expect(normalizeAnswer('i<=N')).toBe(normalizeAnswer('i<=n'));
    expect(normalizeAnswer('X.First>Y.First')).toBe(normalizeAnswer('x.first>y.first'));
  });
  it('不做语义解释：不同数值仍然不同', () => {
    expect(normalizeAnswer('1,2')).not.toBe(normalizeAnswer('2,1'));
    expect(normalizeAnswer('10')).not.toBe(normalizeAnswer('100'));
  });
});
