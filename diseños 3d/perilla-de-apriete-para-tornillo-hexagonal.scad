// ============ PERILLA DE APRIETE PARA TORNILLO HEXAGONAL ============
// Perillas que se calzan sobre una TUERCA o la CABEZA de un tornillo y la
// convierten en tornillo de mano. Elegís la forma y el tornillo, y el resto
// de las medidas se calcula (o se fija a mano).
//  · redonda: perilla baja con 16 lóbulos redondeados, tapa abombada y hueco
//    hexagonal ciego por abajo (réplica de las perillas en STL de la carpeta
//    para tuercas de 8, 10, 12 y 13 mm).
//  · trilobulada: tres lóbulos con cuello cilíndrico, hueco hexagonal en las
//    dos caras y agujero pasante (réplica de la «perilla M3»): sirve como
//    tuerca de mano (la tuerca en la cara de los lóbulos y el tornillo pasa)
//    o como tornillo de mano (la cabeza hexagonal en el hueco).
// Se imprimen tal cual: la cara de los lóbulos apoyada en la cama y el
// hueco de abajo queda como un agujero (su techo es un puente corto).
// miniaturas: tipo="redonda" | tipo="trilobulada", tornillo="M3"

/* [Perilla] */
// Forma de la perilla
tipo = "redonda"; // [redonda, trilobulada]

/* [Tornillo o tuerca] */
// Rosca del tornillo o la tuerca: fija la medida entre caras (M3 5,5 · M4 7 · M5 8 · M6 10 · M8 13 · M10 17 mm)
tornillo = "M8"; // [M3, M4, M5, M6, M8, M10, otra]
// Medida entre caras si elegiste «otra» (mm)
entre_caras_otra = 13; // [4:0.5:30]
// Hueco para tuerca o cabeza hexagonal, o para cabeza cilíndrica (Allen)
hueco = "hexagonal"; // [hexagonal, cilindrico]
// Holgura del hueco (mm): subí 0,1 si la tuerca no entra
holgura = 0.2; // [0:0.05:0.8]
// Profundidad del hueco (mm; 0 = automática)
profundidad_hueco = 0; // [0:0.5:30]
// Agujero pasante para el tornillo
pasante = "auto"; // [auto, si, no]
// Diámetro del agujero pasante (mm; 0 = automático: rosca + 0,5)
diametro_pasante = 0; // [0:0.5:16]

/* [Medidas] */
// Diámetro exterior (mm; 0 = automático según el tornillo)
diametro = 0; // [0:0.5:60]
// Alto total (mm; 0 = automático)
alto = 0; // [0:0.5:40]
// Cantidad de lóbulos (0 = automático: 16 redonda, 3 trilobulada)
lobulos = 0; // [0:1:32]
// Redonda: profundidad de los valles entre lóbulos (mm; 0 = automática)
profundidad_lobulos = 0; // [0:0.1:5]
// Redonda: alto de la tapa abombada (mm; 0 = automático)
alto_cupula = 0; // [0:0.5:10]
// Trilobulada: diámetro del cuello (mm; 0 = automático)
diametro_cuello = 0; // [0:0.5:40]
// Trilobulada: alto de la parte de los lóbulos (mm; 0 = automático)
alto_lobulos = 0; // [0:0.5:20]
// Trilobulada: hueco hexagonal también en la cara del cuello
hueco_doble = true;

