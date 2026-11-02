import { state, save, getReminder, newReminder, upsertReminder, deleteReminder, ruleOf, titleFor, todayItems, comingUp,
  daysWithReminders, markDone, undo, invisalignInfo, status, KIND_DEFAULTS, stockInfo } from '../store.js';
import { next, describe, totalDays, lastDay, between } from '../schedule.js';
import { SCENES, UI, color, character, CHARACTERS, CHARACTER_KEYS, ICONS, ICON_KEYS, COLOR_NAMES, icon, lookArt } from '../art.js';
import { esc, money, go, topbar, bottomNav, artTile, toast, sheet, confirmSheet, readPhoto } from '../ui.js';
import { ymd, today, parseYmd, at, addDays, startOfWeek, fmtDay, fmtDate, fmtShort, fmtTime, fmtTimeStr, fmtLongToday,
  relDay, inDays, ago, daysBetween, ordinal, MONTHS } from '../dates.js';
import { googleLinks, downloadIcs, humanMins } from '../calendar.js';
import { actionSheet } from './features.js';

const deepCopy = (o) => JSON.parse(JSON.stringify(o));

// ---------------- Welcome ----------------
export function welcome() {
  return {
    nav: false,
    html: `<div class="screen no-nav" style="padding-bottom:0">
      <div style="position:relative;height:min(470px,52dvh);background:var(--hero);border-radius:0 0 48px 48px;overflow:hidden">${SCENES.welcome}</div>
      <div class="pad stack" style="padding-top:30px;flex:1">
        <h1 class="h-xl" style="font-size:36px">Never miss the little things</h1>
        <p class="muted" style="font-size:17px">Aligners, medicines, bills, anything: gentle reminders on your phone, right on time.</p>
        <label class="field"><span>What should Sunny call you? (optional)</span><input id="name" autocomplete="given-name" value="${esc(state.name)}" placeholder="Your name"></label>
      </div>
      <div class="pad" style="padding-top:18px;padding-bottom:30px"><button class="btn" id="start">Let's start ${UI.arrow}</button></div>
    </div>`,
    mount(root) {
      root.querySelector('#start').onclick = () => {
        state.name = root.querySelector('#name').value.trim();
        state.onboarded = true;
        save();
        go('#/');
      };
    },
  };
}

