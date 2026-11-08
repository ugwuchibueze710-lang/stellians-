/* Stellian's — interactive layer */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = $('#home'), stage = $('#stage'), px = $('#px'), pizzaFg = $('#pizzaFg');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ================= NAV ================= */
const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40), { passive: true });
burger.addEventListener('click', () => {
  const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
});
$$('a', links).forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
const navMap = { home: 'home', eight: 'menu', menu: 'menu', shakes: 'menu', videos: 'reviews', gallery: 'gallery', reviews: 'reviews', visit: 'visit' };
const navObs = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const id = navMap[e.target.id]; if (!id) return;
  $$('a', links).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('section[id]').forEach(s => navObs.observe(s));

/* ================= NEON POWER ================= */
let neon = 0, target = 1, isOn = false, busy = false;
const sw = $('#neonSwitch'), hint = $('#switchHint');
const litG = document.querySelector('#neon .lit'), glassG = document.querySelector('#neon .glass');
function setNeon(v) {
  neon = v; root.style.setProperty('--neon', v.toFixed(3));
  if (litG) litG.setAttribute('opacity', v.toFixed(3));
  if (glassG) glassG.setAttribute('opacity', (1 - v * .6).toFixed(3));
}
setNeon(0);

// --- sound (synthesized, only after the user touches the switch) ---
let AC = null, master = null;
function audio() {
  if (AC) return AC;
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .55; master.connect(AC.destination); } catch (e) { AC = null; }
  return AC;
}
function noiseBuf(len) {
  const b = AC.createBuffer(1, AC.sampleRate * len, AC.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  return b;
}
function click() {
  if (!audio()) return;
  const t = AC.currentTime;
  const n = AC.createBufferSource(); n.buffer = noiseBuf(.05);
  const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1.4;
  const g = AC.createGain(); g.gain.value = .9;
  n.connect(f).connect(g).connect(master); n.start(t);
  const o = AC.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + .06);
  const og = AC.createGain(); og.gain.setValueAtTime(.5, t); og.gain.exponentialRampToValueAtTime(.001, t + .08);
  o.connect(og).connect(master); o.start(t); o.stop(t + .1);
}
function crackle(at) {
  if (!AC) return;
  const n = AC.createBufferSource(); n.buffer = noiseBuf(.04);
  const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
  const g = AC.createGain(); g.gain.value = .25;
  n.connect(f).connect(g).connect(master); n.start(AC.currentTime + at / 1000);
}
function hum(dur) {
  if (!AC) return;
  const t = AC.currentTime;
  const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 120;
  const o2 = AC.createOscillator(); o2.type = 'square'; o2.frequency.value = 240;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
  const g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .1); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(f); o2.connect(f); f.connect(g).connect(master);
  o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
}

// realistic ignition: tubes strike, stutter, then settle  (light pattern unchanged)
const ignite = [[0, .0], [60, .9], [110, .05], [190, .7], [230, 0], [330, .35], [360, .05], [470, 1], [520, .55], [580, 1], [900, .85], [960, 1]];

// ---- neon buzz sound, synced to every flicker step ----
let humNode = null;
function zap(level, quiet) {
  // electrical arc as the gas strikes: crackle + a burst of 120Hz transformer buzz
  if (!AC || AC.state !== 'running') return;
  const t = AC.currentTime, k = (quiet ? 0.35 : 1) * (0.45 + level * 0.55);
  const n = AC.createBufferSource(); n.buffer = noiseBuf(0.07 + Math.random() * 0.05);
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600 + Math.random() * 2400; bp.Q.value = 0.9;
  const ng = AC.createGain(); ng.gain.setValueAtTime(0.55 * k, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  n.connect(bp).connect(ng).connect(master); n.start(t);
  const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 120;
  const o2 = AC.createOscillator(); o2.type = 'square'; o2.frequency.value = 240;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
  const og = AC.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(0.16 * k, t + 0.008); og.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
  o.connect(lp); o2.connect(lp); lp.connect(og).connect(master);
  o.start(t); o2.start(t); o.stop(t + 0.13); o2.stop(t + 0.13);
}
function tick() { // tube dropping out: small dry snap
  if (!AC || AC.state !== 'running') return;
  const t = AC.currentTime, n = AC.createBufferSource(); n.buffer = noiseBuf(0.025);
  const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
  const g = AC.createGain(); g.gain.value = 0.18; n.connect(hp).connect(g).connect(master); n.start(t);
}
function humOn(level) { // steady neon hum that rides the brightness, then settles low
  if (!AC || AC.state !== 'running') return;
  if (!humNode) {
    const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 120;
    const o2 = AC.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 60;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    const g = AC.createGain(); g.gain.value = 0;
    o.connect(lp); o2.connect(lp); lp.connect(g).connect(master); o.start(); o2.start();
    humNode = { g };
  }
  const t = AC.currentTime;
  humNode.g.gain.cancelScheduledValues(t);
  humNode.g.gain.setTargetAtTime(0.05 * level, t, 0.01);
}
function humSettle() { if (humNode && AC) { const t = AC.currentTime; humNode.g.gain.setTargetAtTime(0.012, t + 0.3, 0.6); } }
function humOff() { if (humNode && AC) humNode.g.gain.setTargetAtTime(0, AC.currentTime, 0.03); }

function runIgnite(sound) {
  let prev = neon;
  ignite.forEach(([ms, v]) => setTimeout(() => {
    setNeon(v);
    if (sound) {
      if (v > prev + 0.2) zap(v); else if (v < prev - 0.2) tick();
      humOn(v);
    }
    prev = v;
  }, ms));
  setTimeout(() => { busy = false; if (sound) humSettle(); }, 1000);
}
function power(on, sound) {
  if (busy) return;
  isOn = on; busy = true;
  sw.setAttribute('aria-pressed', on);
  document.body.classList.toggle('neon-on', on);
  if (sound) { click(); }
  kickCable(on ? -1 : 1);
  if (reduce) { setNeon(on ? 1 : 0); busy = false; return; }
  if (on) {
    runIgnite(sound);
  } else {
    if (sound) { tick(); humOff(); }
    setNeon(.18); setTimeout(() => setNeon(.06), 60); setTimeout(() => { setNeon(0); busy = false; }, 220);
  }
}
let heardIgnite = false;
sw.addEventListener('click', () => {
  hint.classList.add('gone');
  heardIgnite = true;
  if (AC && AC.state === 'suspended') AC.resume();
  power(!isOn, true);
});
// Browsers block sound until the visitor's first click/tap/key. On that first touch,
// the sign re-strikes once with the full buzz synced to the flicker.
function firstTouch(e) {
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => removeEventListener(ev, firstTouch, true));
  if (e.target && e.target.closest && e.target.closest('#neonSwitch')) { audio(); return; }
  if (!audio()) return;
  const go = () => {
    if (heardIgnite || !isOn) return;
    heardIgnite = true;
    const wait = () => busy ? setTimeout(wait, 120) : (busy = true, runIgnite(true));
    wait();
  };
  AC.state === 'running' ? go() : AC.resume().then(go).catch(() => {});
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, firstTouch, true));
// idle "aging tube" micro flicker while on
setInterval(() => {
  if (!isOn || busy || reduce) return;
  if (Math.random() < .25) { setNeon(.82); tick(); setTimeout(() => { setNeon(1); zap(1, true); }, 70); }
}, 2600);

