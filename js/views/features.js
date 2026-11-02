import { state, save, getReminder, markDone, undo, snooze, invisalignInfo, switchedSet, medicineWeek, medicineStreak, stockInfo,
  todayItems, billsInMonth, titleFor, ruleOf } from '../store.js';
import { dateOfKey, between, next } from '../schedule.js';
import { SCENES, UI, color, character, lookArt } from '../art.js';
import { esc, money, go, topbar, artTile, toast, sheet, promptSheet } from '../ui.js';
import { fmtTime, fmtDate, fmtDay, relDay, ago, inDays, addDays, fmtMonthLong, MONTHS, today, ymd, daysBetween } from '../dates.js';
import { afterDone, render } from './reminders.js';

// ---------- Done / snooze sheet for an overdue reminder ----------
export function actionSheet(r, key) {
  if (!r) return;
  const when = dateOfKey(key);
  const now = new Date();
  const c = color(r.look.color);
  const plus = (m) => new Date(now.getTime() + m * 60000);
  const evening = new Date(now); evening.setHours(18, 0, 0, 0);
  const options = [['15 min', plus(15)], ['1 hour', plus(60)]];
  if (evening - now > 90 * 60000) options.push(['This evening', evening]);
  else { const tm = addDays(now, 1); tm.setHours(9, 0, 0, 0); options.push(['Tomorrow', tm]); }
  const isBill = r.kind === 'bill';
  sheet(`
    <div class="row" style="gap:14px">${artTile(r.look, 72, 56, 22)}
      <div class="stack" style="gap:2px"><h2 class="h-l">${esc(r.title)}</h2>
      <span class="danger" style="font-weight:500">Was due ${relDay(when, now).toLowerCase() === 'today' ? `at ${fmtTime(when)}` : `${relDay(when, now)} ${fmtTime(when)}`} · ${ago(when, now)}</span>
      ${r.kind === 'invisalign' ? `<span class="muted small">${esc(titleFor(r, { index: between(ruleOf(r), new Date(0), when).length - 1 }))}</span>` : ''}</div></div>
    <button class="btn" data-done>${UI.check(20)} ${isBill ? 'Paid' : r.kind === 'medicine' ? 'Taken just now' : 'Done'}</button>
    <div class="stack" style="gap:10px"><span class="bold" style="color:var(--ink-2)">Remind me again</span>
      <div class="grid2">${options.map(([l, d], i) => `<button class="card" data-snooze="${d.toISOString()}" style="border:none;height:62px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;${i === 1 ? 'background:var(--sun-soft)' : ''}"><span class="bold">${l}</span><span class="tiny muted">${fmtTime(d)}</span></button>`).join('')}
      <label class="card" style="height:62px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer"><span class="bold">Pick a time</span><input type="time" data-pick aria-label="Pick a time" style="border:none;background:transparent;font-size:13px;text-align:center"></label></div>
      <p class="tiny muted">Snoozing works inside this app. Your calendar won't ring again, so open the app to check.</p></div>
    <button class="link" data-skip style="align-self:center">${r.kind === 'medicine' ? "Skip this dose" : 'Skip this time'}</button>`, (s, close) => {
    s.querySelector('[data-done]').onclick = () => { close(); const { expense } = markDone(r, key); afterDone(r, key, expense); };
    s.querySelectorAll('[data-snooze]').forEach((b) => b.onclick = () => { snooze(r, key, new Date(b.dataset.snooze)); close(); render(); toast(`Snoozed till ${fmtTime(new Date(b.dataset.snooze))}`); });
    const pick = s.querySelector('[data-pick]');
    pick.onchange = () => {
      if (!pick.value) return;
      const [h, m] = pick.value.split(':').map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
      snooze(r, key, d); close(); render(); toast(`Snoozed till ${relDay(d)} ${fmtTime(d)}`);
    };
    s.querySelector('[data-skip]').onclick = () => { markDone(r, key, 'skipped'); close(); render(); toast('Skipped', 'Undo', () => { undo(r, key); render(); }); };
  }, `${r.title} is overdue`);
}