// ---------------- Home ----------------
function greeting(now) {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function itemRow({ r, o, state: st }, now) {
  const c = color(r.look.color);
  const title = r.kind === 'invisalign' ? `${esc(r.title)}` : esc(r.title);
  let sub; let btn;
  const when = o.at < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? `${relDay(o.at, now)} ${fmtTime(o.at)}` : fmtTime(o.at);
  const extra = r.kind === 'invisalign' ? ` · ${esc(titleFor(r, o))}` : '';
  if (st === 'overdue') { sub = `<span class="danger" style="font-weight:500">${when} · overdue</span>${extra}`; btn = 'due'; }
  else if (st === 'snoozed') { sub = `Snoozed till ${fmtTime(new Date(r.snooze.until))}${extra}`; btn = ''; }
  else if (st === 'done') { sub = `<span class="ok" style="font-weight:500">Done</span> · ${when}`; btn = 'done'; }
  else if (st === 'skipped') { sub = `Skipped · ${when}`; btn = 'done'; }
  else { sub = `${when}${extra}`; btn = ''; }
  return `<div class="item" style="${st === 'done' || st === 'skipped' ? 'opacity:.7' : ''}">
    <a href="#/r/${r.id}" data-open="${r.id}|${o.key}|${st}" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;text-decoration:none;color:inherit">
      ${artTile(r.look, 52)}
      <span class="grow" style="display:flex;flex-direction:column;gap:2px"><span class="t">${title}</span><span class="s">${sub}</span></span>
    </a>
    <button class="check ${btn}" data-check="${r.id}|${o.key}|${st}" aria-label="${st === 'done' ? 'Undo' : 'Mark'} ${esc(r.title)} ${st === 'done' ? '' : 'done'}" style="${c && btn === '' ? '' : ''}">${UI.check(20)}</button>
  </div>`;
}

function upCard({ r, o }, now) {
  const c = color(r.look.color);
  let line = `${relDay(o.at, now)} · ${fmtTime(o.at)}`;
  let extra = '';
  if (r.kind === 'invisalign') {
    const info = invisalignInfo(r, now);
    line = `Set ${info.nextSet} ${inDays(o.at, now)}`;
    extra = `<span class="bar"><i style="width:${Math.round(info.progress * 100)}%;background:${c.bar}"></i></span>`;
  } else if (r.kind === 'bill') {
    line = `Due ${inDays(o.at, now)}`;
    extra = `<span class="badge" style="color:${c.mid};align-self:flex-start">${r.bill?.amount ? money(r.bill.amount) : fmtShort(o.at)}</span>`;
  }
  return `<a class="upcard" href="#/r/${r.id}" style="background:${c.bg};color:${c.ink}">
    ${r.look.type === 'photo' ? artTile(r.look, 48) : lookArt(r.look, 46)}
    <span style="display:flex;flex-direction:column;gap:6px"><span class="t">${esc(r.title)}</span><span class="s" style="color:${c.mid}">${line}</span>${extra}</span>
  </a>`;
}

export function home() {
  if (!state.onboarded) { go('#/welcome'); return null; }
  const now = new Date();
  if (!state.reminders.length) return emptyHome(now);

  const wk = startOfWeek(now);
  const marked = daysWithReminders(wk, new Date(addDays(wk, 7) - 1));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(wk, i);
    const isToday = ymd(d) === ymd(now);
    return `<div class="d ${isToday ? 'today' : ''}"><span class="dn">${fmtDay(d)}</span><span class="num">${d.getDate()}</span><span class="dot" style="background:${marked.has(ymd(d)) ? (isToday ? 'var(--ink)' : '#E0703A') : 'transparent'}"></span></div>`;
  }).join('');

  const items = todayItems(now);
  const open = items.filter((x) => x.state === 'overdue' || x.state === 'later' || x.state === 'snoozed').length;
  const heroLine = items.length === 0 ? 'Nothing due today' : open === 0 ? 'All done for today!' : `${open} thing${open > 1 ? 's' : ''} to do today`;
  const ups = comingUp(now).slice(0, 8);
  const offCal = state.reminders.filter((r) => !r.calendarAt || r.calendarStale);
  const kinds = new Set(state.reminders.map((r) => r.kind));
  const inv = state.reminders.find((r) => r.kind === 'invisalign');
  const shortcuts = [
    inv ? `<a class="pill" href="#/journey/${inv.id}" style="background:${color('lavender').bg};color:${color('lavender').ink}">${character('tooth', 22)} Smile journey</a>` : '',
    kinds.has('medicine') ? `<a class="pill" href="#/meds" style="background:${color('mint').bg};color:${color('mint').ink}">${character('pill', 22)} Medicines</a>` : '',
    kinds.has('bill') ? `<a class="pill" href="#/bills" style="background:${color('peach').bg};color:${color('peach').ink}">${character('card', 22)} Bills</a>` : '',
  ].filter(Boolean).join('');

  return {
    nav: 'home',
    html: `<div class="screen">
      <header class="topbar" style="padding-top:26px">
        <div style="display:flex;flex-direction:column;gap:2px"><span class="muted" style="font-size:15px">${fmtLongToday(now)}</span>
        <h1 class="h-xl">${state.name ? `Hi, ${esc(state.name)}` : 'Hi there'}</h1></div>
        <a class="round" href="#/new" aria-label="New reminder">${UI.plus}</a>
      </header>
      <div class="week" aria-label="This week">${week}</div>
      <main class="pad stack" style="padding-top:14px">
        <section class="hero" aria-label="Today summary">${SCENES.heroHills}
          <div class="txt"><span class="k">${greeting(now)}</span><span class="v">${heroLine}</span></div></section>
        ${offCal.length ? `<a class="item" href="#/r/${offCal[0].id}" style="background:var(--sun-soft);padding:12px 14px">
          <span style="color:#7A5200;display:flex">${UI.calendar}</span>
          <span class="grow small" style="color:#4A3608"><strong>${offCal.length === 1 ? `“${esc(offCal[0].title)}” isn't` : `${offCal.length} reminders aren't`} on your calendar yet.</strong> Add ${offCal.length === 1 ? 'it' : 'them'} to get notifications.</span>${UI.chevron}</a>` : ''}
        ${shortcuts ? `<div class="hscroll" style="gap:8px">${shortcuts}</div>` : ''}
        <section class="stack" style="gap:10px">
          <div class="section-title"><h2 class="h-m">Today</h2></div>
          ${items.length ? items.map((x) => itemRow(x, now)).join('') : `<div class="card muted small">Nothing due today. Enjoy your day.</div>`}
        </section>
        ${ups.length ? `<section class="stack" style="gap:10px"><h2 class="h-m">Coming up</h2><div class="hscroll">${ups.map((x) => upCard(x, now)).join('')}</div></section>` : ''}
      </main>
    </div>`,
    mount(root) {
      root.querySelectorAll('[data-check]').forEach((b) => b.addEventListener('click', () => {
        const [id, key, st] = b.dataset.check.split('|');
        const r = getReminder(id);
        if (!r) return;
        if (st === 'done' || st === 'skipped') { undo(r, key); toast('Marked as not done'); render(); return; }
        const { expense } = markDone(r, key);
        afterDone(r, key, expense);
      }));
      root.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', (e) => {
        const [id, key, st] = a.dataset.open.split('|');
        if (st === 'overdue' || st === 'snoozed') {
          e.preventDefault();
          actionSheet(getReminder(id), key);
        }
      }));
    },
  };
}

export function render() { window.dispatchEvent(new HashChangeEvent('hashchange')); }

