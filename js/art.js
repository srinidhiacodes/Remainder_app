// Character illustrations, line icons and the pastel colour palette.
// Every picture is an inline SVG string so the app works offline.

export const COLORS = {
  lavender: { bg: '#E6DEFB', deep: '#D9CEFA', ink: '#2A1F5C', mid: '#4B3A9E', bar: '#6A55D8' },
  mint:     { bg: '#D7F0DF', deep: '#C3E8CF', ink: '#123A25', mid: '#1F6B43', bar: '#5CC08A' },
  peach:    { bg: '#FCDCCB', deep: '#FBCDB5', ink: '#3A1605', mid: '#8A3410', bar: '#FF9466' },
  sky:      { bg: '#D6E9F5', deep: '#C4DEEF', ink: '#123F57', mid: '#1F5876', bar: '#7DB2D6' },
  sunshine: { bg: '#FFE7A6', deep: '#FFDA7A', ink: '#2B1F06', mid: '#5C4310', bar: '#FFC23C' },
  rose:     { bg: '#F9D6E3', deep: '#F5C3D5', ink: '#4A1030', mid: '#9C2F5C', bar: '#F7A8C4' },
};
export const COLOR_NAMES = Object.keys(COLORS);
export const color = (name) => COLORS[name] || COLORS.lavender;

const face = (x1, x2, y, ink, smileW = 6) =>
  `<circle cx="${x1}" cy="${y}" r="1.6" fill="${ink}"/><circle cx="${x2}" cy="${y}" r="1.6" fill="${ink}"/>` +
  `<path d="M${(x1 + x2) / 2 - smileW / 2} ${y + 4}q${smileW / 2} ${smileW * 0.4} ${smileW} 0" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`;

