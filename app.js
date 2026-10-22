/* ── Scroll reveal ─────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -52px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up').forEach(el => {
  revealObserver.observe(el);
});

/* ── Statement line-by-line reveal ─────────────────────────────────────────── */
const statementObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.s-line').forEach(line => {
      const delay = parseInt(line.dataset.delay) || 0;
      setTimeout(() => line.classList.add('in'), delay);
    });
    statementObserver.unobserve(entry.target);
  });
}, { threshold: 0.3 });

const statementEl = document.getElementById('statement');
if (statementEl) statementObserver.observe(statementEl);

/* ── Nav: become opaque after hero ─────────────────────────────────────────── */
const nav  = document.getElementById('nav');
const hero = document.getElementById('hero');

if (nav && hero) {
  const navObserver = new IntersectionObserver((entries) => {
    nav.classList.toggle('scrolled', !entries[0].isIntersecting);
  }, { threshold: 0 });
  navObserver.observe(hero);
}

/* ── Hero parallax ──────────────────────────────────────────────────────────── */
const parallaxImg = document.getElementById('hero-parallax');

if (parallaxImg) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.5) {
        parallaxImg.style.transform = `translateY(${y * 0.32}px)`;
      }
      ticking = false;
    });
  }, { passive: true });
}
