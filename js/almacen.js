// Almacén de Tigre · el mosaico de los vecinos
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const NS = 'http://www.w3.org/2000/svg';
const celu = () => innerWidth < 900;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WA = '5491166476750';
const LAT = -34.4220345, LNG = -58.5757068;

/* ---------- mosaico: Voronoi por recorte de semiplanos ---------- */
function azar(semilla) { let s = semilla >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function recortar(poly, a, b) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = b[0] - a[0], ny = b[1] - a[1];
  const lado = p => (p[0] - mx) * nx + (p[1] - my) * ny;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], dp = lado(p), dq = lado(q);
    if (dp <= 0) out.push(p);
    if ((dp < 0) !== (dq < 0)) { const t = dp / (dp - dq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
  }
  return out;
}
function voronoi(semillas, borde) {
  return semillas.map((a, i) => {
    let poly = borde.slice();
    for (let j = 0; j < semillas.length && poly.length; j++) if (j !== i) {
      const b = semillas[j]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) continue; poly = recortar(poly, a, b);
    }
    return poly;
  });
}
const centro = poly => { let x = 0, y = 0; poly.forEach(p => { x += p[0]; y += p[1]; }); return [x / poly.length, y / poly.length]; };
const pts = poly => poly.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
function el(tag, attrs = {}, padre) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); padre && padre.appendChild(e); return e; }
const COLORES = ['#D8283E', '#2FA6A0', '#F2C230', '#F2A7B5', '#17716C', '#B51E31', '#F2C230', '#2FA6A0', '#D8283E'];
function caja(c) { const xs = c.map(p => p[0]), ys = c.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys); return [x0, y0, Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0)]; }

/* ---------- horario (hora de Buenos Aires) ---------- */
function ahora() {
  const f = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
  const v = Object.fromEntries(f.map(x => [x.type, x.value]));
  const dias = { dom: 0, lun: 1, mar: 2, 'mié': 3, mie: 3, jue: 4, vie: 5, 'sáb': 6, sab: 6 };
  const d = dias[v.weekday.replace('.', '')] ?? new Date().getDay();
  return { dia: d, h: (+v.hour % 24) + v.minute / 60 };
}
function estado() {
  const { dia, h } = ahora(), finde = dia === 0 || dia === 6, cierra = finde ? 20 : 17;
  const abierto = h >= 9.5 && h < cierra;
  const txt = abierto ? `Abierto ahora · cocina hasta las ${cierra}` : h < 9.5 ? 'Cerrado · hoy abrimos a las 9:30' : 'Cerrado · mañana abrimos a las 9:30';
  [['#estado', '#estado-txt'], ['#estado-2', '#estado-2-txt']].forEach(([a, b]) => { $(a)?.classList.toggle('abierto', abierto); if ($(b)) $(b).textContent = txt; });
  $$('#horas > div').forEach(f => f.classList.toggle('hoy', f.dataset.dias.split(',').includes(String(dia))));
}

