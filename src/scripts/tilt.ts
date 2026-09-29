// Subtle pointer-follow tilt (max 4 degrees) for [data-tilt], fine pointers only.
const els = [...document.querySelectorAll<HTMLElement>('[data-tilt]')];
const ok = matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
if (els.length && ok) {
  let raf = 0;
  addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      for (const el of els) {
        el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
      }
    });
  }, { passive: true });
}