/* ================= CABLE (verlet rope) ================= */
const cv = $('#cable'), cx = cv.getContext('2d');
const transformer = $('#transformer'), plate = $('.plate', sw);
let pts = [], A = { x: 0, y: 0 }, B = { x: 0, y: 0 }, seg = 10, N = 34, dpr = 1;
const ptr = { x: -999, y: -999, vx: 0, vy: 0, inside: false };
function anchors() {
  const h = stage.getBoundingClientRect();
  const t = transformer.getBoundingClientRect(), p = plate.getBoundingClientRect();
  A = { x: t.left - h.left + t.width * .5, y: t.bottom - h.top - 2 };
  B = { x: p.left - h.left + p.width * .5, y: p.top - h.top + 3 };
  return h;
}
function buildRope() {
  const h = anchors();
  dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = h.width * dpr; cv.height = h.height * dpr;
  const dist = Math.hypot(B.x - A.x, B.y - A.y);
  const len = dist * 1.25 + h.width * .045;
  seg = len / (N - 1);
  pts = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = A.x + (B.x - A.x) * t, y = A.y + (B.y - A.y) * t + Math.sin(t * Math.PI) * 60;
    pts.push({ x, y, ox: x, oy: y });
  }
}
function kickCable(dir) {
  for (let i = N - 8; i < N - 1; i++) { pts[i] && (pts[i].oy += dir * 3 * (i - N + 9) / 8, pts[i].ox += 2); }
}
function stepRope() {
  const g = 0.5, damp = 0.985;
  for (let i = 1; i < N - 1; i++) {
    const p = pts[i];
    const vx = (p.x - p.ox) * damp, vy = (p.y - p.oy) * damp;
    p.ox = p.x; p.oy = p.y;
    p.x += vx; p.y += vy + g;
    // pointer pushes the cable
    if (ptr.inside) {
      const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy);
      if (d < 34 && d > .01) { const f = (34 - d) / 34; p.x += dx / d * f * 6 + ptr.vx * .25 * f; p.y += dy / d * f * 6 + ptr.vy * .25 * f; }
    }
  }
  pts[0].x = A.x; pts[0].y = A.y; pts[N - 1].x = B.x; pts[N - 1].y = B.y;
  for (let k = 0; k < 18; k++) {
    for (let i = 0; i < N - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .001, diff = (d - seg) / d * .5;
      const ox = dx * diff, oy = dy * diff;
      if (i !== 0) { a.x += ox; a.y += oy; }
      if (i + 1 !== N - 1) { b.x -= ox; b.y -= oy; }
    }
  }
}
function pathRope(ox = 0, oy = 0) {
  cx.beginPath(); cx.moveTo(pts[0].x + ox, pts[0].y + oy);
  for (let i = 1; i < N - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
    cx.quadraticCurveTo(pts[i].x + ox, pts[i].y + oy, mx + ox, my + oy);
  }
  cx.lineTo(pts[N - 1].x + ox, pts[N - 1].y + oy);
}
function drawRope() {
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, cv.width, cv.height);
  const s = Math.max(.55, cv.width / dpr / 1672);
  cx.lineCap = 'round'; cx.lineJoin = 'round';
  // shadow cast on the wall
  cx.save(); cx.filter = 'blur(5px)'; cx.strokeStyle = 'rgba(0,0,0,.55)'; cx.lineWidth = 8 * s; pathRope(9, 14); cx.stroke(); cx.restore();
  // rubber jacket
  cx.strokeStyle = '#0c0c0d'; cx.lineWidth = 7 * s; pathRope(); cx.stroke();
  cx.strokeStyle = '#1d1d20'; cx.lineWidth = 4.5 * s; pathRope(); cx.stroke();
  // specular + red neon reflection
  cx.strokeStyle = 'rgba(255,255,255,.22)'; cx.lineWidth = 1.3 * s; pathRope(-1, -1.8); cx.stroke();
  cx.strokeStyle = `rgba(255,40,55,${(.55 * neon).toFixed(3)})`; cx.lineWidth = 1.6 * s; pathRope(-.6, -2.2); cx.stroke();
  // strain-relief collars
  [pts[0], pts[N - 1]].forEach(p => { cx.fillStyle = '#2c2d31'; cx.beginPath(); cx.arc(p.x, p.y, 6 * s, 0, 7); cx.fill(); cx.fillStyle = '#8b8f96'; cx.beginPath(); cx.arc(p.x - 1.5 * s, p.y - 1.5 * s, 2 * s, 0, 7); cx.fill(); });
}

