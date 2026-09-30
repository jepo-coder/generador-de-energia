/* ===== Generador de Energía Hidráulica — script.js ===== */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* --- 1. Dibujo de la rueda (8 paletas) en todas las .wheel --- */
  let wheel = '<circle r="50"/><circle r="7"/>';
  for (let i = 0; i < 8; i++) {
    wheel += `<g transform="rotate(${i * 45})"><line x1="0" y1="0" x2="0" y2="-50"/><rect x="-8" y="-58" width="16" height="12" rx="3"/></g>`;
  }
  $$('.wheel').forEach(w => (w.innerHTML = wheel));

  /* --- 2. Menú responsive --- */
  const menu = $('#menu'), menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  /* --- 3. Demostración: iniciar / detener (agua, rueda, motor y LED) --- */
  function setDemo(on) {
    document.body.classList.toggle('run', on);
    const es = $('#estado'); if (es) es.textContent = on ? '🟢 GENERANDO ENERGÍA' : '🔴 DEMOSTRACIÓN EN PAUSA';
    $$('[data-demo]').forEach(b => (b.textContent = on ? '⏸ Detener demostración' : '▶ Iniciar demostración'));
  }
  $$('[data-demo]').forEach(b => b.addEventListener('click', () => setDemo(!document.body.classList.contains('run'))));
  $('#verFunc').addEventListener('click', () => setDemo(true));

  /* --- 4. Pestañas genéricas (etapas de energía y variables) --- */
  $$('[data-tabs]').forEach(tabs => {
    const panel = tabs.nextElementSibling;
    $$('button', tabs).forEach(btn => btn.addEventListener('click', () => {
      $$('button', tabs).forEach(b => b.classList.remove('act'));
      btn.classList.add('act');
      panel.textContent = btn.dataset.d;
    }));
  });

  /* --- 5. Línea de tiempo interactiva --- */
  const steps = $$('#tl li');
  steps.forEach(li => li.addEventListener('click', () => {
    li.classList.toggle('done');
    const n = steps.filter(s => s.classList.contains('done')).length;
    $('#progTxt').textContent = `Pasos completados: ${n} de ${steps.length}`;
    $('#progBar').style.width = (n / steps.length * 100) + '%';
  }));

  /* --- 7. Aparición al hacer scroll --- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));

  /* --- 8. Navegación activa según la sección visible --- */
  const links = $$('#menu a');
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('act', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => so.observe(s));

  /* --- 9. Botón "Volver arriba" --- */
  const top = $('#top');
  addEventListener('scroll', () => top.classList.toggle('show', scrollY > 500), { passive: true });
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* --- 10. Hero: tocar la escena inicia o detiene el flujo --- */
  const scene = $('#demo');
  scene.addEventListener('click', () => setDemo(!document.body.classList.contains('run')));
  scene.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scene.click(); } });

  /* --- 11. Laboratorio: simulador con escena animada ---
     P = ṁ·g·h (ṁ = caudal en kg/s); potencia útil = P × (1 − pérdidas). Valores ilustrativos. */
  const lh = $('#lh'), lc = $('#lc'), ll = $('#ll'), G = 9.8, PMAX = 0.3 * G * 3; // potencia ideal máxima de los controles
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let usePy = false, ang = 0, sampleT = 0, series = [], last = performance.now();
  const S = { ph: 0, pu: 0, n: 0, acc: 0 };
  $('#sw').innerHTML = wheel;

  function pyOut(r) { // mismo formato que imprime python/generador.py (masa = caudal × 1 s)
    $('#pyout').textContent = `Energía potencial : ${r.ep.toFixed(2)} J\nVelocidad ideal   : ${r.v.toFixed(2)} m/s\nEnergía cinética  : ${r.ep.toFixed(2)} J\nEnergía útil      : ${r.util.toFixed(2)} J\nLED               : recibe energía`;
  }
  function drawSeries() {
    const c = $('#hist'), x = c.getContext('2d'), W = c.width, H = c.height, MAX = 10, step = (W - 40) / 59;
    const Y = v => H - 16 - (Math.min(v, MAX) / MAX) * (H - 28);
    x.clearRect(0, 0, W, H); x.font = '11px sans-serif'; x.lineWidth = 1; x.strokeStyle = '#1c5a75'; x.fillStyle = '#9cc3d1';
    [0, 5, 10].forEach(v => { x.beginPath(); x.moveTo(34, Y(v)); x.lineTo(W, Y(v)); x.stroke(); x.fillText(v + ' W', 2, Y(v) + 4); });
    if (series.length < 2) return;
    x.beginPath(); series.forEach((v, i) => (i ? x.lineTo(34 + i * step, Y(v)) : x.moveTo(34, Y(v))));
    x.strokeStyle = '#2fc4f0'; x.lineWidth = 2; x.stroke();
    x.lineTo(34 + (series.length - 1) * step, Y(0)); x.lineTo(34, Y(0)); x.fillStyle = 'rgba(47,196,240,.18)'; x.fill();
  }
  function lab() {
    const h = +lh.value, c = +lc.value, l = +ll.value;
    S.ph = c * G * h; S.pu = S.ph * (1 - l / 100); S.n = Math.min(S.pu / PMAX, 1);
    const v = Math.sqrt(2 * G * h);
    $('#lhv').textContent = h.toFixed(1) + ' m'; $('#lcv').textContent = c.toFixed(2) + ' L/s'; $('#llv').textContent = l + ' %';
    $('#ep').textContent = S.ph.toFixed(2) + ' W'; $('#vv').textContent = v.toFixed(2) + ' m/s';
    $('#ut').textContent = S.pu.toFixed(2) + ' W'; $('#ea').textContent = S.acc.toFixed(2) + ' J';
    $('#utBar').style.width = (100 - l) + '%';
    $('#rule').textContent = `P = ${c.toFixed(2)} × ${G} × ${h.toFixed(1)} = ${S.ph.toFixed(2)} W`;
    // Geometría de la escena: más altura = depósito más arriba; más caudal = chorro más grueso
    const yT = 155 - (20 + (h - 0.1) / 2.9 * 100);
    $('#tkg').setAttribute('transform', `translate(0 ${yT})`);
    const st = $('#stream'); st.setAttribute('y1', yT + 6); st.setAttribute('stroke-width', (2 + c / 0.3 * 12).toFixed(1));
    $('#dim').setAttribute('d', `M204 ${yT}H216M210 ${yT}V155M204 155H216`);
    const dt = $('#dimt'); dt.setAttribute('y', (yT + 155) / 2 + 4); dt.textContent = `h = ${h.toFixed(1)} m`;
    // Velocidad de giro y brillo del LED (ilustrativos), también para las ruedas del resto de la página
    document.documentElement.style.setProperty('--t', (6 - 5 * S.n).toFixed(2) + 's');
    document.documentElement.style.setProperty('--b', (0.15 + 0.85 * Math.sqrt(S.n)).toFixed(2));
    document.documentElement.style.setProperty('--ev', (1.4 - S.n).toFixed(2) + 's'); // velocidad de los electrones
    pyOut({ ep: S.ph, v, util: S.pu });
    if (usePy) fetch(`/api/simular?altura=${h}&masa=${c}&perdidas=${l}`).then(r => r.json())
      .then(d => { if (d.energia_util_j !== undefined) pyOut({ ep: d.energia_potencial_j, v: d.velocidad_ms, util: d.energia_util_j }); }).catch(() => {});
  }
  const drops = [], rips = [], rnd = Math.random;
  let spawn = 0, lastG = '';
  function frame(t) { // animación: rueda, salpicaduras, gotas, ondas, medidor y energía acumulada
    const dt = Math.min((t - last) / 1000, 0.1); last = t;
    const run = document.body.classList.contains('run') && !document.hidden;
    if (run) {
      ang = (ang + (25 + 520 * S.n) * dt * (calm ? 0.2 : 1)) % 360;
      $('#sw').setAttribute('transform', `translate(300 210) rotate(${ang.toFixed(1)}) scale(1.1)`);
      $('#gm').setAttribute('transform', `translate(410 210) rotate(${ang.toFixed(1)})`);
      S.acc += S.pu * dt; sampleT += dt;
      if (sampleT >= 0.2) {
        sampleT = 0; series.push(S.pu); if (series.length > 60) series.shift();
        drawSeries(); $('#ea').textContent = S.acc.toFixed(2) + ' J';
      }
      spawn += dt; const rate = 14 + 120 * +lc.value + 30 * S.n; // gotas por segundo
      while (spawn > 1 / rate) {
        spawn -= 1 / rate;
        if (drops.length > 80) { spawn = 0; break; }
        if (rnd() < 0.6) drops.push({ x: 300 + (rnd() - 0.5) * 12, y: 153, vx: (rnd() - 0.5) * 110, vy: -(25 + rnd() * 70) }); // salpicadura del chorro
        else { const a = rnd() * 6.283, w = (25 + 520 * S.n) * Math.PI / 180 * 55 * 0.35; // gota lanzada por las paletas
          drops.push({ x: 300 + 55 * Math.cos(a), y: 210 + 55 * Math.sin(a), vx: -Math.sin(a) * w, vy: Math.cos(a) * w }); }
      }
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.vy += 320 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.y >= 273) { if (rips.length < 14 && d.x > 0 && d.x < 480) rips.push({ x: d.x, r: 2, t: 0 }); drops.splice(i, 1); }
    }
    for (let i = rips.length - 1; i >= 0; i--) { const r = rips[i]; r.r += 26 * dt; r.t += dt; if (r.t > 0.9) rips.splice(i, 1); }
    $('#fxd').setAttribute('d', drops.map(d => `M${d.x.toFixed(1)} ${d.y.toFixed(1)}m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0`).join(''));
    $('#fxr').setAttribute('d', rips.map(r => `M${(r.x - r.r).toFixed(1)} 274a${r.r.toFixed(1)} ${(r.r * 0.3).toFixed(1)} 0 1 0 ${(2 * r.r).toFixed(1)} 0a${r.r.toFixed(1)} ${(r.r * 0.3).toFixed(1)} 0 1 0 ${(-2 * r.r).toFixed(1)} 0`).join(''));
    const n = run ? S.n : 0, val = run ? S.pu : 0, key = n.toFixed(3) + val.toFixed(2); // medidor de potencia útil
    if (key !== lastG) { lastG = key;
      $('#garc').style.strokeDasharray = `${(n * 100).toFixed(1)} 100`;
      $('#needle').style.transform = `rotate(${(-90 + 180 * n).toFixed(1)}deg)`;
      $('#gval').textContent = val.toFixed(2) + ' W'; }
    requestAnimationFrame(frame);
  }
  [lh, lc, ll].forEach(i => i.addEventListener('input', lab));
  $$('#esc button').forEach(b => b.addEventListener('click', () => {
    lh.value = b.dataset.h; lc.value = b.dataset.c; ll.value = b.dataset.l; lab();
  }));
  $('#resetE').addEventListener('click', () => { S.acc = 0; series = []; $('#ea').textContent = '0.00 J'; drawSeries(); });
  let wd = 'M-80 274q20 -7 40 0'; for (let i = 0; i < 14; i++) wd += 't40 0'; // oleaje del recolector
  $('#wave').setAttribute('d', wd + 'V300H-80Z');
  for (let i = 0; i < 8; i++) { // rayos de luz del LED
    const a = i * Math.PI / 4, l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    [['x1', 440 + 20 * Math.cos(a)], ['y1', 112 + 20 * Math.sin(a)], ['x2', 440 + 29 * Math.cos(a)], ['y2', 112 + 29 * Math.sin(a)]].forEach(([k, v]) => l.setAttribute(k, v.toFixed(1)));
    $('#rays').appendChild(l);
  }
  const scn = $('#scene'); // tocar la escena inicia o detiene la demostración
  scn.addEventListener('click', () => setDemo(!document.body.classList.contains('run')));
  scn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scn.click(); } });
  lab(); drawSeries(); requestAnimationFrame(frame);

  /* --- 11b. Si el sitio se sirve con Flask (python/app.py), Python hace el cálculo --- */
  fetch('/api/simular?altura=1&masa=0.5&perdidas=50').then(r => (r.ok ? r.json() : Promise.reject()))
    .then(() => { usePy = true; $('#calcMode').textContent = 'Cálculo: Python (Flask)'; lab(); }).catch(() => {});

  /* --- 12. Equipo editable (se guarda en el navegador) --- */
  $$('[contenteditable][data-k]').forEach(el => {
    try { const s = localStorage.getItem('eh_' + el.dataset.k); if (s) el.textContent = s; } catch (e) {}
    el.addEventListener('input', () => { try { localStorage.setItem('eh_' + el.dataset.k, el.textContent); } catch (e) {} });
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } });
  });

  /* --- 13. Formulario de contacto (demostrativo: no envía datos a ningún servidor) --- */
  $('#cf').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, msg = $('#cmsg');
    if (!f.checkValidity()) { msg.textContent = 'Completa tu nombre, un correo válido y el mensaje.'; return; }
    msg.textContent = `Gracias, ${$('#cn').value}. Este formulario es demostrativo: para recibir mensajes hay que conectarlo a un servicio de correo.`;
    f.reset();
  });

  /* --- 14. Copiar el código Python --- */
  $('#copyPy').addEventListener('click', async e => {
    try { await navigator.clipboard.writeText($('#pycode').textContent); e.target.textContent = 'Copiado ✓'; }
    catch (err) { e.target.textContent = 'Selecciona y copia manualmente'; }
    setTimeout(() => (e.target.textContent = 'Copiar código'), 2000);
  });
})();
