// Small local-time date helpers. All dates are the phone's local time.

export const pad = (n) => String(n).padStart(2, '0');

export function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function parseYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function at(dateStr, time) {
  const d = parseYmd(dateStr);
  const [h, mi] = (time || '09:00').split(':').map(Number);
  d.setHours(h, mi, 0, 0);
  return d;
}
export const today = () => ymd(new Date());

// Whole-day number, immune to daylight-saving shifts.
export const dayNum = (d) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
export const daysBetween = (a, b) => dayNum(b) - dayNum(a);

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
export function addMonths(d, n, wantDay = d.getDate()) {
  const y = d.getFullYear();
  const m = d.getMonth() + n;
  const target = new Date(y, m, 1, d.getHours(), d.getMinutes());
  target.setDate(Math.min(wantDay, daysInMonth(target.getFullYear(), target.getMonth())));
  return target;
}
export function startOfWeek(d) {
  // Weeks start on Monday.
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (x.getDay() + 6) % 7;
  return addDays(x, -wd);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export { DAYS, MONTHS, MONTHS_LONG };

export const fmtDay = (d) => DAYS[d.getDay()];
export const fmtMonth = (d) => MONTHS[d.getMonth()];
export const fmtMonthLong = (d) => MONTHS_LONG[d.getMonth()];
export const fmtLongToday = (d) => `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
export function fmtDate(d, withYear = d.getFullYear() !== new Date().getFullYear()) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
}
export const fmtShort = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export function fmtTime(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ap}`;
}
export const fmtTimeStr = (t) => fmtTime(at('2000-01-01', t));

export function relDay(d, now = new Date()) {
  const n = daysBetween(now, d);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n > 1 && n < 7) return fmtDay(d);
  return fmtShort(d);
}
export function inDays(d, now = new Date()) {
  const n = daysBetween(now, d);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n > 1) return `in ${n} days`;
  if (n === -1) return 'yesterday';
  return `${-n} days ago`;
}
export function ago(d, now = new Date()) {
  const mins = Math.round((now - d) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