// ---------- Celebration ----------
export function celebrate() {
  const items = todayItems();
  const done = items.filter((x) => x.state === 'done').length;
  const streak = medicineStreak();
  return {
    nav: false,
    html: `<div class="screen no-nav" style="background:var(--hero);padding-bottom:0;min-height:100dvh;position:relative;overflow:hidden">
      <div style="flex:1;min-height:300px;max-height:52dvh;position:relative" class="pop">${SCENES.cheer.replace('class="scene"', 'class="scene" style="position:absolute;inset:0;width:100%;height:100%"')}</div>
      <main class="pad stack center" style="gap:10px;position:relative">
        <h1 class="h-xl" style="font-size:38px;font-weight:700;color:#2B1F06">All done for today!</h1>
        <p style="font-size:17px;color:#5C4310">${done} of ${items.length} reminder${items.length === 1 ? '' : 's'} ticked off. Sunny is proud of you.</p>
        <div class="chips" style="justify-content:center;margin-top:6px">
          ${streak > 0 ? `<span class="pill" style="background:#fff;height:40px;font-weight:600">${UI.flame} ${streak}-day streak</span>` : ''}
          <span class="pill" style="background:#fff;height:40px;font-weight:600">100% today</span></div>
      </main>
      <div class="pad" style="padding-top:28px;padding-bottom:34px;position:relative"><a class="btn" href="#/">Back to home</a></div>
    </div>`,
  };
}

// ---------- Invisalign journey ----------
export function journey(id) {
  const r = getReminder(id);
  if (!r || r.kind !== 'invisalign') { go('#/'); return null; }
  const now = new Date();
  const info = invisalignInfo(r, now);
  const c = color('lavender');
  const sets = Array.from({ length: info.total }, (_, i) => {
    const n = i + 1;
    if (n === info.total && n !== info.current) return `<span class="last" aria-label="Set ${n}, the last one">${UI.trophy}</span>`;
    const cls = n < info.current ? 'past' : n === info.current ? 'now' : '';
    return `<span class="${cls}" aria-label="Set ${n}${cls === 'now' ? ', current' : cls === 'past' ? ', done' : ''}">${n}</span>`;
  }).join('');
  const circ = 2 * Math.PI * 52;
  const pct = Math.round(((info.current - 1) / Math.max(1, info.total - 1)) * 100);
  const nextSet = Math.min(info.current + 1, info.total);
  const daysLeft = Math.max(0, daysBetween(now, info.finish));
  return {
    nav: false,
    html: `<div class="screen no-nav">
      <div style="background:${c.bg};border-radius:0 0 40px 40px;padding-bottom:24px;position:relative;overflow:hidden">
        <span aria-hidden="true" style="position:absolute;right:-50px;top:-40px;width:200px;height:200px;border-radius:100px;background:${c.deep}"></span>
        ${topbar({ back: `#/r/${r.id}`, title: `<span style="color:${c.ink}">Your smile journey</span>` }).replace('class="topbar"', 'class="topbar" style="position:relative"')}
        <div class="pad row" style="gap:18px;position:relative;padding-top:18px">
          <svg aria-hidden="true" width="120" height="120" viewBox="0 0 120 120" style="flex:none"><circle cx="60" cy="60" r="52" fill="none" stroke="#fff" stroke-width="12"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="${c.bar}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(circ * pct) / 100} ${circ}" transform="rotate(-90 60 60)"/>
            <g transform="translate(40 40)">${character('tooth', 44).replace(/<\/?svg[^>]*>/g, '')}</g></svg>
          <div class="stack" style="gap:2px;color:${c.ink}"><span style="color:${c.mid}">${info.done ? 'Finished!' : 'Wearing'}</span>
            <span style="font-size:38px;font-weight:700;letter-spacing:-.03em;line-height:1">Set ${info.current}</span>
            <span style="color:${c.mid}">of ${info.total} · ${pct}% done</span></div>
        </div>
      </div>
      <main class="pad stack" style="padding-top:18px">
        <section class="card xl setgrid" aria-label="All sets">${sets}</section>
        <div class="grid2">
          <div class="card stack" style="gap:4px"><span class="tiny muted">Next change</span><span class="h-s">${info.next ? fmtDate(info.next.at) : '—'}</span><span class="small" style="color:${c.mid}">${info.next ? inDays(info.next.at, now) : 'No more changes'}</span></div>
          <div class="card stack" style="gap:4px;background:var(--sun-soft)"><span class="tiny" style="color:#5C4310">Finish line</span><span class="h-s" style="color:#2B1F06">${fmtDate(info.finish, true)}</span><span class="small" style="color:#5C4310">${daysLeft ? `${daysLeft} days to go` : 'You made it!'}</span></div>
        </div>
        <div class="card row"><span class="tile" style="width:36px;height:36px;border-radius:18px;background:${c.bg};color:${c.mid}">↺</span><span class="grow small" style="color:var(--ink-2)">Changed early or late? Tell the app and all future dates move. Then add it to your calendar again.</span></div>
        ${info.current < info.total ? `<button class="btn" data-switch>I switched to set ${nextSet} today</button>` : ''}
        <button class="link" data-other style="align-self:center">I'm on a different set</button>
      </main></div>`,
    mount(root) {
      const doSwitch = (n) => { switchedSet(r, n); render(); toast(`Set ${n} started today. Dates updated.`, 'Calendar', () => go(`#/r/${r.id}`)); };
      root.querySelector('[data-switch]')?.addEventListener('click', () => doSwitch(nextSet));
      root.querySelector('[data-other]').onclick = async () => {
        const v = await promptSheet({ title: 'Which set are you wearing?', label: `Set number (1–${info.total}), started today`, value: String(info.current), type: 'number', inputmode: 'numeric' });
        const n = Number(v);
        if (n >= 1 && n <= info.total) doSwitch(n);
      };
    },
  };
}

