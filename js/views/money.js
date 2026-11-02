import { state, save, uid, addExpense, updateExpense, deleteExpense, categoryOf, monthSummary, billsInMonth } from '../store.js';
import { UI, color, character, lookArt } from '../art.js';
import { esc, money, moneyShort, go, topbar, artTile, toast, confirmSheet, promptSheet, download } from '../ui.js';
import { today, parseYmd, fmtMonthLong, MONTHS, fmtShort, relDay, daysBetween, inDays, daysInMonth, fmtDate } from '../dates.js';
import { lookSheet, render } from './reminders.js';

let month = null; // first day of the month being viewed
const viewMonth = () => (month ||= new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const isThisMonth = (d) => d.getFullYear() === new Date().getFullYear() && d.getMonth() === new Date().getMonth();

function monthNav(d) {
  return `<div class="row" style="gap:4px">
    <button class="round" style="width:40px;height:40px;background:transparent" data-mnav="-1" aria-label="Previous month">${UI.chevronL}</button>
    <span class="h-s" style="min-width:110px;text-align:center">${fmtMonthLong(d)}${d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : ''}</span>
    <button class="round" style="width:40px;height:40px;background:transparent;${isThisMonth(d) ? 'opacity:.3' : ''}" data-mnav="1" aria-label="Next month" ${isThisMonth(d) ? 'disabled' : ''}>${UI.chevron}</button></div>`;
}
function wireMonthNav(root) {
  root.querySelectorAll('[data-mnav]').forEach((b) => b.onclick = () => {
    const d = viewMonth();
    const n = new Date(d.getFullYear(), d.getMonth() + Number(b.dataset.mnav), 1);
    if (n > new Date()) return;
    month = n; render();
  });
}

function txRow(e) {
  const cat = categoryOf(e.category);
  const income = e.kind === 'income';
  return `<a class="li" href="#/money/edit/${e.id}">
    ${artTile(cat.look, 40, 32, 12)}
    <span class="grow" style="display:flex;flex-direction:column"><span style="font-size:15px;font-weight:500">${esc(e.note || cat.name)}</span>
      <span class="tiny ${e.reminderId ? 'ok' : 'muted'}" style="${e.reminderId ? 'font-weight:500' : ''}">${e.reminderId ? 'From reminder · ' : ''}${relDay(parseYmd(e.date))} · ${esc(e.method)}</span></span>
    <span style="font-size:16px;font-weight:600;${income ? 'color:var(--ok)' : ''}">${income ? '+' : '−'}${money(e.amount)}</span></a>`;
}

// ---------------- Money home ----------------
export function moneyHome() {
  const d = viewMonth();
  const { list, spent, income, byCat } = monthSummary(d.getFullYear(), d.getMonth());
  const budget = Number(state.settings.budget) || 0;
  const now = new Date();
  const daysLeft = isThisMonth(d) ? daysInMonth(d.getFullYear(), d.getMonth()) - now.getDate() + 1 : 0;
  const pct = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const over = budget && spent > budget;
  const cats = [...state.categories].sort((a, b) => (byCat[b.id] || 0) - (byCat[a.id] || 0));
  const dueSoon = isThisMonth(d)
    ? [...billsInMonth(d.getFullYear(), d.getMonth()), ...billsInMonth(d.getFullYear(), d.getMonth() + 1)]
      .filter((b) => !b.paid && daysBetween(now, b.o.at) >= 0 && daysBetween(now, b.o.at) <= 7).slice(0, 2)
    : [];
  const recent = [...list].reverse().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  return {
    nav: 'money',
    html: `<div class="screen">
      <header class="topbar" style="padding-top:26px"><h1 class="h-xl">Money</h1>${monthNav(d)}</header>
      <main class="pad stack" style="padding-top:16px">
        <button class="card xl stack" data-budget style="position:relative;background:var(--ink);color:#fff;border:none;text-align:left;overflow:hidden;gap:14px">
          <span aria-hidden="true" style="position:absolute;right:6px;top:6px">${character('sun', 84)}</span>
          <span class="stack" style="gap:2px;position:relative"><span style="color:#D8D1C4">${isThisMonth(d) ? 'Spent so far' : `Spent in ${fmtMonthLong(d)}`}</span>
            <span style="font-size:40px;font-weight:700;letter-spacing:-.03em">${money(spent)}</span></span>
          ${budget ? `<span class="stack" style="gap:8px;position:relative"><span class="bar" style="height:10px;border-radius:5px;background:#45413A"><i style="width:${pct}%;background:${over ? '#F26B4F' : 'var(--sun)'}"></i></span>
            <span class="small" style="color:#D8D1C4">${over ? `${money(spent - budget)} over your ${money(budget)} budget` : `${money(budget - spent)} left of ${money(budget)}`}${daysLeft ? ` · ${daysLeft} day${daysLeft > 1 ? 's' : ''} to go` : ''}</span></span>`
            : '<span class="small" style="color:#D8D1C4">Tap to set a monthly budget</span>'}
          ${income ? `<span class="small" style="color:#9FE0B8;position:relative">+${money(income)} income</span>` : ''}
        </button>

        <section class="stack" style="gap:10px"><h2 class="h-s">By category</h2>
          <div class="hscroll" style="gap:8px">${cats.map((c) => {
            const col = color(c.look.color);
            return `<a href="#/money/add?cat=${c.id}" style="width:84px;flex:none;border-radius:20px;background:${col.bg};padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;color:${col.ink};text-decoration:none">
              ${c.look.type === 'photo' ? artTile(c.look, 36) : lookArt(c.look, 36)}<span class="tiny" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(c.name)}</span><span class="small bold">${moneyShort(byCat[c.id] || 0)}</span></a>`;
          }).join('')}</div></section>

        ${dueSoon.map(({ r, o }) => `<a class="item" href="#/r/${r.id}" style="background:${color('peach').bg};padding:12px 14px;color:${color('peach').ink}">
          <span style="color:#9A3B12;display:flex">${UI.bell.replace('width="24" height="24"', 'width="22" height="22"')}</span>
          <span class="grow" style="font-size:15px"><strong>${esc(r.title)}${r.bill?.amount ? ` ${money(r.bill.amount)}` : ''}</strong> due ${inDays(o.at, now)}</span>${UI.chevron}</a>`).join('')}

        <section class="stack" style="gap:8px"><div class="section-title"><h2 class="h-s">Recent</h2><a href="#/money/insights">Insights</a></div>
          ${recent.length ? `<div class="list">${recent.map(txRow).join('')}</div>` : `<div class="card stack center" style="gap:8px">${character('coin', 56)}<p class="muted small">No spending recorded${isThisMonth(d) ? ' yet this month' : ''}. Tap + to add one.</p></div>`}
        </section>
      </main></div>`,
    mount(root) {
      wireMonthNav(root);
      root.querySelector('[data-budget]').onclick = async () => {
        const v = await promptSheet({ title: 'Monthly budget', label: `Amount in ${state.settings.currency} (0 for none)`, value: String(budget || ''), type: 'number', inputmode: 'numeric' });
        if (v === null || v === undefined) return;
        state.settings.budget = Math.max(0, Number(v) || 0); save(); render();
      };
    },
  };
}

