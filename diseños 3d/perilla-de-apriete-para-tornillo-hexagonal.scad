// ============ PERILLA DE APRIETE PARA TORNILLO HEXAGONAL ============
// Perilla que se calza sobre una TUERCA (o la cabeza de un tornillo)
// hexagonal y la convierte en tornillo de mano: perilla baja con lóbulos
// redondeados alrededor, tapa abombada y hueco hexagonal ciego por abajo.
// Versión paramétrica de las perillas en STL de la carpeta (8, 10, 12 y
// 13 mm entre caras): con «entre_caras» elegís la medida y el resto de
// las dimensiones se calcula con las proporciones de los originales, o
// las fijás a mano. Se imprime tal cual, con la boca del hueco apoyada
// en la cama; el techo del hueco es un puente corto que no necesita
// soporte. La tuerca entra a presión (o con una gota de pegamento).

/* [Qué imprimir] */
// Una perilla con la medida elegida, o el juego de 8, 10, 12 y 13 mm
pieza = "perilla"; // [perilla, juego_8_10_12_13]

/* [Tuerca] */
// Medida de la tuerca entre caras (mm)
entre_caras = 13; // [4:0.5:24]
// Holgura del hueco hexagonal (mm): subí 0,1 si la tuerca no entra
holgura = 0.2; // [0:0.05:0.8]
// Profundidad del hueco (mm; 0 = automática según la medida)
profundidad_hueco = 0; // [0:0.5:30]
// Agujero pasante para el tornillo (mm; 0 = sin agujero, hueco ciego como el original)
agujero_pasante = 0; // [0:0.5:16]

/* [Perilla] */
// Diámetro exterior (mm; 0 = automático según la medida)
diametro = 0; // [0:0.5:60]
// Alto total (mm; 0 = automático según la medida)
alto = 0; // [0:0.5:30]
// Cantidad de lóbulos del agarre
lobulos = 16; // [6:1:32]
// Profundidad de los valles entre lóbulos (mm; 0 = automática)
profundidad_lobulos = 0; // [0:0.1:5]
// Alto de la tapa abombada (mm; 0 = automático)
alto_cupula = 0; // [0:0.5:10]

/* [Hidden] */
$fn = 96;
eps = 0.02;
// Medidas de las perillas originales: [entre caras, diámetro, alto, profundidad del hueco]
_tabla = [[8, 14.4, 5.1, 2.7], [10, 17.4, 6.2, 3.4], [12, 27.3, 9.8, 7.1], [13, 31, 11, 8]];
function _auto(af, i) = af <= 13 ? lookup(af, [for (t = _tabla) [t[0], t[i]]]) : _tabla[3][i] * af / 13;
function d_de(af)  = diametro > 0 ? diametro : _auto(af, 1);
function h_de(af)  = alto > 0 ? alto : _auto(af, 2);
function p_de(af)  = profundidad_hueco > 0 ? profundidad_hueco : _auto(af, 3);
function cup_de(h) = alto_cupula > 0 ? min(alto_cupula, h - 1) : h * 0.27;
function lob_de(r) = profundidad_lobulos > 0 ? profundidad_lobulos : r * 0.135;

echo(str("Perilla para tuerca de ", entre_caras, " mm: Ø", round(d_de(entre_caras) * 10) / 10, " × ", round(h_de(entre_caras) * 10) / 10,
         " mm, hueco de ", round(p_de(entre_caras) * 10) / 10, " mm, ", lobulos, " lóbulos"));

module perilla(af) {
    r = d_de(af) / 2; h = h_de(af); p = p_de(af); hc = cup_de(h); zl = h - hc;
    r_tapa = r * 0.39;                                   // radio de la parte plana de arriba
    zc = (r_tapa * r_tapa + h * h - r * r - zl * zl) / (2 * (h - zl));   // centro de la esfera de la cúpula
    R = sqrt(r * r + (zl - zc) * (zl - zc));
    rh = (af + holgura) / sqrt(3);                       // radio de los vértices del hexágono
    prof_l = lob_de(r); rc = prof_l + 0.3;               // radio del cortador de cada valle
    assert(p < h - 1.5, "El hueco es más hondo que la perilla: bajá «profundidad_hueco» o subí «alto»");
    assert(r - rh - prof_l >= 1.2, str("La pared entre el hueco y los valles queda de ", round((r - rh - prof_l) * 100) / 100, " mm: subí «diametro» o bajá «profundidad_lobulos»"));
    difference() {
        intersection() {
            cylinder(r = r, h = h);
            translate([0, 0, zc]) sphere(R, $fn = 160);
        }
        // valles entre lóbulos
        for (a = [0 : 360 / lobulos : 359]) rotate([0, 0, a]) translate([r + rc - prof_l, 0, -1]) cylinder(r = rc, h = h + 2, $fn = 32);
        // hueco hexagonal (abajo) con boca achaflanada
        translate([0, 0, -eps]) cylinder(r = rh, h = p + eps, $fn = 6);
        translate([0, 0, -eps]) cylinder(r1 = rh + 0.6, r2 = rh, h = 0.6 + eps, $fn = 6);
        if (agujero_pasante > 0) translate([0, 0, -1]) cylinder(d = agujero_pasante, h = h + 2);
    }
}
module juego() {
    medidas = [13, 12, 10, 8];
    for (i = [0 : 3]) translate([i == 0 ? 0 : [for (j = [0 : i]) d_de(medidas[j])] * [for (j = [0 : i]) 1] - d_de(medidas[0]) / 2 - d_de(medidas[i]) / 2 + 6 * i, 0, 0]) perilla(medidas[i]);
}
if (pieza == "juego_8_10_12_13") juego();
else perilla(entre_caras);
