// Caja rectangular encastrable con agujeros · cartón
// Caja cerrada con largo, ancho y alto independientes, armada como el pie
// para varilla y la caja cúbica: cuatro paredes que se cruzan en las
// esquinas en molinete (ranura de abajo en una punta y de arriba en la
// otra), con pestañas arriba y abajo que atraviesan la BASE y la TAPA, dos
// placas que sobresalen un poco alrededor. Sin pegamento; la tapa se saca.
// En cartón las pestañas salen con sobrante y se recortan al ras.
// Podés abrir hasta dos agujeros redondos, cada uno en la cara que quieras
// (frente, atrás, izquierda, derecha, tapa o base), con su diámetro y su
// posición: mirilla para el ojo, estenopo, lente, LED, sensor, cable…
// Cada agujero lleva impreso su diámetro.
// 6 piezas: frente, atrás, izquierda, derecha, base y tapa (5 sin tapa).

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Caja] */
// Largo exterior (de izquierda a derecha), mm
largo = 150; // [40:5:400]
// Ancho exterior (de frente a atrás), mm
ancho = 100; // [40:5:400]
// Alto exterior (mm)
alto = 80; // [30:5:300]
// Incluir la tapa (si no, queda abierta por arriba)
con_tapa = true;
// Cuánto sobresalen la base y la tapa alrededor de las paredes (mm)
saliente = 6; // [0:1:15]
// Ancho de las pestañas (mm)
pestana_ancho = 16; // [8:1:30]

/* [Agujero 1] */
// Cara donde va el agujero
cara_agujero = "frente"; // [frente, atras, izquierda, derecha, tapa, base, ninguna]
// Diámetro (mm). 25–30 mm para el ojo
diametro_agujero = 28; // [0.5:0.5:200]
// Posición en la cara (mirando la caja desde afuera; en tapa y base, arriba = hacia atrás)
posicion_agujero = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero 2] */
// Segundo agujero (por ejemplo, un estenopo de 1–2 mm en la cara opuesta)
cara_agujero_2 = "ninguna"; // [frente, atras, izquierda, derecha, tapa, base, ninguna]
diametro_agujero_2 = 1.5; // [0.5:0.5:200]
posicion_agujero_2 = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Hidden] */
e = espesor;
sx = largo - e;                          // separación entre las paredes cortas (eje a eje)
sy = ancho - e;                          // separación entre las paredes largas
h = alto - e - (con_tapa ? e : 0);       // alto de las paredes
tw = min(pestana_ancho, min(largo, ancho) / 5);
Px = largo + 2 * saliente;               // placas
Py = ancho + 2 * saliente;
assert(h > tw + 10, "La caja es muy baja para ese espesor de cartón");

// Desplazamiento del agujero según la posición pedida; der = +1 si la x del dibujo
// es la derecha de quien mira la cara desde afuera, −1 si es la izquierda
function desp(pos, ancho_cara, alto_cara, der) =
    pos == "arriba" ? [0, alto_cara / 4] : pos == "abajo" ? [0, -alto_cara / 4] :
    pos == "izquierda" ? [-der * ancho_cara / 4, 0] : pos == "derecha" ? [der * ancho_cara / 4, 0] : [0, 0];
function cabe(d, c, x0, y0, x1, y1) = c[0] - d / 2 >= x0 + 5 && c[0] + d / 2 <= x1 - 5 && c[1] - d / 2 >= y0 + 5 && c[1] + d / 2 <= y1 - 5;
// Agujero con su diámetro impreso al lado (y un aro de tinta para ubicarlo)
module agujero_cara(d, c) translate(c) {
    circle(d = d);
    marca() difference() { circle(d = d + 3); circle(d = d + 2); }
    translate([0, -d / 2 - 5.5]) texto(str("O", d), h = 3, centrado = true);
}
// Los agujeros que van en una cara: [[diámetro, posición], …]
function agujeros_de(cara) = concat(
    cara_agujero == cara ? [[diametro_agujero, posicion_agujero]] : [],
    cara_agujero_2 == cara ? [[diametro_agujero_2, posicion_agujero_2]] : []);
module agujeros(cara, centro, ancho_cara, alto_cara, der, x0, y0, x1, y1) {
    for (a = agujeros_de(cara)) {
        c = centro + desp(a[1], ancho_cara, alto_cara, der);
        assert(cabe(a[0], c, x0, y0, x1, y1), str("El agujero de ", cara, " no entra en la cara: achicá el diámetro o cambiá la posición"));
        agujero_cara(a[0], c);
    }
}

// Pared de largo L: ranura de abajo en un extremo y de arriba en el otro (molinete),
// pestañas hacia abajo (base) y hacia arriba (tapa)
module pared(cara, L, der) difference() {
    union() {
        square([L, h]);
        for (x = [L / 4, 3 * L / 4]) {
            translate([x, 0]) rotate(180) pestana(e, tw);
            if (con_tapa) translate([x, h]) pestana(e, tw);
        }
    }
    translate([e / 2, 0]) ranura(h / 2);
    translate([L - e / 2, h]) rotate(180) ranura(h / 2);
    agujeros(cara, [L / 2, h / 2], L, h, der, 0, 0, L, h);
    translate([L / 2, 7]) texto(cara, h = 3.2, centrado = true);
}
// Placa (base o tapa): rectángulo que sobresale, con las 8 ranuras de las pestañas
module placa(cara) difference() {
    rect(Px, Py, 4, center = true);
    for (s = [-1, 1]) {
        for (x = [-largo / 4, largo / 4]) translate([x, s * sy / 2]) ranura_interior(tw + 0.4);
        for (y = [-ancho / 4, ancho / 4]) translate([s * sx / 2, y]) rotate(90) ranura_interior(tw + 0.4);
    }
    agujeros(cara, [0, 0], largo, ancho, 1, -largo / 2, -ancho / 2, largo / 2, ancho / 2);
    translate([0, -ancho / 2 + 12]) texto(cara, h = 3.2, centrado = true);
}
module frente()    pared("frente", largo, 1);
module atras()     pared("atras", largo, 1);
module derecha()   pared("derecha", ancho, -1);
module izquierda() pared("izquierda", ancho, -1);
module base()      placa("base");
module tapa()      placa("tapa");

module plano() {
    paso = h + 2 * (e + fb_sobrante()) + 6;
    y0 = e + fb_sobrante();
    pieza("frente") translate([0, y0]) frente();
    pieza("atras") translate([0, y0 + paso]) atras();
    pieza("derecha") translate([0, y0 + 2 * paso]) derecha();
    pieza("izquierda") translate([ancho + 8, y0 + 2 * paso]) izquierda();
    pieza("base") translate([Px / 2, y0 + 3 * paso + Py / 2]) base();
    if (con_tapa) pieza("tapa") translate([Px / 2 + Px + 8, y0 + 3 * paso + Py / 2]) tapa();
}
module armado() {
    translate([0, 0, -e / 2]) laja() base();
    if (con_tapa) translate([0, 0, h + e / 2]) laja() tapa();
    translate([-largo / 2, -sy / 2, 0]) laja_xz() frente();
    translate([largo / 2, sy / 2, 0]) rotate([0, 0, 180]) laja_xz() atras();
    translate([sx / 2, -ancho / 2, 0]) laja_yz() derecha();
    translate([-sx / 2, ancho / 2, 0]) rotate([0, 0, 180]) laja_yz() izquierda();
}
