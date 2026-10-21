// Caja cúbica con agujeros (cámara oscura, mirilla, caja de luz) · cartón encastrable
// Cubo cerrado de 10 × 10 × 10 cm por defecto: cuatro paredes que se
// encastran entre sí en las esquinas (molinete) y entran por pestañas en la
// base y en la tapa; la tapa se saca para meter cosas adentro. En cada una
// de las seis caras podés abrir un agujero redondo con el diámetro y la
// posición que quieras: uno de 25–30 mm para apoyar el OJO (mirilla), uno de
// 1–2 mm como estenopo (cámara oscura), uno para una lente, un LED o un
// sensor… Cada agujero lleva impreso su diámetro.
// 6 piezas: frente, atrás, izquierda, derecha, base y tapa.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Caja] */
// Lado exterior del cubo (mm)
lado = 100; // [40:5:300]
// Incluir la tapa (si no, queda abierta por arriba)
con_tapa = true;

/* [Agujero del frente] */
// Diámetro (mm; 0 = sin agujero). 25–30 mm para el ojo
agujero_frente = 28; // [0:0.5:120]
// Posición en la cara (mirando la caja desde afuera)
posicion_frente = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de atrás] */
// Diámetro (mm; 0 = sin agujero). 1–2 mm para un estenopo
agujero_atras = 0; // [0:0.5:120]
posicion_atras = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de la izquierda] */
agujero_izquierda = 0; // [0:0.5:120]
posicion_izquierda = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de la derecha] */
agujero_derecha = 0; // [0:0.5:120]
posicion_derecha = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de la tapa] */
agujero_tapa = 0; // [0:0.5:120]
// arriba = hacia atrás, derecha = hacia la derecha (vista desde arriba)
posicion_tapa = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de la base] */
agujero_base = 0; // [0:0.5:120]
posicion_base = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Hidden] */
e = espesor;
tw = min(16, lado / 5);                 // ancho de pestañas
L = lado;                               // largo de cada pared (= lado: el molinete queda de lado × lado)
alto = lado - 2 * e;                    // alto de las paredes (entre base y tapa)
l = lado - e;                           // distancia entre ejes de paredes enfrentadas
xs = [L / 4, 3 * L / 4];                // pestañas y ranuras, a lo largo de cada borde
assert(alto > tw + 8, "El cubo es muy chico para ese espesor de cartón");

// Desplazamiento del agujero según la posición pedida; der = +1 si la x del dibujo
// es la derecha de quien mira la cara desde afuera, −1 si es la izquierda
function desp(pos, ancho_cara, alto_cara, der) =
    pos == "arriba" ? [0, alto_cara / 4] : pos == "abajo" ? [0, -alto_cara / 4] :
    pos == "izquierda" ? [-der * ancho_cara / 4, 0] : pos == "derecha" ? [der * ancho_cara / 4, 0] : [0, 0];
// Agujero con su diámetro impreso al lado (y un aro de tinta para ubicarlo)
module agujero_cara(d, c) {
    if (d > 0) translate(c) {
        circle(d = d);
        marca() difference() { circle(d = d + 3); circle(d = d + 2); }
        translate([0, -d / 2 - 5.5]) texto(str("O", d), h = 3, centrado = true);
    }
}
function cabe(d, c, ancho_cara, alto_cara) = d <= 0 || (c[0] - d / 2 >= 6 && c[0] + d / 2 <= ancho_cara - 6 && c[1] - d / 2 >= 6 && c[1] + d / 2 <= alto_cara - 6);

// Pared: ranura desde abajo en un extremo y desde arriba en el otro (molinete),
// pestañas hacia abajo (base) y hacia arriba (tapa)
module pared(nombre, d, pos, der) {
    c = [L / 2, alto / 2] + desp(pos, L, alto, der);
    assert(cabe(d, c, L, alto), str("El agujero de ", nombre, " no entra en la cara: achicá el diámetro o cambiá la posición"));
    difference() {
        union() {
            rect(L, alto, 1);
            for (x = xs) {
                translate([x, 0]) rotate(180) pestana(e, tw);
                if (con_tapa) translate([x, alto]) pestana(e, tw);
            }
        }
        translate([e / 2, 0]) ranura(alto / 2);
        translate([L - e / 2, alto]) rotate(180) ranura(alto / 2);
        agujero_cara(d, c);
        translate([L / 2, 7]) texto(nombre, h = 3.2, centrado = true);
    }
}
// Base y tapa: cuadrado de lado × lado con las ranuras de las pestañas
module placa(nombre, d, pos) {
    c = [L / 2, L / 2] + desp(pos, L, L, 1);
    assert(cabe(d, c, L, L), str("El agujero de la ", nombre, " no entra en la cara: achicá el diámetro o cambiá la posición"));
    difference() {
        rect(L, L, 2);
        for (s = [0, 1], x = xs) {
            translate([x, e / 2 + s * l]) ranura_interior(tw + 0.4);
            translate([e / 2 + s * l, x]) rotate(90) ranura_interior(tw + 0.4);
        }
        agujero_cara(d, c);
        translate([L / 2, 10]) texto(nombre, h = 3.2, centrado = true);
    }
}

module plano() {
    g = e + fb_sobrante() + 8;
    pieza("frente") pared("FRENTE", agujero_frente, posicion_frente, 1);
    pieza("derecha") translate([L + 8, 0]) pared("DERECHA", agujero_derecha, posicion_derecha, -1);
    pieza("atras") translate([0, alto + 2 * g]) pared("ATRAS", agujero_atras, posicion_atras, 1);
    pieza("izquierda") translate([L + 8, alto + 2 * g]) pared("IZQUIERDA", agujero_izquierda, posicion_izquierda, -1);
    pieza("base") translate([0, 2 * (alto + 2 * g)]) placa("BASE", agujero_base, posicion_base);
    if (con_tapa) pieza("tapa") translate([L + 8, 2 * (alto + 2 * g)]) placa("TAPA", agujero_tapa, posicion_tapa);
}
module armado() {
    translate([-L / 2, -L / 2, e / 2]) laja() placa("BASE", agujero_base, posicion_base);
    if (con_tapa) translate([-L / 2, -L / 2, lado - e / 2]) laja() placa("TAPA", agujero_tapa, posicion_tapa);
    translate([0, 0, e]) {
        translate([-L / 2, -l / 2, 0]) laja_xz() pared("FRENTE", agujero_frente, posicion_frente, 1);
        translate([l / 2, -L / 2, 0]) laja_yz() pared("DERECHA", agujero_derecha, posicion_derecha, -1);
        translate([L / 2, l / 2, 0]) rotate([0, 0, 180]) laja_xz() pared("ATRAS", agujero_atras, posicion_atras, 1);
        translate([-l / 2, L / 2, 0]) rotate([0, 0, 180]) laja_yz() pared("IZQUIERDA", agujero_izquierda, posicion_izquierda, -1);
    }
}