/* [Hidden] */
$fn = 96;
eps = 0.02;
// Tablas de tornillería (mm): rosca, entre caras (tuerca y cabeza hexagonal),
// espesor de tuerca, diámetro y alto de cabeza cilíndrica (Allen)
_T = ["M3", "M4", "M5", "M6", "M8", "M10"];
_d_tor = [3, 4, 5, 6, 8, 10];
_af    = [5.5, 7, 8, 10, 13, 17];
_e_tue = [2.4, 3.2, 4.7, 5.2, 6.8, 8.4];
_d_cab = [5.5, 7, 8.5, 10, 13, 16];
_h_cab = [3, 4, 5, 6, 8, 10];
function _ti(t) = let (s = search([t], _T)) len(s) > 0 && s[0] != [] ? s[0] : -1;
function af_de(t)  = _ti(t) >= 0 ? _af[_ti(t)] : entre_caras_otra;
function dt_de(t)  = _ti(t) >= 0 ? _d_tor[_ti(t)] : entre_caras_otra / 1.65;
function et_de(t)  = _ti(t) >= 0 ? _e_tue[_ti(t)] : dt_de(t) * 0.85;
function dc_de(t)  = _ti(t) >= 0 ? _d_cab[_ti(t)] : entre_caras_otra;
function hc_de(t)  = _ti(t) >= 0 ? _h_cab[_ti(t)] : dt_de(t);
// Medidas de las perillas redondas originales: [entre caras, diámetro, alto, profundidad del hueco]
_tabla = [[8, 14.4, 5.1, 2.7], [10, 17.4, 6.2, 3.4], [12, 27.3, 9.8, 7.1], [13, 31, 11, 8]];
function _auto(af, i) = af <= 13 ? lookup(af, [for (t = _tabla) [t[0], t[i]]]) : _tabla[3][i] * af / 13;
function n_lob() = lobulos > 0 ? lobulos : (tipo == "trilobulada" ? 3 : 16);
function con_pasante() = pasante == "si" || (pasante == "auto" && tipo == "trilobulada");
function d_pas(t) = diametro_pasante > 0 ? diametro_pasante : dt_de(t) + 0.5;

echo(str("Perilla ", tipo, " para ", tornillo, " (", af_de(tornillo), " mm entre caras)"));

// Hueco para la tuerca / cabeza, con la boca en z = 0 hacia abajo (para restar)
module hueco_tuerca(t, prof) {
    if (hueco == "cilindrico") {
        translate([0, 0, -eps]) cylinder(d = dc_de(t) + holgura, h = prof + eps);
        translate([0, 0, -eps]) cylinder(d1 = dc_de(t) + holgura + 1.2, d2 = dc_de(t) + holgura, h = 0.6 + eps);
    } else {
        rh = (af_de(t) + holgura) / sqrt(3);
        translate([0, 0, -eps]) cylinder(r = rh, h = prof + eps, $fn = 6);
        translate([0, 0, -eps]) cylinder(r1 = rh + 0.6, r2 = rh, h = 0.6 + eps, $fn = 6);
    }
}
function prof_auto(t, h) = profundidad_hueco > 0 ? profundidad_hueco
    : hueco == "cilindrico" ? hc_de(t) + 0.5
    : tipo == "trilobulada" ? et_de(t) + 0.6 : _auto(af_de(t), 3);

// ---- Perilla redonda (16 lóbulos, tapa abombada) ----
module redonda(t) {
    af = af_de(t);
    r = (diametro > 0 ? diametro : _auto(af, 1)) / 2;
    h = alto > 0 ? alto : _auto(af, 2);
    p = prof_auto(t, h);
    hc = alto_cupula > 0 ? min(alto_cupula, h - 1) : h * 0.27; zl = h - hc;
    r_tapa = r * 0.39;
    zc = (r_tapa * r_tapa + h * h - r * r - zl * zl) / (2 * (h - zl));
    R = sqrt(r * r + (zl - zc) * (zl - zc));
    prof_l = profundidad_lobulos > 0 ? profundidad_lobulos : r * 0.135; rc = prof_l + 0.3;
    rh = (hueco == "cilindrico" ? (dc_de(t) + holgura) / 2 : (af + holgura) / sqrt(3));
    assert(p < h - 1.5, "El hueco es más hondo que la perilla: bajá «profundidad_hueco» o subí «alto»");
    assert(r - rh - prof_l >= 1.2, str("La pared entre el hueco y los valles queda de ", round((r - rh - prof_l) * 100) / 100, " mm: subí «diametro» o bajá «profundidad_lobulos»"));
    difference() {
        intersection() {
            cylinder(r = r, h = h);
            translate([0, 0, zc]) sphere(R, $fn = 160);
        }
        for (a = [0 : 360 / n_lob() : 359]) rotate([0, 0, a]) translate([r + rc - prof_l, 0, -1]) cylinder(r = rc, h = h + 2, $fn = 32);
        hueco_tuerca(t, p);
        if (con_pasante()) translate([0, 0, -1]) cylinder(d = d_pas(t), h = h + 2);
    }
}