/* ================= PARALLAX + REACTIVE FOOD ================= */
const layers = $$('.food', stage).map(el => ({ el, d: parseFloat(el.dataset.depth || 1), tilt: true, glare: $('.glare', el), seed: Math.random() * 10 }));
let mx = 0, my = 0, tmx = 0, tmy = 0;
hero.addEventListener('pointermove', e => {
  const r = stage.getBoundingClientRect();
  tmx = (e.clientX - r.left) / r.width * 2 - 1; tmy = (e.clientY - r.top) / r.height * 2 - 1;
  const x = e.clientX - r.left, y = e.clientY - r.top;
  if (!ptr.inside) { ptr.x = x; ptr.y = y; }
  ptr.vx = clamp(x - ptr.x, -30, 30); ptr.vy = clamp(y - ptr.y, -30, 30); ptr.x = x; ptr.y = y; ptr.inside = true;
});
hero.addEventListener('pointerleave', () => { tmx = 0; tmy = 0; ptr.inside = false; });
// phone: tilt with the device
addEventListener('deviceorientation', e => {
  if (e.gamma == null) return; tmx = clamp(e.gamma / 30, -1, 1); tmy = clamp((e.beta - 45) / 30, -1, 1);
}, { passive: true });

let heroVisible = true;
new IntersectionObserver(([e]) => heroVisible = e.isIntersecting).observe(hero);
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  if (!heroVisible) return;
  const t = now / 1000; last = now;
  mx += (tmx - mx) * .07; my += (tmy - my) * .07;
  const k = stage.clientWidth / 1672;
  px.style.transform = `translate3d(${(-mx * 9 * k).toFixed(2)}px,${(-my * 6 * k).toFixed(2)}px,0) scale(1.03)`;
  pizzaFg.style.transform = px.style.transform;
  
  root.style.setProperty('--breath', (0.85 + Math.sin(t * 1.7) * 0.08 + Math.sin(t * 7.3) * 0.03).toFixed(3));
  for (const L of layers) {
    let tf = `translate3d(${(-mx * L.d * 16 * k).toFixed(2)}px,${(-my * L.d * 9 * k).toFixed(2)}px,0)`;
    if (L.tilt && !reduce) {
      const bob = Math.sin(t * 1.3 + L.seed) * 3 * k;
      const ry = mx * 14 + Math.sin(t * .7 + L.seed) * 2.5, rx = -my * 8;
      tf += ` translateY(${bob.toFixed(2)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
      if (L.glare) L.glare.style.setProperty('--gx', (50 + mx * 60 + Math.sin(t * .5 + L.seed) * 15).toFixed(1) + '%');
    }
    L.el.style.transform = tf;
  }
  if (pts.length) { anchors(); if (!reduce) stepRope(); drawRope(); }
}

/* ================= MENU DATA (from Stellian's published menu) ================= */
const P = 'img/';
const SPEC = ['10.59', '14.59', '18.59'];
const MENU = [
  { id: 'eight', tab: '8LB Pizza', title: "The Stellian's Special", sub: 'Brick-oven Chicago-style stuffed crust — the pizza that brings everyone to town.', img: P + 'pizza-8lb-cut.jpg', cap: '8 pounds of pizza', items: [
    { n: "The Stellian's Special", d: 'Crust, toppings, cheese — then another crust with sauce and more cheese. Could weigh up to 8 lbs!', p: '27.99', img: P + 'pizza-8lb-cut.jpg', cap: 'Cut open' },
    { n: '8LB Meat Lovers', d: 'Ham, sausage, beef & pepperoni stuffed between two crusts. House pick for max weight.', p: '27.99', img: P + 'pizza-8lb.jpg', cap: 'Fresh from the oven' },
    { n: '8LB The Works', d: 'Pepperoni, Italian sausage, beef, onions, bell peppers, mushrooms, black olives & banana peppers.', p: '27.99', img: P + 'pizza-8lb.jpg', cap: 'The Works' },
    { n: '8 Pound Chowdown Challenge', d: 'Whole Special + a Freak Shake in 40 minutes = meal on the house and the t-shirt.', p: 'FREE*', img: P + 'pizza-8lb-cut.jpg', cap: 'Think you can?' }
  ]},
  { id: 'pizza', tab: 'Pizzas', title: 'Specialty Pizzas', sub: 'Every specialty, three sizes. Cauliflower crust available on mediums.', sizes: true, img: P + 'meat-lovers.jpg', cap: 'Meat Lovers', items: [
    { n: 'Meat Lovers', d: 'Ham, sausage, beef, pepperoni and mozzarella.', p: SPEC, img: P + 'meat-lovers.jpg', cap: 'Meat Lovers' },
    { n: 'The Works', d: 'Pepperoni, Italian sausage, beef, onions, bell peppers, mushrooms, black olives, banana peppers, mozzarella.', p: SPEC, img: P + 'menu/the-works.webp', cap: 'The Works' },
    { n: 'Hawaiian Delight', d: 'Ham, pineapple, bacon and mozzarella.', p: SPEC, img: P + 'menu/hawaiian.webp', cap: 'Hawaiian Delight' },
    { n: 'Bacon Cheeseburger', d: 'Bacon, shredded cheese, beef, ketchup, mustard and pickle.', p: SPEC, img: P + 'menu/bacon-cheeseburger-pizza.webp', cap: 'Bacon Cheeseburger' },
    { n: 'White Pizza', d: 'Housemade Alfredo, grilled chicken, mushrooms, bacon and mozzarella.', p: SPEC, img: P + 'menu/white-pizza.webp', cap: 'White Pizza' },
    { n: 'BBQ Chicken', d: 'Grilled chicken, mozzarella, chopped red onion and BBQ sauce.', p: SPEC, img: P + 'menu/bbq-chicken-pizza.webp', cap: 'BBQ Chicken' },
    { n: 'Buffalo Chicken', d: 'Grilled chicken, onions, cheddar and housemade buffalo sauce.', p: SPEC, img: P + 'menu/buffalo-chicken-pizza.webp', cap: 'Buffalo Chicken' },
    { n: 'Taco Pizza', d: 'Seasoned beef, shredded cheese, lettuce, tomato, black olives — salsa & sour cream on the side.', p: SPEC, img: P + 'menu/taco-pizza.webp', cap: 'Taco Pizza' },
    { n: 'Vegetarian', d: 'Bell peppers, onions, mushrooms, black olives, tomatoes and mozzarella.', p: SPEC, img: P + 'menu/vegetarian-pizza.webp', cap: 'Vegetarian' },
    { n: 'Build Your Own', d: 'Cheese pizza + your toppings: pepperoni, beef, Italian sausage, bacon, ham, onion, banana peppers, mushrooms, olives, pineapple, bell peppers, jalapeños.', p: ['7.49', '9.49', '10.49'], img: P + 'menu/cheese-pizza-pull.webp', cap: 'Build Your Own' }
  ]},
  { id: 'start', tab: 'Starters', title: 'Starters', sub: 'Made to share. Or not.', img: P + 'mozzi-bread.jpg', cap: 'Mozzi Bread', items: [
    { n: 'Mozzi Bread', d: 'The cheesy legend — order it every time.', p: '8.99', img: P + 'mozzi-bread.jpg', cap: 'Mozzi Bread' },
    { n: 'Batter-Fried Mushrooms', d: 'Golden and about the size of baseballs.', p: '9.49', img: P + 'menu/fried-mushrooms.webp', cap: 'Batter-Fried Mushrooms' },
    { n: 'Spinach & Artichoke Dip', d: 'Hot, creamy, scoopable.', p: '9.49', img: P + 'menu/spinach-dip.webp', cap: 'Spinach & Artichoke Dip' },
    { n: 'Fried Pickles or Pepperoncini Rings', d: 'Crispy, tangy, with dipping sauce.', p: '7.49', img: P + 'fried-pepperoncini.jpg', cap: 'Fried Pepperoncini' },
    { n: 'Breadsticks', d: 'Warm, buttery, with house sauce.', p: '7.49', img: P + 'menu/breadsticks.webp', cap: 'Breadsticks' },
    { n: 'Hawg Skins', d: 'Super puffy, super crispy.', p: '8.49', img: P + 'menu/hawg-skins.webp', cap: 'Hawg Skins' },
    { n: 'Totchos', d: 'Tater tots loaded nacho-style.', p: '9.99', img: P + 'menu/totchos.webp', cap: 'Totchos' },
    { n: 'Meatballs', d: 'Homemade with a little red-pepper kick.', p: '9.99', img: P + 'menu/meatballs.webp', cap: 'Meatballs' }
  ]},
  { id: 'wings', tab: 'Wings', title: 'Wings by the Pound', sub: 'Bone-in or boneless, tossed in your sauce.', heat: true, img: P + 'menu/wings-bone-in.webp', cap: 'Bone-In · 1 lb', items: [
    { n: 'Bone-In · 1 lb', d: 'Classic wings, one sauce.', p: '11.99', img: P + 'menu/wings-bone-in.webp', cap: 'Bone-In · 1 lb' },
    { n: 'Bone-In · 2 lb', d: 'Two sauces, double the napkins.', p: '21.99', img: P + 'menu/wings-bone-in.webp', cap: 'Bone-In · 2 lb' },
    { n: 'Boneless · 1 lb', d: 'All meat, no work.', p: '12.59', img: P + 'menu/wings-boneless.webp', cap: 'Boneless · 1 lb' },
    { n: 'Boneless · 2 lb', d: 'Feeds the table.', p: '22.59', img: P + 'menu/wings-boneless.webp', cap: 'Boneless · 2 lb' }
  ]},
  { id: 'pasta', tab: 'Pasta & Salads', title: 'Pasta & Salads', sub: 'Italian comfort, Kentucky portions.', img: P + 'menu/chicken-alfredo.webp', cap: 'Chicken Pasta Alfredo', items: [
    { n: 'Chicken Pasta Alfredo', d: 'Housemade Alfredo, grilled chicken.', p: '12.99', img: P + 'menu/chicken-alfredo.webp', cap: 'Chicken Pasta Alfredo' },
    { n: 'Spaghetti & Meatballs', d: 'Homemade meatballs, red sauce.', p: '11.99', img: P + 'menu/spaghetti-meatballs.webp', cap: 'Spaghetti & Meatballs' },
    { n: 'Baked Lasagna', d: 'Layered, baked, bubbling.', p: '11.49', img: P + 'menu/lasagna.webp', cap: 'Baked Lasagna' },
    { n: 'Calzone', d: '$1 per extra topping.', p: '9.99', img: P + 'menu/calzone.webp', cap: 'Calzone' },
    { n: 'Jumbo Ravioli', d: 'Big pillows, big sauce.', p: '10.99', img: P + 'menu/ravioli.webp', cap: 'Jumbo Ravioli' },
    { n: 'Chicken Salad', d: 'Grilled or fried chicken on greens, tomatoes, green peppers, onions, cheddar.', p: '11.49', img: P + 'menu/chicken-salad.webp', cap: 'Chicken Salad' },
    { n: 'Clubhouse Salad', d: 'Ham, turkey, bacon, onions, bell & banana peppers, tomatoes, black olives, mushrooms.', p: '11.49', img: P + 'menu/clubhouse-salad.webp', cap: 'Clubhouse Salad' },
    { n: 'Side Salad', d: 'Dressings: Stellian\'s House poppy-seed vinaigrette, Ranch, Honey Mustard, Bleu Cheese, Thousand Island, Italian, French.', p: '3.49', img: P + 'menu/side-salad.webp', cap: 'Side Salad' }
  ]},
  { id: 'sand', tab: 'Sandwiches', title: 'Sandwich Combos', sub: 'All sandwiches and baskets served with fries.', img: P + 'menu/italian-beef.webp', cap: 'Italian Stellian', items: [
    { n: 'Italian Stellian', d: 'Italian beef, mozzarella, roasted bell peppers & onions, au jus.', p: '11.99', img: P + 'menu/italian-beef.webp', cap: 'Italian Stellian' },
    { n: 'Meatball Grinder', d: 'Meatballs in spaghetti sauce with mozzarella.', p: '11.99', img: P + 'menu/meatball-grinder.webp', cap: 'Meatball Grinder' },
    { n: 'Chicken Parmesan', d: 'Two breaded tenders, house pizza sauce, melted provolone.', p: '11.99', img: P + 'menu/chicken-parm-sandwich.webp', cap: 'Chicken Parmesan' },
    { n: 'Italian Combo', d: 'Sausage, ham, pepperoni, onion, mozzarella, bell pepper, Italian dressing.', p: '11.49', img: P + 'menu/italian-combo.webp', cap: 'Italian Combo' },
    { n: 'Stromboli', d: 'House pizza sauce, sausage, pepperoni, cheese, bell pepper, onion.', p: '11.49', img: P + 'menu/stromboli.webp', cap: 'Stromboli' },
    { n: 'The Stellian Club', d: 'Hot ham, turkey, bacon, lettuce, tomato, cheddar, mayo.', p: '10.99', img: P + 'menu/club-sandwich.webp', cap: 'The Stellian Club' },
    { n: 'Turkey Grinder', d: 'Turkey, bacon, lettuce, tomato, mozzarella, mayo.', p: '10.99', img: P + 'menu/turkey-grinder.webp', cap: 'Turkey Grinder' },
    { n: 'Hamburger Basket', d: 'Lettuce, tomato, pickle & onion. Add cheese.', p: '10.49', img: P + 'menu/hamburger-basket.webp', cap: 'Hamburger Basket' },
    { n: 'Pizza Burger Basket', d: 'Pepperoni, mozzarella and house pizza sauce.', p: '10.49', img: P + 'menu/pizza-burger.webp', cap: 'Pizza Burger Basket' }
  ]},
  { id: 'shake', tab: 'Freak Shakes', title: 'Freak Shakes & Monster Sundaes', sub: 'Over-the-top, hand-built, made for the camera.', img: P + 'shake-strawberry-cheesecake.jpg', cap: 'Strawberry Cheesecake', items: [
    { n: 'Strawberry Cheesecake', d: 'Whipped cream mountain, graham rim, strawberry drizzle.', p: '9.99', img: P + 'shake-strawberry-cheesecake.jpg', cap: 'Strawberry Cheesecake' },
    { n: 'Chocolate Overload', d: 'Chocolate on chocolate on chocolate.', p: '9.99', img: P + 'shakes-chocolate.jpg', cap: 'Chocolate Overload' },
    { n: "Peanut Butter S'more", d: 'Peanut butter, graham, toasted marshmallow vibes.', p: '9.99', img: P + 'shakes-chocolate.jpg', cap: "PB S'more" },
    { n: 'Cookies-n-Cream', d: 'Cookie crumble everything.', p: '9.99', img: P + 'menu/cookies-n-cream.webp', cap: 'Cookies-n-Cream' },
    { n: 'Seasonal Shake', d: 'Ask your server what\'s loaded on top this season.', p: '9.99', img: P + 'shake-sprinkles.jpg', cap: 'Seasonal special' },
    { n: 'Chocolate Sundae', d: 'Monster-sized.', p: '11', img: P + 'menu/chocolate-sundae.webp', cap: 'Chocolate Sundae' },
    { n: 'Strawberry Sundae', d: 'Monster-sized.', p: '11', img: P + 'menu/strawberry-sundae.webp', cap: 'Strawberry Sundae' }
  ]},
  { id: 'kids', tab: 'Kids', title: 'Kids Menu', sub: 'For kids 10 and under.', img: P + 'menu/kids-cheese-pizza.webp', cap: 'Child\'s Cheese Pizza', items: [
    { n: "Child's Cheese Pizza", d: 'Extra toppings available.', p: 'ASK', img: P + 'menu/kids-cheese-pizza.webp', cap: 'Child\'s Cheese Pizza' },
    { n: 'Chicken Tender Basket', d: 'One tender and fries.', p: '4.99', img: P + 'menu/chicken-tenders.webp', cap: 'Chicken Tender Basket' },
    { n: "Child's Spaghetti", d: 'Just like the grown-up one.', p: '4.99', img: P + 'menu/kids-spaghetti.webp', cap: 'Child\'s Spaghetti' }
  ]}
];
const SAUCES = [['House Sauce', 1], ['Sweet BBQ', 1], ['Honey BBQ', 1], ['Caribbean Jerk', 2], ['Sweet Heat', 2], ['Buffalo', 3], ['Mango Habanero', 4], ['Extra Hot Buffalo', 4], ['Ghost Pepper', 5]];

const tabs = $('#tabs'), board = $('#board'), list = $('#boardList'), card = $('#photoCard'), pimg = $('#photoImg'), pcap = $('#photoCap'), extra = $('#photoExtra');
let cur = null, swapT = null;
MENU.forEach((c, i) => {
  const b = document.createElement('button'); b.className = 'tab'; b.role = 'tab'; b.textContent = c.tab;
  b.setAttribute('aria-selected', i === 0); b.addEventListener('click', () => openCat(c, true));
  c.btn = b; tabs.appendChild(b);
});
const price = p => Array.isArray(p) ? `<span class="pr multi">${p.map(x => `<span class="pbox">${x}</span>`).join('')}</span>` : `<span class="pr"><span class="pbox">${p}</span></span>`;
function renderCat(c) {
  c.items.forEach(it => { if (it.img) { const im = new Image(); im.src = it.img; } });
  list.innerHTML = `<h3 class="cat-title">${c.title}</h3><p class="cat-sub">${c.sub}</p>` +
    (c.sizes ? `<div class="size-row"><span>SMALL</span>·<span>MEDIUM</span>·<span>LARGE</span></div>` : '') +
    `<ul class="items">${c.items.map((it, k) => `<li class="item" data-k="${k}"><span class="th"><img src="${it.img}" alt="${it.n.replace(/"/g, '&quot;')}" loading="lazy" decoding="async"></span><span class="nm">${it.n}</span><span class="ds">${it.d}</span>${price(it.p)}</li>`).join('')}</ul>`;
  extra.innerHTML = c.heat ? `<p class="cat-sub" style="margin:0">Sauces · mild → wild</p><div class="heat">${SAUCES.map(([s, h]) => `<div><span>${s}</span><b style="width:${h * 20}%"></b></div>`).join('')}</div>` : '';
  showPhoto(c.img, c.cap, true);
  $$('.item', list).forEach(li => {
    const it = c.items[li.dataset.k];
    const on = () => { $$('.item.hot', list).forEach(x => x.classList.remove('hot')); li.classList.add('hot'); if (it.img) showPhoto(it.img, it.cap); };
    li.addEventListener('pointerenter', on); li.addEventListener('click', on);
  });
}
function showPhoto(src, cap, instant) {
  if (pimg.getAttribute('src') === src && pcap.textContent === cap) return;
  clearTimeout(swapT);
  if (instant) { pimg.src = src; pcap.textContent = cap; pimg.alt = cap; return; }
  card.classList.add('swap');
  swapT = setTimeout(() => { pimg.src = src; pcap.textContent = cap; pimg.alt = cap; card.classList.remove('swap'); }, 260);
}
function openCat(c, anim) {
  if (c === cur) return; cur = c;
  MENU.forEach(m => m.btn.setAttribute('aria-selected', m === c));
  if (!anim || reduce) return renderCat(c);
  board.classList.add('flip-out');
  setTimeout(() => {
    renderCat(c);
    board.classList.remove('flip-out'); board.classList.add('flip-in');
    void board.offsetWidth;
    board.classList.remove('flip-in');
  }, 320);
}
openCat(MENU[0], false);
const bStage = $('#boardStage');
bStage.addEventListener('pointermove', e => {
  const r = bStage.getBoundingClientRect();
  board.style.setProperty('--bx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
  board.style.setProperty('--by', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
});
bStage.addEventListener('pointerleave', () => { board.style.setProperty('--bx', 0); board.style.setProperty('--by', 0); });

/* ================= 8LB photo tilt ================= */
$$('[data-tilt-card]').forEach(el => {
  const img = $('img', el);
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    img.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg) scale(1.03)`;
  });
  el.addEventListener('pointerleave', () => img.style.transform = '');
});

