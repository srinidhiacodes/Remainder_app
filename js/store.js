// App state, saved in this phone's browser storage (localStorage).
import { between, next, first, totalDays, lastDay, dateOfKey, keyOf } from './schedule.js';
import { ymd, today, addDays, parseYmd, at, daysBetween, startOfWeek } from './dates.js';

const KEY = 'remainder-app-v1';

export const DEFAULT_CATEGORIES = [
  { id: 'food', name: 'Food', look: { type: 'char', key: 'bowl', color: 'sunshine' } },
  { id: 'bills', name: 'Bills', look: { type: 'char', key: 'card', color: 'peach' } },
  { id: 'travel', name: 'Travel', look: { type: 'char', key: 'car', color: 'sky' } },
  { id: 'shopping', name: 'Shopping', look: { type: 'char', key: 'bag', color: 'rose' } },
  { id: 'health', name: 'Health', look: { type: 'char', key: 'pill', color: 'mint' } },
  { id: 'other', name: 'Other', look: { type: 'char', key: 'star', color: 'lavender' } },
];

export const KIND_DEFAULTS = {
  invisalign: { title: 'Invisalign', look: { type: 'char', key: 'tooth', color: 'lavender' } },
  medicine: { title: '', look: { type: 'char', key: 'pill', color: 'mint' } },
  bill: { title: '', look: { type: 'char', key: 'card', color: 'peach' } },
  custom: { title: '', look: { type: 'char', key: 'bell', color: 'sky' } },
};

function fresh() {
  return {
    version: 1,
    onboarded: false,
    name: '',
    settings: { defaultTime: '09:00', billHeadsUpDays: 3, budget: 30000, currency: '₹' },
    reminders: [],
    expenses: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, look: { ...c.look } })),
  };
}

export let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* storage blocked or corrupt: start fresh */ }
  return fresh();
}
function migrate(s) {
  const base = fresh();
  return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) }, categories: s.categories && s.categories.length ? s.categories : base.categories };
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}
export function replaceState(next) {
  state = migrate(next);
  save();
}
export function resetAll() {
  state = fresh();
  save();
}

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const getReminder = (id) => state.reminders.find((r) => r.id === id);

// ---------- Reminder rules ----------

// Invisalign stores "started set N on date D, change every X days, T sets in total".
// Its schedule is derived: the first change is D + X, and there is one change per remaining set.
export function ruleOf(r) {
  if (r.kind === 'invisalign') {
    const a = r.invisalign;
    const startD = addDays(parseYmd(a.startedOn), a.every);
    return {
      start: ymd(startD), times: r.schedule.times, repeat: 'every', every: a.every, unit: 'day',
      endType: 'count', count: Math.max(0, a.totalSets - a.startSet),
    };
  }
  return r.schedule;
}

export function invisalignInfo(r, now = new Date()) {
  const a = r.invisalign;
  const rule = ruleOf(r);
  const passed = between(rule, parseYmd(a.startedOn), now).length;
  const current = Math.min(a.totalSets, a.startSet + passed);
  const nx = next(rule, now, 1)[0] || null;
  const end = lastDay(rule);
  return {
    current, total: a.totalSets, next: nx, nextSet: nx ? a.startSet + nx.index + 1 : null,
    finish: end ? at(ymd(end), rule.times[0]) : parseYmd(a.startedOn),
    done: current >= a.totalSets && !nx,
    progress: Math.max(0, Math.min(1, (current - 1) / Math.max(1, a.totalSets - 1))),
  };
}

export function titleFor(r, occ) {
  if (r.kind === 'invisalign' && occ) return `Switch to set ${r.invisalign.startSet + occ.index + 1} of ${r.invisalign.totalSets}`;
  return r.title;
}

// ---------- Status: what's due, overdue, snoozed ----------

// Reminders count from the start of the day they were created on, so a 9 AM dose
// added at 11 AM still shows up as today's dose.
const createdAt = (r) => { const d = new Date(r.createdAt || 0); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };

// Moments that already happened and still need an answer (not done / skipped).
export function pending(r, now = new Date()) {
  const from = new Date(Math.max(createdAt(r), addDays(now, -3)));
  const occ = between(ruleOf(r), from, now).filter((o) => !r.log[o.key]);
  return occ;
}

