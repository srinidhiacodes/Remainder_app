// Schedule engine: turns a repeat rule into concrete reminder times.
//
// rule = {
//   start: 'YYYY-MM-DD',          first possible day
//   times: ['09:00', ...],        one or more times per day
//   repeat: 'once' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'every',
//   every: 3, unit: 'day' | 'week' | 'month',   (repeat 'every', also 'monthly' interval)
//   weekdays: [1, 3],              (repeat 'weekly', 0 = Sunday)
//   monthDay: 31,                  (repeat 'monthly'; clamps to the month's last day)
//   endType: 'never' | 'date' | 'count', endDate: 'YYYY-MM-DD', count: 17
// }
import { parseYmd, ymd, addDays, daysBetween, daysInMonth, at } from './dates.js';

const MAX_DAYS = 366 * 6;

const monthsBetween = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
const clampDay = (d, want) => Math.min(want, daysInMonth(d.getFullYear(), d.getMonth()));

export function matchesDay(rule, start, d) {
  const diff = daysBetween(start, d);
  if (diff < 0) return false;
  const n = Math.max(1, Number(rule.every) || 1);
  switch (rule.repeat) {
    case 'once': return diff === 0;
    case 'daily': return true;
    case 'weekdays': return d.getDay() >= 1 && d.getDay() <= 5;
    case 'weekly': {
      const days = rule.weekdays && rule.weekdays.length ? rule.weekdays : [start.getDay()];
      return days.includes(d.getDay());
    }
    case 'monthly': {
      const want = rule.monthDay || start.getDate();
      const md = monthsBetween(start, d);
      // The first month only counts if the due day is on/after the start day.
      return md % n === 0 && d.getDate() === clampDay(d, want);
    }
    case 'yearly':
      return d.getMonth() === start.getMonth() && d.getDate() === clampDay(d, start.getDate());
    case 'every':
      if (rule.unit === 'week') return diff % (7 * n) === 0;
      if (rule.unit === 'month') {
        const md = monthsBetween(start, d);
        return md % n === 0 && d.getDate() === clampDay(d, start.getDate());
      }
      return diff % n === 0;
    default: return diff === 0;
  }
}

// Yields matching days (Date at midnight) from the start, in order, until `until`.
export function* days(rule, until) {
  const start = parseYmd(rule.start);
  const end = rule.endType === 'date' && rule.endDate ? parseYmd(rule.endDate) : null;
  const max = rule.endType === 'count' ? Math.max(0, Number(rule.count) || 0) : Infinity;
  let found = 0;
  for (let i = 0, d = start; i < MAX_DAYS; i++, d = addDays(start, i)) {
    if (until && d > until) return;
    if (end && d > end) return;
    if (found >= max) return;
    if (matchesDay(rule, start, d)) {
      yield { day: d, index: found };
      found++;
    }
  }
}

export const keyOf = (date, time) => `${ymd(date)}T${time}`;
export const dateOfKey = (key) => at(key.slice(0, 10), key.slice(11));

function sortedTimes(rule) {
  return [...(rule.times && rule.times.length ? rule.times : ['09:00'])].sort();
}

// All reminder moments between `from` and `to` (inclusive), sorted.
export function between(rule, from, to) {
  const out = [];
  const times = sortedTimes(rule);
  const dayFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (const { day, index } of days(rule, to)) {
    if (day < dayFrom) continue;
    for (const t of times) {
      const when = at(ymd(day), t);
      if (when >= from && when <= to) out.push({ at: when, key: keyOf(day, t), index });
    }
  }
  return out;
}

// The next `n` moments strictly after `after`.
export function next(rule, after = new Date(), n = 1) {
  const out = [];
  const times = sortedTimes(rule);
  for (const { day, index } of days(rule, null)) {
    if (day < addDays(after, -1)) continue;
    for (const t of times) {
      const when = at(ymd(day), t);
      if (when > after) {
        out.push({ at: when, key: keyOf(day, t), index });
        if (out.length >= n) return out;
      }
    }
  }
  return out;
}

export function first(rule) {
  const it = days(rule, null).next();
  if (it.done) return null;
  const t = sortedTimes(rule)[0];
  return { at: at(ymd(it.value.day), t), key: keyOf(it.value.day, t), index: 0 };
}

// How many matching days exist in total (Infinity if it never ends).
export function totalDays(rule) {
  if (rule.repeat === 'once') return 1;
  if (rule.endType === 'never' || !rule.endType) return Infinity;
  let c = 0;
  for (const _ of days(rule, null)) c++; // eslint-disable-line no-unused-vars
  return c;
}

export function lastDay(rule) {
  if (totalDays(rule) === Infinity) return null;
  let last = null;
  for (const { day } of days(rule, null)) last = day;
  return last;
}

// Plain-English summary, e.g. "Every 3 days at 7:00 AM".
import { fmtTimeStr, ordinal, DAYS, MONTHS, fmtDate } from './dates.js';
export function describe(rule) {
  const times = sortedTimes(rule).map(fmtTimeStr).join(' & ');
  const start = parseYmd(rule.start);
  const n = Math.max(1, Number(rule.every) || 1);
  let s;
  switch (rule.repeat) {
    case 'once': s = `Once on ${fmtDate(start)}`; break;
    case 'daily': s = 'Every day'; break;
    case 'weekdays': s = 'Every weekday'; break;
    case 'weekly': s = `Every ${(rule.weekdays && rule.weekdays.length ? rule.weekdays : [start.getDay()]).slice().sort().map((d) => DAYS[d]).join(', ')}`; break;
    case 'monthly': {
      const md = rule.monthDay || start.getDate();
      s = `${n > 1 ? `Every ${n} months` : 'Every month'} on the ${md >= 29 ? `${ordinal(md)} (or last day)` : ordinal(md)}`;
      break;
    }
    case 'yearly': s = `Every year on ${start.getDate()} ${MONTHS[start.getMonth()]}`; break;
    case 'every': s = `Every ${n} ${rule.unit || 'day'}${n > 1 ? 's' : ''}`; break;
    default: s = '';
  }
  return `${s} at ${times}`;
}