// ---------------- Add / edit expense ----------------
let ex = null;
export function expenseEditor(id, query) {
  if (id) {
    const found = state.expenses.find((e) => e.id === id);
    if (!found) { go('#/money'); return null; }
    if (!ex || ex.id !== id) ex = { ...found, amountStr: String(found.amount) };
  } else if (!ex || ex.id && state.expenses.some((e) => e.id === ex.id) || ex.__saved) {
    ex = { id: null, amountStr: '', category: query.get('cat') || 'food', note: '', date: today(), method: 'UPI', kind: 'expense' };
  }
  const e = ex;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
  const amt = e.amountStr || '0';
  return {
    nav: false,
    html: `<div class="screen no-nav">
      ${topbar({ back: '#/money', close: true, title: `<div class="seg dark" role="tablist" style="display:inline-flex">${['expense', 'income'].map((k) => `<button role="tab" aria-selected="${e.kind === k}" class="${e.kind === k ? 'on' : ''}" data-kind="${k}">${k === 'expense' ? 'Expense' : 'Income'}</button>`).join('')}</div>` })}
      <main class="pad stack" style="padding-top:12px;gap:12px">
        <div class="stack center" style="gap:2px;padding:4px 0">
          <div class="amount" aria-live="polite" aria-label="Amount">${state.settings.currency}${esc(Number(amt).toLocaleString('en-IN', { maximumFractionDigits: 2 }))}${amt.endsWith('.') ? '.' : ''}<span class="caret"></span></div>
          <label class="row" style="gap:6px;color:var(--muted)"><span class="small">Note</span><input data-note value="${esc(e.note)}" placeholder="What was it?" style="border:none;background:transparent;font-size:16px;font-weight:500;width:170px;outline:none"></label>
        </div>
        <div class="hscroll" role="radiogroup" aria-label="Category" style="gap:8px">${state.categories.map((c) => {
          const col = color(c.look.color); const on = e.category === c.id;
          return `<button role="radio" aria-checked="${on}" data-cat="${c.id}" style="width:74px;height:78px;flex:none;border-radius:18px;border:3px solid ${on ? 'var(--ink)' : 'transparent'};background:${col.bg};color:${col.ink};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:${on ? 600 : 500}">${c.look.type === 'photo' ? artTile(c.look, 30) : lookArt(c.look, 30)}${esc(c.name)}</button>`;
        }).join('')}
          <button data-newcat style="width:74px;height:78px;flex:none;border-radius:18px;border:2px dashed var(--dash);background:transparent;color:var(--ink-2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px">${UI.plus}New</button></div>
        <div class="row wrap">
          <label class="pill" style="background:var(--card);height:40px">${UI.calendar.replace('width="20" height="20"', 'width="16" height="16"')}<input type="date" data-date value="${e.date}" aria-label="Date" style="border:none;background:transparent;font-size:14px;width:120px"></label>
          <div class="chips" role="radiogroup" aria-label="Paid with" style="margin-left:auto">${['UPI', 'Card', 'Cash'].map((m) => `<button role="radio" aria-checked="${e.method === m}" class="chip ${e.method === m ? 'on' : ''}" data-method="${m}" style="${e.method === m ? '' : 'background:var(--card)'}">${m}</button>`).join('')}</div>
        </div>
        <div class="keypad" aria-label="Number pad">${keys.map((k) => k === 'del' ? `<button class="flat" data-key="del" aria-label="Delete">${UI.backspace}</button>` : `<button class="${k === '.' ? 'flat' : ''}" data-key="${k}">${k}</button>`).join('')}</div>
        <button class="btn sun" data-save ${Number(amt) > 0 ? '' : 'disabled'}>Save ${Number(amt) > 0 ? money(Number(amt)) : ''}</button>
        ${e.id ? `<button class="link danger" data-del style="align-self:center">Delete</button>` : ''}
      </main></div>`,
    mount(root) {
      root.querySelectorAll('[data-key]').forEach((b) => b.onclick = () => {
        let s = e.amountStr;
        const k = b.dataset.key;
        if (k === 'del') s = s.slice(0, -1);
        else if (k === '.') { if (!s.includes('.')) s = (s || '0') + '.'; }
        else if (/\.\d{2}$/.test(s)) return;
        else if (s.replace('.', '').length >= 9) return;
        else s = s === '0' ? k : s + k;
        e.amountStr = s; render();
      });
      root.querySelector('[data-note]').oninput = (ev) => { e.note = ev.target.value; };
      root.querySelector('[data-date]').onchange = (ev) => { if (ev.target.value) e.date = ev.target.value; };
      root.querySelectorAll('[data-cat]').forEach((b) => b.onclick = () => { e.category = b.dataset.cat; render(); });
      root.querySelectorAll('[data-method]').forEach((b) => b.onclick = () => { e.method = b.dataset.method; render(); });
      root.querySelectorAll('[data-kind]').forEach((b) => b.onclick = () => { e.kind = b.dataset.kind; render(); });
      root.querySelector('[data-newcat]').onclick = async () => {
        const name = (await promptSheet({ title: 'New category', label: 'Name', value: '', yes: 'Next: pick a look' }) || '').trim();
        if (!name) return;
        lookSheet({ type: 'char', key: 'star', color: 'lavender' }, (look) => {
          const c = { id: uid(), name, look };
          state.categories.push(c); save(); e.category = c.id; render();
        });
      };
      root.querySelector('[data-save]').onclick = () => {
        const amount = Number(e.amountStr);
        if (!(amount > 0)) return;
        const item = { id: e.id, amount, category: e.category, note: e.note.trim(), date: e.date, method: e.method, kind: e.kind, reminderId: e.reminderId || null };
        if (e.id) updateExpense(item); else addExpense(item);
        e.__saved = true; ex = null;
        month = new Date(parseYmd(item.date).getFullYear(), parseYmd(item.date).getMonth(), 1);
        go('#/money');
        toast(`${item.kind === 'income' ? 'Income' : 'Expense'} of ${money(amount)} saved`);
      };
      root.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (await confirmSheet({ title: 'Delete this entry?', yes: 'Delete', danger: true })) { deleteExpense(e.id); ex = null; go('#/money'); toast('Deleted'); }
      });
    },
  };
}
export const resetExpense = () => { ex = null; };