// ---- Perilla trilobulada con cuello (bordes redondeados y empalmes suaves) ----
module lobulos2d(r_hub, r_l, d_l, n, suav) {
    offset(r = suav) offset(r = -suav) union() {
        circle(r_hub);
        for (i = [0 : n - 1]) rotate(i * 360 / n + 270) translate([d_l, 0]) circle(r_l);
    }
}
// Extruye una forma 2D de alto e con los bordes superior e inferior redondeados (radio rb, en capas)
module lobulos_redondeados(e, rb, capas = 6) {
    for (k = [0 : capas - 1]) {
        z0 = rb * k / capas; z1 = rb * (k + 1) / capas; zm = (z0 + z1) / 2;
        d = rb - sqrt(rb * rb - (rb - zm) * (rb - zm));
        translate([0, 0, z0]) linear_extrude(z1 - z0 + eps) offset(delta = -d) children();
        translate([0, 0, e - z1]) linear_extrude(z1 - z0 + eps) offset(delta = -d) children();
    }
    translate([0, 0, rb - eps]) linear_extrude(e - 2 * rb + 2 * eps) children();
}
// Perfil (r, z) del cuello con empalme cóncavo abajo y borde redondeado arriba
module perfil_cuello(r_c, z0, z1, rf, rt) {
    union() {
        square([r_c, z1 - rt - z0 + eps]);                                // cuerpo
        translate([0, z1 - z0 - rt]) square([r_c - rt, rt]);              // tapa hasta el borde
        translate([r_c - rt, z1 - z0 - rt]) circle(rt, $fn = 32);         // borde redondeado
        difference() {                                                    // empalme cóncavo con los lóbulos
            square([r_c + rf, rf]);
            translate([r_c + rf, rf]) circle(rf, $fn = 32);
        }
    }
}
module trilobulada(t) {
    af = af_de(t);
    R = (diametro > 0 ? diametro : 3.1 * af) / 2;        // radio de las puntas de los lóbulos
    r_cuello = (diametro_cuello > 0 ? diametro_cuello : 1.82 * af) / 2;
    e = alto_lobulos > 0 ? alto_lobulos : 0.73 * af;      // alto de los lóbulos
    h = alto > 0 ? alto : 1.82 * af;                      // alto total
    p = prof_auto(t, h);
    r_l = R * 0.45; d_l = R - r_l;                        // lóbulos: círculos de radio r_l a distancia d_l
    rb = min(1.2, e * 0.22);                              // redondeo de los bordes de los lóbulos
    rf = min(1.5, af * 0.16);                             // empalme cóncavo lóbulos–cuello
    rt = min(1, af * 0.1);                                // redondeo de la boca del cuello
    rh = (hueco == "cilindrico" ? (dc_de(t) + holgura) / 2 : (af + holgura) / sqrt(3));
    assert(h > e + 2, "El alto total tiene que superar al de los lóbulos");
    assert(r_cuello - rh >= 1.2, str("La pared del cuello alrededor del hueco queda de ", round((r_cuello - rh) * 100) / 100, " mm: subí «diametro_cuello»"));
    assert(p * (hueco_doble ? 2 : 1) < h - 1.5, "Los huecos son más hondos que la perilla: bajá «profundidad_hueco» o subí «alto»");
    difference() {
        union() {
            // lóbulos con los bordes de arriba y abajo redondeados (capas de offset)
            lobulos_redondeados(e, rb) lobulos2d(r_cuello + rf + rb, r_l, d_l, n_lob(), af * 0.22);
            // cuello: empalme cóncavo con los lóbulos y boca redondeada
            translate([0, 0, e - eps]) rotate_extrude() perfil_cuello(r_cuello, e - eps, h, rf, rt);
        }
        hueco_tuerca(t, p);
        if (hueco_doble) translate([0, 0, h]) mirror([0, 0, 1]) hueco_tuerca(t, p);
        if (con_pasante()) translate([0, 0, -1]) cylinder(d = d_pas(t), h = h + 2);
    }
}

module perilla(t) { if (tipo == "trilobulada") trilobulada(t); else redonda(t); }
perilla(tornillo);