// Characters: drawn on a 40x40 grid, each with a friendly face.
export const CHARACTERS = {
  tooth: { label: 'Tooth', svg: `<path d="M12 6.5c-4.5 0-7 3.5-7 8 0 5.5 2.7 8 3.6 13.5S10.4 37 13 37s2.7-6.3 4.5-10c.9-1.8 4.1-1.8 5 0C24.3 30.7 24.4 37 27 37s3.5-3.6 4.4-9S35 20 35 14.5c0-4.5-2.5-8-7-8-3.6 0-4.5 1.8-8 1.8S15.6 6.5 12 6.5z" fill="#fff" stroke="#4B3A9E" stroke-width="1.6" stroke-linejoin="round"/>${face(15.5, 24.5, 17, '#2A1F5C', 7)}<circle cx="11.5" cy="21.5" r="2.2" fill="#F59BB0"/><circle cx="28.5" cy="21.5" r="2.2" fill="#F59BB0"/>` },
  pill: { label: 'Capsule', svg: `<g transform="rotate(-35 20 20)"><rect x="5" y="12" width="30" height="16" rx="8" fill="#fff" stroke="#1F6B43" stroke-width="1.6"/><path d="M20 12h7a8 8 0 0 1 0 16h-7z" fill="#5CC08A" stroke="#1F6B43" stroke-width="1.6"/></g><circle cx="15.5" cy="20.5" r="1.6" fill="#1F3B2A"/><circle cx="21" cy="17" r="1.6" fill="#1F3B2A"/><path d="M16.8 24.8q3.6.2 5.8-3" fill="none" stroke="#1F3B2A" stroke-width="1.5" stroke-linecap="round"/>` },
  tablet: { label: 'Tablet', svg: `<circle cx="20" cy="20" r="13" fill="#fff" stroke="#1F6B43" stroke-width="1.6"/><path d="M8 20h24" stroke="#1F6B43" stroke-width="1.6"/>${face(15.5, 24.5, 14.5, '#1F3B2A', 0)}<path d="M16 25.5q4 3 8 0" fill="none" stroke="#1F3B2A" stroke-width="1.5" stroke-linecap="round"/>` },
  card: { label: 'Card', svg: `<rect x="3" y="9" width="34" height="23" rx="5" fill="#FF9466" stroke="#9A3B12" stroke-width="1.6"/><path d="M3 15h34" stroke="#9A3B12" stroke-width="2.4"/>${face(15, 25, 22, '#4A1E08', 6)}` },
  bolt: { label: 'Electricity', svg: `<path d="M23 3 8 22h10l-3 15 16-20H21z" fill="#FFD34D" stroke="#1F5876" stroke-width="1.6" stroke-linejoin="round"/><circle cx="17" cy="19" r="1.3" fill="#123F57"/><circle cx="22" cy="19" r="1.3" fill="#123F57"/>` },
  bell: { label: 'Bell', svg: `<path d="M10 25a10 10 0 0 1 20 0c0 7 4 9 4 9H6s4-2 4-9" fill="#fff" stroke="#1F5876" stroke-width="1.6" stroke-linejoin="round"/><path d="M17 37a3 3 0 0 0 6 0" fill="none" stroke="#1F5876" stroke-width="1.6"/>${face(16, 24, 24, '#123F57', 5)}<path d="M33 5l1.4 3.3 3.3 1.4-3.3 1.4L33 14.4l-1.4-3.3-3.3-1.4 3.3-1.4z" fill="#FFC23C"/>` },
  plant: { label: 'Plant', svg: `<path d="M20 20c0-7 4-11 10-11 0 6-4 10-10 11zM20 20c0-6-3-9-8-9 0 5 3 8 8 9z" fill="#5CC08A" stroke="#1F6B43" stroke-width="1.4" stroke-linejoin="round"/><path d="M20 20v4" stroke="#1F6B43" stroke-width="1.6"/><path d="M11 24h18l-2 11a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2z" fill="#FF9466" stroke="#9A3B12" stroke-width="1.4" stroke-linejoin="round"/>${face(17, 23, 28.5, '#4A1E08', 4)}` },
  pet: { label: 'Pet', svg: `<path d="M9 10l5 4M31 10l-5 4" stroke="#7A4A22" stroke-width="5" stroke-linecap="round"/><circle cx="20" cy="22" r="12" fill="#F2C48D" stroke="#7A4A22" stroke-width="1.4"/><circle cx="16" cy="20" r="1.6" fill="#3A2510"/><circle cx="24" cy="20" r="1.6" fill="#3A2510"/><ellipse cx="20" cy="25" rx="2.4" ry="1.8" fill="#3A2510"/><path d="M17.5 28q2.5 2 5 0" fill="none" stroke="#3A2510" stroke-width="1.3" stroke-linecap="round"/>` },
  car: { label: 'Car', svg: `<path d="M5 26v-5l4-7h22l4 7v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#7DB2D6" stroke="#1F5876" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 15h16l2 5H10z" fill="#fff" stroke="#1F5876" stroke-width="1.2"/><circle cx="12" cy="29" r="3.4" fill="#22201C"/><circle cx="28" cy="29" r="3.4" fill="#22201C"/><circle cx="17" cy="23.5" r="1.3" fill="#123F57"/><circle cx="23" cy="23.5" r="1.3" fill="#123F57"/>` },
  cake: { label: 'Cake', svg: `<path d="M20 5q2.4 3 0 5.5Q17.6 8 20 5z" fill="#FF9F1C"/><path d="M20 11v5" stroke="#6A55D8" stroke-width="2"/><rect x="7" y="16" width="26" height="19" rx="4" fill="#F9D6E3" stroke="#9C2F5C" stroke-width="1.4"/><path d="M7 22q4.3 3 8.7 0t8.6 0 8.7 0" fill="none" stroke="#9C2F5C" stroke-width="1.4"/>${face(17, 23, 27, '#4A1030', 4)}` },
  workout: { label: 'Workout', svg: `<rect x="3" y="12" width="7" height="16" rx="2" fill="#22201C"/><rect x="30" y="12" width="7" height="16" rx="2" fill="#22201C"/><rect x="10" y="16.5" width="20" height="7" rx="3.5" fill="#FFC23C" stroke="#7A5200" stroke-width="1.2"/><circle cx="17" cy="20" r="1.2" fill="#3A2510"/><circle cx="23" cy="20" r="1.2" fill="#3A2510"/>` },
  book: { label: 'Book', svg: `<path d="M7 9h12a2 2 0 0 1 2 2v22a3 3 0 0 0-3-3H7zM33 9H21v24a3 3 0 0 1 3-3h9z" fill="#E6DEFB" stroke="#4B3A9E" stroke-width="1.4" stroke-linejoin="round"/>${face(12, 16, 18, '#2A1F5C', 3)}` },
  water: { label: 'Water', svg: `<path d="M20 4c5 8 10 13 10 19.5a10 10 0 0 1-20 0C10 17 15 12 20 4z" fill="#7DB2D6" stroke="#1F5876" stroke-width="1.4" stroke-linejoin="round"/>${face(16.5, 23.5, 23.5, '#123F57', 5)}` },
  house: { label: 'Home', svg: `<path d="M5 19 20 6l15 13" fill="none" stroke="#9A3B12" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 17v16a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2V17L20 8.5z" fill="#FFE7A6" stroke="#7A5200" stroke-width="1.4" stroke-linejoin="round"/>${face(17, 23, 22, '#3A2510', 4)}` },
  bowl: { label: 'Food', svg: `<path d="M14 13q2-4 0-7M20 13q2-4 0-7M26 13q2-4 0-7" stroke="#A39C90" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M5 18h30a15 15 0 0 1-30 0z" fill="#FFC23C" stroke="#7A5200" stroke-width="1.4" stroke-linejoin="round"/>${face(16, 24, 24, '#3A2510', 5)}` },
  bag: { label: 'Shopping', svg: `<path d="M15 14v-3a5 5 0 0 1 10 0v3" fill="none" stroke="#9C2F5C" stroke-width="1.6"/><path d="M8.5 14h23l-2 22h-19z" fill="#F7A8C4" stroke="#9C2F5C" stroke-width="1.4" stroke-linejoin="round"/>${face(16.5, 23.5, 23, '#4A1030', 5)}` },
  star: { label: 'Star', svg: `<path d="M20 4l4.6 9.6 10.4 1.5-7.6 7.3 1.9 10.4L20 27.9l-9.3 4.9 1.9-10.4L5 15.1l10.4-1.5z" fill="#E6DEFB" stroke="#4B3A9E" stroke-width="1.4" stroke-linejoin="round"/>${face(17, 23, 18.5, '#2A1F5C', 4)}` },
  coin: { label: 'Money', svg: `<circle cx="20" cy="20" r="15" fill="#FFC23C" stroke="#9A5B00" stroke-width="1.6"/><circle cx="20" cy="20" r="10.5" fill="none" stroke="#E0A400" stroke-width="1.4"/>${face(16.5, 23.5, 18.5, '#4A2A00', 5)}` },
  sun: { label: 'Sunny', svg: `<g stroke="#F59E1B" stroke-width="2.6" stroke-linecap="round"><path d="M20 2v4M20 34v4M2 20h4M34 20h4M7.3 7.3l2.8 2.8M29.9 29.9l2.8 2.8M7.3 32.7l2.8-2.8M29.9 10.1l2.8-2.8"/></g><circle cx="20" cy="20" r="11" fill="#FF9F1C"/>${face(16.5, 23.5, 18.5, '#3A2510', 5)}` },
};
export const CHARACTER_KEYS = Object.keys(CHARACTERS);

