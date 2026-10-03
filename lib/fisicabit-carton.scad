// ============================================================
//  fisicabit-carton.scad — Biblioteca para diseños de ENCASTRE EN CARTÓN
//  Apartado «Diseño 3D ▸ Encastre en cartón» de FisicaBit.
//  Licencia MIT. Pensada para OpenSCAD 2021+ (incluido openscad-wasm).
//
//  La página agrega esta biblioteca sola al renderizar; en OpenSCAD de
//  escritorio escribí al inicio del diseño:  include <fisicabit-carton.scad>
//
//  CONVENCIÓN DE UN DISEÑO
//    espesor = 3;    // [1:0.5:8]  grosor del cartón (mm)
//    holgura = 0;    // [-0.6:0.1:0.8] ancho extra de las ranuras (mm)
//    module pieza_a() difference() { square([80, 40]); translate([40, 0]) ranura(20); }
//    module plano()  { pieza_a(); translate([0, 50]) pieza_b(); }   // piezas de corte
//    module armado() { laja() pieza_a(); ... }                       // vista 3D armada
//
//    La página renderiza con  -D vista="plano" | "marcas" | "armado".
//    Las MARCAS impresas (reglas, transportadores, textos, dobleces) van
//    DENTRO del difference() de la pieza, como si fueran agujeros: en el
//    plano de corte no quitan material y en la impresión salen en tinta.
// ============================================================

vista = "armado";   // la página lo cambia con -D; el diseño NO lo define
$marcas = false;    // true solo mientras se dibuja la capa de tinta
$fn = 48;

/* ---------- Material y medidas ---------- */
// material: "carton" (se corta a mano: las pestañas salen MÁS LARGAS, con
// sobrante, para que traspasen y se recorte lo que sobra una vez armado),
// "laser" (medidas exactas, compensa el kerf del haz) o "impresion3d"
// (medidas exactas; descargá el STL de las piezas planas).
function fb_material() = is_undef(material) ? "carton" : material;
function fb_espesor() = is_undef(espesor) ? 3 : espesor;
function fb_holgura() = is_undef(holgura) ? 0 : holgura;
// Largo extra de las pestañas en cartón (mm); 0 en láser e impresión 3D
function fb_sobrante() = !is_undef(sobrante) ? sobrante : (fb_material() == "carton" ? 8 : 0);
// Ancho del haz del láser (mm): se descuenta de las ranuras y se suma a las pestañas
function fb_kerf() = !is_undef(kerf) ? kerf : (fb_material() == "laser" ? 0.15 : 0);
// Ancho de una ranura donde entra otra pieza de cartón
function fb_ranura() = fb_espesor() + fb_holgura() - fb_kerf();

/* ---------- Encastres (2D, para restar o sumar en una pieza) ---------- */
// Ranura abierta: entra por y=0 (borde de la pieza) y avanza hacia +y.
//   prof    profundidad; ancho (por defecto espesor+holgura);
//   entrada boca ensanchada a 45° para guiar el encastre (mm, 0 = sin boca)
module ranura(prof, ancho = undef, entrada = 1) {
    a = is_undef(ancho) ? fb_ranura() : ancho;
    translate([-a / 2, -1]) square([a, prof + 1]);
    if (entrada > 0)
        polygon([[-a / 2 - entrada, -1], [a / 2 + entrada, -1], [a / 2, entrada], [-a / 2, entrada]]);
}
// Ranura cerrada (pasante) centrada en el origen, a lo largo de x.
module ranura_interior(largo, ancho = undef) {
    a = is_undef(ancho) ? fb_ranura() : ancho;
    square([largo, a], center = true);
}
// Pestaña (para sumar con union): nace en y=0 y sobresale hacia +y.
//   largo  lo que debe traspasar (normalmente el espesor de la otra pieza).
//   En cartón se agrega el sobrante (fb_sobrante) para recortarlo después;
//   exacta = true lo evita (pestañas que no deben sobresalir).
module pestana(largo, ancho = undef, exacta = false) {
    a = (is_undef(ancho) ? fb_espesor() : ancho) + fb_kerf();
    l = largo + (exacta ? 0 : fb_sobrante());
    translate([-a / 2, -0.01]) square([a, l + 0.01]);
}
// Agujero redondo (varillas, ejes, tornillos). d = diámetro de la pieza que pasa.
module agujero(d, juego = 0.4) { circle(d = d + juego); }
// Esquina redondeada para cuadrados: rect(ancho, alto, r)
module rect(ancho, alto, r = 0, center = false) {
    translate(center ? [-ancho / 2, -alto / 2] : [0, 0])
        if (r <= 0) square([ancho, alto]);
        else hull() for (x = [r, ancho - r], y = [r, alto - r]) translate([x, y]) circle(r = r);
}

