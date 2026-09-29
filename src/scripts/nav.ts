import { storeLinkFor } from '../lib/store-link.ts';

// Solid nav background once the page scrolls.
const nav = document.querySelector<HTMLElement>('[data-nav]');
const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
addEventListener('scroll', onScroll, { passive: true });

// "Get the app" goes straight to the right store on phones.
const target = storeLinkFor(navigator.userAgent, navigator.maxTouchPoints);
document.querySelectorAll<HTMLAnchorElement>('[data-get-app]').forEach((a) => { a.href = target; });

// Full-screen mobile menu: focus moves in, Tab stays inside, Esc closes.
const menu = document.querySelector<HTMLElement>('[data-menu]');
const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
const closeBtn = document.querySelector<HTMLButtonElement>('[data-menu-close]');
let lastFocus: HTMLElement | null = null;
const focusables = () => [...(menu?.querySelectorAll<HTMLElement>('a[href], button') ?? [])];
// Everything behind the sheet: inert while the menu is open, so neither Tab
// nor screen-reader navigation can reach it.
const background = () => [...document.querySelectorAll<HTMLElement>('[data-nav], #main, footer')];

function open() {
  if (!menu) return;
  lastFocus = document.activeElement as HTMLElement | null;
  menu.hidden = false;
  background().forEach((el) => { el.inert = true; });
  document.body.classList.add('menu-open');
  openBtn?.setAttribute('aria-expanded', 'true');
  focusables()[0]?.focus();
}
function close() {
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  background().forEach((el) => { el.inert = false; });
  document.body.classList.remove('menu-open');
  openBtn?.setAttribute('aria-expanded', 'false');
  (lastFocus ?? openBtn)?.focus();
}
openBtn?.addEventListener('click', open);
closeBtn?.addEventListener('click', close);
menu?.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) close(); });
document.addEventListener('keydown', (e) => {
  if (!menu || menu.hidden) return;
  if (e.key === 'Escape') { close(); return; }
  if (e.key !== 'Tab') return;
  const f = focusables();
  const first = f[0];
  const last = f[f.length - 1];
  // Focus can sit outside the sheet (e.g. after clicking blank space): pull it back in.
  if (!menu.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
addEventListener('resize', () => { if (innerWidth >= 860) close(); });
