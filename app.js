// Nav background on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Reveal on scroll
const revealEls = document.querySelectorAll('.section-head, .prose, .def, .card, .tile, .doc, .refs, .constructs-title');
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// Lightbox
const tiles = Array.from(document.querySelectorAll('.tile'));
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('.lb-img');
const lbCap = lb.querySelector('.lb-cap');
let idx = 0;

function show(i) {
  idx = (i + tiles.length) % tiles.length;
  const t = tiles[idx];
  lbImg.src = t.dataset.full;
  lbImg.alt = t.dataset.cap || '';
  lbCap.textContent = t.dataset.cap || '';
}
function open(i) { show(i); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); }
function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lbImg.src = ''; }

tiles.forEach((t, i) => t.addEventListener('click', () => open(i)));
lb.querySelector('.lb-close').addEventListener('click', close);
lb.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1); });
lb.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1); });
lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowRight') show(idx + 1);
  if (e.key === 'ArrowLeft') show(idx - 1);
});