// ---------------- Insights ----------------
export function insights() {
  const d = viewMonth();
  const cur = monthSummary(d.getFullYear(), d.getMonth());
  const prevD = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const prev = monthSummary(prevD.getFullYear(), prevD.getMonth());
  const diffPct = prev.spent ? Math.round(((cur.spent - prev.spent) / prev.spent) * 100) : null;
  const rows = Object.entries(cur.byCat).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;
  const H = 200;
  const days = isThisMonth(d) ? new Date().getDate() : daysInMonth(d.getFullYear(), d.getMonth());
  let change = null;
  for (const [id, v] of rows) {
    const delta = v - (prev.byCat[id] || 0);
    if (!change || Math.abs(delta) > Math.abs(change.delta)) change = { id, delta };
  }
  const cols = Math.max(1, Math.min(rows.length, 6));
  return {
    nav: 'insights',
    html: `<div class="screen">
      <header class="topbar" style="padding-top:26px"><h1 class="h-xl">Insights</h1>${monthNav(d)}</header>
      <main class="pad stack" style="padding-top:12px">
        <div class="stack center" style="gap:6px">
          <span style="font-size:54px;font-weight:700;letter-spacing:-.04em;line-height:1">${money(cur.spent)}</span>
          ${diffPct !== null ? `<span class="pill" style="background:${diffPct <= 0 ? 'var(--ok-soft)' : color('peach').bg};color:${diffPct <= 0 ? 'var(--ok)' : color('peach').mid};font-weight:600">${diffPct <= 0 ? '↓' : '↑'} ${Math.abs(diffPct)}% ${diffPct <= 0 ? 'less' : 'more'} than ${fmtMonthLong(prevD)}${isThisMonth(d) ? ' (so far)' : ''}</span>` : `<span class="small muted">spent in ${fmtMonthLong(d)}</span>`}
        </div>
        <section class="card xl stack" style="gap:6px"><h2 class="h-s" style="margin-bottom:8px">Where it went</h2>
          ${rows.length ? `<div class="bars" role="img" aria-label="${rows.map(([id, v]) => `${categoryOf(id).name} ${money(v)}`).join(', ')}" style="grid-template-columns:repeat(${cols},minmax(0,1fr));height:${H + 50}px">
            ${rows.slice(0, 6).map(([id, v]) => { const c = categoryOf(id); return `<div class="col"><span class="tiny bold">${moneyShort(v)}</span><div class="fill" style="width:100%;max-width:56px;height:${Math.max(28, Math.round((v / max) * H))}px;border-radius:22px;background:${color(c.look.color).bar}"></div><span class="tiny muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(c.name)}</span></div>`; }).join('')}
          </div>` : `<p class="muted small">Nothing recorded for ${fmtMonthLong(d)}.</p>`}
        </section>
        ${rows.length ? `<div class="grid2">
          ${change && prev.spent ? `<div class="card stack" style="gap:4px;background:${color(categoryOf(change.id).look.color).bg};color:${color(categoryOf(change.id).look.color).ink}"><span class="tiny">${esc(categoryOf(change.id).name)}</span><span class="h-s">${money(Math.abs(change.delta))} ${change.delta >= 0 ? 'more' : 'less'}</span><span class="tiny">than ${fmtMonthLong(prevD)}</span></div>`
            : `<div class="card stack" style="gap:4px;background:var(--sun-soft)"><span class="tiny">Top category</span><span class="h-s">${esc(categoryOf(rows[0][0]).name)}</span><span class="tiny">${money(rows[0][1])}</span></div>`}
          <div class="card stack" style="gap:4px;background:${color('sky').bg};color:${color('sky').ink}"><span class="tiny">Daily average</span><span class="h-s">${money(Math.round(cur.spent / Math.max(1, days)))}</span><span class="tiny">across ${days} day${days > 1 ? 's' : ''}</span></div>
        </div>` : ''}
        ${cur.income ? `<div class="card row between"><span>Income</span><span class="bold ok">+${money(cur.income)}</span></div>` : ''}
        ${cur.list.length ? `<button class="btn ghost" data-csv>${UI.download} Download ${fmtMonthLong(d)} as a sheet</button>` : ''}
      </main></div>`,
    mount(root) {
      wireMonthNav(root);
      root.querySelector('[data-csv]')?.addEventListener('click', () => {
        const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
        const lines = [['Date', 'Type', 'Category', 'Note', 'Paid with', 'Amount'].join(',')]
          .concat([...cur.list].sort((a, b) => a.date.localeCompare(b.date)).map((e) => [e.date, e.kind, q(categoryOf(e.category).name), q(e.note), e.method, e.amount].join(',')));
        download(`money-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}.csv`, lines.join('\n'), 'text/csv');
      });
    },
  };
}
