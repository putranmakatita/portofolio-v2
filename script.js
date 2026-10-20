/* =========================================================
   SCROLL ANIMATIONS
   Idea: for each section we work out "progress" (0 → 1)
   and then update the page based on that number.
   Everything is in small, separate blocks – edit one at a time.
   ========================================================= */

const vh = () => window.innerHeight;
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const ease = t => 1 - Math.pow(1 - t, 3);          // starts fast, ends slow

/* Progress of a PINNED section: 0 when it sticks, 1 when it lets go. */
function pinProgress(section) {
  const r = section.getBoundingClientRect();
  return clamp(-r.top / (r.height - vh()));
}

/* ---------- Settings you may want to change ---------- */
const HERO_ASSEMBLE_UNTIL = 0.45;   // letters finish assembling at 45% of hero scroll
const ROLE_STEPS = [0.55, 0.7, 0.85]; // when each job title appears
// Where each letter of "PUTRA" starts: [x in vw, y in vh, rotation in degrees]
const LETTER_START = [[-40, -30, -60], [30, -40, 45], [-25, 35, 80], [45, 25, -50], [-10, -45, 30]];

/* ---------- Grab elements ---------- */
const hero = document.getElementById('hero');
const letters = [...document.querySelectorAll('.name span')];
const hello = document.querySelector('.hello');
const roles = [...document.querySelectorAll('.roles li')];
const hint = document.querySelector('.scroll-hint');
const hscrolls = [...document.querySelectorAll('.hscroll')];   // professional + personal strips
const quotesSection = document.getElementById('testimonials');
const quotes = [...document.querySelectorAll('.quote')];
const dotsBox = document.querySelector('.dots');
const bar = document.getElementById('progress');

/* ---------- Setup ---------- */
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (calm) document.body.classList.add('calm');

// Split the About paragraphs into words so we can light them up one by one
const revealParas = [...document.querySelectorAll('.reveal')];
revealParas.forEach(p => {
  p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
});

// One dot per testimonial
quotes.forEach(() => dotsBox.appendChild(document.createElement('i')));
const dots = [...dotsBox.children];

/* ---------- 1. HERO ---------- */
function updateHero() {
  const p = pinProgress(hero);
  const assemble = ease(clamp(p / HERO_ASSEMBLE_UNTIL));    // 0 = scattered, 1 = in place
  letters.forEach((el, i) => {
    const [x, y, r] = LETTER_START[i % LETTER_START.length];
    const left = 1 - assemble;
    el.style.transform = `translate(${x * left}vw, ${y * left}vh) rotate(${r * left}deg)`;
    el.style.opacity = 0.25 + 0.75 * assemble;
  });
  hello.classList.toggle('on', p > HERO_ASSEMBLE_UNTIL);
  roles.forEach((li, i) => li.classList.toggle('on', p > ROLE_STEPS[i]));
  hint.style.opacity = p > 0.05 ? 0 : 1;
}

/* ---------- 2. ABOUT: light up words ---------- */
function updateReveal() {
  revealParas.forEach(p => {
    if (!p.offsetParent) return;                           // skip the hidden language
    const r = p.getBoundingClientRect();
    const t = clamp((vh() * 0.85 - r.top) / (vh() * 0.45 + r.height));
    const words = p.children;
    const lit = Math.round(t * words.length);
    for (let i = 0; i < words.length; i++) words[i].classList.toggle('on', i < lit);
  });
}

/* ---------- 3. SERVICES: shrink cards that are being covered ---------- */
const cards = [...document.querySelectorAll('.card')];
function updateCards() {
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    const gap = next.getBoundingClientRect().top - card.getBoundingClientRect().top;
    const covered = clamp(1 - gap / 300);                  // 0 = next card far away, 1 = on top
    card.style.transform = `scale(${1 - covered * 0.06})`;
    card.style.filter = `brightness(${1 - covered * 0.35})`;
  });
}

/* ---------- 4. WORK + PERSONAL: vertical scroll → sideways movement ---------- */
function updateWork() {
  hscrolls.forEach(section => {
    const track = section.querySelector('.track');
    const p = pinProgress(section);
    const distance = track.scrollWidth - window.innerWidth;  // how far the strip can slide
    track.style.transform = `translateX(${-distance * p}px)`;
  });
}

/* ---------- 5. TESTIMONIALS: switch quote ---------- */
function updateQuotes() {
  const p = pinProgress(quotesSection);
  const active = Math.min(quotes.length - 1, Math.floor(p * quotes.length));
  quotes.forEach((q, i) => q.classList.toggle('on', i === active));
  dots.forEach((d, i) => d.classList.toggle('on', i === active));
}

/* ---------- Top progress bar ---------- */
function updateBar() {
  const max = document.documentElement.scrollHeight - vh();
  bar.style.transform = `scaleX(${clamp(window.scrollY / max)})`;
}

/* ---------- Run on scroll (once per frame = smooth) ---------- */
let ticking = false;
function update() {
  updateBar();
  updateReveal();
  if (!calm) { updateHero(); updateCards(); updateWork(); updateQuotes(); }
  ticking = false;
}
function onScroll() { if (!ticking) { requestAnimationFrame(update); ticking = true; } }
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
window.addEventListener('load', update);
update();

/* ---------- Language switch (EN / ID) ---------- */
const html = document.documentElement;
const saved = localStorage.getItem('lang');
if (saved) html.dataset.lang = saved;
document.getElementById('langBtn').addEventListener('click', () => {
  html.dataset.lang = html.dataset.lang === 'en' ? 'id' : 'en';
  localStorage.setItem('lang', html.dataset.lang);
  update();
});