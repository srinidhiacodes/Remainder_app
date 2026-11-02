// Calendar export: the phone's calendar sends the notifications.
// - Google Calendar: a link that opens a pre-filled event (Android, and iPhone with Google Calendar).
// - Apple Calendar (and others): an .ics file with alerts built in.
import { ruleOf, titleFor } from './store.js';
import { first, between, days } from './schedule.js';
import { pad, ymd, at, parseYmd, addDays } from './dates.js';

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

function monthDayPart(day) {
  if (day <= 28) return `BYMONTHDAY=${day}`;
  const list = [];
  for (let i = 28; i <= day; i++) list.push(i);
  return `BYMONTHDAY=${list.join(',')};BYSETPOS=-1`; // = that day, or the month's last day
}

export function rrule(rule) {
  const n = Math.max(1, Number(rule.every) || 1);
  const start = parseYmd(rule.start);
  let r;
  switch (rule.repeat) {
    case 'once': return '';
    case 'daily': r = 'FREQ=DAILY'; break;
    case 'weekdays': r = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'; break;
    case 'weekly': r = `FREQ=WEEKLY;BYDAY=${(rule.weekdays && rule.weekdays.length ? rule.weekdays : [start.getDay()]).map((d) => BYDAY[d]).join(',')}`; break;
    case 'monthly': r = `FREQ=MONTHLY${n > 1 ? `;INTERVAL=${n}` : ''};${monthDayPart(rule.monthDay || start.getDate())}`; break;
    case 'yearly': r = `FREQ=YEARLY;BYMONTH=${start.getMonth() + 1};${start.getMonth() === 1 && start.getDate() === 29 ? 'BYMONTHDAY=28,29;BYSETPOS=-1' : `BYMONTHDAY=${start.getDate()}`}`; break;
    case 'every':
      if (rule.unit === 'week') r = `FREQ=WEEKLY;INTERVAL=${n}`;
      else if (rule.unit === 'month') r = `FREQ=MONTHLY;INTERVAL=${n};${monthDayPart(start.getDate())}`;
      else r = `FREQ=DAILY;INTERVAL=${n}`;
      break;
    default: return '';
  }
  if (rule.endType === 'date' && rule.endDate) r += `;UNTIL=${rule.endDate.replace(/-/g, '')}T235959`;
  if (rule.endType === 'count' && rule.count) r += `;COUNT=${rule.count}`;
  return r;
}

const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
}

function alarms(r) {
  const lines = ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(r.title)}`, 'TRIGGER:PT0M', 'END:VALARM'];
  if (r.headsUpMins > 0) {
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc('Coming up: ' + r.title)}`, `TRIGGER:-PT${r.headsUpMins}M`, 'END:VALARM');
  }
  return lines;
}

// One calendar "series" per time of day (or one event per set for Invisalign).
export function events(r) {
  const rule = ruleOf(r);
  const note = 'Added from Remainder App';
  if (r.kind === 'invisalign') {
    return between(rule, parseYmd(rule.start), addDays(parseYmd(rule.start), 3650)).map((o) => ({
      title: `${r.title}: ${titleFor(r, o)}`, start: o.at, rrule: '', note, uidPart: o.key,
    }));
  }
  return (rule.times || ['09:00']).map((t) => {
    const f = first({ ...rule, times: [t] });
    return f ? { title: r.title, start: f.at, rrule: rrule(rule), note, uidPart: t } : null;
  }).filter(Boolean);
}

export function ics(r) {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Remainder App//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of events(r)) {
    const end = new Date(e.start.getTime() + 15 * 60000);
    lines.push('BEGIN:VEVENT', `UID:${r.id}-${e.uidPart.replace(/[^0-9A-Za-z]/g, '')}@remainder-app`, `DTSTAMP:${dtstamp}`,
      `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.note)}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push(...alarms(r), 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadIcs(r) {
  const blob = new Blob([ics(r)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(r.title || 'reminder').replace(/[^\w -]+/g, '').trim() || 'reminder'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Google Calendar links. Invisalign becomes one repeating "switch to the next set" series here,
// because a link can only add one event at a time.
export function googleLinks(r) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const rule = ruleOf(r);
  const list = r.kind === 'invisalign'
    ? (() => { const f = first(rule); return f ? [{ title: `${r.title}: switch to the next set`, start: f.at, rrule: rrule(rule), label: 'every set change' }] : []; })()
    : events(r).map((e) => ({ ...e, label: e.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }));
  return list.map((e) => {
    const end = new Date(e.start.getTime() + 15 * 60000);
    const details = r.headsUpMins > 0
      ? `Added from Remainder App. Tip: add a notification ${humanMins(r.headsUpMins)} before in Google Calendar.`
      : 'Added from Remainder App.';
    const p = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${stamp(e.start)}/${stamp(end)}`, details });
    if (tz) p.set('ctz', tz);
    if (e.rrule) p.set('recur', `RRULE:${e.rrule}`);
    return { url: `https://calendar.google.com/calendar/render?${p.toString()}`, label: e.label };
  });
}

export function humanMins(m) {
  if (m % 1440 === 0) { const d = m / 1440; return `${d} day${d > 1 ? 's' : ''}`; }
  if (m % 60 === 0) { const h = m / 60; return `${h} hour${h > 1 ? 's' : ''}`; }
  return `${m} minutes`;
}

export { days, ymd, at };
