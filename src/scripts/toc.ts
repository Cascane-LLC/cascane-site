// Keeps the TOC open on desktop and collapsed on phones, and highlights the
// section being read.
const toc = document.querySelector<HTMLElement>('[data-toc]');
if (toc) {
  const details = toc.querySelector('details');
  const mq = matchMedia('(min-width: 1024px)');
  const sync = () => { if (details) details.open = mq.matches; };
  sync();
  mq.addEventListener('change', sync);

  const links = new Map([...toc.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')].map((a) => [a.dataset.tocLink!, a]));
  const mark = (id: string) => {
    links.forEach((a) => a.removeAttribute('aria-current'));
    links.get(id)?.setAttribute('aria-current', 'location');
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) mark(e.target.id);
  }, { rootMargin: '-20% 0px -70% 0px' });
  links.forEach((a, id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
    a.addEventListener('click', () => mark(id));
  });
}