/* ================= FREAK SHAKE COVERFLOW ================= */
const SHAKES = [
  { src: 'img/cut/shake-strawberry.webp', n: 'Strawberry Cheesecake', d: 'A fan favorite — whipped cream, graham rim, strawberry everything.', p: '9.99' },
  { src: 'img/cut/shake-birthday.webp', n: 'Seasonal Freak Shake', d: 'Brownies, candy, sprinkles — ask your server what\'s on top this season.', p: '9.99' },
  { src: 'img/shakes-chocolate.jpg', n: "Chocolate Overload & PB S'more", d: 'Bring a friend. Or don\'t.', p: '9.99', photo: true },
  { src: 'img/shake-sprinkles.jpg', n: 'Built at the Table', d: 'Every Freak Shake is hand-stacked to order.', p: '9.99', photo: true },
  { src: 'img/shake-strawberry-cheesecake.jpg', n: 'Pairs with Pizza', d: 'The Chowdown Challenge includes one — finish both in 40 minutes.', p: '9.99', photo: true }
];
const track = $('#flowTrack'), finfo = $('#flowInfo');
let fi = 0, fTimer;
const fcards = SHAKES.map((s, i) => {
  const d = document.createElement('div'); d.className = 'fcard' + (s.photo ? ' photo' : '');
  d.innerHTML = `<img src="${s.src}" alt="${s.n}" loading="lazy" ${s.wide ? 'style="max-width:none;max-height:70%"' : ''}>`;
  d.addEventListener('click', () => { if (i !== fi) { fi = i; layoutFlow(); } });
  track.appendChild(d); return d;
});
function layoutFlow() {
  const n = SHAKES.length, w = Math.min(innerWidth * .26, 340);
  fcards.forEach((c, i) => {
    let o = i - fi; if (o > n / 2) o -= n; if (o < -n / 2) o += n;
    const a = Math.abs(o);
    c.style.transform = `translateX(${o * w * 1.02}px) translateZ(${-a * 260}px) rotateY(${-o * 30}deg)`;
    c.style.zIndex = 10 - a; c.style.opacity = a > 2 ? 0 : 1; c.style.filter = `brightness(${1 - a * .3})`;
  });
  const s = SHAKES[fi];
  finfo.innerHTML = `<h3>${s.n}</h3><p>${s.d}</p><span class="pbox">$${s.p}</span>`;
}
const go = d => { fi = (fi + d + SHAKES.length) % SHAKES.length; layoutFlow(); };
$('#flowPrev').addEventListener('click', () => go(-1));
$('#flowNext').addEventListener('click', () => go(1));
let dx0 = null;
$('#flow').addEventListener('pointerdown', e => dx0 = e.clientX);
addEventListener('pointerup', e => { if (dx0 == null) return; const d = e.clientX - dx0; dx0 = null; if (Math.abs(d) > 50) go(d < 0 ? 1 : -1); });
const autoFlow = () => { clearInterval(fTimer); if (!reduce) fTimer = setInterval(() => go(1), 4800); };
$('#flow').addEventListener('pointerenter', () => clearInterval(fTimer));
$('#flow').addEventListener('pointerleave', autoFlow);
layoutFlow(); autoFlow();
addEventListener('resize', layoutFlow);