export function afterDone(r, key, expense) {
  const left = todayItems().filter((x) => x.state === 'overdue' || x.state === 'later' || x.state === 'snoozed').length;
  const doneToday = todayItems().filter((x) => x.state === 'done').length;
  if (left === 0 && doneToday > 0) { go('#/done'); return; }
  render();
  toast(expense ? `Paid. ${money(expense.amount)} added to Money.` : `Nice! ${r.title} done.`, 'Undo', () => { undo(r, key); render(); });
}

function emptyHome(now) {
  const quick = ['invisalign', 'medicine', 'bill'].map((k) => {
    const d = KIND_DEFAULTS[k];
    const c = color(d.look.color);
    const label = { invisalign: 'Invisalign', medicine: 'Medicine', bill: 'Bill' }[k];
    return `<a href="#/new/${k}" style="min-height:104px;border-radius:24px;background:${c.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-decoration:none;color:${c.ink};font-size:15px;font-weight:600">${character(d.look.key, 44)}${label}</a>`;
  }).join('');
  return {
    nav: 'home',
    html: `<div class="screen">
      <header class="topbar" style="padding-top:26px"><div style="display:flex;flex-direction:column;gap:2px"><span class="muted" style="font-size:15px">${fmtLongToday(now)}</span>
        <h1 class="h-xl">${state.name ? `Hi, ${esc(state.name)}` : 'Hi there'}</h1></div></header>
      <main class="pad stack center" style="padding-top:8px">
        ${SCENES.sleepy}
        <h2 class="h-l" style="font-size:28px">Nothing to remember… yet!</h2>
        <p class="muted" style="max-width:300px">Sunny is napping. Add your first reminder and Sunny will make sure you get notified on time.</p>
        <div class="grid3" style="width:100%;margin-top:6px">${quick}</div>
        <a class="btn sun" href="#/new" style="margin-top:4px">${UI.plus} Something else</a>
      </main></div>`,
  };
}

// ---------------- New: pick a type ----------------
export function chooseType() {
  const types = [
    ['invisalign', 'Invisalign', 'Change sets on time'],
    ['medicine', 'Medicine', 'Daily doses'],
    ['bill', 'Bill or card', 'Every month'],
    ['custom', 'Something else', 'Any picture, any schedule'],
  ];
  return {
    nav: false,
    html: `<div class="screen no-nav">
      ${topbar({ back: '#/', title: '<span class="muted" style="font-weight:400;font-size:15px">New reminder</span>' })}
      <main class="pad stack" style="padding-top:22px;gap:22px">
        <div class="stack" style="gap:8px"><h1 class="h-xl">What should I remind you about?</h1><p class="muted">Pick one. You can change everything after.</p></div>
        <div class="typegrid">${types.map(([k, t, s]) => {
          const d = KIND_DEFAULTS[k]; const c = color(d.look.color);
          return `<a class="typecard" href="#/new/${k}" style="background:${c.bg};color:${c.ink}">${character(d.look.key, 72)}<span style="display:flex;flex-direction:column;gap:2px"><span class="t">${t}</span><span class="s" style="color:${c.mid}">${s}</span></span></a>`;
        }).join('')}</div>
      </main></div>`,
  };
}