/* ---------- Armado 3D (una pieza 2D → placa de cartón) ---------- */
// laja(): placa horizontal (plano XY), centrada en su espesor.
module laja() linear_extrude(fb_espesor(), center = true) children();
// laja_xz(): placa vertical en el plano XZ (su "y" del dibujo pasa a ser altura).
module laja_xz() rotate([90, 0, 0]) laja() children();
// laja_yz(): placa vertical en el plano YZ.
module laja_yz() rotate([90, 0, 90]) laja() children();

/* ---------- Marcas impresas (tinta, no cortan) ---------- */
// Todo lo que va dentro de marca(){...} se imprime y no se corta.
module marca() { if ($marcas) children(); }

// Tipografía de trazos (no hace falta ninguna fuente instalada).
// Glifos en una caja de 1 × 2; cada glifo = lista de polilíneas.
_FB_CHARS = "0123456789.-°/:,()+=ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz";
_FB_LETRAS = [
    [[[0,0],[0.5,2],[1,0]],[[0.22,0.9],[0.78,0.9]]],                                   // A
    [[[0,0],[0,2],[0.75,2],[1,1.75],[1,1.25],[0.75,1],[0,1]],[[0.75,1],[1,0.75],[1,0.25],[0.75,0],[0,0]]], // B
    [[[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,0.3],[0.3,0],[0.7,0],[1,0.3]]],                // C
    [[[0,0],[0,2],[0.65,2],[1,1.65],[1,0.35],[0.65,0],[0,0]]],                          // D
    [[[1,2],[0,2],[0,0],[1,0]],[[0,1],[0.7,1]]],                                        // E
    [[[1,2],[0,2],[0,0]],[[0,1],[0.7,1]]],                                              // F
    [[[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,0.3],[0.3,0],[0.7,0],[1,0.3],[1,0.9],[0.55,0.9]]], // G
    [[[0,0],[0,2]],[[1,0],[1,2]],[[0,1],[1,1]]],                                        // H
    [[[0.5,0],[0.5,2]],[[0.2,2],[0.8,2]],[[0.2,0],[0.8,0]]],                            // I
    [[[1,2],[1,0.3],[0.7,0],[0.3,0],[0,0.3]]],                                          // J
    [[[0,0],[0,2]],[[1,2],[0,0.85]],[[0.35,1.3],[1,0]]],                                // K
    [[[0,2],[0,0],[1,0]]],                                                              // L
    [[[0,0],[0,2],[0.5,0.9],[1,2],[1,0]]],                                              // M
    [[[0,0],[0,2],[1,0],[1,2]]],                                                        // N
    [[[0.3,0],[0.7,0],[1,0.3],[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,0.3],[0.3,0]]],         // O
    [[[0,0],[0,2],[0.75,2],[1,1.75],[1,1.2],[0.75,0.95],[0,0.95]]],                     // P
    [[[0.3,0],[0.7,0],[1,0.3],[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,0.3],[0.3,0]],[[0.6,0.55],[1.05,0]]], // Q
    [[[0,0],[0,2],[0.75,2],[1,1.75],[1,1.2],[0.75,0.95],[0,0.95]],[[0.5,0.95],[1,0]]],  // R
    [[[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,1.3],[0.3,1.02],[0.7,0.98],[1,0.7],[1,0.3],[0.7,0],[0.3,0],[0,0.3]]], // S
    [[[0,2],[1,2]],[[0.5,2],[0.5,0]]],                                                  // T
    [[[0,2],[0,0.3],[0.3,0],[0.7,0],[1,0.3],[1,2]]],                                    // U
    [[[0,2],[0.5,0],[1,2]]],                                                            // V
    [[[0,2],[0.25,0],[0.5,1.2],[0.75,0],[1,2]]],                                        // W
    [[[0,0],[1,2]],[[0,2],[1,0]]],                                                      // X
    [[[0,2],[0.5,1],[1,2]],[[0.5,1],[0.5,0]]],                                          // Y
    [[[0,2],[1,2],[0,0],[1,0]]]                                                         // Z
];
_FB_GLIFOS = concat([
    [[[0.3,0],[0.7,0],[1,0.3],[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,0.3],[0.3,0]],[[0.2,0.3],[0.8,1.7]]], // 0
    [[[0.5,0],[0.5,2]],[[0.15,1.65],[0.5,2]]],                                          // 1
    [[[0,1.7],[0.3,2],[0.7,2],[1,1.7],[1,1.3],[0,0],[1,0]]],                            // 2
    [[[0,2],[1,2],[0.55,1.15],[1,0.75],[1,0.3],[0.7,0],[0.3,0],[0,0.3]]],               // 3
    [[[0.75,0],[0.75,2],[0,0.6],[1,0.6]]],                                              // 4
    [[[1,2],[0,2],[0,1.1],[0.7,1.1],[1,0.8],[1,0.3],[0.7,0],[0,0]]],                    // 5
    [[[1,2],[0.4,2],[0,1.4],[0,0.3],[0.3,0],[0.7,0],[1,0.3],[1,0.8],[0.7,1.05],[0,1.05]]], // 6
    [[[0,2],[1,2],[0.4,0]]],                                                            // 7
    [[[0.5,1.05],[0.2,1.3],[0.2,1.75],[0.5,2],[0.8,1.75],[0.8,1.3],[0.5,1.05],[0.1,0.8],[0.1,0.25],[0.4,0],[0.6,0],[0.9,0.25],[0.9,0.8],[0.5,1.05]]], // 8
    [[[0,0],[0.6,0],[1,0.6],[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,1.2],[0.3,0.95],[1,0.95]]], // 9
    [[[0.5,0],[0.5,0.06]]],                                                             // .
    [[[0.2,1],[0.8,1]]],                                                                // -
    [[for (a = [0:45:360]) [0.5 + 0.28 * cos(a), 1.7 + 0.28 * sin(a)]]],               // °
    [[[0,0],[1,2]]],                                                                    // /
    [[[0.5,0.4],[0.5,0.46]],[[0.5,1.4],[0.5,1.46]]],                                    // :
    [[[0.55,0.3],[0.4,-0.3]]],                                                          // ,
    [[[0.8,2.2],[0.4,1.6],[0.4,0.4],[0.8,-0.2]]],                                       // (
    [[[0.2,2.2],[0.6,1.6],[0.6,0.4],[0.2,-0.2]]],                                       // )
    [[[0.1,1],[0.9,1]],[[0.5,0.6],[0.5,1.4]]],                                          // +
    [[[0.1,0.75],[0.9,0.75]],[[0.1,1.25],[0.9,1.25]]]                                   // =
], _FB_LETRAS, [[]], _FB_LETRAS);

