// Caja cúbica encastrable con agujeros (cámara oscura, mirilla, caja de luz) · cartón
// Misma lógica de encastre que el «pie para varilla»: cuatro paredes que se
// cruzan en las esquinas en molinete (ranura de abajo en una punta y de
// arriba en la otra), con pestañas arriba y abajo que atraviesan dos placas,
// la BASE y la TAPA, que sobresalen un poco alrededor. Sin pegamento; la
// tapa se saca para meter cosas adentro. En cartón las pestañas salen con
// sobrante y se recortan al ras después de armar.
// En cada una de las seis caras podés abrir un agujero redondo con el
// diámetro y la posición que quieras: uno de 25–30 mm para apoyar el OJO
// (mirilla), uno de 1–2 mm como estenopo (cámara oscura), uno para una
// lente, un LED o un sensor… Cada agujero lleva impreso su diámetro.
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
// Cuánto sobresalen la base y la tapa alrededor de las paredes (mm)
saliente = 6; // [0:1:15]
// Ancho de las pestañas (mm)
pestana_ancho = 16; // [8:1:30]

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
L = lado;                                // largo de cada pared (el molinete queda de lado × lado)
sep = lado - e;                          // separación entre paredes enfrentadas (eje a eje)
altura = lado - 2 * e;                   // alto de las paredes (entre base y tapa)
tw = min(pestana_ancho, L / 5);
P = lado + 2 * saliente;                 // lado de las placas (sobresalen «saliente» por lado)
assert(altura > tw + 10, "El cubo es muy chico para ese espesor de cartón");

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
function cabe(d, c, x0, y0, x1, y1) = d <= 0 || (c[0] - d / 2 >= x0 + 5 && c[0] + d / 2 <= x1 - 5 && c[1] - d / 2 >= y0 + 5 && c[1] + d / 2 <= y1 - 5);

// Pared: ranura de abajo en un extremo y de arriba en el otro (molinete),
// pestañas hacia abajo (base) y hacia arriba (tapa), como en el pie para varilla
module pared(nombre, d, pos, der) {
    c = [L / 2, altura / 2] + desp(pos, L, altura, der);
    assert(cabe(d, c, 0, 0, L, altura), str("El agujero de ", nombre, " no entra en la cara: achicá el diámetro o cambiá la posición"));
    difference() {
        union() {
            square([L, altura]);
            for (x = [L / 4, 3 * L / 4]) {
                translate([x, 0]) rotate(180) pestana(e, tw);
                if (con_tapa) translate([x, altura]) pestana(e, tw);
            }
        }
        translate([e / 2, 0]) ranura(altura / 2);
        translate([L - e / 2, altura]) rotate(180) ranura(altura / 2);
        agujero_cara(d, c);
        translate([L / 2, 7]) texto(nombre, h = 3.2, centrado = true);
    }
}
// Placa (base o tapa): cuadrado que sobresale, con las 8 ranuras de las pestañas
module placa(nombre, d, pos) {
    c = desp(pos, lado, lado, 1);
    assert(cabe(d, c, -lado / 2, -lado / 2, lado / 2, lado / 2), str("El agujero de la ", nombre, " no entra en la cara: achicá el diámetro o cambiá la posición"));
    difference() {
        rect(P, P, 4, center = true);
        for (k = [0 : 3]) rotate(k * 90) translate([-sep / 2, -sep / 2])
            for (t = [L / 4, 3 * L / 4]) translate([t - e / 2, 0]) ranura_interior(tw + 0.4);
        agujero_cara(d, c);
        translate([0, -lado / 2 + 12]) texto(nombre, h = 3.2, centrado = true);
    }
}
module frente()    pared("FRENTE", agujero_frente, posicion_frente, 1);
module derecha()   pared("DERECHA", agujero_derecha, posicion_derecha, -1);
module atras()     pared("ATRAS", agujero_atras, posicion_atras, 1);
module izquierda() pared("IZQUIERDA", agujero_izquierda, posicion_izquierda, -1);
module base()      placa("BASE", agujero_base, posicion_base);
module tapa()      placa("TAPA", agujero_tapa, posicion_tapa);

module plano() {
    paso = altura + 2 * (e + fb_sobrante()) + 6;
    y0 = e + fb_sobrante();
    pieza("frente") translate([0, y0]) frente();
    pieza("derecha") translate([0, y0 + paso]) derecha();
    pieza("atras") translate([0, y0 + 2 * paso]) atras();
    pieza("izquierda") translate([0, y0 + 3 * paso]) izquierda();
    pieza("base") translate([P / 2, y0 + 4 * paso + P / 2]) base();
    if (con_tapa) pieza("tapa") translate([P / 2 + P + 8, y0 + 4 * paso + P / 2]) tapa();
}
module armado() {
    translate([0, 0, -e / 2]) laja() base();
    if (con_tapa) translate([0, 0, altura + e / 2]) laja() tapa();
    translate([-sep / 2 - e / 2, -sep / 2, 0]) laja_xz() frente();
    rotate([0, 0, 90]) translate([-sep / 2 - e / 2, -sep / 2, 0]) laja_xz() derecha();
    rotate([0, 0, 180]) translate([-sep / 2 - e / 2, -sep / 2, 0]) laja_xz() atras();
    rotate([0, 0, 270]) translate([-sep / 2 - e / 2, -sep / 2, 0]) laja_xz() izquierda();
}