// ---------- Medicine tracker ----------
export function meds() {
  const now = new Date();
  const list = state.reminders.filter((r) => r.kind === 'medicine');
  const week = medicineWeek(now);
  const expected = week.reduce((s, d) => s + d.expected, 0);
  const taken = week.reduce((s, d) => s + d.taken, 0);
  const streak = medicineStreak(now);
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todays = [];
  for (const r of list) for (const o of between(r.schedule, startDay, new Date(addDays(startDay, 1) - 1))) todays.push({ r, o });
  todays.sort((a, b) => a.o.at - b.o.at);
  const low = list.map((r) => ({ r, s: stockInfo(r, now) })).filter((x) => x.s && x.s.low);
  const H = 130;
  return {
    nav: false,
    html: `<div class="screen no-nav">
      ${topbar({ back: '#/', title: 'Medicines', right: streak ? `<span class="pill" style="background:var(--sun-soft);color:#5C4310;font-weight:600">${UI.flame} ${streak} day${streak > 1 ? 's' : ''}</span>` : '<span class="spacer48"></span>' })}
      <main class="pad stack" style="padding-top:18px">
        ${!list.length ? `<div class="card stack center">${character('pill', 64)}<p>No medicines yet.</p><a class="btn sun sm" href="#/new/medicine">Add a medicine</a></div>` : `
        <section class="card xl stack">
          <div class="row between" style="align-items:flex-end"><div class="stack" style="gap:2px"><span class="small muted">Last 7 days</span>
            <span style="font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1">${taken}<span style="font-size:20px;font-weight:500;color:var(--muted)"> / ${expected} doses</span></span></div>
            <span class="small ok bold">${expected ? Math.round((taken / expected) * 100) : 0}% taken</span></div>
          <div class="bars" role="img" aria-label="Doses taken per day: ${week.map((d) => `${d.isToday ? 'today' : fmtDay(d.d)} ${d.taken} of ${d.expected}`).join(', ')}" style="grid-template-columns:repeat(7,minmax(0,1fr));height:${H + 24}px">
            ${week.map((d) => {
              const f = d.expected ? d.taken / d.expected : 0;
              const fill = d.isToday ? 'var(--sun)' : f >= 1 ? '#5CC08A' : '#F2A97E';
              return `<div class="col"><div class="track" style="height:${H}px;${d.isToday ? 'background:#FFF6DC;outline:2px dashed #E0A400;outline-offset:-2px' : ''}"><div class="fill" style="height:${Math.round(f * H)}px;background:${fill}"></div></div><span class="tiny ${d.isToday ? 'bold' : 'muted'}">${d.isToday ? 'Today' : fmtDay(d.d)}</span></div>`;
            }).join('')}
          </div>
        </section>
        <section class="stack" style="gap:10px"><h2 class="h-s">Today</h2>
          ${todays.length ? todays.map(({ r, o }) => {
            const ans = r.log[o.key];
            return `<div class="item" style="padding:10px 10px 10px 14px"><span class="bold" style="width:72px;font-size:15px">${fmtTime(o.at)}</span><span class="grow">${esc(r.title)}</span>
              ${ans === 'done' ? `<button class="pill" data-undo="${r.id}|${o.key}" style="background:var(--ok-soft);color:var(--ok);font-weight:600">${UI.check(14)} Taken</button>`
                : ans === 'skipped' ? `<button class="pill" data-undo="${r.id}|${o.key}">Skipped</button>`
                : `<button class="pill on" data-take="${r.id}|${o.key}">Take</button>`}</div>`;
          }).join('') : '<div class="card muted small">No doses today.</div>'}
        </section>
        ${low.map(({ r, s }) => `<section class="row" style="background:${color('peach').bg};border-radius:24px;padding:14px 16px;gap:12px">
          <span class="tile" style="width:46px;height:46px;background:#fff;border-radius:14px">${lookArt(r.look, 36)}</span>
          <div class="grow stack" style="gap:2px;color:${color('peach').ink}"><span class="bold">${esc(r.title)} running low</span>
          <span class="small" style="color:${color('peach').mid}">${s.stock} left${s.runsOut ? ` · buy more by ${fmtDate(s.lastDose)}` : ''}</span></div>
          <button class="chip" data-refill="${r.id}" style="background:#fff">Bought</button></section>`).join('')}
        <a class="btn ghost" href="#/new/medicine">${UI.plus} Add a medicine</a>`}
      </main></div>`,
    mount(root) {
      root.querySelectorAll('[data-take]').forEach((b) => b.onclick = () => { const [id, key] = b.dataset.take.split('|'); markDone(getReminder(id), key); render(); });
      root.querySelectorAll('[data-undo]').forEach((b) => b.onclick = () => { const [id, key] = b.dataset.undo.split('|'); undo(getReminder(id), key); render(); });
      root.querySelectorAll('[data-refill]').forEach((b) => b.onclick = async () => {
        const r = getReminder(b.dataset.refill);
        const v = await promptSheet({ title: `New ${r.title}`, label: 'How many tablets did you get?', value: '30', type: 'number', inputmode: 'numeric', yes: 'Add' });
        const n = Number(v);
        if (n > 0) { r.medicine.stock = (r.medicine.stock || 0) + n; save(); render(); toast(`${r.medicine.stock} ${r.title} now`); }
      });
    },
  };
}