function _fb_glifo(c) = let(i = search(c, _FB_CHARS, 1)[0]) i == undef || i == [] ? [] : _FB_GLIFOS[i];
module _fb_trazo(pts, g) {
    if (len(pts) == 1) translate(pts[0]) circle(d = g, $fn = 12);
    for (i = [0 : len(pts) - 2]) hull() {
        translate(pts[i]) circle(d = g, $fn = 12);
        translate(pts[i + 1]) circle(d = g, $fn = 12);
    }
}
// Ancho que ocupa un texto de altura h
function fb_ancho_texto(s, h = 4) = (len(s) * 1.45 - 0.45) * h / 2;
// texto(s, h): escribe s con altura de mayúscula h (mm); g = grosor del trazo.
// centrado = true centra el texto en x sobre el origen. Solo dibuja en la capa de marcas.
module texto(s, h = 4, g = undef, centrado = false) {
    if ($marcas) {
        gg = is_undef(g) ? max(0.3, h * 0.11) : g;
        k = h / 2;
        off = centrado ? -fb_ancho_texto(s, h) / 2 : 0;
        for (i = [0 : len(s) - 1]) {
            gl = _fb_glifo(s[i]);
            for (p = gl)
                _fb_trazo([for (q = p) [off + (i * 1.45 + q[0]) * k, q[1] * k]], gg);
        }
    }
}
// Línea de tinta entre dos puntos
module linea(a, b, g = 0.35) { if ($marcas) _fb_trazo([a, b], g); }
// Línea de doblez (punteada) de largo l a lo largo de +x desde el origen
module doblez(largo, g = 0.3, tramo = 4) {
    if ($marcas) for (x = [0 : tramo * 2 : largo - tramo]) translate([x, -g / 2]) square([min(tramo, largo - x), g]);
}
// Regla: ticks desde el origen hacia +x, apoyada en y=0 (poner el origen en el
// borde de la pieza). largo en mm; paso entre ticks; cada = ticks numerados;
// desde = valor que se escribe en el origen (para medir desde otro punto).
module regla(largo = 100, alto = 6, paso = 1, cada = 10, numeros = true, unidad = "mm", desde = 0, g = 0.35, h_num = 2.4) {
    if ($marcas) {
        square([largo, g]);
        n = floor(largo / paso + 1e-6);
        for (i = [0 : n]) {
            x = i * paso;
            l = (x % cada == 0) ? alto : (x % (cada / 2) == 0) ? alto * 0.65 : alto * 0.4;
            translate([x - g / 2, 0]) square([g, l]);
            if (numeros && x % cada == 0)
                translate([x, alto + 1]) texto(str(x + desde), h = h_num, centrado = true);
        }
        if (numeros && unidad != "") translate([largo + 5, alto + 1]) texto(unidad, h = h_num);
    }
}
// Transportador: arco de radio r centrado en el origen, ángulos desde→hasta
// (grados, sentido antihorario desde +x). Ticks hacia adentro.
//   cero      ángulo que se rotula como 0 (por defecto, desde)
//   simetrico true: rótulos sin signo a ambos lados de cero (péndulos)
//   numeros_adentro true: los números apuntan hacia el centro (escalas colgantes)
module transportador(r = 40, desde = 0, hasta = 180, paso = 1, cada = 10, numeros = true, linea_base = true, cero = undef, simetrico = false, numeros_adentro = false, g = 0.35, h_num = 2.4) {
    if ($marcas) {
        c0 = is_undef(cero) ? desde : cero;
        _fb_arco(r, desde, hasta, g);
        for (a = [desde : paso : hasta]) {
            d = a - c0;
            l = (d % cada == 0) ? 6 : (d % (cada / 2) == 0) ? 4 : 2.5;
            rotate(a) translate([r - l, -g / 2]) square([l, g]);
        }
        if (numeros) for (a = [desde : paso : hasta]) if ((a - c0) % cada == 0)
            rotate(a) translate([numeros_adentro ? r - 6.6 : r - 8.6, 0]) rotate(numeros_adentro ? 90 : -90)
                texto(str(simetrico ? abs(a - c0) : a - c0), h = h_num, centrado = true);
        if (linea_base) {
            rotate(desde) translate([0, -g / 2]) square([r, g]);
            rotate(hasta) translate([0, -g / 2]) square([r, g]);
            if (!is_undef(cero)) rotate(cero) translate([0, -g / 2]) square([r, g]);
            _fb_trazo([[-2, 0], [2, 0]], g); _fb_trazo([[0, -2], [0, 2]], g);
        }
    }
}
// Arco de tinta (sin ticks), para señalar un ángulo
module arco(r, desde = 0, hasta = 90, g = 0.35) { if ($marcas) _fb_arco(r, desde, hasta, g); }
module _fb_arco(r, desde, hasta, g) {
    n = max(8, ceil((hasta - desde) / 3));
    polygon(concat(
        [for (i = [0 : n]) let(a = desde + (hasta - desde) * i / n) [(r + g / 2) * cos(a), (r + g / 2) * sin(a)]],
        [for (i = [n : -1 : 0]) let(a = desde + (hasta - desde) * i / n) [(r - g / 2) * cos(a), (r - g / 2) * sin(a)]]
    ));
}
// Cuadrícula de tinta (papel milimetrado grueso) desde el origen
module cuadricula(ancho, alto, paso = 10, g = 0.2) {
    if ($marcas) {
        for (x = [0 : paso : ancho]) translate([x - g / 2, 0]) square([g, alto]);
        for (y = [0 : paso : alto]) translate([0, y - g / 2]) square([ancho, g]);
    }
}
// Flecha de tinta desde el origen hacia +x
module flecha(largo, g = 0.35) {
    if ($marcas) { _fb_trazo([[0, 0], [largo, 0]], g); polygon([[largo, 0], [largo - 3, 1.4], [largo - 3, -1.4]]); }
}