/* ---------- 1 · hero: el mosaico de los vecinos (la intro es el mosaico armándose) ---------- */
const LUGAR = [
  ['pasaje', 'El pasaje de mosaicos'], ['milanesa', 'Milanga napolitana'], ['pesca', 'La pesca al punto'], ['pavlova', 'Pavlova con frutillas'],
  ['salon', 'El salón'], ['peras', 'Peras al vino'], ['vereda', 'Las mesas de la vereda'], ['polenta', 'La polenta de almacén'],
  ['cafe-al-sol', 'Cafecito al sol'], ['ternera', 'Ternera con puré'],
];
function hero(animar) {
  $('.hero').style.setProperty('--alto', innerHeight + 'px');
  const svg = $('#hb-svg'), caja0 = svg.getBoundingClientRect(), W = caja0.width, H = caja0.height;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
  const r = azar(1336), nf = celu() ? 6 : 10, sem = [];
  const cols = celu() ? 2 : 5, filas = celu() ? 3 : 2;
  let k = 0;
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
    if (k >= nf) break;
    sem.push([(c + .5 + (r() - .5) * .5) * W / cols, (f + .5 + (r() - .5) * .4) * H / filas, 'foto', k++]);
  }
  const relleno = celu() ? 16 : 26;
  for (let i = 0; i < relleno; i++) sem.push([r() * W, r() * H, 'color']);
  const celdas = voronoi(sem, [[-4, -4], [W + 4, -4], [W + 4, H + 4], [-4, H + 4]]);
  const defs = el('defs', {}, svg);
  let ultimo = 0;
  celdas.forEach((c, i) => {
    if (c.length < 3) return;
    const s = sem[i], g = el('g', { class: 'tesela' }, svg);
    if (s[2] === 'foto') {
      const id = 'hb' + i, cp = el('clipPath', { id }, defs); el('polygon', { points: pts(c) }, cp);
      const [x0, y0, lado] = caja(c), foto = LUGAR[s[3] % LUGAR.length];
      const im = el('image', { href: `img/h-${foto[0]}.webp`, x: x0, y: y0, width: lado, height: lado, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${id})` }, g);
      el('title', {}, im).textContent = foto[1];
    } else el('polygon', { points: pts(c), fill: COLORES[i % COLORES.length] }, g);
    el('polygon', { points: pts(c), fill: 'none', stroke: '#F5F1EA', 'stroke-width': 7, 'stroke-linejoin': 'round' }, g);
    if (animar) {
      const [cx, cy] = centro(c), ang = Math.atan2(cy - H / 2, cx - W / 2), d = 40 + r() * (celu() ? 520 : 820);
      ultimo = Math.max(ultimo, d);
      g.animate([{ transform: `translate(${Math.cos(ang) * 120}px,${Math.sin(ang) * 120}px) rotate(${(r() - .5) * 40}deg) scale(.7)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 700, delay: d, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'backwards' });
    }
  });
  if (animar) $('#hb-placa').animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(1.25) rotate(-4deg)' }, { opacity: 1, transform: 'translate(-50%,-50%)' }],
    { duration: 420, delay: celu() ? 560 : 900, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'both' });
  return animar ? (celu() ? 1100 : 1500) : 0;
}

