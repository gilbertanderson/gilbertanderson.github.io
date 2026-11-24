import { describe, expect, it } from 'vitest';
import type { Role } from '../client/siteApi';
import { layout } from './Timeline';

const role = (company: string, period: string): Role => ({ company, period, title: 'Engineer' });

describe('timeline layout', () => {
  it('puts overlapping roles on separate lanes and reuses free lanes', () => {
    const now = new Date(2026, 10, 1);
    const { spans, lanes } = layout(
      [role('A', 'Jan 2020 – Present'), role('B', 'Mar 2021 – Jun 2021'), role('C', 'Jul 2021 – Dec 2021'), role('D', 'Bad period')],
      now,
    );
    expect(lanes).toBe(2);
    expect(spans.map((s) => [s.role.company, s.lane])).toEqual([['A', 0], ['B', 1], ['C', 1]]);
    expect(spans[0].end).toBe(2026 * 12 + 10 + 1);
  });
});