/* ---------- Piezas auxiliares ---------- */
// Peine de prueba de ajuste: ranuras de distintos anchos para elegir la
// holgura que mejor encastra con TU cartón y TU forma de cortar.
module peine_ajuste(n = 5, paso = 0.2, prof = 15) {
    e = fb_espesor();
    w = n * 10 + 10;
    difference() {
        rect(w, prof + 14, 2);
        for (i = [0 : n - 1]) {
            d = round((i - floor(n / 2)) * paso * 100) / 100;
            translate([10 + i * 10, 0]) ranura(prof, ancho = e + d, entrada = 0.6);
            translate([10 + i * 10, prof + 3]) texto(str(d > 0 ? "+" : "", d), h = 2.4, centrado = true);
        }
        translate([w / 2, prof + 8.5]) texto(str("E ", e), h = 2.6, centrado = true);
    }
}

/* ---------- Despachador de vistas (lo usa la página) ---------- */
module _fb_con_marcas() { $marcas = true; plano(); }
module _fb_sin_marcas() { $marcas = false; plano(); }
if (vista == "plano") _fb_sin_marcas();
else if (vista == "marcas") difference() { _fb_sin_marcas(); _fb_con_marcas(); }
else if (vista == "plano_3d") linear_extrude(fb_espesor()) _fb_sin_marcas();
else if (vista == "armado") armado();
