import { state } from './store.js';
import { bottomNav } from './ui.js';
import { welcome, home, chooseType, editor, details, resetDraft } from './views/reminders.js';
import { celebrate, journey, meds, bills } from './views/features.js';
import { moneyHome, expenseEditor, insights, resetExpense } from './views/money.js';
import { settings } from './views/settings.js';

const routes = [
  [/^\/welcome$/, () => welcome()],
  [/^\/$/, () => home()],
  [/^\/new$/, () => chooseType()],
  [/^\/new\/(invisalign|medicine|bill|custom)$/, (m) => editor(m[1])],
  [/^\/edit\/([\w-]+)$/, (m) => editor(null, m[1])],
  [/^\/r\/([\w-]+)$/, (m, q) => details(m[1], q)],
  [/^\/journey\/([\w-]+)$/, (m) => journey(m[1])],
  [/^\/meds$/, () => meds()],
  [/^\/bills$/, () => bills()],
  [/^\/done$/, () => celebrate()],
  [/^\/money$/, () => moneyHome()],
  [/^\/money\/add$/, (m, q) => expenseEditor(null, q)],
  [/^\/money\/edit\/([\w-]+)$/, (m, q) => expenseEditor(m[1], q)],
  [/^\/money\/insights$/, () => insights()],
  [/^\/settings$/, () => settings()],
];

const app = document.getElementById('app');
let lastPath = null;

function route() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const query = new URLSearchParams(qs || '');
  if (!state.onboarded && path !== '/welcome') { location.replace('#/welcome'); return; }

  // Leaving an editor throws away its unsaved draft.
  if (!/^\/(new\/|edit\/)/.test(path)) resetDraft();
  if (!/^\/money\/(add|edit)/.test(path)) resetExpense();

  for (const [re, fn] of routes) {
    const m = path.match(re);
    if (!m) continue;
    const view = fn(m, query);
    if (!view) return; // view redirected
    const keepScroll = path === lastPath;
    if (!keepScroll) document.querySelectorAll('.toast').forEach((t) => { if (Date.now() - Number(t.dataset.t) > 600) t.remove(); });
    const y = window.scrollY;
    app.innerHTML = view.html + (view.nav ? bottomNav(view.nav) : '');
    view.mount && view.mount(app);
    // Back buttons go back in history when we came from inside the app.
    app.querySelectorAll('[data-back]').forEach((a) => a.addEventListener('click', (e) => {
      if (history.state && history.state.inApp) { e.preventDefault(); history.back(); }
    }));
    window.scrollTo(0, keepScroll ? y : 0);
    if (!keepScroll) {
      const h = app.querySelector('h1');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    lastPath = path;
    document.title = titleFor(path);
    return;
  }
  location.replace('#/');
}

function titleFor(path) {
  if (path.startsWith('/money')) return 'Money · Remainder';
  if (path.startsWith('/settings')) return 'Settings · Remainder';
  return 'Remainder';
}

// Mark history entries we created so "back" stays inside the app.
let navigating = false;
window.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (a && !a.hasAttribute('data-back')) navigating = true;
});
window.addEventListener('hashchange', () => {
  if (navigating && !(history.state && history.state.inApp)) history.replaceState({ inApp: true }, '');
  navigating = false;
  route();
});

route();

// Refresh "overdue / due" states when coming back to the app.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') route(); });
setInterval(() => { if (document.visibilityState === 'visible' && !document.querySelector('.backdrop') && !document.activeElement?.matches('input, select, textarea')) route(); }, 60000);

// Offline support + install prompt.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.__installPrompt = e; });