// ---------------- Look picker ----------------
export function lookSheet(look, onPick) {
  let cur = deepCopy(look);
  let tab = cur.type === 'icon' ? 'icon' : cur.type === 'photo' ? 'photo' : 'char';
  const draw = (s, close) => {
    const c = color(cur.color);
    const grid = tab === 'char'
      ? CHARACTER_KEYS.map((k) => `<button type="button" class="${cur.type === 'char' && cur.key === k ? 'on' : ''}" data-char="${k}" aria-label="${CHARACTERS[k].label}" aria-pressed="${cur.type === 'char' && cur.key === k}">${character(k, 44)}</button>`).join('')
      : tab === 'icon'
        ? ICON_KEYS.filter((k) => k !== 'trash').map((k) => `<button type="button" class="${cur.type === 'icon' && cur.key === k ? 'on' : ''}" data-icon="${k}" aria-label="${k}" aria-pressed="${cur.type === 'icon' && cur.key === k}" style="color:${c.mid}">${icon(k, 28, 2.2)}</button>`).join('')
        : `${cur.photo ? `<button type="button" class="on" aria-label="Your photo">${lookArt({ type: 'photo', photo: cur.photo }, 60)}</button>` : ''}
           <label class="photo" style="height:74px;border-radius:20px;border:2px dashed var(--dash);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;color:var(--ink-2);cursor:pointer">${UI.camera}${cur.photo ? 'Change' : 'Choose photo'}<input type="file" accept="image/*" class="sr" data-photo></label>`;
    s.innerHTML = `<span class="grab" aria-hidden="true"></span>
      <div class="row"><span class="tile" style="width:64px;height:64px;border-radius:20px;background:${cur.type === 'photo' ? 'transparent' : c.bg}">${lookArt(cur, cur.type === 'photo' ? 64 : 50)}</span><h2 class="h-m grow">Pick a look</h2></div>
      <div class="seg" role="tablist">${[['char', 'Characters'], ['icon', 'Icons'], ['photo', 'My photo']].map(([k, l]) => `<button type="button" role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div class="lookgrid">${grid}</div>
      <div class="stack" style="gap:10px"><span class="bold">Card colour</span>
        <div class="swatches" role="radiogroup" aria-label="Card colour">${COLOR_NAMES.map((n) => `<button type="button" role="radio" aria-checked="${cur.color === n}" aria-label="${n}" class="swatch ${cur.color === n ? 'on' : ''}" data-color="${n}" style="background:${color(n).bg}"></button>`).join('')}</div></div>
      <button class="btn" data-done>Done</button>`;
    s.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; draw(s, close); });
    s.querySelectorAll('[data-char]').forEach((b) => b.onclick = () => { cur = { ...cur, type: 'char', key: b.dataset.char }; draw(s, close); });
    s.querySelectorAll('[data-icon]').forEach((b) => b.onclick = () => { cur = { ...cur, type: 'icon', key: b.dataset.icon }; draw(s, close); });
    s.querySelectorAll('[data-color]').forEach((b) => b.onclick = () => { cur = { ...cur, color: b.dataset.color }; draw(s, close); });
    const f = s.querySelector('[data-photo]');
    if (f) f.onchange = async () => {
      if (!f.files[0]) return;
      try { cur = { ...cur, type: 'photo', photo: await readPhoto(f.files[0]) }; draw(s, close); } catch (e) { toast("Couldn't read that picture"); }
    };
    s.querySelector('[data-done]').onclick = () => { close(); onPick(cur); };
  };
  sheet('', (s, close) => draw(s, close), 'Pick a look');
}

// ---------------- Editor ----------------
let draft = null;

const REPEATS = [['once', 'Once'], ['daily', 'Daily'], ['weekdays', 'Weekdays'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly'], ['every', 'Every…']];
const HEADS = [[0, 'None'], [60, '1 hour'], [1440, '1 day'], [4320, '3 days']];
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function stepper(name, value, label) {
  return `<div class="card stack" style="gap:8px"><span class="label">${label}</span><div class="stepper">
    <button type="button" data-step="${name}" data-d="-1" aria-label="Less">−</button><output>${value}</output><button type="button" data-step="${name}" data-d="1" aria-label="More">+</button></div></div>`;
}
function timesField(times) {
  return `<div class="card stack" style="gap:10px"><span class="bold" style="font-size:15px">Notify me at</span>
    <div class="chips">${times.map((t, i) => `<span class="timechip"><input type="time" value="${t}" data-time="${i}" aria-label="Time ${i + 1}">${times.length > 1 ? `<button type="button" data-deltime="${i}" aria-label="Remove time">${UI.close}</button>` : ''}</span>`).join('')}
    <button type="button" class="add-dashed" data-addtime>+ Add time</button></div></div>`;
}
function chipsField(label, name, opts, cur) {
  return `<div class="card stack" style="gap:10px"><span class="bold" style="font-size:15px">${label}</span>
    <div class="chips" role="radiogroup" aria-label="${label}">${opts.map(([v, l]) => `<button type="button" role="radio" aria-checked="${String(cur) === String(v)}" class="chip ${String(cur) === String(v) ? 'on' : ''}" data-chip="${name}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
}

function summary(r) {
  const rule = ruleOf(r);
  const upcoming = next(rule, new Date(), 3);
  if (r.kind === 'invisalign') {
    const n = totalDays(rule);
    if (!n) return 'You are on your last set. Nothing left to remind.';
    const end = lastDay(rule);
    const f = upcoming[0];
    return `<strong>${n} reminder${n > 1 ? 's' : ''}</strong>${f ? `, from ${fmtDate(f.at)} (set ${r.invisalign.startSet + f.index + 1})` : ''} to ${fmtDate(end)} (set ${r.invisalign.totalSets}).`;
  }
  if (!upcoming.length) return 'No upcoming dates. Check the start or end date.';
  const daysList = [...new Set(next(rule, new Date(), 12).map((o) => fmtShort(o.at)))].slice(0, 3);
  return `${esc(describe(rule))}. Next: ${daysList.join(', ')}.`;
}

export function editor(kind, id) {
  if (id) {
    const r = getReminder(id);
    if (!r) { go('#/'); return null; }
    if (!draft || draft.id !== id) draft = deepCopy(r);
  } else if (!draft || draft.kind !== kind || draft.__saved || getReminder(draft.id)) {
    draft = newReminder(kind);
  }
  const r = draft;
  const s = r.schedule;
  const c = color(r.look.color);
  const isNew = !getReminder(r.id);

  let body = '';
  if (r.kind === 'invisalign') {
    const a = r.invisalign;
    body = `
      <label class="field"><span>Started current set on</span><input type="date" data-f="invisalign.startedOn" value="${a.startedOn}"></label>
      <div class="grid2">${stepper('startSet', a.startSet, 'Current set')}${stepper('totalSets', a.totalSets, 'Total sets')}</div>
      ${chipsField('Change every', 'every', [[7, '7 days'], [10, '10 days'], [14, '14 days']], a.every)}
      <label class="field"><span>Notify me at</span><input type="time" data-time="0" value="${s.times[0]}"></label>`;
  } else if (r.kind === 'medicine') {
    body = `
      ${timesField(s.times)}
      ${chipsField('Which days', 'medrepeat', [['daily', 'Every day'], ['weekly', 'Some days']], s.repeat === 'weekly' ? 'weekly' : 'daily')}
      ${s.repeat === 'weekly' ? weekdayPicker(s) : ''}
      <div class="grid2"><label class="field"><span>Starting</span><input type="date" data-f="schedule.start" value="${s.start}"></label>
      <label class="field"><span>Until (optional)</span><input type="date" data-f="schedule.endDate" value="${s.endType === 'date' ? s.endDate : ''}" data-enddate></label></div>
      <label class="field"><span>Tablets left (optional, for refill alerts)</span><input type="number" inputmode="numeric" min="0" data-f="medicine.stock" value="${r.medicine?.stock ?? ''}" placeholder="e.g. 30"></label>`;
  } else if (r.kind === 'bill') {
    body = `
      <label class="field"><span>Amount (optional)</span><input type="number" inputmode="decimal" min="0" data-f="bill.amount" value="${r.bill?.amount ?? ''}" placeholder="${state.settings.currency}0"></label>
      <div class="grid2">${stepper('monthDay', s.monthDay || 1, 'Due day of month')}
      <label class="field"><span>Notify at</span><input type="time" data-time="0" value="${s.times[0]}"></label></div>
      ${chipsField('Early heads-up', 'heads', [[0, 'None'], [1440, '1 day'], [4320, '3 days'], [10080, '1 week']], r.headsUpMins)}
      <label class="card row" style="justify-content:space-between;cursor:pointer"><span>When I mark it paid, add it to Money</span>
        <input type="checkbox" data-f="bill.logExpense" ${r.bill?.logExpense !== false ? 'checked' : ''} style="width:24px;height:24px;accent-color:#22201C"></label>`;
  } else {
    body = `
      <div class="card stack" style="gap:12px"><span class="bold" style="font-size:15px">Repeat</span>
        <div class="chips" role="radiogroup" aria-label="Repeat">${REPEATS.map(([v, l]) => `<button type="button" role="radio" aria-checked="${s.repeat === v}" class="chip ${s.repeat === v ? 'on' : ''}" data-chip="repeat" data-v="${v}">${l}</button>`).join('')}</div>
        ${s.repeat === 'every' ? `<div class="row wrap" style="border-top:1px solid var(--line);padding-top:12px"><span>Every</span>
          <div class="stepper" style="gap:8px"><button type="button" data-step="every" data-d="-1" aria-label="Less">−</button><output>${s.every}</output><button type="button" data-step="every" data-d="1" aria-label="More">+</button></div>
          <div class="seg" style="margin-left:auto">${[['day', 'days'], ['week', 'weeks'], ['month', 'months']].map(([v, l]) => `<button type="button" class="${s.unit === v ? 'on' : ''}" data-chip="unit" data-v="${v}">${l}</button>`).join('')}</div></div>` : ''}
        ${s.repeat === 'weekly' ? weekdayPicker(s, true) : ''}
        ${s.repeat === 'monthly' ? `<div style="border-top:1px solid var(--line);padding-top:12px">${stepper('monthDay', s.monthDay || parseYmd(s.start).getDate(), 'Day of month').replace('class="card stack"', 'class="stack"')}</div>` : ''}
      </div>
      <div class="grid2"><label class="field"><span>${s.repeat === 'once' ? 'On' : 'Starting'}</span><input type="date" data-f="schedule.start" value="${s.start}"></label>
        ${s.repeat === 'once' ? '<span></span>' : `<div class="field"><span>Ends</span><select data-f="schedule.endType" aria-label="Ends"><option value="never" ${s.endType === 'never' ? 'selected' : ''}>Never</option><option value="date" ${s.endType === 'date' ? 'selected' : ''}>On a date</option><option value="count" ${s.endType === 'count' ? 'selected' : ''}>After N times</option></select></div>`}</div>
      ${s.repeat !== 'once' && s.endType === 'date' ? `<label class="field"><span>Last day</span><input type="date" data-f="schedule.endDate" value="${s.endDate || s.start}"></label>` : ''}
      ${s.repeat !== 'once' && s.endType === 'count' ? stepper('count', s.count || 10, 'How many times') : ''}
      ${timesField(s.times)}
      ${chipsField('Early heads-up', 'heads', HEADS, r.headsUpMins)}`;
  }

  const placeholder = { medicine: 'e.g. Vitamin D', bill: 'e.g. Credit card bill', custom: 'e.g. Water the plants', invisalign: 'Invisalign' }[r.kind];
  return {
    nav: false,
    html: `<div class="screen no-nav">
      ${topbar({ back: isNew ? '#/new' : `#/r/${r.id}`, title: isNew ? 'New reminder' : 'Edit reminder', close: true })}
      <main class="pad stack" style="padding-top:16px;gap:12px">
        <section class="row" style="background:${c.bg};border-radius:26px;padding:14px;gap:14px">
          <button type="button" class="tile" data-look aria-label="Change picture and colour" style="width:68px;height:68px;border-radius:20px;background:#fff;border:none;position:relative">${lookArt(r.look, r.look.type === 'photo' ? 68 : 54)}
            <span style="position:absolute;right:-4px;bottom:-4px;width:26px;height:26px;border-radius:13px;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center">${UI.edit.replace('width="20" height="20"', 'width="14" height="14"')}</span></button>
          <label class="grow" style="display:flex;flex-direction:column;gap:2px"><span style="font-size:13px;color:${c.mid}">Name</span>
            <input data-f="title" value="${esc(r.title)}" placeholder="${placeholder}" style="border:none;padding:0;background:transparent;font-size:20px;font-weight:600;color:${c.ink};width:100%;outline:none" ${r.title ? '' : 'autofocus'}></label>
        </section>
        <button type="button" class="link" data-look style="align-self:flex-start;margin-top:-4px">Change picture &amp; colour</button>
        ${body}
        <section aria-live="polite" class="card" id="summary" style="background:var(--sun-soft);color:#4A3608;font-size:15px;line-height:1.45">${summary(r)}</section>
        <button class="btn sun" data-save>${isNew ? 'Save reminder' : 'Save changes'}</button>
        ${isNew ? '' : `<button class="link danger" data-delete style="align-self:center">Delete reminder</button>`}
      </main></div>`,
    mount(root) {
      const rerender = () => render();
      const refreshSummary = () => { root.querySelector('#summary').innerHTML = summary(r); };
      root.querySelectorAll('[data-look]').forEach((b) => b.onclick = () => lookSheet(r.look, (look) => { r.look = look; rerender(); }));
      root.querySelectorAll('[data-f]').forEach((el) => {
        const handler = () => {
          const path = el.dataset.f.split('.');
          let v = el.type === 'checkbox' ? el.checked : el.value;
          if (el.type === 'number') v = el.value === '' ? null : Number(el.value);
          let obj = r;
          for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
          obj[path[path.length - 1]] = v;
          if (el.dataset.enddate !== undefined) s.endType = v ? 'date' : 'never';
          if (el.dataset.f === 'schedule.endType' || el.dataset.f === 'schedule.start' && s.repeat === 'monthly') { rerender(); return; }
          refreshSummary();
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
      });
      root.querySelectorAll('[data-time]').forEach((el) => el.addEventListener('change', () => { if (el.value) { s.times[Number(el.dataset.time)] = el.value; refreshSummary(); } }));
      root.querySelectorAll('[data-deltime]').forEach((b) => b.onclick = () => { s.times.splice(Number(b.dataset.deltime), 1); rerender(); });
      root.querySelector('[data-addtime]')?.addEventListener('click', () => {
        const last = s.times[s.times.length - 1] || '09:00';
        const h = (Number(last.slice(0, 2)) + 8) % 24;
        s.times.push(`${String(h).padStart(2, '0')}:${last.slice(3)}`);
        rerender();
      });
      root.querySelectorAll('[data-step]').forEach((b) => b.onclick = () => {
        const d = Number(b.dataset.d); const name = b.dataset.step;
        if (name === 'startSet') r.invisalign.startSet = Math.min(Math.max(1, r.invisalign.startSet + d), r.invisalign.totalSets);
        if (name === 'totalSets') r.invisalign.totalSets = Math.max(r.invisalign.startSet, Math.min(99, r.invisalign.totalSets + d));
        if (name === 'monthDay') s.monthDay = ((Number(s.monthDay || parseYmd(s.start).getDate()) - 1 + d + 31) % 31) + 1;
        if (name === 'every') s.every = Math.max(1, Math.min(365, Number(s.every || 1) + d));
        if (name === 'count') s.count = Math.max(1, Math.min(999, Number(s.count || 10) + d));
        rerender();
      });
      root.querySelectorAll('[data-chip]').forEach((b) => b.onclick = () => {
        const v = b.dataset.v; const name = b.dataset.chip;
        if (name === 'every') r.invisalign.every = Number(v);
        if (name === 'heads') r.headsUpMins = Number(v);
        if (name === 'repeat') { s.repeat = v; if (v === 'weekly' && !s.weekdays?.length) s.weekdays = [parseYmd(s.start).getDay()]; if (v === 'monthly' && !s.monthDay) s.monthDay = parseYmd(s.start).getDate(); }
        if (name === 'unit') s.unit = v;
        if (name === 'medrepeat') { s.repeat = v; if (v === 'weekly' && !s.weekdays?.length) s.weekdays = [1, 2, 3, 4, 5]; }
        if (name === 'wd') {
          const n = Number(v); const set = new Set(s.weekdays || []);
          set.has(n) ? set.delete(n) : set.add(n);
          if (set.size) s.weekdays = [...set].sort();
        }
        rerender();
      });
      root.querySelector('[data-save]').onclick = () => {
        if (!r.title.trim()) { toast('Please give it a name'); root.querySelector('[data-f="title"]').focus(); return; }
        if (r.kind === 'bill') s.monthDay = s.monthDay || 1;
        if (!s.times.length) s.times = [state.settings.defaultTime];
        s.times = [...new Set(s.times)].sort();
        const wasNew = !getReminder(r.id);
        const saved = deepCopy(r);
        upsertReminder(saved);
        r.__saved = true;
        draft = null;
        go(`#/r/${saved.id}${wasNew ? '?new=1' : '?changed=1'}`);
      };
      root.querySelector('[data-delete]')?.addEventListener('click', async () => {
        if (await confirmSheet({ title: `Delete “${r.title}”?`, body: 'Also delete it from your phone calendar so the notifications stop.', yes: 'Delete', danger: true })) {
          deleteReminder(r.id); draft = null; go('#/'); toast('Reminder deleted');
        }
      });
    },
  };
}
export const resetDraft = () => { draft = null; };

