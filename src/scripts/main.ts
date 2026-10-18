const toggle = document.getElementById('mobile-menu-toggle');
const nav = document.getElementById('primary-nav');
const overlay = document.getElementById('mobile-overlay');

function setMenu(open: boolean) {
  nav?.classList.toggle('is-open', open);
  overlay?.classList.toggle('is-visible', open);
  toggle?.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}

toggle?.addEventListener('click', () => setMenu(!nav?.classList.contains('is-open')));
overlay?.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav?.classList.contains('is-open')) {
    setMenu(false);
    toggle?.focus();
  }
});

const header = document.getElementById('site-header');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const faqItems = document.querySelectorAll<HTMLElement>('.faq-item');
faqItems.forEach((item) => {
  const btn = item.querySelector<HTMLButtonElement>('.faq-question');
  const answer = item.querySelector<HTMLElement>('.faq-answer');
  if (!btn || !answer) return;
  btn.addEventListener('click', () => {
    const wasOpen = item.classList.contains('is-open');
    faqItems.forEach((other) => {
      other.classList.remove('is-open');
      other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      const a = other.querySelector<HTMLElement>('.faq-answer');
      if (a) a.hidden = true;
    });
    if (!wasOpen) {
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      answer.hidden = false;
    }
  });
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.service-card, .concern-card, .philosophy-card, .faq-item').forEach((el) => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}
