import { state, save, replaceState, resetAll } from '../store.js';
import { UI, color, character } from '../art.js';
import { esc, toast, confirmSheet, promptSheet, download } from '../ui.js';
import { fmtTimeStr, today } from '../dates.js';
import { render } from './reminders.js';

export function settings() {
  const s = state.settings;
  const sky = color('sky'); const lav = color('lavender'); const mint = color('mint');
  const row = (label, value, attr) => `<button class="li" ${attr} style="cursor:pointer"><span class="grow" style="font-size:16px">${label}</span><span class="bold">${value}</span>${UI.chevron}</button>`;
  return {
    nav: 'settings',
    html: `<div class="screen">
      <header class="topbar" style="padding-top:30px"><h1 class="h-xl">Settings</h1></header>
      <main class="pad stack" style="padding-top:16px">
        <section class="card xl stack" style="position:relative;background:${sky.bg};color:${sky.ink};overflow:hidden;gap:12px">
          <span aria-hidden="true" style="position:absolute;right:10px;top:8px"><svg width="90" height="90" viewBox="0 0 96 96"><path d="M26 62a16 16 0 0 1 2-32 22 22 0 0 1 42 4 14 14 0 0 1 0 28z" fill="#fff" stroke="#1F5876" stroke-width="2.4" stroke-linejoin="round"/><circle cx="42" cy="46" r="2.6" fill="#123F57"/><circle cx="56" cy="46" r="2.6" fill="#123F57"/><path d="M44 53q5 4 10 0" fill="none" stroke="#123F57" stroke-width="2.2" stroke-linecap="round"/></svg></span>
          <div class="stack" style="gap:2px;max-width:220px"><h2 class="h-m">Backup</h2>
            <span class="small" style="color:${sky.mid}">Keep your ${state.reminders.length} reminder${state.reminders.length === 1 ? '' : 's'} and ${state.expenses.length} money entr${state.expenses.length === 1 ? 'y' : 'ies'} safe when you change phones.</span></div>
          <div class="grid2"><button class="btn sm" data-export>${UI.download} Download</button>
            <label class="btn sm white" style="cursor:pointer">${UI.upload} Restore<input type="file" accept="application/json,.json" class="sr" data-import></label></div>
        </section>

        <section class="list">
          ${row('Your name', esc(state.name || 'Not set'), 'data-name')}
          ${row('Default reminder time', fmtTimeStr(s.defaultTime), 'data-time')}
          ${row('Bill heads-up', `${s.billHeadsUpDays} day${s.billHeadsUpDays === 1 ? '' : 's'} before`, 'data-heads')}
          ${row('Monthly budget', s.budget ? `${s.currency}${Number(s.budget).toLocaleString('en-IN')}` : 'None', 'data-budget')}
          ${row('Currency symbol', esc(s.currency), 'data-currency')}
        </section>

        <section class="card xl stack" style="background:${lav.bg};color:${lav.ink};gap:12px">
          <h2 class="h-m">Add to your home screen</h2>
          <div class="grid2">
            <div class="card stack" style="gap:6px;padding:12px 14px;color:var(--ink)"><span class="bold">Android</span><span class="tiny" style="line-height:1.4;color:var(--ink-2)">In Chrome, tap ⋮ then <strong>Add to Home screen</strong> (or <strong>Install app</strong>)</span></div>
            <div class="card stack" style="gap:6px;padding:12px 14px;color:var(--ink)"><span class="bold">iPhone</span><span class="tiny" style="line-height:1.4;color:var(--ink-2)">In Safari, tap Share then <strong>Add to Home Screen</strong></span></div>
          </div>
          <button class="btn sm" data-install hidden>Install app</button>
        </section>

        <section class="card xl stack" style="gap:8px">
          <h2 class="h-s">How notifications work</h2>
          <p class="small" style="color:var(--ink-2)">Each reminder is added to your phone's calendar (Google Calendar on Android, Apple or Google Calendar on iPhone). The calendar sends the notification, even when this app is closed. If you edit a reminder, add it again and delete the old calendar entry.</p>
        </section>

        <section class="row" style="background:${mint.bg};border-radius:28px;padding:16px 18px;gap:12px">
          ${character('tablet', 40)}<span class="small" style="color:${mint.ink};line-height:1.4"><strong>Private by design.</strong> Everything stays only on this phone. No account, no server.</span></section>

        <button class="link danger" data-reset style="align-self:center">Delete everything</button>
      </main></div>`,
    mount(root) {
      root.querySelector('[data-export]').onclick = () => {
        download(`remainder-backup-${today()}.json`, JSON.stringify(state, null, 2));
        toast('Backup downloaded. Keep the file somewhere safe.');
      };
      root.querySelector('[data-import]').onchange = async (ev) => {
        const f = ev.target.files[0];
        if (!f) return;
        try {
          const data = JSON.parse(await f.text());
          if (!data || !Array.isArray(data.reminders)) throw new Error('bad');
          if (await confirmSheet({ title: 'Restore this backup?', body: `It has ${data.reminders.length} reminders and ${(data.expenses || []).length} money entries. What's on this phone now will be replaced.`, yes: 'Restore' })) {
            replaceState(data); render(); toast('Backup restored');
          }
        } catch (e) { toast("That file isn't a Remainder backup"); }
        ev.target.value = '';
      };
      const ask = async (opts, apply) => { const v = await promptSheet(opts); if (v !== undefined && v !== null) { apply(v); save(); render(); } };
      root.querySelector('[data-name]').onclick = () => ask({ title: 'Your name', label: 'Name', value: state.name }, (v) => { state.name = v.trim(); });
      root.querySelector('[data-time]').onclick = () => ask({ title: 'Default reminder time', label: 'Time for new reminders', value: s.defaultTime, type: 'time' }, (v) => { if (v) s.defaultTime = v; });
      root.querySelector('[data-heads]').onclick = () => ask({ title: 'Bill heads-up', label: 'Days before the due date', value: String(s.billHeadsUpDays), type: 'number', inputmode: 'numeric' }, (v) => { s.billHeadsUpDays = Math.max(0, Math.min(30, Number(v) || 0)); });
      root.querySelector('[data-budget]').onclick = () => ask({ title: 'Monthly budget', label: `Amount in ${s.currency} (0 for none)`, value: String(s.budget || ''), type: 'number', inputmode: 'numeric' }, (v) => { s.budget = Math.max(0, Number(v) || 0); });
      root.querySelector('[data-currency]').onclick = () => ask({ title: 'Currency symbol', label: 'For example ₹, $, €, £', value: s.currency }, (v) => { if (v.trim()) s.currency = v.trim().slice(0, 3); });
      root.querySelector('[data-reset]').onclick = async () => {
        if (await confirmSheet({ title: 'Delete everything?', body: 'All reminders, money entries and settings on this phone will be removed. Download a backup first if you might need them.', yes: 'Delete everything', danger: true })) {
          resetAll(); location.hash = '#/welcome'; toast('Everything deleted');
        }
      };
      const btn = root.querySelector('[data-install]');
      if (window.__installPrompt) {
        btn.hidden = false;
        btn.onclick = async () => { window.__installPrompt.prompt(); window.__installPrompt = null; btn.hidden = true; };
      }
    },
  };
}