// Line icons on a 24x24 grid (stroke = currentColor).
export const ICONS = {
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0',
  phone: 'M7 3h10v18H7zM11 18h2',
  key: 'M14 10a4 4 0 1 1-1.2-2.8L21 15v3h-3v-2h-2v-2',
  leaf: 'M5 19C5 10 11 5 20 5c0 9-5 15-14 15M5 19l7-7',
  music: 'M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  cart: 'M3 4h2l2.5 11h11L21 7H6.5M9 20h.01M18 20h.01',
  plane: 'M3 13l7-2 4-7h2l-1.5 7 5.5 2v2l-5.5-1L14 20h-2l-1-5-8-.5z',
  scissors: 'M6 6a2.5 2.5 0 1 0 0 .1M6 18a2.5 2.5 0 1 0 0 .1M8 7.5 20 18M8 16.5 20 6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
};
export const ICON_KEYS = Object.keys(ICONS);

export function icon(key, size = 22, stroke = 2) {
  const d = ICONS[key] || ICONS.bell;
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

export function character(key, size = 40) {
  const c = CHARACTERS[key] || CHARACTERS.star;
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 40 40">${c.svg}</svg>`;
}

// Render whatever "look" a reminder or category has: character, icon or photo.
export function lookArt(look, size = 40) {
  if (!look) return character('star', size);
  if (look.type === 'photo' && look.photo) {
    return `<img src="${look.photo}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:${Math.round(size / 3.2)}px;object-fit:cover;display:block">`;
  }
  if (look.type === 'icon') {
    return `<span style="color:${color(look.color).mid};display:flex">${icon(look.key, Math.round(size * 0.7), 2.2)}</span>`;
  }
  return character(look.key, size);
}

// UI glyphs used across screens.
export const UI = {
  back: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  close: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check: (s = 20) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>`,
  arrow: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  chevron: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  chevronL: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  bell: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
  wallet: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/></svg>',
  chart: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 20v-6M12 20V6M18 20v-9"/></svg>',
  sliders: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  calendar: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  edit: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  flame: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="#FF9F1C"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z"/></svg>',
  download: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>',
  upload: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14"/></svg>',
  camera: '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  trophy: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 20h16"/></svg>',
  backspace: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/></svg>',
};

// Big scenes (hero, welcome, celebration, empty state).
export const SCENES = {
  heroHills: `<svg aria-hidden="true" class="scene" viewBox="0 0 346 150" preserveAspectRatio="xMaxYMax slice">
    <ellipse cx="300" cy="28" rx="22" ry="8" fill="#FFF6DC"/><ellipse cx="318" cy="24" rx="14" ry="9" fill="#FFF6DC"/>
    <g stroke="#F59E1B" stroke-width="4" stroke-linecap="round"><path d="M268 22v-10M268 106v10M226 64h-10M310 64h10M238 34l-7-7M298 34l7-7M238 94l-7 7M298 94l7 7"/></g>
    <circle cx="268" cy="64" r="30" fill="#FF9F1C"/><circle cx="258" cy="60" r="3.4" fill="#3A2510"/><circle cx="278" cy="60" r="3.4" fill="#3A2510"/>
    <path d="M259 71q9 8 18 0" fill="none" stroke="#3A2510" stroke-width="3" stroke-linecap="round"/>
    <circle cx="250" cy="70" r="4" fill="#F26B4F" opacity=".55"/><circle cx="286" cy="70" r="4" fill="#F26B4F" opacity=".55"/>
    <path d="M0 122q70-30 150-6t196-10V150H0z" fill="#A9CF7A"/><path d="M0 138q90-22 190 0t156-4V150H0z" fill="#79B156"/>
    <path d="M196 132l9-26 9 26z" fill="#3F7D45"/><path d="M212 134l7-20 7 20z" fill="#4E8E50"/></svg>`,
  welcome: `<svg aria-hidden="true" class="scene" viewBox="0 0 390 470" preserveAspectRatio="xMidYMax slice">
    <ellipse cx="70" cy="90" rx="34" ry="12" fill="#FFF6DC"/><ellipse cx="96" cy="82" rx="22" ry="14" fill="#FFF6DC"/>
    <ellipse cx="320" cy="140" rx="30" ry="10" fill="#FFF6DC"/><ellipse cx="300" cy="134" rx="18" ry="12" fill="#FFF6DC"/>
    <g stroke="#F59E1B" stroke-width="6" stroke-linecap="round"><path d="M195 96v-18M195 280v18M103 188H85M287 188h18M130 123l-12-12M260 123l12-12M130 253l-12 12M260 253l12 12"/></g>
    <circle cx="195" cy="188" r="68" fill="#FF9F1C"/><circle cx="173" cy="178" r="7" fill="#3A2510"/><circle cx="217" cy="178" r="7" fill="#3A2510"/>
    <circle cx="175" cy="175" r="2.2" fill="#fff"/><circle cx="219" cy="175" r="2.2" fill="#fff"/>
    <path d="M176 204q19 17 38 0" fill="none" stroke="#3A2510" stroke-width="6" stroke-linecap="round"/>
    <circle cx="155" cy="202" r="9" fill="#F26B4F" opacity=".5"/><circle cx="235" cy="202" r="9" fill="#F26B4F" opacity=".5"/>
    <path d="M0 380q90-60 200-20t190-30V470H0z" fill="#A9CF7A"/><path d="M0 420q120-40 230-6t160-10V470H0z" fill="#79B156"/>
    <path d="M40 400l16-46 16 46z" fill="#3F7D45"/><path d="M66 404l12-34 12 34z" fill="#4E8E50"/>
    <path d="M300 392l16-50 16 50z" fill="#3F7D45"/><path d="M326 398l12-34 12 34z" fill="#4E8E50"/>
    <g transform="translate(118 330)"><rect width="64" height="56" rx="12" fill="#fff" stroke="#22201C" stroke-width="3"/><path d="M0 18h64" stroke="#22201C" stroke-width="3"/><path d="M16-6v12M48-6v12" stroke="#22201C" stroke-width="4" stroke-linecap="round"/><path d="M20 36l8 8 16-16" fill="none" stroke="#2E9E62" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g transform="translate(212 340)"><path d="M10 34a20 20 0 0 1 40 0c0 14 8 18 8 18H2s8-4 8-18" fill="#fff" stroke="#22201C" stroke-width="3" stroke-linejoin="round"/><path d="M24 58a6 6 0 0 0 12 0" fill="none" stroke="#22201C" stroke-width="3"/><circle cx="30" cy="10" r="4" fill="#22201C"/></g></svg>`,
  sleepy: `<svg role="img" aria-label="Sunny the sun napping on a cloud" class="scene-inline" viewBox="0 0 300 250">
    <circle cx="150" cy="130" r="110" fill="#EFE7D8"/>
    <path d="M210 50h14l-14 14h14M232 30h10l-10 10h10" fill="none" stroke="#A39C90" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <g stroke="#F59E1B" stroke-width="6" stroke-linecap="round"><path d="M150 52v-14M96 74l-10-10M204 74l10-10M78 128H64M222 128h14"/></g>
    <circle cx="150" cy="128" r="58" fill="#FF9F1C"/>
    <path d="M124 124q8 7 16 0M160 124q8 7 16 0" fill="none" stroke="#3A2510" stroke-width="5" stroke-linecap="round"/>
    <circle cx="150" cy="148" r="6" fill="#3A2510"/><circle cx="116" cy="140" r="8" fill="#F26B4F" opacity=".5"/><circle cx="184" cy="140" r="8" fill="#F26B4F" opacity=".5"/>
    <path d="M58 214a26 26 0 0 1 20-40 34 34 0 0 1 62-8 30 30 0 0 1 52 4 28 28 0 0 1 48 20 22 22 0 0 1 2 24z" fill="#fff"/></svg>`,
  cheer: `<svg aria-hidden="true" class="scene" viewBox="0 0 390 520" preserveAspectRatio="xMidYMin meet">
    <circle cx="195" cy="300" r="190" fill="#FFE08F"/>
    <rect x="40" y="90" width="12" height="6" rx="3" fill="#6A55D8" transform="rotate(30 46 93)"/><rect x="320" y="120" width="12" height="6" rx="3" fill="#5CC08A" transform="rotate(-25 326 123)"/>
    <rect x="80" y="190" width="10" height="5" rx="2.5" fill="#F26B4F" transform="rotate(60 85 192)"/><rect x="300" y="230" width="12" height="6" rx="3" fill="#fff" transform="rotate(15 306 233)"/>
    <rect x="60" y="400" width="12" height="6" rx="3" fill="#5CC08A" transform="rotate(-40 66 403)"/><rect x="330" y="380" width="10" height="5" rx="2.5" fill="#6A55D8" transform="rotate(45 335 382)"/>
    <rect x="160" y="70" width="10" height="5" rx="2.5" fill="#F26B4F" transform="rotate(-15 165 72)"/><rect x="250" y="60" width="12" height="6" rx="3" fill="#7DB2D6" transform="rotate(70 256 63)"/>
    <circle cx="110" cy="130" r="5" fill="#fff"/><circle cx="285" cy="170" r="4" fill="#F26B4F"/><circle cx="40" cy="300" r="5" fill="#7DB2D6"/><circle cx="350" cy="300" r="5" fill="#fff"/>
    <g stroke="#F59E1B" stroke-width="9" stroke-linecap="round"><path d="M195 150v-26M195 450v26M45 300H19M345 300h26M89 194l-18-18M301 194l18-18M89 406l-18 18M301 406l18 18"/></g>
    <circle cx="195" cy="300" r="110" fill="#FF9F1C"/>
    <path d="M155 288q12-14 24 0M211 288q12-14 24 0" fill="none" stroke="#3A2510" stroke-width="8" stroke-linecap="round"/>
    <path d="M160 318q35 44 70 0z" fill="#3A2510"/><path d="M178 340q17 10 34 0q-8-10-17-10t-17 10z" fill="#F26B4F"/>
    <circle cx="137" cy="318" r="14" fill="#F26B4F" opacity=".5"/><circle cx="253" cy="318" r="14" fill="#F26B4F" opacity=".5"/></svg>`,
};
