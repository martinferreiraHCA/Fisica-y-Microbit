// MAPEO · Prueba de la entrada P1 de la micro:bit
//
// P1 no es un voltímetro ideal: al medir, la entrada toma un poco de corriente de lo que tiene conectado. Con una
// fuente de mucha resistencia (la punta apoyada en el agua) eso cambia la lectura. Esta prueba lo mide en la placa
// que se tenga (V1 o V2) con tres resistencias iguales en serie entre 3V y GND:
//
//      3V ──[R]── B ──[R]── A ──[R]── GND          A debería dar 1/3 de la tensión y B 2/3,
//                                                   y cada punto «se ve» como una fuente de 2R/3
//
// Modelo: lectura = V·(1 − k) + U·k, con k = Rf / (Rf + Rin). Rin es la resistencia con que carga la entrada y U la
// tensión interna hacia la que tira. Con las dos lecturas salen k, Rin y U. Se hace sin y con el capacitor de 100 nF
// entre P1 y GND, para ver cuánto corrige. Detalle y fuentes: mapeo/README.md.
(function () {
  'use strict';
  var CLAVE = 'fisicabit_mapeo_entrada';
  var TXT = {
    es: {
      titulo: 'Probar la entrada P1',
      intro: 'P1 no mide como un multímetro: al leer, toma un poco de corriente de lo que tiene conectado. Con la punta en el agua (una fuente de mucha resistencia) eso cambia la lectura. Esta prueba lo mide en tu placa y muestra cuánto corrige el capacitor.',
      arma: 'Poné <strong>tres resistencias iguales</strong> en serie entre <span style="color:#ef5350;font-weight:700;">3V</span> y <span style="color:#42a5f5;font-weight:700;">GND</span> (sirven de 47 kΩ a 220 kΩ). Con el programa de MAPEO cargado, tocá con <span style="color:#fdd835;font-weight:700;">P1</span> cada punto y presioná <strong>A</strong>: el valor entra solo en la casilla marcada. También podés escribirlo a mano.',
      r: 'Valor de cada resistencia (kΩ)', sin: 'Sin capacitor', con: 'Con 100 nF entre P1 y GND',
      f3: 'P1 en 3V', fa: 'P1 en A (1/3)', fb: 'P1 en B (2/3)', ideal: 'ideal',
      toma: 'Tomar la lectura actual', borra: 'Borrar la prueba',
      falta: 'Faltan lecturas en esta columna.',
      desv: 'Diferencia con lo ideal', nose: 'La carga de la entrada no se distingue: es menor que lo que dejan ver resistencias al 5 %.',
      carga: 'La entrada carga la punta como una resistencia de unos <strong>%RIN%</strong>, que tira hacia <strong>%U% V</strong>.',
      cubeta: 'En la cubeta, con una punta de %RS% kΩ, la lectura se corre hasta <strong>%E% %</strong> de la escala.',
      mejora: 'Con el capacitor el corrimiento baja de %A% a %B% mV en los puntos de prueba.',
      resto: 'Lo que queda con el capacitor viene de la resistencia fija de 10 MΩ que P1 tiene hacia 3V y de la tolerancia de las resistencias.',
      nota: 'Las lecturas se guardan en este navegador. Hacé la prueba en cada placa (V1 y V2): no dan lo mismo.'
    },
    en: {
      titulo: 'Test the P1 input',
      intro: 'P1 does not measure like a multimeter: while reading, it draws a little current from whatever is connected. With the probe in the water (a high-resistance source) that changes the reading. This test measures it on your board and shows how much the capacitor corrects.',
      arma: 'Put <strong>three equal resistors</strong> in series between <span style="color:#ef5350;font-weight:700;">3V</span> and <span style="color:#42a5f5;font-weight:700;">GND</span> (47 kΩ to 220 kΩ work). With the MAPPING program loaded, touch each point with <span style="color:#fdd835;font-weight:700;">P1</span> and press <strong>A</strong>: the value goes into the highlighted box. You can also type it.',
      r: 'Value of each resistor (kΩ)', sin: 'Without capacitor', con: 'With 100 nF between P1 and GND',
      f3: 'P1 on 3V', fa: 'P1 on A (1/3)', fb: 'P1 on B (2/3)', ideal: 'ideal',
      toma: 'Take the current reading', borra: 'Clear the test',
      falta: 'Readings are missing in this column.',
      desv: 'Difference from ideal', nose: 'The input loading cannot be told apart: it is smaller than what 5 % resistors let you see.',
      carga: 'The input loads the probe like a resistance of about <strong>%RIN%</strong>, pulling towards <strong>%U% V</strong>.',
      cubeta: 'In the tray, with a %RS% kΩ probe, the reading shifts by up to <strong>%E% %</strong> of full scale.',
      mejora: 'With the capacitor the shift drops from %A% to %B% mV at the test points.',
      resto: 'What remains with the capacitor comes from the fixed 10 MΩ resistor P1 has to 3V and from the resistor tolerance.',
      nota: 'Readings are saved in this browser. Run the test on each board (V1 and V2): they do not give the same result.'
    },
    pt: {
      titulo: 'Testar a entrada P1',
      intro: 'O P1 não mede como um multímetro: ao ler, puxa um pouco de corrente do que está ligado. Com a ponta na água (uma fonte de muita resistência) isso muda a leitura. Este teste mede isso na sua placa e mostra quanto o capacitor corrige.',
      arma: 'Coloque <strong>três resistores iguais</strong> em série entre <span style="color:#ef5350;font-weight:700;">3V</span> e <span style="color:#42a5f5;font-weight:700;">GND</span> (servem de 47 kΩ a 220 kΩ). Com o programa do MAPEAMENTO carregado, toque cada ponto com <span style="color:#fdd835;font-weight:700;">P1</span> e pressione <strong>A</strong>: o valor entra sozinho na casa marcada. Também dá para digitar.',
      r: 'Valor de cada resistor (kΩ)', sin: 'Sem capacitor', con: 'Com 100 nF entre P1 e GND',
      f3: 'P1 em 3V', fa: 'P1 em A (1/3)', fb: 'P1 em B (2/3)', ideal: 'ideal',
      toma: 'Tomar a leitura atual', borra: 'Apagar o teste',
      falta: 'Faltam leituras nesta coluna.',
      desv: 'Diferença para o ideal', nose: 'A carga da entrada não se distingue: é menor do que resistores de 5 % deixam ver.',
      carga: 'A entrada carrega a ponta como uma resistência de cerca de <strong>%RIN%</strong>, puxando para <strong>%U% V</strong>.',
      cubeta: 'Na cuba, com uma ponta de %RS% kΩ, a leitura se desloca até <strong>%E% %</strong> da escala.',
      mejora: 'Com o capacitor o deslocamento cai de %A% para %B% mV nos pontos de teste.',
      resto: 'O que resta com o capacitor vem do resistor fixo de 10 MΩ que o P1 tem para 3V e da tolerância dos resistores.',
      nota: 'As leituras ficam salvas neste navegador. Faça o teste em cada placa (V1 e V2): não dão o mesmo.'
    }
  };
  function idioma() { try { var l = (window.FbitI18n && window.FbitI18n.lang()) || 'es'; return TXT[l] ? l : 'es'; } catch (e) { return 'es'; } }
  var num = function (v) { var x = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : null; };
  var coma = function (x, d) { return x.toFixed(d).replace('.', ','); };

  // lecturas { f3, a, b } en volts y R de cada resistencia en kΩ → qué carga pone la entrada
  //   k menor que UMBRAL no se distingue de la tolerancia de las resistencias (5 %)
  var UMBRAL = 0.07;
  function calcular(l, rk) {
    if (!l || l.f3 == null || l.a == null || l.b == null || !(l.f3 > 0.5) || !(rk > 0)) return null;
    var va = l.f3 / 3, vb = 2 * l.f3 / 3, rf = 2 * rk / 3;                 // ideales y resistencia de la fuente en A y en B (kΩ)
    var k = 1 - (l.b - l.a) / (vb - va), o = { va: va, vb: vb, da: l.a - va, db: l.b - vb, k: k, rf: rf, distingue: k > UMBRAL };
    if (o.distingue) { o.rin = rf * (1 - k) / k; o.u = Math.max(0, Math.min(l.f3, (l.a - va * (1 - k)) / k)); }
    return o;
  }
  // corrimiento máximo en la cubeta (fracción de la escala) con una punta de rs kΩ
  function enCubeta(o, fs, rs) { if (!o || !o.distingue) return null; var kc = rs / (rs + o.rin); return kc * Math.max(o.u, fs - o.u) / fs; }

  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE) || 'null') || {}; } catch (e) { return {}; } }
  function guardar(d) { try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) {} }

  function abrir(ctrl) {
    var T = TXT[idioma()], d = leer(), ORDEN = ['sin.f3', 'sin.a', 'sin.b', 'con.f3', 'con.a', 'con.b'];
    d.rk = d.rk > 0 ? d.rk : 100; d.sin = d.sin || {}; d.con = d.con || {};
    var activa = ORDEN.filter(function (k) { var p = k.split('.'); return d[p[0]][p[1]] == null; })[0] || 'sin.f3';
    var celda = function (k) { var p = k.split('.'), v = d[p[0]][p[1]]; return '<input type="number" step="0.001" min="0" max="3.6" data-celda="' + k + '" value="' + (v == null ? '' : v) + '" style="width:100%;box-sizing:border-box;background:#101216;color:#fff;border:1px solid #444;padding:6px;font-size:13px;">'; };
    var fila = function (t, c) { return '<tr><td style="padding:4px 8px 4px 0;white-space:nowrap;">' + t + '</td><td style="padding:4px;">' + celda('sin.' + c) + '</td><td style="padding:4px;">' + celda('con.' + c) + '</td></tr>'; };
    var esquema = '<svg viewBox="0 0 560 96" role="img" aria-label="3V - R - B - R - A - R - GND" style="width:100%;height:auto;background:#1a1d23;border:1px solid #2b303b;margin:8px 0;">' +
      '<path d="M40 40 H520" stroke="#9e9e9e" stroke-width="2"/>' +
      [110, 280, 450].map(function (x) { return '<rect x="' + (x - 34) + '" y="30" width="68" height="20" fill="#1a1d23" stroke="#e0e0e0" stroke-width="2"/><text x="' + x + '" y="24" text-anchor="middle" font-size="11" fill="#9e9e9e">R</text>'; }).join('') +
      '<circle cx="40" cy="40" r="7" fill="#ef5350"/><text x="40" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#ef5350">3V</text>' +
      '<circle cx="520" cy="40" r="7" fill="#42a5f5"/><text x="520" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#42a5f5">GND</text>' +
      '<circle cx="195" cy="40" r="6" fill="#fdd835" stroke="#000"/><text x="195" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#fdd835">B · 2/3</text>' +
      '<circle cx="365" cy="40" r="6" fill="#fdd835" stroke="#000"/><text x="365" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#fdd835">A · 1/3</text>' +
      '<text x="280" y="88" text-anchor="middle" font-size="10" fill="#9e9e9e">P1 → 3V, A, B</text></svg>';
    var html = '<div id="fb-entrada"><p>' + T.intro + '</p>' + esquema + '<p>' + T.arma + '</p>' +
      '<label style="display:flex;align-items:center;gap:8px;margin:8px 0;">' + T.r + ' <input type="number" id="fb-ent-r" min="1" step="1" value="' + d.rk + '" style="width:90px;background:#101216;color:#fff;border:1px solid #444;padding:6px;"></label>' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr><th></th><th style="text-align:left;padding:4px;font-weight:700;">' + T.sin + '</th><th style="text-align:left;padding:4px;font-weight:700;">' + T.con + '</th></tr>' +
      fila(T.f3, 'f3') + fila(T.fa, 'a') + fila(T.fb, 'b') + '</table>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;"><button type="button" class="mapeo-btn" id="fb-ent-toma" style="width:auto;">' + T.toma + '</button><button type="button" class="mapeo-btn danger" id="fb-ent-borra" style="width:auto;">' + T.borra + '</button></div>' +
      '<div id="fb-ent-res"></div><p style="color:#9e9e9e;font-size:11px;">' + T.nota + '</p></div>';
    ctrl._showInfo(T.titulo, html);
    var raiz = document.getElementById('fb-entrada'), modal = document.getElementById('mapeo-info-modal');
    if (!raiz) return;
    var q = function (s) { return raiz.querySelector(s); };

    function marcar() { raiz.querySelectorAll('[data-celda]').forEach(function (i) { i.style.borderColor = i.dataset.celda === activa ? '#fdd835' : '#444'; i.style.boxShadow = i.dataset.celda === activa ? '0 0 0 1px #fdd835' : 'none'; }); }
    function bloque(titulo, l, o) {
      var h = '<div style="border:1px solid #2b303b;padding:8px 10px;margin:6px 0;"><div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#f9a825;font-weight:700;">' + titulo + '</div>';
      if (!o) return h + '<div style="color:#9e9e9e;">' + T.falta + '</div></div>';
      h += '<div>' + T.desv + ': A <strong>' + (o.da >= 0 ? '+' : '−') + Math.abs(Math.round(o.da * 1000)) + ' mV</strong> · B <strong>' + (o.db >= 0 ? '+' : '−') + Math.abs(Math.round(o.db * 1000)) + ' mV</strong> (' + T.ideal + ': ' + coma(o.va, 3) + ' V · ' + coma(o.vb, 3) + ' V)</div>';
      if (!o.distingue) return h + '<div>' + T.nose + '</div></div>';
      h += '<div>' + T.carga.replace('%RIN%', o.rin >= 1000 ? coma(o.rin / 1000, 1) + ' MΩ' : Math.round(o.rin) + ' kΩ').replace('%U%', coma(o.u, 2)) + '</div>';
      [20, 50].forEach(function (rs) { h += '<div>' + T.cubeta.replace('%RS%', rs).replace('%E%', coma(100 * enCubeta(o, l.f3, rs), 1)) + '</div>'; });
      return h + '</div>';
    }
    function pintar() {
      var os = calcular(d.sin, d.rk), oc = calcular(d.con, d.rk), h = bloque(T.sin, d.sin, os) + bloque(T.con, d.con, oc);
      if (os && oc) {
        var peor = function (o) { return Math.round(1000 * Math.max(Math.abs(o.da), Math.abs(o.db))); };
        h += '<p>' + T.mejora.replace('%A%', peor(os)).replace('%B%', peor(oc)) + ' ' + T.resto + '</p>';
      }
      q('#fb-ent-res').innerHTML = h; marcar();
    }
    function poner(k, v) {
      var p = k.split('.'); d[p[0]][p[1]] = v; guardar(d);
      var i = q('[data-celda="' + k + '"]'); if (i && document.activeElement !== i) i.value = v == null ? '' : v;
    }
    function tomar(v) {
      if (v == null || !isFinite(v)) return;
      poner(activa, Math.round(v * 1000) / 1000);
      var n = ORDEN.indexOf(activa); activa = ORDEN[Math.min(ORDEN.length - 1, n + 1)]; pintar();
    }
    raiz.querySelectorAll('[data-celda]').forEach(function (i) {
      i.addEventListener('focus', function () { activa = i.dataset.celda; marcar(); });
      i.addEventListener('input', function () { poner(i.dataset.celda, num(i.value)); pintar(); });
    });
    q('#fb-ent-r').addEventListener('input', function (e) { var v = num(e.target.value); if (v > 0) { d.rk = v; guardar(d); pintar(); } });
    q('#fb-ent-toma').addEventListener('click', function () { tomar(ctrl._lastValue); });
    q('#fb-ent-borra').addEventListener('click', function () { d.sin = {}; d.con = {}; guardar(d); raiz.querySelectorAll('[data-celda]').forEach(function (i) { i.value = ''; }); activa = 'sin.f3'; pintar(); });
    // Mientras la prueba está abierta, la medida que llega con el botón A va a la casilla marcada y no a la grilla
    ctrl._probeTap = function (v) {
      if (!document.body.contains(raiz) || !modal || !modal.classList.contains('open')) { ctrl._probeTap = null; return false; }
      tomar(v); return true;
    };
    pintar();
  }

  window.FbitEntradaP1 = { abrir: abrir, calcular: calcular, enCubeta: enCubeta };
})();
