import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Role } from '../client/siteApi';
import { mono } from '../theme';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Months since year 0 for "Jul 2023"; "Present" means the current month. */
function toMonth(text: string, now: Date): number | null {
  const t = text.trim().toLowerCase();
  if (t === 'present') return now.getFullYear() * 12 + now.getMonth();
  const m = /^([a-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(t);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1]);
  return month < 0 ? null : Number(m[2]) * 12 + month;
}

export type Span = { index: number; role: Role; start: number; end: number; lane: number };

/** Parse each role's period and pack overlapping roles into separate lanes. */
export function layout(roles: Role[], now = new Date()): { spans: Span[]; lanes: number } {
  const parsed = roles
    .map((role, index) => {
      const [a, b] = role.period.split(/\s+[–-]\s+/);
      const start = a ? toMonth(a, now) : null;
      const end = b ? toMonth(b, now) : start;
      return start === null || end === null ? null : { index, role, start, end: end + 1, lane: 0 };
    })
    .filter((s): s is Span => s !== null)
    .sort((x, y) => x.start - y.start || y.end - x.end);
  const laneEnds: number[] = [];
  for (const s of parsed) {
    let lane = laneEnds.findIndex((e) => e <= s.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = s.end;
    s.lane = lane;
  }
  return { spans: parsed, lanes: laneEnds.length };
}

/** "Defense Information Systems Agency (DISA)" -> "DISA"; otherwise the name before any comma or parenthesis. */
function shortName(company: string): string {
  const acronym = /\(([A-Z][A-Z0-9 ]{1,7})\)\s*$/.exec(company)?.[1];
  return acronym ?? company.split(/,|\(/)[0].trim();
}

function titleOf(role: Role): string {
  return role.positions?.length ? role.positions.map((p) => p.title).join(' · ') : role.title ?? '';
}

const LANE = 34;
const AXIS = 28;

/** A swimlane chart of every role, one bar per company, overlaps on their own lanes. */
export default function Timeline({ roles, onSelect }: { roles: Role[]; onSelect: (index: number) => void }) {
  const { spans, lanes } = layout(roles);
  const scroller = useRef<HTMLDivElement>(null);
  // On narrow screens start at the most recent years; earlier ones are a swipe away.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);
  if (!spans.length) return null;
  const min = Math.min(...spans.map((s) => s.start));
  const max = Math.max(...spans.map((s) => s.end));
  const first = Math.floor(min / 12);
  const last = Math.ceil(max / 12);
  const from = first * 12;
  const total = last * 12 - from;
  const pct = (m: number) => `${((m - from) / total) * 100}%`;
  const years = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  return (
    <Box component="figure" sx={{ m: 0, mb: 6 }}>
      <Typography component="figcaption" sx={{ fontFamily: mono, fontSize: 13, color: 'text.secondary', mb: 1.5 }}>
        Career timeline, {first} to today. Overlapping roles sit on their own rows; select one to jump to it.
        <Box component="span" sx={{ display: { md: 'none' } }}> Swipe for earlier years.</Box>
      </Typography>
      <Box ref={scroller} sx={{ overflowX: 'auto', pb: 1 }}>
        <Box sx={{ position: 'relative', minWidth: 880, height: lanes * LANE + AXIS }}>
          {years.map((y) => (
            <Box key={y} aria-hidden="true" sx={{ position: 'absolute', top: 0, bottom: 0, left: pct(y * 12), borderLeft: 1, borderColor: 'divider' }}>
              {y < last ? (
                <Typography sx={{ position: 'absolute', bottom: 0, left: 4, fontFamily: mono, fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {y}
                </Typography>
              ) : null}
            </Box>
          ))}
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {spans.map((s) => {
              const label = `${s.role.company}, ${titleOf(s.role)}, ${s.role.period}`;
              const months = s.end - s.start;
              return (
                <Box component="li" key={`${s.role.company}-${s.role.period}`} sx={{ position: 'absolute', top: s.lane * LANE + 4, left: pct(s.start), width: pct(from + months), height: LANE - 8 }}>
                  <Tooltip
                    arrow
                    title={
                      <>
                        <strong>{s.role.company}</strong>
                        <br />
                        {titleOf(s.role)}
                        <br />
                        {s.role.period}
                      </>
                    }
                  >
                    <ButtonBase
                      aria-label={label}
                      onClick={() => onSelect(s.index)}
                      sx={{
                        width: 1,
                        height: 1,
                        minWidth: 8,
                        justifyContent: 'flex-start',
                        gap: 0.75,
                        px: months >= 10 ? 0.5 : 0,
                        borderRadius: '4px',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        overflow: 'hidden',
                        outline: '2px solid',
                        outlineColor: 'background.default',
                        transition: 'filter 120ms',
                        '&:hover, &.Mui-focusVisible': { filter: 'brightness(1.15)' },
                        '&.Mui-focusVisible': { outlineColor: 'text.primary' },
                      }}
                    >
                      {s.role.logo && months >= 10 ? (
                        <Box component="img" src={s.role.logo} alt="" loading="lazy" sx={{ flex: '0 0 auto', width: 20, height: 20, borderRadius: '3px', bgcolor: '#FFFFFF', objectFit: 'contain', p: '1px', boxSizing: 'border-box' }} />
                      ) : null}
                      {months >= 16 ? (
                        <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {shortName(s.role.company)}
                        </Typography>
                      ) : null}
                    </ButtonBase>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
