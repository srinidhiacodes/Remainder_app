import { UI, color, lookArt } from './art.js';
import { state } from './store.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function money(n, { sign = false } = {}) {
  const cur = state.settings.currency || '₹';
  const v = Math.round(Math.abs(n) * 100) / 100;
  const s = v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return `${sign && n < 0 ? '−' : ''}${cur}${s}`;
}
export function moneyShort(n) {
  const cur = state.settings.currency || '₹';
  if (n >= 100000) return `${cur}${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${cur}${(n / 1000).toFixed(1)}k`;
  return `${cur}${Math.round(n)}`;
}

export const go = (hash) => { location.hash = hash; };

export function topbar({ back: backHref = '#/', title = '', right = '<span class="spacer48"></span>', close = false } = {}) {
  return `<header class="topbar">
    <a class="round" href="${backHref}" data-back aria-label="${close ? 'Close' : 'Back'}">${close ? UI.close : UI.back}</a>
    <span class="title">${title}</span>${right}</header>`;
}

export function bottomNav(active) {
  const item = (href, key, label, svg) => `<a href="${href}" class="${active === key ? 'on' : ''}" aria-label="${label}"${active === key ? ' aria-current="page"' : ''}>${svg}</a>`;
  const addHref = active === 'money' || active === 'insights' ? '#/money/add' : '#/new';
  return `<nav class="nav" aria-label="Main">
    ${item('#/', 'home', 'Reminders', UI.bell)}
    ${item('#/money', 'money', 'Money', UI.wallet)}
    <a href="${addHref}" class="fab" aria-label="Add">${UI.plus}</a>
    ${item('#/money/insights', 'insights', 'Insights', UI.chart)}
    ${item('#/settings', 'settings', 'Settings', UI.sliders)}
  </nav>`;
}

// A pastel tile holding a reminder's / category's picture.
export function artTile(look, size = 52, artSize = Math.round(size * 0.77), radius = 16) {
  const c = color(look?.color);
  const photo = look?.type === 'photo' && look.photo;
  return `<span class="tile" style="width:${size}px;height:${size}px;border-radius:${radius}px;background:${photo ? 'transparent' : c.bg}">${lookArt(look, photo ? size : artSize)}</span>`;
}

let toastTimer;
export function toast(msg, action, onAction, ms = 4000) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.dataset.t = String(Date.now());
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { el.remove(); onAction && onAction(); };
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), ms);
}

// Bottom sheet. `mount(sheetEl, close)` wires up its controls.
export function sheet(html, mount, label = 'Dialog') {
  const bd = document.createElement('div');
  bd.className = 'backdrop';
  bd.innerHTML = `<section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(label)}"><span class="grab" aria-hidden="true"></span>${html}</section>`;
  const prevFocus = document.activeElement;
  const close = () => { bd.remove(); document.removeEventListener('keydown', onKey); prevFocus?.focus?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  bd.addEventListener('click', (e) => { if (e.target === bd) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(bd);
  const s = bd.querySelector('.sheet');
  mount && mount(s, close);
  (s.querySelector('[autofocus]') || s.querySelector('button, a, input'))?.focus();
  return close;
}

export function confirmSheet({ title, body = '', yes = 'Yes', no = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    sheet(`<h2 class="h-m">${esc(title)}</h2>${body ? `<p class="muted">${esc(body)}</p>` : ''}
      <button class="btn ${danger ? '' : 'sun'}" data-yes style="${danger ? 'background:var(--danger)' : ''}">${esc(yes)}</button>
      <button class="btn ghost" data-no>${esc(no)}</button>`, (s, close) => {
      s.querySelector('[data-yes]').onclick = () => { answered = true; close(); resolve(true); };
      s.querySelector('[data-no]').onclick = () => { answered = true; close(); resolve(false); };
      new MutationObserver((m, obs) => { if (!document.body.contains(s)) { obs.disconnect(); if (!answered) resolve(false); } }).observe(document.body, { childList: true });
    }, title);
  });
}

export function promptSheet({ title, label, value = '', type = 'text', yes = 'Save', inputmode }) {
  return new Promise((resolve) => {
    sheet(`<h2 class="h-m">${esc(title)}</h2>
      <label class="field"><span>${esc(label)}</span><input type="${type}" ${inputmode ? `inputmode="${inputmode}"` : ''} value="${esc(value)}" autofocus></label>
      <button class="btn sun" data-yes>${esc(yes)}</button>`, (s, close) => {
      const input = s.querySelector('input');
      const done = () => { close(); resolve(input.value); };
      s.querySelector('[data-yes]').onclick = done;
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
    }, title);
  });
}

// Read a picked image file and shrink it so it fits in storage.
export function readPhoto(file, max = 192) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        const c = document.createElement('canvas');
        c.width = c.height = max;
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, max, max);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function download(name, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
