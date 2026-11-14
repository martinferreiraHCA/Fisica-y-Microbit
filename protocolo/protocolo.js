/* =========================================================================
   PROTOCOLO DE PRÁCTICO — herramientas del docente (fisicabit)
   Se carga la primera vez que se usa una herramienta del grupo «Laboratorio»
   de la cinta del editor (INFORME ▾ → Protocolo de práctico). Habla con el
   editor por window.Informe.api.

     montaje  → guias/?embed=1      dibujo del dispositivo o anexo de ensamblado
     circuito → circuitos/?embed=1  esquemático o protoboard
     teorica  → gráfica de una función (modelo) o ejes en blanco
     bloques  → bloques de MakeCode (render oficial) listos para fisicabit.com
     ia       → prompt con todo lo que hay HOY en el sitio + importar la respuesta
   ========================================================================= */
(function () {
  'use strict';
  if (window.FbitProtocolo) return;

  var AQUI = (document.currentScript && document.currentScript.src) || '';
  var RAIZ = AQUI.replace(/protocolo\/protocolo\.js.*$/, '');
  var REPO = 'martinferreiraHCA/Fisica-y-Microbit', EXT = 'martinferreiraHCA/pxt-fisicabit-usb';
  var API = 'https://api.github.com/repos/' + REPO + '/contents/';
  var CARPETAS = { '3d': 'diseños 3d', carton: 'diseños carton' };
  var MK = 'https://makecode.microbit.org';
  var ANEXO = 'Anexo · Ensamblado del montaje experimental';

  function api() { return window.Informe && window.Informe.api; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function h(tag, attrs, html) { var e = document.createElement(tag); if (attrs) Object.keys(attrs).forEach(function (k) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }); if (html != null) e.innerHTML = html; return e; }
  function aviso(t) { var a = api(); if (a) a.toast(t); }
  function idioma() { try { return (typeof currentLanguage !== 'undefined' && currentLanguage) || 'es'; } catch (e) { return 'es'; } }

  /* ---------- Estilos (blanco y negro, como el resto del sitio) ---------- */
  var css = [
    '.fp-modal{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Montserrat,-apple-system,"Segoe UI",Arial,sans-serif;font-size:13px;color:#000}',
    '.fp-caja{background:#fff;border:2px solid #000;display:flex;flex-direction:column;width:min(980px,100%);max-height:100%;min-height:0}',
    '.fp-modal.llena{padding:0}.fp-modal.llena .fp-caja{width:100%;height:100%;border:0}',
    '.fp-cab{display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:2px solid #000;flex:none}',
    '.fp-cab b{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:800}.fp-cab span{color:#555;font-size:11.5px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.fp-btn{background:#fff;color:#000;border:2px solid #000;border-radius:0;padding:6px 11px;font:700 11px Montserrat,Arial,sans-serif;text-transform:uppercase;letter-spacing:.4px;cursor:pointer;white-space:nowrap}',
    '.fp-btn:hover{background:#000;color:#fff}.fp-btn.pri{background:#000;color:#fff}.fp-btn.pri:hover{background:#333;border-color:#333}.fp-btn:disabled{opacity:.4;pointer-events:none}.fp-btn.chico{padding:3px 8px;font-size:10px;border-width:1.5px}',
    '.fp-cuerpo{flex:1;min-height:0;overflow:auto;padding:14px}.fp-cuerpo.sin{padding:0;overflow:hidden;display:flex}.fp-cuerpo iframe{flex:1;border:0;width:100%;height:100%;background:#ededed}',
    '.fp-pie{display:flex;gap:8px;align-items:center;justify-content:flex-end;padding:9px 12px;border-top:2px solid #000;flex:none;flex-wrap:wrap}.fp-pie .fp-nota{margin-right:auto}',
    '.fp-dos{display:grid;grid-template-columns:330px 1fr;gap:16px;align-items:start}@media(max-width:820px){.fp-dos{grid-template-columns:1fr}}',
    '.fp-l{display:block;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;margin:10px 0 3px}.fp-l:first-child{margin-top:0}',
    '.fp-in,.fp-ta,.fp-sel{width:100%;box-sizing:border-box;border:1.5px solid #000;border-radius:0;background:#fff;padding:6px 7px;font:inherit;color:#000}.fp-ta{resize:vertical;min-height:70px;line-height:1.45}.fp-ta.mono{font-family:"Courier New",monospace;font-size:12px}',
    '.fp-fila{display:flex;gap:6px;align-items:center}.fp-fila>*{flex:1;min-width:0}.fp-fila>.fijo{flex:none}',
    '.fp-nota{font-size:11px;color:#555;line-height:1.45}.fp-t{font-size:10px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:4px;margin:16px 0 8px}.fp-t:first-child{margin-top:0}',
    '.fp-chk{display:flex;gap:7px;align-items:flex-start;margin:5px 0;font-size:12px;cursor:pointer;line-height:1.35}.fp-chk input{margin-top:2px;accent-color:#000}',
    '.fp-prev{border:2px solid #000;background:#fff;display:flex;align-items:center;justify-content:center;min-height:220px;padding:8px}.fp-prev canvas,.fp-prev img{max-width:100%;height:auto;display:block}',
    '.fp-lista{border:1.5px solid #000;max-height:54vh;overflow:auto}.fp-it{padding:7px 9px;border-bottom:1px solid #ddd;cursor:pointer;line-height:1.3}.fp-it:hover{background:#f5f5f5}.fp-it.sel{background:#000;color:#fff}.fp-it small{display:block;font-size:10.5px;opacity:.7}',
    '.fp-g{font-size:9.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;background:#f5f5f5;padding:5px 9px;border-bottom:1px solid #ddd}',
    '.fp-tabs{display:flex;margin-bottom:12px}.fp-tabs .fp-btn+.fp-btn{border-left:0}.fp-tabs .fp-btn.act{background:#000;color:#fff}',
    '.fp-cat{border:1.5px solid #000;max-height:190px;overflow:auto;padding:6px 9px}.fp-caja-gris{background:#f5f5f5;border-left:4px solid #000;padding:8px 11px;line-height:1.5;font-size:12px}',
    '.fp-pend{background:#f5f5f5;border-left:4px solid #000;padding:7px 10px;font-size:12.5px}'
  ].join('\n');
  document.head.appendChild(h('style', { id: 'fp-style' }, css));

  /* ---------- Ventana genérica ---------- */
  var abierta = null;
  function ventana(titulo, sub, opts) {
    cerrar();
    opts = opts || {};
    var m = h('div', { class: 'fp-modal' + (opts.llena ? ' llena' : '') });
    var caja = h('div', { class: 'fp-caja' }); if (opts.ancho) caja.style.width = 'min(' + opts.ancho + 'px,100%)';
    var cab = h('div', { class: 'fp-cab' }, '<b>' + esc(titulo) + '</b><span>' + esc(sub || '') + '</span>');
    var x = h('button', { class: 'fp-btn', type: 'button' }, '✕ Cerrar'); x.onclick = cerrar; cab.appendChild(x);
    var cuerpo = h('div', { class: 'fp-cuerpo' + (opts.sinMargen ? ' sin' : '') });
    caja.appendChild(cab); caja.appendChild(cuerpo);
    var pie = null; if (opts.pie) { pie = h('div', { class: 'fp-pie' }); caja.appendChild(pie); }
    m.appendChild(caja); document.body.appendChild(m);
    m.addEventListener('mousedown', function (e) { if (e.target === m && !opts.llena) cerrar(); });
    abierta = { m: m, cuerpo: cuerpo, pie: pie, cab: cab, alCerrar: null };
    return abierta;
  }
  function cerrar() { if (!abierta) return; var a = abierta; abierta = null; try { if (a.alCerrar) a.alCerrar(); } catch (e) {} if (a.m.parentNode) a.m.parentNode.removeChild(a.m); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierta && !abierta.m.classList.contains('llena')) cerrar(); });
  function boton(txt, cls, fn) { var b = h('button', { class: 'fp-btn ' + (cls || ''), type: 'button' }, txt); b.onclick = fn; return b; }

  /* ---------- Montaje y circuito: herramientas embebidas (misma página, mismo origen) ---------- */
  function embebida(titulo, sub, ruta) {
    var v = ventana(titulo, sub, { llena: true, sinMargen: true });
    v.cuerpo.appendChild(h('iframe', { src: RAIZ + ruta, title: titulo, allow: 'clipboard-write' }));
  }
  // Lo que mandan las herramientas embebidas (guias/ y circuitos/) al pulsar «Insertar en el protocolo»
  function recibir(msg) {
    var a = api(); if (!a || !msg) return false;
    if (msg.tipo === 'circuito' && msg.png) {
      var proto = msg.vista === 'protoboard', pie = (msg.titulo ? msg.titulo + ' · ' : '') + (proto ? 'montaje en protoboard' : 'circuito esquemático');
      // El ancho sigue al tamaño real del dibujo (el PNG viene a 2×): un circuito chico no se infla a toda la hoja.
      var im = new Image();
      im.onload = function () { a.insertFigure(msg.png, pie, Math.max(25, Math.min(90, Math.round(im.naturalWidth / 2 / 7)))); aviso('Circuito insertado ✓'); };
      im.onerror = function () { a.insertFigure(msg.png, pie, proto ? 85 : 60); };
      cerrar(); im.src = msg.png; return true;
    }
    if (msg.tipo === 'guia-imagen' && msg.png) {
      a.insertFigure(msg.png, msg.titulo ? msg.titulo + ' · dispositivo armado' : 'Dispositivo armado', 70);
      cerrar(); aviso('Dibujo del dispositivo insertado ✓'); return true;
    }
    if (msg.tipo === 'guia-anexo' && msg.datos) { cerrar(); insertarAnexo(msg.datos); return true; }
    return false;
  }
  // Anexo con el ensamblado paso a paso: dispositivo armado, piezas y un dibujo por paso.
  function anexoHTML(d) {
    var a = api(), o = '';
    o += '<p>Secuencia de ensamblado' + (d.titulo ? ' de <b>' + esc(d.titulo) + '</b>' : ' del montaje experimental') + '.' + (d.descripcion ? ' ' + esc(d.descripcion) : '') + '</p>';
    if (d.armado) o += a.figureHTML(d.armado, 'Dispositivo armado. Las letras indican en qué paso se coloca cada parte.', 70);
    if (d.lista && d.lista.length) {
      o += '<h3>Piezas</h3>';
      if (d.piezas) o += a.figureHTML(d.piezas, '', 100);
      else o += '<ul>' + d.lista.map(function (p) { return '<li>' + p.n + ' × ' + esc(p.nombre) + '</li>'; }).join('') + '</ul>';
    }
    (d.pasos || []).forEach(function (p) {
      o += '<h3>Paso ' + esc(p.letra) + ' · ' + esc(p.titulo) + '</h3>' + (p.texto ? '<p>' + esc(p.texto) + '</p>' : '');
      if (p.png) o += a.figureHTML(p.png, 'Paso ' + p.letra, 50);
    });
    return o + '<p>​</p>';
  }
  function insertarAnexo(d) {
    var a = api(), html = anexoHTML(d);
    var ya = a.sections().filter(function (s) { return (s.title || '').trim() === ANEXO; })[0];
    function listo(id) { a.rebuild(); setTimeout(function () { a.goTo(id); }, 80); aviso('Anexo de ensamblado agregado al final del protocolo ✓'); }
    if (!ya) { listo(a.addSection(ANEXO, html, { silent: true })); return; }
    a.confirm('El protocolo ya tiene un anexo de ensamblado.\n\n¿Reemplazarlo por este? (Cancelar agrega otro anexo aparte.)').then(function (si) {
      if (si) { a.setSectionHTML(ya.id, html); listo(ya.id); } else listo(a.addSection(ANEXO, html, { silent: true }));
    });
  }

  /* ---------- Gráfica teórica ---------- */
  var FUN = { sin: 'sin', sen: 'sin', cos: 'cos', tan: 'tan', tg: 'tan', asin: 'asin', acos: 'acos', atan: 'atan', sinh: 'sinh', cosh: 'cosh', tanh: 'tanh', sqrt: 'sqrt', raiz: 'sqrt', abs: 'abs', exp: 'exp', ln: 'log', log: 'log10', log10: 'log10', log2: 'log2', pow: 'pow', min: 'min', max: 'max', floor: 'floor', ceil: 'ceil', round: 'round', sign: 'sign' };
  var CONST = { pi: 'Math.PI', e: 'Math.E', g: '9.8' };
  // Compila «0,5·9,8·t^2» a una función segura: solo números, x/t, constantes y funciones de la lista.
  function compilar(expr) {
    var s = String(expr || '').replace(/^\s*[a-zA-Z]\w*\s*(\([a-z]\))?\s*=/, '').replace(/(\d),(\d)/g, '$1.$2')
      .replace(/π/g, ' pi ').replace(/√/g, ' sqrt ').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '^2').replace(/³/g, '^3');
    var re = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+|\*\*|[-+*\/^(),])/y, toks = [], m;
    re.lastIndex = 0;
    while (re.lastIndex < s.length) { if (/^\s*$/.test(s.slice(re.lastIndex))) break; m = re.exec(s); if (!m) throw new Error('no entiendo «' + s.slice(re.lastIndex).trim().slice(0, 8) + '»'); toks.push(m[1]); }
    if (!toks.length) throw new Error('escribí una expresión');
    var js = '', prev = null;
    toks.forEach(function (t) {
      var esId = /^[A-Za-z_]/.test(t), esNum = /^[\d.]/.test(t), out, tipo;
      if (esId) {
        var k = t.toLowerCase();
        if (k === 'x' || k === 't') { out = 'x'; tipo = 'val'; }
        else if (FUN[k]) { out = 'Math.' + FUN[k]; tipo = 'fun'; }
        else if (CONST[k]) { out = '(' + CONST[k] + ')'; tipo = 'val'; }
        else throw new Error('no conozco «' + t + '» (usá x o t como variable)');
      } else if (esNum) { out = t; tipo = 'val'; }
      else if (t === '^') { out = '**'; tipo = 'op'; }
      else if (t === '(') { out = '('; tipo = 'ab'; }
      else if (t === ')') { out = ')'; tipo = 'ci'; }
      else { out = t; tipo = 'op'; }
      // menos unario: −x² es −(x²); después de una potencia (2^−x) queda como está
      if (t === '-' && (prev === null || prev === 'op' || prev === 'ab')) { out = toks._pot ? '-' : '(-1)*'; }
      toks._pot = (t === '^' || t === '**');
      // multiplicación implícita: 2x, 3(x+1), (x)(x), 2sin(x), x sin(x)
      if ((prev === 'val' || prev === 'ci') && (tipo === 'val' || tipo === 'fun' || tipo === 'ab')) js += '*';
      js += out; prev = tipo;
    });
    var f; try { f = new Function('x', '"use strict"; return (' + js + ');'); f(1); } catch (e) { throw new Error('la expresión está incompleta'); }
    return f;
  }
  function pasoLindo(rango, n) { var b = rango / n, p = Math.pow(10, Math.floor(Math.log10(b))), r = b / p; return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * p; }
  function numLindo(v, paso) { var d = Math.max(0, -Math.floor(Math.log10(paso) + 1e-9)); var s = v.toFixed(Math.min(6, d)); if (Math.abs(v) >= 1e5 || (v !== 0 && Math.abs(v) < 1e-4)) s = v.toExponential(1); return s.replace('.', ','); }
  var TRAZOS = [[], [14, 9], [3, 7]];
  // Dibuja la gráfica en un canvas con la estética de las gráficas del sitio (ejes negros, cuadrícula tenue).
  function dibujarGrafica(o) {
    var W = 1200, H = 800, c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), F = 'Montserrat, Arial, sans-serif';
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    var x0 = +o.x0, x1 = +o.x1; if (!(x1 > x0)) throw new Error('el rango de X no es válido');
    var curvas = [];
    if (!o.soloEjes) (o.curvas || []).forEach(function (cv, i) {
      if (!String(cv.expr || '').trim()) return;
      var f; try { f = compilar(cv.expr); } catch (e) { throw new Error('Curva ' + (i + 1) + ': ' + e.message); }
      var pts = []; for (var k = 0; k <= 600; k++) { var x = x0 + (x1 - x0) * k / 600, y = f(x); pts.push([x, (typeof y === 'number' && isFinite(y)) ? y : null]); }
      curvas.push({ pts: pts, rotulo: cv.rotulo || '', trazo: TRAZOS[i % 3] });
    });
    var y0 = o.y0 === '' || o.y0 == null ? null : +o.y0, y1 = o.y1 === '' || o.y1 == null ? null : +o.y1;
    if (y0 == null || y1 == null || !(y1 > y0)) {
      var lo = Infinity, hi = -Infinity;
      curvas.forEach(function (cv) { cv.pts.forEach(function (p) { if (p[1] != null) { if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; } }); });
      if (!isFinite(lo)) { lo = 0; hi = 10; }
      if (hi - lo < 1e-12) { hi += 1; lo -= 1; }
      var mg = (hi - lo) * 0.08; y0 = (lo >= 0 && lo - mg < 0) ? 0 : lo - mg; y1 = hi + mg;
    }
    var L = 130, R = 40, T = o.titulo ? 90 : 40, B = 110, pw = W - L - R, ph = H - T - B;
    var X = function (x) { return L + (x - x0) / (x1 - x0) * pw; }, Y = function (y) { return T + ph - (y - y0) / (y1 - y0) * ph; };
    var px = pasoLindo(x1 - x0, 8), py = pasoLindo(y1 - y0, 6), k, v;
    if (o.fina) {   // cuadrícula fina (para graficar a mano)
      g.strokeStyle = '#ececec'; g.lineWidth = 1; g.beginPath();
      for (v = Math.ceil(x0 / (px / 5)) * (px / 5); v <= x1 + 1e-9; v += px / 5) { g.moveTo(X(v), T); g.lineTo(X(v), T + ph); }
      for (v = Math.ceil(y0 / (py / 5)) * (py / 5); v <= y1 + 1e-9; v += py / 5) { g.moveTo(L, Y(v)); g.lineTo(L + pw, Y(v)); }
      g.stroke();
    }
    g.strokeStyle = o.fina ? '#c4c4c4' : '#dcdcdc'; g.lineWidth = 1.5; g.fillStyle = '#333'; g.font = '500 24px ' + F;
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (k = Math.ceil(x0 / px - 1e-9); k * px <= x1 + 1e-9; k++) { v = k * px; g.beginPath(); g.moveTo(X(v), T); g.lineTo(X(v), T + ph + 8); g.stroke(); g.fillText(numLindo(v, px), X(v), T + ph + 16); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (k = Math.ceil(y0 / py - 1e-9); k * py <= y1 + 1e-9; k++) { v = k * py; g.beginPath(); g.moveTo(L - 8, Y(v)); g.lineTo(L + pw, Y(v)); g.stroke(); g.fillText(numLindo(v, py), L - 16, Y(v)); }
    // ejes (en el cero si entra en el rango; si no, en el borde)
    g.strokeStyle = '#000'; g.lineWidth = 3.5; g.beginPath();
    var ex = (x0 <= 0 && x1 >= 0) ? X(0) : L, ey = (y0 <= 0 && y1 >= 0) ? Y(0) : T + ph;
    g.moveTo(ex, T); g.lineTo(ex, T + ph); g.moveTo(L, ey); g.lineTo(L + pw, ey); g.stroke();
    if (ex !== L || ey !== T + ph) { g.lineWidth = 1.5; g.strokeRect(L, T, pw, ph); }
    // curvas
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip(); g.lineWidth = 4.5; g.lineJoin = 'round'; g.strokeStyle = '#000';
    curvas.forEach(function (cv) {
      g.setLineDash(cv.trazo); g.beginPath(); var dentro = false;
      cv.pts.forEach(function (p) { if (p[1] == null || Math.abs(Y(p[1])) > 1e5) { dentro = false; return; } if (dentro) g.lineTo(X(p[0]), Y(p[1])); else { g.moveTo(X(p[0]), Y(p[1])); dentro = true; } });
      g.stroke();
    });
    g.restore(); g.setLineDash([]);
    // rótulos
    g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '700 28px ' + F;
    if (o.ejeX) g.fillText(o.ejeX, L + pw / 2, H - 28);
    if (o.ejeY) { g.save(); g.translate(40, T + ph / 2); g.rotate(-Math.PI / 2); g.fillText(o.ejeY, 0, 0); g.restore(); }
    if (o.titulo) { g.font = '800 32px ' + F; g.textAlign = 'left'; g.fillText(o.titulo.toUpperCase(), L, 54); }
    var conRotulo = curvas.filter(function (cv) { return cv.rotulo; });
    if (conRotulo.length) {   // leyenda
      g.font = '600 24px ' + F; var lw = 0; conRotulo.forEach(function (cv) { lw = Math.max(lw, g.measureText(cv.rotulo).width); });
      var bw = lw + 104, bh = conRotulo.length * 38 + 16, mejor = null;
      [[L + pw - bw - 16, T + 16], [L + 16, T + 16], [L + pw - bw - 16, T + ph - bh - 16], [L + 16, T + ph - bh - 16]].forEach(function (e) {   // la esquina que tapa menos curva
        var n = 0; curvas.forEach(function (cv) { cv.pts.forEach(function (p) { if (p[1] == null) return; var cx = X(p[0]), cy = Y(p[1]); if (cx > e[0] - 12 && cx < e[0] + bw + 12 && cy > e[1] - 12 && cy < e[1] + bh + 12) n++; }); });
        if (!mejor || n < mejor.n) mejor = { n: n, x: e[0], y: e[1] };
      });
      var bx = mejor.x, by = mejor.y;
      g.fillStyle = '#fff'; g.fillRect(bx, by, bw, bh); g.strokeStyle = '#000'; g.lineWidth = 2; g.strokeRect(bx, by, bw, bh);
      conRotulo.forEach(function (cv, i) { var yy = by + 27 + i * 38; g.lineWidth = 4.5; g.setLineDash(cv.trazo); g.beginPath(); g.moveTo(bx + 14, yy); g.lineTo(bx + 74, yy); g.stroke(); g.setLineDash([]); g.fillStyle = '#000'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(cv.rotulo, bx + 88, yy + 1); });
    }
    return c;
  }
  var MODELOS = [
    ['MRU · posición', { curvas: [{ expr: '2 + 1,5 t', rotulo: 'x = x₀ + v·t' }], x0: 0, x1: 10, ejeX: 't (s)', ejeY: 'x (m)', titulo: 'Movimiento rectilíneo uniforme' }],
    ['MRUV · posición', { curvas: [{ expr: '0,5·2·t^2', rotulo: 'x = ½·a·t²' }], x0: 0, x1: 5, ejeX: 't (s)', ejeY: 'x (m)', titulo: 'MRUV: posición' }],
    ['MRUV · velocidad', { curvas: [{ expr: '2 t', rotulo: 'v = a·t' }], x0: 0, x1: 5, ejeX: 't (s)', ejeY: 'v (m/s)', titulo: 'MRUV: velocidad' }],
    ['Caída libre', { curvas: [{ expr: '0,5·9,8·t^2', rotulo: 'h = ½·g·t²' }], x0: 0, x1: 1, ejeX: 't (s)', ejeY: 'h (m)', titulo: 'Caída libre' }],
    ['Péndulo simple', { curvas: [{ expr: '2 pi sqrt(x/9,8)', rotulo: 'T = 2π√(L/g)' }], x0: 0, x1: 1.5, ejeX: 'L (m)', ejeY: 'T (s)', titulo: 'Período del péndulo' }],
    ['Movimiento armónico', { curvas: [{ expr: '0,1 cos(2 pi t / 1,2)', rotulo: 'x = A·cos(ωt)' }], x0: 0, x1: 4, ejeX: 't (s)', ejeY: 'x (m)', titulo: 'Movimiento armónico simple' }],
    ['Oscilación amortiguada', { curvas: [{ expr: '0,1 exp(-0,4 t) cos(2 pi t / 1,2)', rotulo: 'x = A·e^(−bt)·cos(ωt)' }], x0: 0, x1: 8, ejeX: 't (s)', ejeY: 'x (m)', titulo: 'Oscilación amortiguada' }],
    ['Ley de Hooke', { curvas: [{ expr: '25 x', rotulo: 'F = k·x' }], x0: 0, x1: 0.2, ejeX: 'x (m)', ejeY: 'F (N)', titulo: 'Ley de Hooke' }],
    ['Ley de Ohm', { curvas: [{ expr: 'x / 220', rotulo: 'I = V / R' }], x0: 0, x1: 3.3, ejeX: 'V (V)', ejeY: 'I (A)', titulo: 'Ley de Ohm' }],
    ['Descarga de un capacitor', { curvas: [{ expr: '3,3 exp(-t / 2)', rotulo: 'V = V₀·e^(−t/RC)' }], x0: 0, x1: 10, ejeX: 't (s)', ejeY: 'V (V)', titulo: 'Descarga RC' }],
    ['Enfriamiento de Newton', { curvas: [{ expr: '20 + 60 exp(-t / 300)', rotulo: 'T = Tₐ + ΔT·e^(−t/τ)' }], x0: 0, x1: 1200, ejeX: 't (s)', ejeY: 'T (°C)', titulo: 'Enfriamiento' }],
    ['Proporcionalidad inversa', { curvas: [{ expr: '100 / x', rotulo: 'P = k / V' }], x0: 10, x1: 100, ejeX: 'V (mL)', ejeY: 'P (kPa)', titulo: 'Ley de Boyle' }]
  ];
  function abrirTeorica() {
    var v = ventana('Gráfica teórica', 'El modelo esperado, o ejes en blanco para completar a mano', { pie: true });
    v.cuerpo.innerHTML = '<div class="fp-dos"><div>' +
      '<label class="fp-l">Modelo listo</label><select class="fp-sel" id="ft-modelo"><option value="">— elegir —</option>' + MODELOS.map(function (m, i) { return '<option value="' + i + '">' + esc(m[0]) + '</option>'; }).join('') + '</select>' +
      [1, 2, 3].map(function (i) { return '<label class="fp-l">Curva ' + i + (i > 1 ? ' (opcional)' : '') + ' · y =</label><input class="fp-in" id="ft-e' + i + '" placeholder="' + (i === 1 ? 'Ej.: 0,5·9,8·t^2' : '') + '" autocomplete="off"><input class="fp-in" id="ft-r' + i + '" placeholder="Rótulo en la leyenda (opcional)" style="margin-top:3px;border-top:0" autocomplete="off">'; }).join('') +
      '<label class="fp-l">Eje X: desde · hasta · rótulo</label><div class="fp-fila"><input class="fp-in" id="ft-x0" type="number" step="any"><input class="fp-in" id="ft-x1" type="number" step="any"><input class="fp-in" id="ft-ex" placeholder="t (s)" style="flex:1.5"></div>' +
      '<label class="fp-l">Eje Y: desde · hasta (vacío = automático) · rótulo</label><div class="fp-fila"><input class="fp-in" id="ft-y0" type="number" step="any"><input class="fp-in" id="ft-y1" type="number" step="any"><input class="fp-in" id="ft-ey" placeholder="x (m)" style="flex:1.5"></div>' +
      '<label class="fp-l">Título</label><input class="fp-in" id="ft-tit" autocomplete="off">' +
      '<label class="fp-chk" style="margin-top:10px"><input type="checkbox" id="ft-solo"> Solo ejes y cuadrícula (para que el estudiante grafique a mano)</label>' +
      '<label class="fp-chk"><input type="checkbox" id="ft-fina"> Cuadrícula fina</label>' +
      '<p class="fp-nota">Variable: <b>x</b> o <b>t</b>. Se puede escribir 2x, x^2, sqrt( ), sen( ), cos( ), exp( ), ln( ), pi, e. La 2.ª curva sale a trazos y la 3.ª punteada.</p>' +
      '</div><div><div class="fp-prev" id="ft-prev"></div><p class="fp-nota" id="ft-msg" style="margin-top:8px"></p></div></div>';
    var q = function (id) { return v.cuerpo.querySelector('#' + id); };
    var lienzo = null;
    function leer() {
      return { curvas: [1, 2, 3].map(function (i) { return { expr: q('ft-e' + i).value, rotulo: q('ft-r' + i).value.trim() }; }), x0: q('ft-x0').value, x1: q('ft-x1').value, y0: q('ft-y0').value, y1: q('ft-y1').value,
        ejeX: q('ft-ex').value.trim(), ejeY: q('ft-ey').value.trim(), titulo: q('ft-tit').value.trim(), soloEjes: q('ft-solo').checked, fina: q('ft-fina').checked };
    }
    function poner(o) { [1, 2, 3].forEach(function (i) { var c = (o.curvas || [])[i - 1] || {}; q('ft-e' + i).value = c.expr || ''; q('ft-r' + i).value = c.rotulo || ''; }); q('ft-x0').value = o.x0; q('ft-x1').value = o.x1; q('ft-y0').value = o.y0 == null ? '' : o.y0; q('ft-y1').value = o.y1 == null ? '' : o.y1; q('ft-ex').value = o.ejeX || ''; q('ft-ey').value = o.ejeY || ''; q('ft-tit').value = o.titulo || ''; }
    function pintar() {
      var msg = q('ft-msg'), pv = q('ft-prev');
      try { lienzo = dibujarGrafica(leer()); pv.innerHTML = ''; pv.appendChild(lienzo); msg.textContent = ''; ins.disabled = false; }
      catch (e) { lienzo = null; msg.textContent = '⚠ ' + e.message; ins.disabled = true; }
    }
    var ins = boton('Insertar en el documento', 'pri', function () {
      if (!lienzo) return; var o = leer();
      api().insertFigure(lienzo.toDataURL('image/png'), o.titulo || (o.soloEjes ? 'Ejes para graficar' : 'Gráfica teórica'), 70); cerrar(); aviso('Gráfica insertada ✓');
    });
    v.pie.appendChild(h('span', { class: 'fp-nota' }, 'Queda como una imagen: se puede mover, achicar y ponerle pie.')); v.pie.appendChild(ins);
    poner(MODELOS[3][1]);
    q('ft-modelo').onchange = function (e) { if (e.target.value !== '') { poner(MODELOS[+e.target.value][1]); pintar(); } };
    v.cuerpo.addEventListener('input', pintar);
    (document.fonts && document.fonts.load ? document.fonts.load('700 28px Montserrat').catch(function () {}) : Promise.resolve()).then(pintar);
  }

  /* ---------- Bloques de MakeCode ---------- */
  var DEP_USB = 'fisicabit-usb=github:' + EXT, DEP_BT = 'fisicabit-bt=github:' + EXT + '#bluetooth';
  var LISTOS = [
    ['1 sensor: aceleración X (10 por segundo)', 'En el sitio: CONECTAR (USB), 1 variable, «micro:bit envía timestamp» activado.', 'basic.forever(function () {\n    fisicabitSerial.send1(input.acceleration(Dimension.X), 100)\n})\n'],
    ['2 variables: aceleración X e Y', 'En el sitio: 2 variables.', 'basic.forever(function () {\n    fisicabitSerial.send2(input.acceleration(Dimension.X), input.acceleration(Dimension.Y), 100)\n})\n'],
    ['3 variables: aceleración X, Y y Z', 'En el sitio: 3 variables.', 'basic.forever(function () {\n    fisicabitSerial.send3(input.acceleration(Dimension.X), input.acceleration(Dimension.Y), input.acceleration(Dimension.Z), 100)\n})\n'],
    ['Temperatura (1 por segundo)', 'Sensor interno de la micro:bit.', 'basic.forever(function () {\n    fisicabitSerial.send1(input.temperature(), 1000)\n})\n'],
    ['Nivel de luz', 'Sensor de luz de la matriz de LED.', 'basic.forever(function () {\n    fisicabitSerial.send1(input.lightLevel(), 200)\n})\n'],
    ['Sensor analógico en P0', 'Potenciómetro, LDR o termistor en un divisor de tensión (lectura de 0 a 1023).', 'basic.forever(function () {\n    fisicabitSerial.send1(pins.analogReadPin(AnalogPin.P0), 100)\n})\n'],
    ['Distancia con ultrasonido HC-SR04', 'TRIG en P1 y ECHO en P2. Para movimiento de carritos o caída.', 'basic.forever(function () {\n    fisicabitUltrasonic.sendDistance(DigitalPin.P1, DigitalPin.P2, FbDistanceUnit.Centimeters, FbChannel.USB, 50)\n})\n'],
    ['Empezar con A y parar con B', 'El tiempo arranca en cero al apretar A.', 'let midiendo = false\ninput.onButtonPressed(Button.A, function () {\n    fisicabitSerial.resetTime()\n    midiendo = true\n})\ninput.onButtonPressed(Button.B, function () {\n    midiendo = false\n})\nbasic.forever(function () {\n    if (midiendo) {\n        fisicabitSerial.send1(input.acceleration(Dimension.Y), 50)\n    }\n})\n'],
    ['Muestreo rápido (100 por segundo)', 'Para choques y oscilaciones rápidas, por USB.', 'basic.forever(function () {\n    fisicabitSerial.send1(input.acceleration(Dimension.Z), 10)\n})\n']
  ];
  var _mk = null;   // { iframe, listo: Promise, pend: {id: resolve} }
  function motorBloques() {
    if (_mk) return _mk;
    var f = h('iframe', { src: MK + '/--docs?render=1&forcelang=' + (idioma() === 'pt' ? 'pt-BR' : idioma()), title: 'MakeCode', 'aria-hidden': 'true' });
    f.style.cssText = 'position:absolute;left:-9999px;top:0;width:900px;height:600px;border:0';
    var pend = {}, listo;
    _mk = { iframe: f, pend: pend, n: 0 };
    _mk.listo = new Promise(function (res, rej) { listo = res; setTimeout(function () { rej(new Error('MakeCode no respondió')); }, 45000); });
    window.addEventListener('message', function (ev) {
      var m = ev.data; if (ev.origin !== MK || !m || m.source !== 'makecode') return;
      if (m.type === 'renderready') listo();
      if (m.type === 'renderblocks' && pend[m.id]) { var r = pend[m.id]; delete pend[m.id]; r(m); }
    });
    document.body.appendChild(f);
    _mk.listo.catch(function () { if (f.parentNode) f.parentNode.removeChild(f); _mk = null; });
    return _mk;
  }
  // Dibuja el programa con el render oficial de MakeCode. Devuelve { uri, width, height }.
  function dibujarBloques(code, deps) {
    var mk = motorBloques();
    return mk.listo.then(function () {
      return new Promise(function (res, rej) {
        var id = 'fb' + (++mk.n); mk.pend[id] = function (m) { if (m.uri && m.width) res({ uri: m.uri, width: m.width, height: m.height }); else rej(new Error(m.error || 'MakeCode no pudo dibujar este programa')); };
        setTimeout(function () { if (mk.pend[id]) { delete mk.pend[id]; rej(new Error('MakeCode tardó demasiado')); } }, 40000);
        mk.iframe.contentWindow.postMessage({ type: 'renderblocks', id: id, code: code, options: { package: deps || DEP_USB, snippetMode: false } }, MK);
      });
    });
  }
  function depsDe(code, pxtJson) {
    var d = [];
    try { var o = JSON.parse(pxtJson || '{}').dependencies || {}; Object.keys(o).forEach(function (k) { if (/^github:/.test(o[k])) d.push(k + '=' + o[k]); }); } catch (e) {}
    if (!d.length) d.push(/FisicaBitBT|fisicabitBluetooth|fisicabitBT/.test(code) ? DEP_BT : DEP_USB);
    return d.join(',');
  }
  function codigoHTML(code) {
    return '<p style="font-family:\'Courier New\',monospace;font-size:12px;line-height:1.45;background:#f5f5f5;border-left:4px solid #111;padding:8px 10px;white-space:pre-wrap;">' + esc(code.replace(/\s+$/, '')) + '</p><p>​</p>';
  }
  function misPracticas() {
    var out = [];
    try {
      var ps = JSON.parse(localStorage.getItem('fisicabit_makecode_workspace_v1') || '{}');
      Object.keys(ps).forEach(function (k) { var p = ps[k]; if (!p || !p.header || p.header.isDeleted || !p.text) return; var ts = p.text['main.ts'] || ''; if (!ts.trim()) return; out.push({ nombre: p.header.name || 'Práctica', code: ts, pxt: p.text['pxt.json'], at: (p.header.modificationTime || 0) }); });
    } catch (e) {}
    return out.sort(function (a, b) { return b.at - a.at; });
  }
  function abrirBloques() {
    var v = ventana('Bloques de programación', 'MakeCode para micro:bit con la extensión FisicaBit', { pie: true });
    var mias = misPracticas();
    var items = LISTOS.map(function (l) { return { nombre: l[0], nota: l[1], code: l[2] }; });
    v.cuerpo.innerHTML = '<div class="fp-dos"><div><div class="fp-lista" id="fb-lista"></div>' +
      '<p class="fp-nota" style="margin-top:8px">«Mis prácticas» son los programas que armaste en <b>EXTRAS → MakeCode + FisicaBit</b> en este navegador.</p></div>' +
      '<div><label class="fp-l">Así se ve en bloques</label><div class="fp-prev" id="fb-prev" style="min-height:150px;overflow:auto"></div><p class="fp-nota" id="fb-msg" style="margin-top:6px"></p>' +
      '<label class="fp-l">Programa (se puede retocar)</label><textarea class="fp-ta mono" id="fb-code" rows="9" spellcheck="false"></textarea>' +
      '<div class="fp-fila" style="margin-top:6px"><button class="fp-btn chico fijo" id="fb-redibujar" type="button">Volver a dibujar</button><span class="fp-nota" id="fb-nota"></span></div></div></div>';
    var lista = v.cuerpo.querySelector('#fb-lista'), ta = v.cuerpo.querySelector('#fb-code'), pv = v.cuerpo.querySelector('#fb-prev'), msg = v.cuerpo.querySelector('#fb-msg'), nota = v.cuerpo.querySelector('#fb-nota');
    var actual = null, img = null, turno = 0;
    function fila(it) { var d = h('div', { class: 'fp-it' }, esc(it.nombre) + (it.nota ? '<small>' + esc(it.nota) + '</small>' : '')); d.onclick = function () { [].forEach.call(lista.querySelectorAll('.fp-it'), function (x) { x.classList.remove('sel'); }); d.classList.add('sel'); actual = it; ta.value = it.code; nota.textContent = it.nota || ''; dibujar(); }; lista.appendChild(d); return d; }
    lista.appendChild(h('div', { class: 'fp-g' }, 'Listos para fisicabit.com'));
    var primera = null; items.forEach(function (it, i) { var d = fila(it); if (!i) primera = d; });
    lista.appendChild(h('div', { class: 'fp-g' }, 'Mis prácticas de MakeCode'));
    if (mias.length) mias.forEach(function (p) { fila({ nombre: p.nombre, nota: 'Guardada en este navegador', code: p.code, pxt: p.pxt }); });
    else lista.appendChild(h('div', { class: 'fp-it', style: 'cursor:default;color:#777' }, 'Todavía no hay prácticas guardadas.'));
    function dibujar() {
      var mi = ++turno; img = null; insB.disabled = true; pv.innerHTML = '<span class="fp-nota">Dibujando los bloques con MakeCode…</span>'; msg.textContent = '';
      dibujarBloques(ta.value, depsDe(ta.value, actual && actual.pxt)).then(function (r) {
        if (mi !== turno) return; img = r; pv.innerHTML = ''; var im = h('img', { src: r.uri, alt: 'Bloques' }); im.style.width = Math.min(100, r.width / 7.2) + '%'; pv.appendChild(im); insB.disabled = false;
      }).catch(function (e) { if (mi !== turno) return; pv.innerHTML = '<span class="fp-nota">No se pudieron dibujar los bloques.</span>'; msg.textContent = '⚠ ' + e.message + '. Hace falta conexión a makecode.microbit.org; igual podés insertar el programa como texto.'; });
    }
    var insB = boton('Insertar bloques', 'pri', function () { if (!img) return; api().insertFigure(img.uri, (actual && actual.nombre ? 'Programa de la micro:bit · ' + actual.nombre : 'Programa de la micro:bit'), Math.max(35, Math.min(100, Math.round(img.width / 7.2)))); cerrar(); aviso('Bloques insertados ✓'); });
    var insC = boton('Insertar como texto', '', function () { api().insertHTML(codigoHTML(ta.value)); cerrar(); aviso('Programa insertado ✓'); });
    v.pie.appendChild(h('span', { class: 'fp-nota' }, 'Para probarlo o cambiarlo en bloques: EXTRAS → MakeCode + FisicaBit.')); v.pie.appendChild(insC); v.pie.appendChild(insB);
    v.cuerpo.querySelector('#fb-redibujar').onclick = dibujar;
    if (primera) primera.click();
  }

  /* ---------- Lo que hay HOY en el sitio (para el prompt de IA): catálogo, bloques, módulos ---------- */
  var _cache = {};
  function conCache(clave, fn) { if (!_cache[clave] || Date.now() - _cache[clave].at > 10 * 60 * 1000) _cache[clave] = { at: Date.now(), p: fn().catch(function (e) { delete _cache[clave]; throw e; }) }; return _cache[clave].p; }
  function resumenScad(code) {
    var lin = code.split('\n'), desc = [], params = [], i = 0, grupo = '', com = '';
    for (; i < lin.length; i++) { var c = /^\s*\/\/\s?(.*)$/.exec(lin[i]); if (!c) { if (lin[i].trim() === '') { if (desc.length) break; continue; } break; } var t = c[1].replace(/^=+\s*|\s*=+$/g, '').trim(); if (t && !/^miniaturas:/i.test(t)) desc.push(t); }
    for (; i < lin.length; i++) {
      var g = /^\s*\/\*\s*\[(.+?)\]\s*\*\/\s*$/.exec(lin[i]); if (g) { grupo = g[1].trim(); if (/^hidden$/i.test(grupo)) break; com = ''; continue; }
      var cc = /^\s*\/\/\s?(.*)$/.exec(lin[i]); if (cc) { com = cc[1].trim(); continue; }
      var m = /^([A-Za-z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?|true|false|"[^"]*")\s*;\s*(?:\/\/\s*(\[[^\]]*\]))?/.exec(lin[i].trim());
      if (m && grupo) { params.push((com || m[1]) + ' (' + m[1] + ' = ' + m[2] + (m[3] ? ' ' + m[3] : '') + ')'); com = ''; }
    }
    var tit = desc[0] || ''; if (tit && tit === tit.toUpperCase()) tit = tit.charAt(0) + tit.slice(1).toLowerCase();
    return { titulo: tit, desc: desc.slice(1).join(' '), params: params };
  }
  function catalogo(modo) {
    return conCache('cat' + modo, function () {
      return fetch(API + encodeURIComponent(CARPETAS[modo]) + '?ref=main', { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) { if (!r.ok) throw new Error('catálogo ' + r.status); return r.json(); }).then(function (items) {
        items = items.filter(function (it) { return it.type === 'file' && /\.scad$/i.test(it.name) && !/plantilla/i.test(it.name); });
        return Promise.all(items.map(function (it) {
          var nombre = it.name.replace(/\.scad$/i, '').replace(/-/g, ' ');
          return fetch(it.download_url).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; }).then(function (code) { var r = resumenScad(code); return { modo: modo, archivo: it.name, nombre: nombre, desc: [r.titulo, r.desc].filter(Boolean).join('. ').replace(/\.\./g, '.'), params: r.params }; });
        }));
      });
    });
  }
  function bloquesExtension() {
    return conCache('ext', function () {
      var raw = 'https://raw.githubusercontent.com/' + EXT + '/main/';
      return Promise.all([fetch(raw + 'pxt.json').then(function (r) { return r.json(); }), fetch(raw + '_locales/es/fisicabit-usb-strings.json').then(function (r) { return r.json(); })]).then(function (rs) {
        var out = []; Object.keys(rs[1]).forEach(function (k) { var m = /^(fisicabit\w+)\.(\w+)\|block$/.exec(k); if (m) out.push({ fn: m[1] + '.' + m[2], texto: rs[1][k].replace(/\|/g, ' ').replace(/%(\w+)/g, '[$1]') }); });
        return { version: rs[0].version || '', bloques: out };
      });
    });
  }
  // Descripción de los módulos conocidos; si el botón del sitio trae su propia descripción (title), se usa esa.
  var MODULOS = {
    'MAKECODE + FISICABIT': 'editor oficial de MakeCode embebido, con la extensión FisicaBit ya cargada, para programar la micro:bit en bloques',
    'PIEZAS 3D': 'catálogo de piezas de laboratorio paramétricas (OpenSCAD en el navegador) para imprimir en 3D',
    'CARTÓN ENCASTRABLE': 'piezas de laboratorio en cartón: se imprimen en A4 o se cortan con láser, y se encastran',
    'TRACKER': 'Tracker Online (Open Source Physics): análisis de video y modelado, en el navegador',
    'VIDEO + MOVIMIENTO': 'análisis de video del movimiento: posición, velocidad, aceleración y energías en función del tiempo',
    'MAPEO': 'medir una magnitud punto por punto sobre una grilla y ver el mapa interpolado',
    'SENSORES': 'ver los sensores en tiempo real'
  };
  function estadoDelSitio() {
    var mods = [], fits = [], maxVars = 3;
    try { [].forEach.call(document.querySelectorAll('#extrasMenu button'), function (b) { var t = b.textContent.trim(); if (t) mods.push({ nombre: t, desc: (b.getAttribute('title') || '').trim() || MODULOS[t.toUpperCase()] || '' }); }); } catch (e) {}
    try { var vs = [].map.call(document.querySelectorAll('#numVariables option'), function (o) { return +o.value || 0; }); if (vs.length) maxVars = Math.max.apply(null, vs); } catch (e) {}
    try { [].forEach.call(document.querySelectorAll('#fitType option'), function (o) { var t = o.textContent.trim(); if (t && o.value) fits.push(t); }); } catch (e) {}
    return { mods: mods, fits: fits, maxVars: maxVars };
  }
  // Guía de armado que está abierta en el diseñador (guias/), si la hay: pasos y piezas.
  function guiaActual() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('fisicabit-guias', 1);
        r.onupgradeneeded = function () { try { r.result.createObjectStore('guia'); } catch (e) {} };
        r.onerror = function () { res(null); };
        r.onsuccess = function () {
          try { var q = r.result.transaction('guia').objectStore('guia').get('actual'); q.onsuccess = function () { var E = q.result; if (!E || !E.partes || !E.partes.length) return res(null);
            res({ titulo: (E.doc && E.doc.titulo) || '', pasos: (E.pasos || []).map(function (p, i) { return { letra: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i] || '?', titulo: p.titulo || 'Paso', texto: p.texto || '', piezas: E.partes.filter(function (x) { return x.paso === p.id && !x.oculto; }).map(function (x) { return x.nombre; }) }; }).filter(function (p) { return p.piezas.length; }) }); };
            q.onerror = function () { res(null); }; } catch (e) { res(null); }
        };
      } catch (e) { res(null); }
    });
  }
  var PARTES_PROT = ['Objetivos', 'Fundamento teórico', 'Materiales', 'Montaje experimental', 'Programación de la micro:bit', 'Procedimiento', 'Registro de datos', 'Análisis y preguntas'];
  function armarPrompt(f, ctx) {
    var L = [], hoy = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
    function p(s) { L.push(s == null ? '' : s); }
    p('Sos un docente de Física con experiencia en trabajo experimental en el aula. ' + (f.modo === 'adaptar' ? 'Vas a ADAPTAR un protocolo de práctico que ya existe' : 'Vas a ESCRIBIR un protocolo de práctico') + ' para hacerlo con micro:bit y el sitio fisicabit.com. Escribí en español rioplatense, claro y directo, pensado para que lo lean estudiantes.');
    p(); p('# 1. El práctico');
    if (f.tema) p('- Tema o título: ' + f.tema);
    if (f.curso) p('- Curso / nivel: ' + f.curso);
    if (f.duracion) p('- Duración: ' + f.duracion);
    if (f.magnitudes) p('- Qué se mide y con qué sensor: ' + f.magnitudes);
    if (f.ideas) { p('- Indicaciones del docente:'); p(f.ideas.split('\n').map(function (l) { return '  ' + l; }).join('\n')); }
    p(); p('# 2. Qué ofrece fisicabit.com (estado al ' + hoy + ', leído del sitio en este momento)');
    p('fisicabit.com («micro:bit DataLab Pro») es un laboratorio en el navegador (Chrome o Edge en computadora o Android; iPhone/iPad no pueden conectar la placa). No hay que instalar nada.');
    p('- Captura de datos de la micro:bit por USB (botón CONECTAR, lo más simple y rápido: hasta ~100 muestras/s) o por BLUETOOTH (sin cable, ~30–50 muestras/s). Hasta ' + (ctx.sitio.maxVars || 3) + ' variables por captura, con el tiempo que marca la propia micro:bit.');
    p('- Gráficas en vivo y tabla de datos; ESTABLECER T=0, depuración de puntos, TIRADAS (repetir y comparar ensayos), CÁMARA (fotos del montaje) y EXPORTAR CSV.');
    if (ctx.sitio.fits.length) p('- Ajuste de curvas disponibles hoy: ' + ctx.sitio.fits.join(', ') + '. También ajuste por tramos, estadísticas e integral bajo la curva.');
    p('- INFORME: el estudiante arma su informe con datos, gráficas, ajustes, fórmulas y fotos, y lo baja en PDF o Word.');
    if (ctx.sitio.mods.length) { p('- Módulos del menú EXTRAS:'); ctx.sitio.mods.forEach(function (m) { p('  - ' + m.nombre + (m.desc ? ': ' + m.desc.replace(/\.$/, '') : '') + '.'); }); }
    p('- El editor de protocolos (donde se va a pegar tu respuesta) puede insertar: dibujo del dispositivo armado y anexo con el ensamblado paso a paso (a partir de las piezas del catálogo), circuitos en esquemático o en protoboard (con el código de colores de las resistencias), gráficas teóricas de una función, ejes en blanco para graficar a mano, bloques de MakeCode, tablas para completar y fórmulas en LaTeX.');
    p(); p('## 2.1 Bloques de MakeCode de la extensión FisicaBit' + (ctx.ext ? ' (versión ' + ctx.ext.version + ')' : ''));
    p('El programa de la micro:bit se arma en MakeCode con la extensión FisicaBit (github.com/' + EXT + '). Usá SOLO estos bloques de la extensión, más los bloques estándar de micro:bit (input.acceleration, input.temperature, input.lightLevel, pins.analogReadPin, botones, etc.):');
    if (ctx.ext) ctx.ext.bloques.forEach(function (b) { p('- `' + b.fn + '` → «' + b.texto + '»'); });
    else { p('- `fisicabitSerial.send1(valor, ms)` → «enviar a fisicabit.com tiempo y [valor] cada [ms] ms» (también send2 y send3 para más valores)'); p('- `fisicabitUltrasonic.sendDistance(TRIG, ECHO, unidad, canal, ms)` → envía la distancia del HC-SR04'); }
    p('Ejemplo mínimo (va dentro de «para siempre»): `fisicabitSerial.send1(input.acceleration(Dimension.X), 100)` envía 10 muestras por segundo.');
    ['3d', 'carton'].forEach(function (modo) {
      var cat = ctx.cat[modo]; p(); p('## 2.' + (modo === '3d' ? '2 Piezas para imprimir en 3D' : '3 Piezas de cartón encastrable') + ' del catálogo' + (cat ? ' (' + cat.length + ' diseños hoy)' : ''));
      if (!cat) { p('(No se pudo leer el catálogo en este momento.)'); return; }
      p(modo === '3d' ? 'Todas son paramétricas: el docente cambia las medidas en el sitio y descarga el STL.' : 'Se imprimen en A4 y se pegan sobre cartón de 3 mm, o se cortan con láser; cada diseño trae su plano de piezas y el armado.');
      cat.forEach(function (c) { p('- **' + c.nombre + '**' + (c.desc ? ': ' + c.desc : '')); });
    });
    p(); p('# 3. Elementos del montaje de ESTE práctico');
    var hay = false;
    if (f.elegidos.length) { hay = true; p('Del catálogo de fisicabit (usalos con estos nombres):'); f.elegidos.forEach(function (c) { p('- ' + c.nombre + ' (' + (c.modo === '3d' ? 'impresión 3D' : 'cartón encastrable') + ')' + (c.params.length ? '. Medidas que se pueden cambiar: ' + c.params.slice(0, 8).join('; ') + (c.params.length > 8 ? '; …' : '') : '') + '.'); }); }
    if (f.propios.length) { hay = true; p('Elementos propios del docente (cada uno con sus partes):'); f.propios.forEach(function (e) { p('- ' + e.nombre + (e.partes.length ? ':' : '')); e.partes.forEach(function (x) { p('  - ' + x); }); }); }
    if (f.guia) { hay = true; p('Secuencia de ensamblaje ya definida en el diseñador de guías de armado' + (f.guia.titulo ? ' («' + f.guia.titulo + '»)' : '') + ' — respetala y describila en «Montaje experimental»; el dibujo paso a paso va en un anexo que agrega el editor:'); f.guia.pasos.forEach(function (s) { p('- Paso ' + s.letra + ' · ' + s.titulo + (s.texto ? ': ' + s.texto : '') + ' [piezas: ' + s.piezas.join(', ') + ']'); }); }
    if (f.secuencia) { hay = true; p('Secuencia de ensamblaje indicada por el docente:'); p(f.secuencia); }
    if (!hay) p('El docente no indicó elementos: proponé un montaje sencillo, usando piezas del catálogo de arriba cuando sirvan y materiales comunes de laboratorio escolar.');
    if (f.modo === 'adaptar' && f.existente) { p(); p('# 4. Protocolo existente a adaptar'); p('Conservá sus objetivos y su secuencia didáctica; cambiá lo necesario para medir con micro:bit y fisicabit.com, y aprovechá las piezas y herramientas de arriba.'); p('"""'); p(f.existente.trim()); p('"""'); }
    p(); p('# ' + (f.modo === 'adaptar' && f.existente ? '5' : '4') + '. Formato de la respuesta (obligatorio: lo importa un programa)');
    p('Respondé SOLO con el protocolo, en Markdown, sin saludo ni comentarios antes o después.');
    p('- Primera línea: `# ` + título del práctico.');
    p('- Después, exactamente estas partes, cada una con `## `, en este orden: ' + PARTES_PROT.join(' · ') + '.' + (f.extras.seguridad ? ' Agregá al final `## Seguridad y cuidados`.' : ''));
    p('- Dentro de cada parte: párrafos, listas con `- ` o `1. `, subtítulos con `### `, **negrita**, tablas Markdown (`| a | b |`) y fórmulas en LaTeX entre `$...$` (en línea) o `$$...$$` (centradas).');
    p('- «Materiales»: lista con `- `, un material por línea, con cantidades.');
    p('- «Procedimiento»: lista numerada, una acción por paso, en imperativo; incluí qué botones tocar en fisicabit.com (CONECTAR, CAPTURAR, DETENER, ESTABLECER T=0, EXPORTAR CSV, etc.).');
    p('- «Registro de datos»: al menos una tabla Markdown con las columnas y unidades, y filas vacías para completar.');
    p('- «Análisis y preguntas»: qué gráfica hacer, qué ajuste de curva elegir de la lista y por qué, y entre 4 y 6 preguntas numeradas.');
    p('Marcadores especiales (cada uno solo en su línea; el editor los reemplaza por el elemento real):');
    if (f.extras.bloques) p('- En «Programación de la micro:bit»: un bloque de código ```typescript con el programa completo para MakeCode, usando solo los bloques de 2.1. El editor lo convierte en la imagen de los bloques.');
    if (f.extras.grafica) p('- `[[GRAFICA: y = expresión | x: desde a hasta | ejeX: rótulo (unidad) | ejeY: rótulo (unidad) | titulo: texto]]` → gráfica teórica del modelo (variable x o t; se puede usar ^, sqrt(), sin(), cos(), exp(), ln(), pi). Ejemplo: `[[GRAFICA: y = 0.5*9.8*t^2 | x: 0 a 1 | ejeX: t (s) | ejeY: h (m) | titulo: Caída libre]]`. Poné una en «Fundamento teórico» o en «Análisis y preguntas».');
    if (f.extras.ejes) p('- `[[EJES: x: desde a hasta | y: desde a hasta | ejeX: rótulo (unidad) | ejeY: rótulo (unidad)]]` → ejes en blanco con cuadrícula para que el estudiante grafique a mano, en «Registro de datos».');
    if (f.extras.circuito) p('- `[[CIRCUITO: descripción precisa de qué se conecta con qué: componentes, valores y pines de la micro:bit]]` → el docente lo dibuja con el editor de circuitos. Va en «Montaje experimental».');
    p('- `[[MONTAJE: qué dibujo del dispositivo o del armado va acá]]` → el docente inserta el dibujo o el anexo de ensamblado. Va en «Montaje experimental».');
    p('No inventes funciones de fisicabit.com ni bloques que no estén en las listas de arriba. Si falta un dato, elegí un valor razonable y marcalo con «(a confirmar)».');
    return L.join('\n');
  }

  /* ---------- Importar la respuesta de la IA (Markdown → partes del protocolo) ---------- */
  function enLinea(t) {
    var a = api(), eqs = [];
    t = t.replace(/\$([^$\n]+)\$/g, function (_, l) { eqs.push(l.trim()); return '\u0001' + (eqs.length - 1) + '\u0001'; });
    t = esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<span style="font-family:\'Courier New\',monospace;background:#f5f5f5;">$1</span>');
    return t.replace(/\u0001(\d+)\u0001/g, function (_, i) { return a.eqHTML(eqs[+i], false); });
  }
  function campos(s) { var o = {}; s.split('|').forEach(function (x, i) { var m = /^\s*([A-Za-zÁÉÍÓÚáéíóú]+)\s*[:=]\s*([\s\S]*)$/.exec(x); if (m) o[m[1].toLowerCase()] = m[2].trim(); else if (!i) o._ = x.trim(); }); return o; }
  function rango(s) { var m = /(-?[\d.,]+)\s*(?:a|hasta|to|–|-|;)\s*(-?[\d.,]+)/.exec(s || ''); return m ? [parseFloat(m[1].replace(',', '.')), parseFloat(m[2].replace(',', '.'))] : null; }
  function pendiente(tipo, txt) { return '<p class="fp-pend" style="background:#f5f5f5;border-left:4px solid #111;padding:7px 10px;"><b>▣ Falta insertar acá · ' + esc(tipo) + '.</b> ' + esc(txt || '') + '</p>'; }
  // Convierte el cuerpo de una parte; las imágenes de bloques se piden aparte (tareas) y se reemplazan después.
  function mdAHtml(md, tareas) {
    var a = api(), lin = md.replace(/\r/g, '').split('\n'), o = '', i = 0, m;
    function lista(ord) { var re = ord ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*•]\s+(.*)$/, s = ''; while (i < lin.length && (m = re.exec(lin[i]))) { s += '<li>' + enLinea(m[1]) + '</li>'; i++; } return (ord ? '<ol>' : '<ul>') + s + (ord ? '</ol>' : '</ul>'); }
    while (i < lin.length) {
      var l = lin[i];
      if (!l.trim()) { i++; continue; }
      if (/^\s*```/.test(l)) { var code = []; i++; while (i < lin.length && !/^\s*```/.test(lin[i])) code.push(lin[i++]); i++; var src = code.join('\n'); if (/fisicabit|basic\.|input\.|pins\./i.test(src)) { var id = 'fpb' + tareas.length; tareas.push({ id: id, code: src + '\n' }); o += '<p data-fpb="' + id + '">​</p>' + codigoHTML(src); } else o += codigoHTML(src); continue; }
      if (/^\s*\$\$/.test(l)) { var eq = l.replace(/^\s*\$\$/, ''); if (/\$\$\s*$/.test(eq)) { eq = eq.replace(/\$\$\s*$/, ''); i++; } else { i++; while (i < lin.length && !/\$\$/.test(lin[i])) eq += ' ' + lin[i++]; if (i < lin.length) eq += ' ' + lin[i++].replace(/\$\$.*$/, ''); } o += a.eqHTML(eq.trim(), true) + '<p>​</p>'; continue; }
      if ((m = /^\s*\[\[\s*(GRAFICA|GRÁFICA|EJES|CIRCUITO|MONTAJE|BLOQUES)\s*:?\s*([\s\S]*?)\]\]\s*$/i.exec(l))) {
        var tipo = m[1].toUpperCase().replace('Á', 'A'), c = campos(m[2]); i++;
        if (tipo === 'GRAFICA' || tipo === 'EJES') {
          try {
            var rx = rango(c.x) || [0, 10], ry = rango(c.y), solo = tipo === 'EJES';
            var cv = dibujarGrafica({ curvas: solo ? [] : [{ expr: (c._ || c.y || '').replace(/^\s*y\s*=/, ''), rotulo: '' }], x0: rx[0], x1: rx[1], y0: solo && ry ? ry[0] : '', y1: solo && ry ? ry[1] : '', ejeX: c.ejex || '', ejeY: c.ejey || '', titulo: c.titulo || '', soloEjes: solo, fina: solo });
            o += a.figureHTML(cv.toDataURL('image/png'), c.titulo || (solo ? 'Ejes para graficar' : 'Gráfica teórica'), 70) + '<p>​</p>';
          } catch (e) { o += pendiente(tipo === 'EJES' ? 'ejes para graficar' : 'gráfica teórica', m[2] + ' — botón «Teórica»'); }
        } else if (tipo === 'CIRCUITO') o += pendiente('circuito', m[2] + ' — botón «Circuito»');
        else if (tipo === 'MONTAJE') o += pendiente('dibujo del montaje', m[2] + ' — botón «Montaje»');
        else o += pendiente('bloques', m[2] + ' — botón «Bloques»');
        continue;
      }
      if ((m = /^\s*#{3,6}\s+(.*)$/.exec(l))) { o += '<h3>' + enLinea(m[1]) + '</h3>'; i++; continue; }
      if (/^\s*\|.*\|\s*$/.test(l)) {
        var filas = []; while (i < lin.length && /^\s*\|.*\|\s*$/.test(lin[i])) { var cel = lin[i].trim().replace(/^\||\|$/g, '').split('|').map(function (x) { return x.trim(); }); if (!cel.every(function (x) { return /^:?-{2,}:?$/.test(x); })) filas.push(cel); i++; }
        if (filas.length) { o += '<table class="doc-data-table doc-free-table"><thead><tr>' + filas[0].map(function (x) { return '<th>' + (enLinea(x) || '<br>') + '</th>'; }).join('') + '</tr></thead><tbody>' + filas.slice(1).map(function (f) { return '<tr>' + filas[0].map(function (_, k) { return '<td>' + (f[k] ? enLinea(f[k]) : '<br>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table><p>​</p>'; }
        continue;
      }
      if (/^\s*[-*•]\s+/.test(l)) { o += lista(false); continue; }
      if (/^\s*\d+[.)]\s+/.test(l)) { o += lista(true); continue; }
      if ((m = /^\s*>\s?(.*)$/.exec(l))) { o += '<p style="background:#f5f5f5;border-left:4px solid #111;padding:7px 10px;">' + enLinea(m[1]) + '</p>'; i++; continue; }
      var par = [l.trim()]; i++;
      while (i < lin.length && lin[i].trim() && !/^\s*(#{1,6}\s|[-*•]\s|\d+[.)]\s|\||```|\$\$|>|\[\[)/.test(lin[i])) par.push(lin[i++].trim());
      o += '<p>' + enLinea(par.join(' ')) + '</p>';
    }
    return o;
  }
  function partirMd(md) {
    md = String(md || '').replace(/\r/g, '').replace(/^\s*```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/, '$1');
    var titulo = '', partes = [], act = null, enCodigo = false;
    md.split('\n').forEach(function (l) {
      if (/^\s*```/.test(l)) enCodigo = !enCodigo;
      var m = !enCodigo && /^\s*(#{1,2})\s+(.*)$/.exec(l);
      if (m && m[1] === '#' && !titulo && !partes.length) { titulo = m[2].replace(/\*\*/g, '').trim(); return; }
      if (m) { act = { titulo: m[2].replace(/\*\*/g, '').replace(/^\d+[.)]\s*/, '').replace(/:$/, '').trim(), md: '' }; partes.push(act); return; }
      if (act) act.md += l + '\n'; else if (l.trim()) { act = { titulo: 'Presentación', md: l + '\n' }; partes.push(act); }
    });
    return { titulo: titulo, partes: partes.filter(function (p) { return p.md.trim(); }) };
  }
  function vacio(html) { return !/<img|<table|doc-eq/.test(html || '') && String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;|​|\s/g, '') === ''; }
  function importarRespuesta(md) {
    var a = api(), doc = partirMd(md);
    if (!doc.partes.length) { a.alert('No encontré partes con «## Título» en el texto. Pegá la respuesta completa de la IA.'); return Promise.resolve(false); }
    var tareas = [], hechas = [];
    if (doc.titulo && !(a.meta().title || '').trim()) a.setMeta({ title: doc.titulo });
    var secs = a.sections(), norm = function (s) { return (s || '').trim().toLowerCase(); };
    doc.partes.forEach(function (p) {
      var html = mdAHtml(p.md, tareas);
      var ya = secs.filter(function (s) { return norm(s.title) === norm(p.titulo) && vacio(s.html); })[0];
      if (ya) { a.setSectionHTML(ya.id, html); ya.html = html; hechas.push(ya.id); } else hechas.push(a.addSection(p.titulo, html, { silent: true }));
    });
    a.rebuild(); if (hechas[0]) setTimeout(function () { a.goTo(hechas[0]); }, 80);
    aviso('Protocolo importado: ' + doc.partes.length + ' partes ✓' + (tareas.length ? ' Dibujando los bloques…' : ''));
    // Los programas se dibujan con MakeCode y reemplazan al texto cuando llegan.
    return Promise.all(tareas.map(function (t) {
      return dibujarBloques(t.code, depsDe(t.code)).then(function (r) {
        var cambio = false;
        a.sections().forEach(function (s) {
          if ((s.html || '').indexOf('data-fpb="' + t.id + '"') < 0) return;
          var d = document.createElement('div'); d.innerHTML = s.html; var marca = d.querySelector('[data-fpb="' + t.id + '"]'); if (!marca) return;
          var sig = marca.nextElementSibling; if (sig && /Courier/.test(sig.getAttribute('style') || '')) sig.parentNode.removeChild(sig);
          var tmp = document.createElement('div'); tmp.innerHTML = a.figureHTML(r.uri, 'Programa de la micro:bit', Math.max(35, Math.min(100, Math.round(r.width / 7.2))));
          marca.parentNode.replaceChild(tmp.firstChild, marca); a.setSectionHTML(s.id, d.innerHTML); cambio = true;
        });
        return cambio;
      }).catch(function () { return false; });
    })).then(function (rs) { if (rs.some(Boolean)) { a.rebuild(); aviso('Bloques dibujados ✓'); } return true; });
  }

  /* ---------- Ventana de IA ---------- */
  var _iaForm = null;   // se recuerda mientras la página esté abierta
  function abrirIA() {
    var v = ventana('Protocolo con IA', 'Arma el prompt con lo que hay hoy en fisicabit.com; la respuesta se importa al editor', { pie: true, ancho: 1040 });
    v.cuerpo.innerHTML = '<div class="fp-tabs"><button class="fp-btn act" data-t="1" type="button">1 · Qué práctico</button><button class="fp-btn" data-t="2" type="button">2 · Prompt</button><button class="fp-btn" data-t="3" type="button">3 · Pegar la respuesta</button></div>' +
      '<div data-p="1"><div class="fp-dos" style="grid-template-columns:1fr 1fr"><div>' +
        '<div class="fp-t">El práctico</div>' +
        '<label class="fp-chk"><input type="radio" name="fi-modo" value="nuevo" checked> Escribir un protocolo nuevo</label><label class="fp-chk"><input type="radio" name="fi-modo" value="adaptar"> Adaptar un protocolo que ya tengo</label>' +
        '<div id="fi-exist-box" style="display:none"><label class="fp-l">Protocolo existente (pegalo acá)</label><textarea class="fp-ta" id="fi-existente" rows="6" placeholder="Pegá el texto del protocolo que querés adaptar…"></textarea><div class="fp-fila" style="margin-top:4px"><button class="fp-btn chico fijo" id="fi-usar" type="button">Usar lo que ya escribí en el editor</button><button class="fp-btn chico fijo" id="fi-archivo" type="button">Cargar archivo de texto</button><span></span></div><input type="file" id="fi-file" accept=".txt,.md,.markdown,text/plain" hidden></div>' +
        '<label class="fp-l">Tema o título</label><input class="fp-in" id="fi-tema" placeholder="Ej.: Período del péndulo simple" autocomplete="off">' +
        '<div class="fp-fila"><div><label class="fp-l">Curso / nivel</label><input class="fp-in" id="fi-curso" placeholder="Ej.: 4.º año de liceo" autocomplete="off"></div><div><label class="fp-l">Duración</label><input class="fp-in" id="fi-dur" placeholder="Ej.: 2 horas de clase" autocomplete="off"></div></div>' +
        '<label class="fp-l">Qué se mide y con qué</label><input class="fp-in" id="fi-mag" placeholder="Ej.: aceleración con el acelerómetro de la micro:bit" autocomplete="off">' +
        '<label class="fp-l">Indicaciones (objetivos, ideas, lo que no puede faltar)</label><textarea class="fp-ta" id="fi-ideas" rows="4"></textarea>' +
        '<div class="fp-t">Que la respuesta incluya</div>' +
        '<label class="fp-chk"><input type="checkbox" id="fi-x-bloques" checked> Programa en bloques de MakeCode (se convierte en la imagen de los bloques)</label>' +
        '<label class="fp-chk"><input type="checkbox" id="fi-x-grafica" checked> Gráfica teórica del modelo</label>' +
        '<label class="fp-chk"><input type="checkbox" id="fi-x-ejes"> Ejes en blanco para graficar a mano</label>' +
        '<label class="fp-chk"><input type="checkbox" id="fi-x-circuito"> Circuito (queda marcado para dibujarlo)</label>' +
        '<label class="fp-chk"><input type="checkbox" id="fi-x-seguridad"> Parte de seguridad y cuidados</label>' +
      '</div><div>' +
        '<div class="fp-t">Elementos del montaje</div>' +
        '<label class="fp-l">Piezas 3D del catálogo <span id="fi-n3d" style="font-weight:500;text-transform:none;letter-spacing:0"></span></label><div class="fp-cat" id="fi-cat-3d"><span class="fp-nota">Leyendo el catálogo…</span></div>' +
        '<label class="fp-l">Cartón encastrable <span id="fi-ncar" style="font-weight:500;text-transform:none;letter-spacing:0"></span></label><div class="fp-cat" id="fi-cat-carton"><span class="fp-nota">Leyendo el catálogo…</span></div>' +
        '<label class="fp-l">Elementos propios (uno por línea; sus partes después de «:», separadas por coma)</label><textarea class="fp-ta" id="fi-propios" rows="3" placeholder="Carrito: chasis, 4 ruedas, eje, micro:bit con portapilas&#10;Riel de aluminio de 1 m"></textarea>' +
        '<label class="fp-chk" id="fi-guia-box" style="display:none;margin-top:10px"><input type="checkbox" id="fi-guia" checked> <span id="fi-guia-txt"></span></label>' +
        '<label class="fp-l">Secuencia de ensamblaje (opcional)</label><textarea class="fp-ta" id="fi-sec" rows="3" placeholder="1. Fijar el riel a la mesa…&#10;2. Colocar el sensor en el extremo…"></textarea>' +
        '<p class="fp-nota" style="margin-top:8px">Los catálogos, los bloques de la extensión y los módulos se leen del sitio cada vez: si subís una pieza nueva, el prompt ya la incluye.</p>' +
      '</div></div></div>' +
      '<div data-p="2" style="display:none"><div class="fp-caja-gris" id="fi-resumen"></div><label class="fp-l">Prompt (copialo y pegalo en la IA que uses: ChatGPT, Claude, Gemini…)</label><textarea class="fp-ta mono" id="fi-prompt" rows="18" spellcheck="false"></textarea></div>' +
      '<div data-p="3" style="display:none"><div class="fp-caja-gris">Pegá acá la respuesta completa de la IA. Cada «## Parte» se carga en la parte del protocolo con el mismo nombre (si está vacía) o se agrega como parte nueva. Los programas se convierten en bloques, las gráficas se dibujan solas y lo que falte insertar queda marcado en gris.</div><label class="fp-l">Respuesta de la IA</label><textarea class="fp-ta mono" id="fi-resp" rows="16" spellcheck="false" placeholder="# Título del práctico&#10;&#10;## Objetivos&#10;…"></textarea></div>';
    var q = function (s) { return v.cuerpo.querySelector(s); };
    var ctx = { cat: { '3d': null, carton: null }, ext: null, sitio: estadoDelSitio() }, guia = null, pestana = 1;
    function chk(c) { return '<label class="fp-chk" title="' + esc(c.desc) + '"><input type="checkbox" data-cat="' + esc(c.modo + '|' + c.archivo) + '"> <span><b>' + esc(c.nombre) + '</b>' + (c.desc ? ' <span style="color:#666">· ' + esc(c.desc.slice(0, 70)) + (c.desc.length > 70 ? '…' : '') + '</span>' : '') + '</span></label>'; }
    [['3d', '#fi-cat-3d', '#fi-n3d'], ['carton', '#fi-cat-carton', '#fi-ncar']].forEach(function (x) {
      catalogo(x[0]).then(function (c) { ctx.cat[x[0]] = c; if (!abierta || abierta !== v) return; q(x[1]).innerHTML = c.map(chk).join('') || '<span class="fp-nota">Sin diseños.</span>'; q(x[2]).textContent = '· ' + c.length + ' hoy'; restaurar(); })
        .catch(function () { if (abierta === v) q(x[1]).innerHTML = '<span class="fp-nota">No se pudo leer el catálogo (sin conexión con GitHub). El prompt se arma igual, sin esta lista.</span>'; });
    });
    bloquesExtension().then(function (e) { ctx.ext = e; }).catch(function () {});
    guiaActual().then(function (g) { guia = g; if (g && abierta === v) { q('#fi-guia-box').style.display = 'flex'; q('#fi-guia-txt').innerHTML = 'Incluir la secuencia de la guía de armado que tengo abierta' + (g.titulo ? ' («' + esc(g.titulo) + '»)' : '') + ': ' + g.pasos.length + ' pasos'; } });
    function leer() {
      var eleg = []; [].forEach.call(v.cuerpo.querySelectorAll('[data-cat]:checked'), function (c) { var k = c.getAttribute('data-cat').split('|'); var it = (ctx.cat[k[0]] || []).filter(function (z) { return z.archivo === k[1]; })[0]; if (it) eleg.push(it); });
      var propios = q('#fi-propios').value.split('\n').map(function (l) { l = l.trim().replace(/^[-*•]\s*/, ''); if (!l) return null; var i = l.indexOf(':'); return i < 0 ? { nombre: l, partes: [] } : { nombre: l.slice(0, i).trim(), partes: l.slice(i + 1).split(/[,;]/).map(function (x) { return x.trim(); }).filter(Boolean) }; }).filter(Boolean);
      return { modo: q('[name=fi-modo]:checked').value, existente: q('#fi-existente').value, tema: q('#fi-tema').value.trim(), curso: q('#fi-curso').value.trim(), duracion: q('#fi-dur').value.trim(), magnitudes: q('#fi-mag').value.trim(), ideas: q('#fi-ideas').value.trim(),
        elegidos: eleg, propios: propios, guia: (guia && q('#fi-guia').checked) ? guia : null, secuencia: q('#fi-sec').value.trim(),
        extras: { bloques: q('#fi-x-bloques').checked, grafica: q('#fi-x-grafica').checked, ejes: q('#fi-x-ejes').checked, circuito: q('#fi-x-circuito').checked, seguridad: q('#fi-x-seguridad').checked },
        _cats: [].map.call(v.cuerpo.querySelectorAll('[data-cat]:checked'), function (c) { return c.getAttribute('data-cat'); }), _propios: q('#fi-propios').value };
    }
    function restaurar() {
      var f = _iaForm; if (!f) return;
      (f._cats || []).forEach(function (k) { var c = v.cuerpo.querySelector('[data-cat="' + k.replace(/"/g, '\\"') + '"]'); if (c) c.checked = true; });
    }
    if (_iaForm) { var f0 = _iaForm; q('[name=fi-modo][value=' + f0.modo + ']').checked = true; q('#fi-existente').value = f0.existente; q('#fi-tema').value = f0.tema; q('#fi-curso').value = f0.curso; q('#fi-dur').value = f0.duracion; q('#fi-mag').value = f0.magnitudes; q('#fi-ideas').value = f0.ideas; q('#fi-propios').value = f0._propios; q('#fi-sec').value = f0.secuencia; Object.keys(f0.extras).forEach(function (k) { q('#fi-x-' + k).checked = f0.extras[k]; }); }
    else { var mt = (api().meta().title || '').trim(); if (mt) q('#fi-tema').value = mt; var mc = (api().meta().course || '').trim(); if (mc) q('#fi-curso').value = mc; }
    function verModo() { q('#fi-exist-box').style.display = q('[name=fi-modo]:checked').value === 'adaptar' ? 'block' : 'none'; }
    [].forEach.call(v.cuerpo.querySelectorAll('[name=fi-modo]'), function (r) { r.onchange = verModo; }); verModo();
    q('#fi-usar').onclick = function () { var d = document.createElement('div'), t = ''; api().sections().forEach(function (s) { d.innerHTML = (s.html || '').replace(/<\/(p|li|h\d|tr|div)>/g, '\n</$1>').replace(/<br\s*\/?>/g, '\n'); var x = d.textContent.replace(/​/g, '').replace(/\n{3,}/g, '\n\n').trim(); if (x) t += '## ' + s.title + '\n' + x + '\n\n'; }); q('#fi-existente').value = t.trim() || q('#fi-existente').value; if (!t.trim()) aviso('El editor todavía no tiene texto.'); };
    q('#fi-archivo').onclick = function () { q('#fi-file').click(); };
    q('#fi-file').onchange = function (e) { var fl = e.target.files[0]; e.target.value = ''; if (!fl) return; var rd = new FileReader(); rd.onload = function () { q('#fi-existente').value = String(rd.result || ''); }; rd.readAsText(fl); };
    function generar() {
      var f = leer(); _iaForm = f; ctx.sitio = estadoDelSitio();
      var pr = armarPrompt(f, ctx); q('#fi-prompt').value = pr;
      var n3 = ctx.cat['3d'] ? ctx.cat['3d'].length : 0, nc = ctx.cat.carton ? ctx.cat.carton.length : 0;
      q('#fi-resumen').innerHTML = '<b>Incluye lo que hay hoy en el sitio:</b> ' + n3 + ' piezas 3D, ' + nc + ' diseños de cartón, ' + (ctx.ext ? ctx.ext.bloques.length + ' bloques de la extensión FisicaBit v' + esc(ctx.ext.version) : 'los bloques básicos de la extensión') + ', ' + ctx.sitio.fits.length + ' ajustes de curva y ' + ctx.sitio.mods.length + ' módulos. ' +
        (f.elegidos.length || f.propios.length || f.guia || f.secuencia ? 'Montaje: ' + [f.elegidos.length ? f.elegidos.length + ' del catálogo' : '', f.propios.length ? f.propios.length + ' propios' : '', f.guia ? 'guía de armado' : '', f.secuencia ? 'secuencia escrita' : ''].filter(Boolean).join(', ') + '.' : 'Sin elementos elegidos: la IA propone el montaje.') + ' <span style="color:#555">(' + pr.length.toLocaleString('es') + ' caracteres)</span>';
    }
    function ir(n) {
      if (n === 2) generar();
      pestana = n; [1, 2, 3].forEach(function (k) { q('[data-p="' + k + '"]').style.display = k === n ? '' : 'none'; q('[data-t="' + k + '"]').classList.toggle('act', k === n); });
      pintarPie();
    }
    [].forEach.call(v.cuerpo.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { ir(+b.getAttribute('data-t')); }; });
    function copiar() { var ta = q('#fi-prompt'); var ok = function () { aviso('Prompt copiado ✓ Pegalo en la IA y después traé la respuesta.'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, function () { ta.select(); document.execCommand('copy'); ok(); }); else { ta.select(); document.execCommand('copy'); ok(); } }
    function pintarPie() {
      v.pie.innerHTML = '';
      if (pestana === 1) { v.pie.appendChild(h('span', { class: 'fp-nota' }, 'Con lo que completes se arma el prompt. Nada se envía a ningún servicio: lo copiás vos.')); v.pie.appendChild(boton('Armar el prompt →', 'pri', function () { ir(2); })); }
      if (pestana === 2) { v.pie.appendChild(h('span', { class: 'fp-nota' }, 'Podés retocarlo antes de copiarlo.')); v.pie.appendChild(boton('← Cambiar datos', '', function () { ir(1); })); v.pie.appendChild(boton('Copiar el prompt', 'pri', copiar)); v.pie.appendChild(boton('Ya tengo la respuesta →', '', function () { ir(3); })); }
      if (pestana === 3) { v.pie.appendChild(h('span', { class: 'fp-nota' }, 'Se puede deshacer con ↶ en el editor.')); v.pie.appendChild(boton('← Prompt', '', function () { ir(2); })); v.pie.appendChild(boton('Importar al protocolo', 'pri', function () { var t = q('#fi-resp').value; if (!t.trim()) { aviso('Pegá primero la respuesta de la IA.'); return; } _iaForm = leer(); cerrar(); importarRespuesta(t); })); }
    }
    v.alCerrar = function () { try { _iaForm = leer(); } catch (e) {} };
    pintarPie();
  }

  /* ---------- Entrada ---------- */
  function abrir(cual) {
    if (!api()) return;
    if (cual === 'montaje') embebida('Montaje', 'Armá el dispositivo con piezas del catálogo e insertá el dibujo o el anexo de ensamblado', 'guias/?embed=1');
    else if (cual === 'circuito') embebida('Circuito', 'Esquemático o protoboard · «Insertar en el protocolo» lo agrega al documento', 'circuitos/?embed=1');
    else if (cual === 'teorica') abrirTeorica();
    else if (cual === 'bloques') abrirBloques();
    else if (cual === 'ia') abrirIA();
  }
  window.FbitProtocolo = {
    abrir: abrir, recibir: recibir, cerrar: cerrar,
    // para pruebas y para otras partes del sitio
    _: { compilar: compilar, dibujarGrafica: dibujarGrafica, dibujarBloques: dibujarBloques, armarPrompt: armarPrompt, catalogo: catalogo, bloquesExtension: bloquesExtension, estadoDelSitio: estadoDelSitio, guiaActual: guiaActual, partirMd: partirMd, mdAHtml: mdAHtml, importarRespuesta: importarRespuesta, anexoHTML: anexoHTML, resumenScad: resumenScad }
  };
})();