/* ================= VIDEOS ================= */
$$('.video').forEach(v => v.addEventListener('click', () => {
  v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1&rel=0" title="Stellian's video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}, { once: true }));

/* ================= GALLERY + LIGHTBOX ================= */
const GAL = [
  ['pizza-8lb-cut.jpg', 'The 8LB, cut open'], ['shakes-chocolate.jpg', 'Freak Shakes'], ['interior.jpg', 'The dollar-bill room'],
  ['meat-lovers.jpg', 'Meat Lovers'], ['shake-strawberry-cheesecake.jpg', 'Strawberry Cheesecake'], ['mozzi-bread.jpg', 'Mozzi Bread'],
  ['pizza-8lb.jpg', 'Stuffed crust'], ['fried-pepperoncini.jpg', 'Fried Pepperoncini'], ['shake-sprinkles.jpg', 'Seasonal Shake'],
  ['pizza-togo.jpg', 'Carry-out'], ['storefront.jpg', 'Downtown Central City']
];
const mas = $('#masonry');
GAL.forEach(([f, c]) => { const d = document.createElement('figure'); d.className = 'gitem reveal'; d.innerHTML = `<img src="img/${f}" alt="${c}" loading="lazy"><span>${c}</span>`; mas.appendChild(d); });
const strip = $('#strip');
for (let i = 1; i <= 7; i++) { const im = new Image(); im.src = `img/menu-scan-${i}.jpg`; im.alt = `Stellian's printed menu page ${i}`; im.loading = 'lazy'; strip.appendChild(im); }
const lb = $('#lightbox'), lbImg = $('#lbImg');
document.addEventListener('click', e => {
  const im = e.target.closest('.gitem img, .gitem, .strip img'); if (!im) return;
  const src = (im.tagName === 'IMG' ? im : $('img', im)).src;
  lbImg.src = src; lb.hidden = false;
});
lb.addEventListener('click', e => { if (e.target !== lbImg) lb.hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; });

/* ================= REVEAL ================= */
const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: .12 });
$$('.reveal').forEach(el => rv.observe(el));

/* ================= OPEN NOW (Central Time) ================= */
(function hours() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).map(p => [p.type, p.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  const mins = (+parts.hour % 24) * 60 + +parts.minute;
  const close = (day === 5 || day === 6) ? 22 * 60 : 21 * 60;
  const open = mins >= 11 * 60 && mins < close;
  const el = $('#openNow'); el.classList.add(open ? 'open' : 'closed');
  $('span', el).textContent = open ? `Open now · until ${close / 60 - 12} PM` : 'Closed now · opens 11 AM';
  const row = $(`#hours tr[data-d="${day}"]`); row && row.classList.add('today');
  setTimeout(hours, 60000);
})();
$('#yr').textContent = new Date().getFullYear();


/* ================= ENDLESS NEON FIELD =================
   Hundreds of the real Stellian's sign (cut from the hero photo) at three depths.
   They fall with your scroll (nearer = faster), tilt and streak with scroll speed,
   and every sign buzzes / flickers on its own like aging neon. */
(function neonField() {
  const cv = document.getElementById('neonField'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const sprite = new Image(); sprite.src = 'img/hero/neon-sprite.webp';
  const AR = 368 / 468;
  const BASE = [
    { n: 0.000045, w: [46, 70],  speed: 0.18, alpha: 0.26, blur: 1.6 },
    { n: 0.000030, w: [78, 112], speed: 0.38, alpha: 0.42, blur: 0.6 },
    { n: 0.000012, w: [128, 170], speed: 0.72, alpha: 0.62, blur: 0 }
  ];
  let LAYERS = BASE;
  let W = 0, H = 0, dpr = 1, items = [], bake = [];
  let lastY = scrollY, vel = 0, smoothVel = 0;
  function bakeSprites() {
    // pre-render each layer's sprite once at its blur level (fast drawing every frame)
    bake = LAYERS.map(L => {
      const w = Math.round(L.w[1] * dpr), h = Math.round(w * AR);
      const c = document.createElement('canvas'); c.width = w + 40; c.height = h + 40;
      const x = c.getContext('2d');
      if (L.blur) x.filter = `blur(${L.blur * dpr}px)`;
      x.drawImage(sprite, 20, 20, w, h);
      return c;
    });
  }
  function build() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    // keep the signs "tiny" on phones / narrow windows
    const k = Math.max(0.5, Math.min(1, W / 1200));
    LAYERS = BASE.map(L => ({ ...L, w: [L.w[0] * k, L.w[1] * k] }));
    cv.width = W * dpr; cv.height = H * dpr;
    items = [];
    const span = H + 260;
    LAYERS.forEach((L, li) => {
      // jittered grid = evenly filled, no clumps, no empty holes
      const cw = L.w[1] * (li === 0 ? 1.55 : li === 1 ? 1.75 : 2.1), ch = cw * AR * 1.55;
      const cols = Math.ceil((W + 120) / cw), rows = Math.ceil(span / ch);
      const ox = Math.random() * cw, oy = Math.random() * ch;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const px = (c * cw + ox + (r % 2) * cw * 0.5 + (Math.random() - .5) * cw * 0.45) % (W + 120);
        const py = (r * ch + oy + (Math.random() - .5) * ch * 0.4) % span;
        items.push({
          li, x: px / (W + 120), y: py / span, w: L.w[0] + Math.random() * (L.w[1] - L.w[0]),
          rot: (Math.random() - .5) * 0.45, spin: (Math.random() - .5) * 0.0006,
          ph: Math.random() * 1000, flick: 0, next: performance.now() + 800 + Math.random() * 9000
        });
      }
    });
    items.sort((a, b) => a.li - b.li);
    if (sprite.complete && sprite.naturalWidth) bakeSprites();
  }
  sprite.onload = bakeSprites;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || !bake.length) return;
    const sy = scrollY; vel = sy - lastY; lastY = sy;
    smoothVel += (vel - smoothVel) * 0.15;
    const tilt = Math.max(-0.35, Math.min(0.35, smoothVel * 0.006));
    const stretch = 1 + Math.min(0.6, Math.abs(smoothVel) * 0.012);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const span = H + 260;
    for (const it of items) {
      const L = LAYERS[it.li], img = bake[it.li];
      // falls DOWN as you scroll down, endlessly wrapping
      let y = (it.y * span + sy * L.speed + Math.sin(now / 2400 + it.ph) * 6) % span;
      if (y < 0) y += span;
      y -= 130;
      const x = it.x * (W + 120) - 60 + Math.sin(now / 3100 + it.ph) * 4;
      // neon flicker: occasional stutter, rare blackout
      if (now > it.next) { it.flick = now + 60 + Math.random() * 260; it.next = now + 2500 + Math.random() * 12000; }
      let a = L.alpha;
      if (now < it.flick) a *= (Math.floor(now / 45) % 2) ? 0.15 : 0.85;
      a *= 0.92 + Math.sin(now / 90 + it.ph) * 0.04; // mains hum
      ctx.globalAlpha = a;
      const w = it.w, h = w * AR;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(it.rot + tilt * (0.5 + it.li * 0.4) + now * it.spin * 0.05);
      ctx.scale(1, it.li === 2 ? stretch : 1 + (stretch - 1) * 0.5);
      ctx.drawImage(img, -w / 2 - 20 * (w / (L.w[1])), -h / 2 - 20 * (w / (L.w[1])), (img.width / dpr) * (w / L.w[1]), (img.height / dpr) * (w / L.w[1]));
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  build();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  if (!reduce) requestAnimationFrame(frame); else sprite.onload = () => { bakeSprites(); frame(performance.now()); };
})();

/* ================= BOOT ================= */
function layout() { buildRope(); }
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 150); });
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  layout();
  requestAnimationFrame(frame);
  // the sign strikes itself on when the page opens
  setTimeout(() => {
    let allowed = false;
    try { if (audio() && AC.state === 'running') allowed = true; } catch (e) {}
    if (allowed) heardIgnite = true;
    power(true, allowed);
  }, 450);
});
})();