// ---------- Bills overview ----------
let billsMonth = null;
export function bills() {
  const now = new Date();
  if (!billsMonth) billsMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const y = billsMonth.getFullYear(); const m = billsMonth.getMonth();
  const list = billsInMonth(y, m);
  const total = list.reduce((s, b) => s + (b.r.bill?.amount || 0), 0);
  const left = list.filter((b) => !b.paid).reduce((s, b) => s + (b.r.bill?.amount || 0), 0);
  const paidN = list.filter((b) => b.paid).length;
  const pc = color('peach');
  const tabs = [-1, 0, 1].map((d) => new Date(y, m + d, 1));
  return {
    nav: false,
    html: `<div class="screen no-nav">
      ${topbar({ back: '#/', title: 'Bills' })}
      <div class="pad chips" role="tablist" aria-label="Month" style="padding-top:16px">${tabs.map((t, i) => `<button role="tab" aria-selected="${i === 1}" class="chip ${i === 1 ? 'on' : ''}" data-month="${i - 1}" style="${i === 1 ? '' : 'background:var(--card)'}">${i === 1 ? fmtMonthLong(t) : MONTHS[t.getMonth()]}</button>`).join('')}</div>
      <main class="pad stack" style="padding-top:16px">
        <section style="position:relative;border-radius:30px;background:${pc.bg};padding:20px;overflow:hidden;color:${pc.ink}" class="stack">
          <span aria-hidden="true" style="position:absolute;right:-6px;top:-4px">${character('coin', 96)}</span>
          <div class="stack" style="gap:2px;position:relative"><span style="color:${pc.mid}">Left to pay</span>
            <span style="font-size:40px;font-weight:700;letter-spacing:-.03em">${money(left)}</span>
            <span style="color:${pc.mid}">of ${money(total)} in ${fmtMonthLong(billsMonth)}</span></div>
          <div class="stack" style="gap:6px"><div class="bar" style="height:10px;border-radius:5px"><i style="width:${list.length ? Math.round((paidN / list.length) * 100) : 0}%;background:#E0703A"></i></div>
            <span class="small" style="font-weight:500;color:${pc.mid}">${paidN} of ${list.length} bill${list.length === 1 ? '' : 's'} paid</span></div>
        </section>
        ${list.length ? list.map(({ r, o, paid }) => {
          const c = color(r.look.color);
          const dd = daysBetween(now, o.at);
          return `<a class="item" href="#/r/${r.id}" style="padding:12px 14px;${paid ? 'opacity:.75' : ''}">
            ${paid ? `<span class="tile" style="width:46px;height:52px;background:var(--ok-soft);color:var(--ok)">${UI.check(22)}</span>`
              : `<span class="tile" style="width:46px;height:52px;background:${c.bg};flex-direction:column"><span style="font-size:18px;font-weight:700;line-height:1;color:${c.ink}">${o.at.getDate()}</span><span class="tiny" style="color:${c.mid}">${MONTHS[o.at.getMonth()]}</span></span>`}
            <span class="grow stack" style="gap:2px"><span class="t" style="font-size:16px;${paid ? 'text-decoration:line-through' : ''}">${esc(r.title)}</span>
              <span class="s ${!paid && dd < 0 ? 'danger' : ''} ${paid ? 'ok' : ''}" style="${!paid && dd >= 0 && dd <= 3 ? 'color:var(--danger);font-weight:500' : ''}">${paid ? 'Paid' : dd < 0 ? `Overdue · ${fmtDate(o.at)}` : inDays(o.at, now).replace(/^./, (x) => x.toUpperCase())}</span></span>
            <span class="bold" style="font-size:17px">${r.bill?.amount ? money(r.bill.amount) : ''}</span></a>`;
        }).join('') : `<div class="card muted small">No bills due in ${fmtMonthLong(billsMonth)}.</div>`}
        <a class="btn sun" href="#/new/bill">${UI.plus} Add a bill</a>
      </main></div>`,
    mount(root) {
      root.querySelectorAll('[data-month]').forEach((b) => b.onclick = () => { billsMonth = new Date(y, m + Number(b.dataset.month), 1); render(); });
    },
  };
}