/* ---------- 2 · WOW: cada pieza, un plato (los platos salen de la carta del kit) ---------- */
const EN_EL_MOSAICO = ['milanesa-napolitana', 'ternera-pure', 'polenta-almacen', 'bife-a-caballo', 'ravioles-estofado', 'pesca-al-punto', 'cazuela-humita', 'ensalada-pollo-brie', 'combito-toston-palta', 'peras-al-vino', 'pavlova', 'lentejas'];
const MOMENTO = { desayunos: 'Desayuno · hasta 12:30', entradas: 'Para empezar', principales: 'Almuerzo y cena temprana', ensaladas: 'Ensaladas', postres: 'Postre o merienda' };
let wowListo = null;
function wow(productos) {
  const svg = $('#wow-svg'), med = $('#medalla');
  const lista = EN_EL_MOSAICO.map(id => productos.find(p => p.id === id)).filter(p => p && p.foto);
  if (wowListo && wowListo.firma === lista.map(p => p.id + (p.disponible === false)).join()) return;
  svg.innerHTML = '';
  const R = 490, C = 500, r = azar(200), sem = [], n = lista.length;
  lista.forEach((p, i) => { const a = i / n * Math.PI * 2 + (r() - .5) * .25 - Math.PI / 2, rr = 345 + (r() - .5) * 40; sem.push([C + Math.cos(a) * rr, C + Math.sin(a) * rr, 'foto', i]); });
  for (let i = 0; i < 8; i++) { const a = (i + .5) / 8 * Math.PI * 2 + (r() - .5) * .3 - Math.PI / 2; sem.push([C + Math.cos(a) * 560, C + Math.sin(a) * 560, 'color']); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + r(); sem.push([C + Math.cos(a) * 130, C + Math.sin(a) * 130, 'color']); }
  sem.push([C, C, 'color']);
  const borde = Array.from({ length: 72 }, (_, i) => [C + Math.cos(i / 72 * Math.PI * 2) * R, C + Math.sin(i / 72 * Math.PI * 2) * R]);
  const celdas = voronoi(sem, borde), defs = el('defs', {}, svg), grupos = [];
  celdas.forEach((c, i) => {
    if (c.length < 3) return;
    const s = sem[i], g = el('g', { class: 'tesela' }, svg);
    if (s[2] === 'foto') {
      const p = lista[s[3]], id = 'w' + i, cp = el('clipPath', { id }, defs); el('polygon', { points: pts(c) }, cp);
      const [x0, y0, lado] = caja(c);
      el('image', { href: p.foto, x: x0, y: y0, width: lado, height: lado, preserveAspectRatio: 'xMidYMid slice', 'clip-path': `url(#${id})` }, g);
      g.classList.add('foto');
      if (p.disponible === false) { g.classList.add('off'); el('polygon', { points: pts(c), class: 'velo' }, g); }
      g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.dataset.i = s[3];
      g.setAttribute('aria-label', p.nombre + (p.disponible === false ? ' (hoy no sale)' : ''));
      g.addEventListener('click', () => abrir(g, p));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(g, p); } });
    } else el('polygon', { points: pts(c), fill: COLORES[(i * 5) % COLORES.length] }, g);
    el('polygon', { points: pts(c), class: 'borde' }, g);
    grupos.push([g, c]);
  });
  const primera = !wowListo;
  // en el celu la ficha muestra un plato de ejemplo desde el primer momento
  const fotos0 = grupos.filter(([g]) => g.classList.contains('foto') && !g.classList.contains('off'));
  if (celu() && fotos0[0] && !med.classList.contains('abierta')) { fotos0[0][0].classList.add('activa'); llenar(lista[fotos0[0][0].dataset.i], true); }
  wowListo = { firma: lista.map(p => p.id + (p.disponible === false)).join() };
  // firma: las piezas se juntan cuando el mosaico entra en pantalla
  if (primera && !reducido) {
    grupos.forEach(([g]) => g.style.opacity = 0);
    new IntersectionObserver((ents, ob) => ents.forEach(e => {
      if (!e.isIntersecting) return; ob.disconnect();
      grupos.forEach(([g, c]) => {
        const [cx, cy] = centro(c), a = Math.atan2(cy - C, cx - C);
        g.style.opacity = '';
        g.animate([{ transform: `translate(${Math.cos(a) * 90}px,${Math.sin(a) * 90}px) rotate(${(r() - .5) * 50}deg) scale(.7)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 650, delay: r() * 700, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'backwards' });
      });
      setTimeout(invitar, 1500);
    }), { threshold: .25 }).observe(med);
  } else invitar();

  function invitar() {
    const fotos = grupos.filter(([g]) => g.classList.contains('foto') && !g.classList.contains('off')).map(([g]) => g);
    let i = 0; clearInterval(wow.invitando);
    wow.invitando = setInterval(() => {
      if (med.classList.contains('abierta') || !fotos.length) return;
      fotos.forEach(f => f.classList.remove('activa'));
      const g = fotos[i++ % fotos.length]; g.classList.add('activa');
      if (celu()) llenar(lista[g.dataset.i], true);
    }, celu() ? 2600 : 1100);
    if (fotos[0]) { fotos[0].classList.add('activa'); i = 1; if (celu()) llenar(lista[fotos[0].dataset.i], true); }
  }
  function abrir(g, p) {
    clearInterval(wow.invitando);
    grupos.forEach(([x]) => x.classList.remove('activa'));
    wow.activa = g; g.classList.add('activa'); med.classList.add('abierta');
    llenar(p, false);
    $('.ficha__x').focus({ preventScroll: true });
  }
  function llenar(p, ejemplo) {
    const ficha = $('#ficha'), sale = p.disponible !== false;
    ficha.classList.toggle('ejemplo', ejemplo);
    $('#ficha-img').src = p.foto; $('#ficha-img').alt = p.nombre;
    $('#ficha-m').textContent = MOMENTO[p.categoria] || ''; $('#ficha-n').textContent = p.nombre; $('#ficha-d').textContent = p.descripcion || '';
    $('#ficha-hoy').textContent = sale ? 'hoy sale' : 'hoy no sale';
    ficha.classList.toggle('off', !sale);
    $('#ficha-wa').textContent = sale ? '¿Hay hoy? Preguntá' : '¿Cuándo vuelve?';
    $('#ficha-wa').href = `https://wa.me/${WA}?text=` + encodeURIComponent(sale ? `¡Hola! ¿Hoy hay ${p.nombre.toLowerCase()}?` : `¡Hola! ¿Cuándo vuelve ${p.nombre.toLowerCase()}?`);
    ficha.hidden = false; ficha.style.animation = 'none'; void ficha.offsetWidth; ficha.style.animation = '';
    const im = $('#ficha-img'); im.style.animation = 'none'; void im.offsetWidth; im.style.animation = '';
  }
  wow.invitar = invitar;
}
function wowCerrar() {
  const ficha = $('#ficha'); if (ficha.hidden || ficha.classList.contains('ejemplo')) return;
  ficha.hidden = !celu(); $('#medalla').classList.remove('abierta');
  wow.activa?.classList.remove('activa'); wow.activa?.focus({ preventScroll: true }); wow.activa = null; wow.invitar?.();
}
$('.ficha__x').addEventListener('click', wowCerrar);
document.addEventListener('keydown', e => e.key === 'Escape' && wowCerrar());
document.addEventListener('pointerdown', e => { const f = $('#ficha'); if (!f.hidden && !f.contains(e.target) && !e.target.closest('.tesela.foto')) wowCerrar(); });

/* ---------- 3 · la carta frente a la pared ---------- */
function pared() {
  const p = $('#pared'); if (!p) return;
  const filas = Math.ceil(p.parentElement.offsetHeight / 64) + 1;
  p.innerHTML = Array.from({ length: filas }, (_, i) => `<span style="--x:${(i * 137) % 120}">${'lalala'.repeat(9)}</span>`).join('');
}
const mqDesk = matchMedia('(min-width: 900px)');
function cartaVidriera(el) {
  if (!el) return;
  const tabs = $$('.kit-tab', el), paneles = $$('.kit-carta__panel', el);
  paneles.forEach((pn, i) => {
    if (!$('.cat-t', pn)) pn.insertAdjacentHTML('afterbegin', `<h3 class="cat-t">${tabs[i]?.textContent.trim().toLowerCase() || ''}</h3>`);
  });
  if (mqDesk.matches) paneles.forEach(pn => pn.hidden = false);
  else { const on = tabs.findIndex(t => t.classList.contains('is-on')); paneles.forEach((pn, i) => pn.hidden = i !== Math.max(0, on)); }
}
mqDesk.addEventListener('change', () => cartaVidriera($('.pizarra__carta')));
document.addEventListener('kit:carta', (e) => {
  if (e.detail.el?.classList.contains('pizarra__carta')) { cartaVidriera(e.detail.el); requestAnimationFrame(pared); }
  ultimosProductos = e.detail.productos || [];
  if (wowCerca) wow(ultimosProductos);
});
let ultimosProductos = null, wowCerca = false;
new IntersectionObserver((e, ob) => { if (!e[0].isIntersecting) return; ob.disconnect(); wowCerca = true; if (ultimosProductos) wow(ultimosProductos); }, { rootMargin: '700px 0px' }).observe($('#medalla'));

/* ---------- 4 · la tira del pasaje: arrastre con el mouse y flechas ---------- */
function tira() {
  const t = $('#tira'); if (!t) return;
  let x0 = 0, s0 = 0, mov = false, abajo = false;
  t.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; abajo = true; mov = false; x0 = e.clientX; s0 = t.scrollLeft; });
  addEventListener('pointermove', e => { if (!abajo) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { mov = true; t.classList.add('arrastrando'); } t.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { if (!abajo) return; abajo = false; t.classList.remove('arrastrando');
    if (mov) { const w = t.querySelector('.pz').offsetWidth + 30; t.scrollTo({ left: Math.round(t.scrollLeft / w) * w, behavior: 'smooth' }); } });
  $$('.flecha').forEach(b => b.addEventListener('click', () => t.scrollBy({ left: +b.dataset.dir * (t.querySelector('.pz').offsetWidth + 30), behavior: 'smooth' })));
}

/* ---------- 5 · fechas especiales (eventos del kit) ---------- */
function proximoEvento() {
  const ev = window.kit?.eventos?.proximos?.()[0], p = $('#prox-ev'), b = $('#btn-evento');
  if (!ev) { p.hidden = true; b.hidden = true; return; }
  const [y, m, d] = ev.fecha.split('-').map(Number);
  const fecha = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
  p.textContent = `Próxima fecha: ${fecha}, ${ev.hora} hs${/ejemplo/i.test(ev.nombre) ? ' (ejemplo)' : ''}`; p.hidden = false; b.hidden = false; b.dataset.ev = ev.id;
}
$('#btn-evento').addEventListener('click', e => window.kit?.reservas?.abrir({ evento: e.currentTarget.dataset.ev, personas: 2 }));
document.addEventListener('almacen:kit', proximoEvento);
document.addEventListener('kit:eventos', proximoEvento);

/* ---------- 6 · mapa con el cartel como pin ---------- */
function mapa() {
  const box = $('#mapa'); if (!box || box.dataset.listo) return;
  if (!window.L && !document.querySelector('script[data-leaflet]')) { const s = document.createElement('script'); s.src = 'vendor/leaflet/leaflet.js'; s.dataset.leaflet = 1; document.head.appendChild(s); }
  const ir = () => {
    if (!window.L) return setTimeout(ir, 150);
    box.dataset.listo = 1;
    const m = L.map(box, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView([LAT, LNG], 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m);
    const icon = L.divIcon({ className: 'pin', html: '<img src="img/logo.svg" alt=""><span>Almacén de Tigre</span>', iconSize: [64, 64], iconAnchor: [32, 32] });
    L.marker([LAT, LNG], { icon, title: 'Almacén de Tigre', alt: 'Almacén de Tigre' }).addTo(m);
  };
  ir();
}
new IntersectionObserver((e, ob) => { if (e[0].isIntersecting) { ob.disconnect(); mapa(); } }, { rootMargin: '600px 0px' }).observe($('#mapa'));

/* ---------- menú: un mosaico a pantalla completa ---------- */
function menu() {
  const b = $('#abrir-menu'), m = $('#menu');
  const abrir = () => { m.hidden = false; b.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; $('.menu__cerrar', m).focus(); };
  const cerrar = () => { if (m.hidden) return; m.hidden = true; b.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; b.focus({ preventScroll: true }); };
  b.addEventListener('click', abrir);
  $('.menu__cerrar', m).addEventListener('click', cerrar);
  $$('a', m).forEach(a => a.addEventListener('click', cerrar));
  document.addEventListener('keydown', e => e.key === 'Escape' && cerrar());
  m.addEventListener('click', e => { if (e.target === m) cerrar(); });
}

/* ---------- firma en las secciones: entran como piezas ---------- */
function firma() {
  const cosas = $$('.cab, .pizarra, .pz, .luchi__foto, .luchi__txt > *, .llegar__info > *');
  cosas.forEach((c, i) => { c.classList.add('arma'); c.style.setProperty('--i', i % 5); });
  if (reducido) { cosas.forEach(c => c.classList.add('visto')); return; }
  const io = new IntersectionObserver(ents => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .12 });
  cosas.forEach(c => io.observe(c));
}

/* ---------- la barra se esconde al bajar; con popups abiertos se corre ---------- */
let yAnt = 0;
addEventListener('scroll', () => {
  const y = scrollY, b = $('.barra');
  html.classList.toggle('bajo', y > 40);
  if (y > innerHeight * .8 && y > yAnt + 6) b.classList.add('oculta');
  else if (y < yAnt - 6 || y < innerHeight * .5) b.classList.remove('oculta');
  yAnt = y;
}, { passive: true });
new MutationObserver(() => document.documentElement.classList.toggle('con-pop', !!document.querySelector('.kit-pop') || !$('#menu').hidden || (celu() && $('#medalla').classList.contains('abierta'))))
  .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });

/* ---------- arranque ---------- */
estado(); setInterval(estado, 60000);
menu(); tira(); firma(); pared();
new IntersectionObserver(([e]) => html.classList.toggle('pasado', !e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe($('.hero'));
new IntersectionObserver(([e]) => html.classList.toggle('en-pie', e.isIntersecting)).observe($('.pie'));
new IntersectionObserver(([e]) => html.classList.toggle('en-hero', e.intersectionRatio > .6), { threshold: [0, .6, 1] }).observe($('.hero'));
let ancho = innerWidth;
addEventListener('resize', () => { if (Math.abs(innerWidth - ancho) < 40) return; ancho = innerWidth; hero(false); pared(); });
const conIntro = html.classList.contains('con-intro');
{
  const dur = hero(conIntro);
  setTimeout(() => html.classList.add('intro-fin', 'entra'), dur);
}
setTimeout(() => html.classList.add('intro-fin'), 4500); // seguro anti-trabas