export function status(r, now = new Date()) {
  const open = pending(r, now);
  // Only the most recent missed moment matters for daily things.
  const due = open.length ? open[open.length - 1] : null;
  const snoozed = due && r.snooze && r.snooze.key === due.key && new Date(r.snooze.until) > now ? new Date(r.snooze.until) : null;
  const upcoming = next(ruleOf(r), now, 1)[0] || null;
  return { due, missed: Math.max(0, open.length - 1), snoozed, upcoming };
}

// Everything to show in "Today": today's moments for every reminder, plus older ones still open.
export function todayItems(now = new Date()) {
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDay = addDays(startDay, 1);
  const items = [];
  for (const r of state.reminders) {
    const rule = ruleOf(r);
    const seen = new Set();
    for (const o of pending(r, now)) {
      if (o.at < startDay) { items.push({ r, o, state: 'overdue' }); seen.add(o.key); }
    }
    for (const o of between(rule, startDay, new Date(endDay - 1))) {
      if (seen.has(o.key)) continue;
      const answer = r.log[o.key];
      const snoozed = r.snooze && r.snooze.key === o.key && new Date(r.snooze.until) > now;
      let st = answer || (o.at <= now ? (snoozed ? 'snoozed' : 'overdue') : 'later');
      items.push({ r, o, state: st });
    }
  }
  const rank = { overdue: 0, snoozed: 1, later: 2, done: 3, skipped: 3 };
  return items.sort((a, b) => rank[a.state] - rank[b.state] || a.o.at - b.o.at);
}

// Next future moment per reminder, after today.
export function comingUp(now = new Date()) {
  const tomorrow = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  return state.reminders
    .map((r) => ({ r, o: next(ruleOf(r), new Date(tomorrow - 1), 1)[0] }))
    .filter((x) => x.o)
    .sort((a, b) => a.o.at - b.o.at);
}

export function daysWithReminders(from, to) {
  const set = new Set();
  for (const r of state.reminders) for (const o of between(ruleOf(r), from, to)) set.add(ymd(o.at));
  return set;
}

// ---------- Actions ----------

export function markDone(r, key, how = 'done') {
  r.log[key] = how;
  if (r.snooze && r.snooze.key === key) r.snooze = null;
  if (how === 'done' && r.kind === 'medicine' && typeof r.medicine?.stock === 'number') {
    r.medicine.stock = Math.max(0, r.medicine.stock - 1);
  }
  let expense = null;
  if (how === 'done' && r.kind === 'bill' && r.bill?.amount > 0 && r.bill.logExpense !== false) {
    expense = addExpense({ amount: r.bill.amount, category: 'bills', note: r.title, date: today(), method: 'Card', reminderId: r.id, kind: 'expense' });
  }
  save();
  return { expense };
}
export function undo(r, key) {
  const was = r.log[key];
  delete r.log[key];
  if (was === 'done' && r.kind === 'medicine' && typeof r.medicine?.stock === 'number') r.medicine.stock += 1;
  if (was === 'done' && r.kind === 'bill') {
    const i = state.expenses.findIndex((e) => e.reminderId === r.id && e.date === today());
    if (i >= 0) state.expenses.splice(i, 1);
  }
  save();
}
export function snooze(r, key, until) {
  r.snooze = { key, until: until.toISOString() };
  save();
}

export function upsertReminder(r) {
  const i = state.reminders.findIndex((x) => x.id === r.id);
  if (i >= 0) {
    r.calendarStale = true;
    state.reminders[i] = r;
  } else {
    r.createdAt = new Date().toISOString();
    state.reminders.push(r);
  }
  save();
}
export function deleteReminder(id) {
  state.reminders = state.reminders.filter((r) => r.id !== id);
  save();
}

export function newReminder(kind) {
  const d = KIND_DEFAULTS[kind] || KIND_DEFAULTS.custom;
  const t = today();
  const base = {
    id: uid(), kind, title: d.title, look: { ...d.look }, log: {}, snooze: null,
    headsUpMins: 0, schedule: { start: t, times: [state.settings.defaultTime], repeat: 'daily', every: 1, unit: 'day', weekdays: [], endType: 'never', endDate: '', count: 10 },
  };
  if (kind === 'invisalign') {
    base.invisalign = { startedOn: t, startSet: 1, totalSets: 20, every: 14 };
    base.schedule.times = ['21:00'];
  }
  if (kind === 'medicine') base.medicine = { stock: null };
  if (kind === 'bill') {
    base.bill = { amount: null, logExpense: true };
    base.schedule.repeat = 'monthly';
    base.schedule.monthDay = new Date().getDate();
    base.schedule.times = ['10:00'];
    base.headsUpMins = state.settings.billHeadsUpDays * 1440;
  }
  if (kind === 'custom') base.schedule.repeat = 'every';
  return base;
}