function weekdayPicker(s, bordered) {
  return `<div class="row" style="gap:6px;${bordered ? 'border-top:1px solid var(--line);padding-top:12px' : ''}" role="group" aria-label="Days of the week">
    ${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button type="button" class="chip ${s.weekdays?.includes(d) ? 'on' : ''}" aria-pressed="${!!s.weekdays?.includes(d)}" data-chip="wd" data-v="${d}" style="flex:1;padding:0;height:42px" aria-label="${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]}">${WD[d]}</button>`).join('')}</div>`;
}

// ---------------- Details ----------------
export function details(id, query) {
  const r = getReminder(id);
  if (!r) { go('#/'); return null; }
  const now = new Date();
  const c = color(r.look.color);
  const rule = ruleOf(r);
  const st = status(r, now);
  const upcoming = next(rule, now, 4);
  const nx = upcoming[0];
  const links = googleLinks(r);
  const isNew = query.get('new') === '1';

  let big = '';
  if (st.due && !st.snoozed) {
    big = `<span style="font-size:15px;color:${c.mid}">Due</span><span style="font-size:40px;font-weight:700;letter-spacing:-.03em;line-height:1.05">${ago(st.due.at, now)}</span><span style="font-size:15px;color:${c.mid}">${relDay(st.due.at, now)}, ${fmtTime(st.due.at)}</span>`;
  } else if (nx) {
    const dd = daysBetween(now, nx.at);
    big = dd >= 1
      ? `<span style="font-size:15px;color:${c.mid}">${r.kind === 'bill' ? 'Due in' : 'Next in'}</span><span style="font-size:76px;font-weight:700;line-height:1;letter-spacing:-.04em">${dd}</span><span style="font-size:20px;font-weight:600">day${dd > 1 ? 's' : ''}</span>`
      : `<span style="font-size:15px;color:${c.mid}">Next</span><span style="font-size:44px;font-weight:700;line-height:1.05;letter-spacing:-.03em">${fmtTime(nx.at)}</span><span style="font-size:20px;font-weight:600">${relDay(nx.at, now)}</span>`;
    big += `<span style="margin-top:10px;font-size:15px;color:${c.mid}">${fmtDate(nx.at)} · ${fmtTime(nx.at)}${r.kind === 'invisalign' ? `<br>${esc(titleFor(r, nx))}` : ''}</span>`;
  } else {
    big = `<span style="font-size:28px;font-weight:700">All finished</span><span style="font-size:15px;color:${c.mid}">No more dates on this reminder.</span>`;
  }

  const bullets = [`At the time`];
  if (r.headsUpMins > 0) bullets.unshift(`${humanMins(r.headsUpMins)} before`);
  const stale = r.calendarAt && r.calendarStale;
  const stock = r.kind === 'medicine' ? stockInfo(r, now) : null;

  return {
    nav: false,
    html: `<div class="screen no-nav">
      ${topbar({ back: '#/', title: esc(r.title), right: `<a class="round" href="#/edit/${r.id}" aria-label="Edit">${UI.edit}</a>` })}
      <main class="pad stack" style="padding-top:16px">
        <section style="position:relative;min-height:200px;border-radius:30px;background:${c.bg};color:${c.ink};overflow:hidden;padding:22px">
          <span aria-hidden="true" style="position:absolute;right:-30px;top:-30px;width:200px;height:200px;border-radius:100px;background:${c.deep}"></span>
          <span style="position:absolute;right:20px;top:36px">${r.look.type === 'photo' ? lookArt(r.look, 120) : lookArt(r.look, 132)}</span>
          <div style="position:relative;display:flex;flex-direction:column;max-width:58%">${big}</div>
        </section>
        ${st.due && !st.snoozed ? `<div class="grid2"><button class="btn" data-done>${UI.check(18)} ${r.kind === 'bill' ? 'Paid' : 'Done'}</button><button class="btn white" data-later>Later…</button></div>` : ''}
        ${st.snoozed ? `<div class="card row"><span class="grow">Snoozed till <strong>${fmtTime(st.snoozed)}</strong></span><button class="chip" data-later>Change</button></div>` : ''}
        ${r.kind === 'invisalign' ? `<a class="item" href="#/journey/${r.id}" style="padding:12px 14px"><span class="grow"><span class="t" style="font-size:16px">Smile journey</span><br><span class="s">Set ${invisalignInfo(r, now).current} of ${r.invisalign.totalSets} · see all sets</span></span>${UI.chevron}</a>` : ''}
        ${stock ? `<a class="item" href="#/meds" style="padding:12px 14px;${stock.low ? `background:${color('peach').bg}` : ''}"><span class="grow"><span class="t" style="font-size:16px">${stock.stock} left</span><br><span class="s">${stock.runsOut ? `Buy more by ${fmtDate(stock.lastDose)}` : 'Medicine tracker'}</span></span>${UI.chevron}</a>` : ''}
        ${r.kind === 'bill' && r.bill?.amount ? `<a class="item" href="#/bills" style="padding:12px 14px"><span class="grow"><span class="t" style="font-size:16px">${money(r.bill.amount)}</span><br><span class="s">Bills this month</span></span>${UI.chevron}</a>` : ''}

        <section class="stack" style="gap:10px"><h2 class="h-s">${esc(describe(rule))}</h2>
          ${upcoming.length ? `<div class="grid4">${upcoming.map((o, i) => `<div style="height:70px;border-radius:22px;background:${i === 0 ? 'var(--ink)' : 'var(--card)'};color:${i === 0 ? '#fff' : 'var(--ink)'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px"><span style="font-size:20px;font-weight:600">${o.at.getDate()}</span><span style="font-size:13px;color:${i === 0 ? '#D8D1C4' : 'var(--muted)'}">${MONTHS[o.at.getMonth()]}</span></div>`).join('')}</div>` : ''}
        </section>

        <section class="stack" style="gap:10px"><h2 class="h-s">You'll be notified</h2>
          <div class="chips">${bullets.map((b) => `<span class="pill" style="background:var(--card);height:40px">${UI.bell.replace('width="24" height="24"', 'width="16" height="16"')} ${b}</span>`).join('')}</div></section>

        <section class="card xl stack" id="cal" style="gap:12px;${isNew || !r.calendarAt || stale ? 'box-shadow:0 0 0 3px var(--sun)' : ''}">
          <h2 class="h-s">${r.calendarAt && !stale ? 'On your calendar ✓' : 'Get notified on your phone'}</h2>
          <p class="small muted">${stale ? 'You changed this reminder. Add it again, then delete the old one in your calendar app.' : r.calendarAt ? 'Added. Your calendar app sends the notification, even when this app is closed.' : 'Your phone calendar sends the notification at the right time, even when this app is closed. Add it once:'}</p>
          ${links.map((l) => `<a class="btn sun sm" href="${esc(l.url)}" target="_blank" rel="noopener" data-cal>${UI.calendar} Add to Google Calendar${links.length > 1 ? ` · ${esc(l.label)}` : ''}</a>`).join('')}
          <button class="btn ghost sm" data-ics>Add to Apple / other calendar</button>
          <p class="tiny muted">Android: use Google. iPhone: Apple Calendar or Google.${r.headsUpMins > 0 ? ` In Google Calendar, add the ${humanMins(r.headsUpMins)} early notification yourself.` : ''}</p>
        </section>
        <button class="link danger" data-delete style="align-self:center">Delete reminder</button>
      </main></div>`,
    mount(root) {
      const markCal = () => { r.calendarAt = new Date().toISOString(); r.calendarStale = false; save(); };
      root.querySelectorAll('[data-cal]').forEach((a) => a.addEventListener('click', () => { markCal(); setTimeout(render, 300); }));
      root.querySelector('[data-ics]').onclick = () => { downloadIcs(r); markCal(); toast('Calendar file ready. Open it to add the reminders.'); setTimeout(render, 300); };
      root.querySelector('[data-done]')?.addEventListener('click', () => { const { expense } = markDone(r, st.due.key); afterDone(r, st.due.key, expense); });
      root.querySelectorAll('[data-later]').forEach((b) => b.onclick = () => actionSheet(r, st.due.key));
      root.querySelector('[data-delete]').onclick = async () => {
        if (await confirmSheet({ title: `Delete “${r.title}”?`, body: 'Also delete it from your phone calendar so the notifications stop.', yes: 'Delete', danger: true })) {
          deleteReminder(r.id); go('#/'); toast('Reminder deleted');
        }
      };
      if (isNew) setTimeout(() => root.querySelector('#cal')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
    },
  };
}