// Invisalign: "I switched to set N today" rebases the schedule so future dates move.
export function switchedSet(r, setNumber) {
  r.invisalign.startSet = setNumber;
  r.invisalign.startedOn = today();
  r.log = {};
  r.snooze = null;
  r.calendarStale = true;
  save();
}

// ---------- Medicine stats ----------

export function medicineWeek(now = new Date()) {
  const meds = state.reminders.filter((r) => r.kind === 'medicine');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -i);
    const end = new Date(addDays(d, 1) - 1);
    let expected = 0; let taken = 0;
    for (const r of meds) {
      for (const o of between(r.schedule, new Date(Math.max(d, createdAt(r))), end)) {
        expected++;
        if (r.log[o.key] === 'done') taken++;
      }
    }
    days.push({ d, expected, taken, isToday: i === 0 });
  }
  return days;
}
export function medicineStreak(now = new Date()) {
  const meds = state.reminders.filter((r) => r.kind === 'medicine');
  if (!meds.length) return 0;
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -i);
    const end = i === 0 ? now : new Date(addDays(d, 1) - 1);
    let expected = 0; let taken = 0;
    for (const r of meds) {
      for (const o of between(r.schedule, new Date(Math.max(d, createdAt(r))), end)) {
        expected++;
        if (r.log[o.key] === 'done') taken++;
      }
    }
    if (i === 0 && taken < expected) continue; // today still in progress
    if (expected === 0) { if (i === 0) continue; break; }
    if (taken < expected) break;
    streak++;
  }
  return streak;
}
// Days of medicine left, and the day it runs out.
export function stockInfo(r, now = new Date()) {
  const stock = r.medicine?.stock;
  if (typeof stock !== 'number') return null;
  const upcoming = next(r.schedule, now, Math.max(stock, 0) + 1);
  const runsOut = upcoming[stock] ? upcoming[stock].at : null; // first dose you can't take
  const lastDose = stock > 0 && upcoming[stock - 1] ? upcoming[stock - 1].at : now;
  return { stock, runsOut, lastDose, low: stock <= Math.max(5, (r.schedule.times?.length || 1) * 5) };
}

// ---------- Money ----------

export function addExpense(e) {
  const item = { id: uid(), amount: Number(e.amount) || 0, category: e.category || 'other', note: e.note || '', date: e.date || today(), method: e.method || 'UPI', kind: e.kind || 'expense', reminderId: e.reminderId || null };
  state.expenses.push(item);
  save();
  return item;
}
export function updateExpense(e) {
  const i = state.expenses.findIndex((x) => x.id === e.id);
  if (i >= 0) state.expenses[i] = e;
  save();
}
export function deleteExpense(id) {
  state.expenses = state.expenses.filter((e) => e.id !== id);
  save();
}
export const categoryOf = (id) => state.categories.find((c) => c.id === id) || state.categories.find((c) => c.id === 'other') || DEFAULT_CATEGORIES[5];

export function monthExpenses(y, m) {
  const p = `${y}-${String(m + 1).padStart(2, '0')}`;
  return state.expenses.filter((e) => e.date.startsWith(p));
}
export function monthSummary(y, m) {
  const list = monthExpenses(y, m);
  const spent = list.filter((e) => e.kind !== 'income').reduce((s, e) => s + e.amount, 0);
  const income = list.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0);
  const byCat = {};
  for (const e of list) if (e.kind !== 'income') byCat[e.category] = (byCat[e.category] || 0) + e.amount;
  return { list, spent, income, byCat };
}

// Bills due in a month (from bill reminders), with paid state.
export function billsInMonth(y, m) {
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0, 23, 59);
  const out = [];
  for (const r of state.reminders.filter((x) => x.kind === 'bill')) {
    for (const o of between(r.schedule, from, to)) out.push({ r, o, paid: r.log[o.key] === 'done' });
  }
  return out.sort((a, b) => a.o.at - b.o.at);
}

export { between, next, first, totalDays, lastDay, dateOfKey, keyOf, daysBetween, startOfWeek };
