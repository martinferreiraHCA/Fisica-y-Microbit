// Pie para varilla · cartón encastrable
// Dos placas con agujero (arriba y abajo) mantienen vertical una varilla;
// cuatro paredes iguales forman una caja que las separa. Sin pegamento.
// 6 piezas: 4 paredes iguales + 2 placas iguales.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (las pestañas salen más largas, con sobrante para recortar
// después de armar), laser (medidas exactas, compensa el kerf) o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Pie] */
// Diámetro de la varilla (mm)
diametro_varilla = 12; // [4:1:30]
// Lado de la base (mm)
lado = 120; // [60:5:220]
// Altura de las paredes (mm)
altura = 70; // [30:5:150]
// Ancho de las pestañas (mm)
pestana_ancho = 16; // [8:1:30]

/* [Hidden] */
e = espesor;
s = lado - e;            // separación entre paredes paralelas (eje a eje)
L = lado;                // largo de cada pared
tw = pestana_ancho;
P = lado + 2 * e + 8;    // lado de las placas (sobresalen un poco)

// Pared: ranura de abajo en un extremo, de arriba en el otro (molinete)
module pared() difference() {
    union() {
        square([L, altura]);
        for (x = [L / 4, 3 * L / 4]) {
            translate([x, altura]) pestana(e, tw);
            translate([x, 0]) rotate(180) pestana(e, tw);
        }
    }
    translate([e / 2, 0]) ranura(altura / 2);
    translate([L - e / 2, altura]) rotate(180) ranura(altura / 2);
    translate([L / 2, altura / 2 - 2]) texto("PARED", h = 4, centrado = true);
}

// Placa: agujero central + 8 ranuras para las pestañas de las paredes
module placa() difference() {
    rect(P, P, 4, center = true);
    agujero(diametro_varilla);
    for (k = [0 : 3]) rotate(k * 90) translate([-s / 2, -s / 2])
        for (t = [L / 4, 3 * L / 4]) translate([t - e / 2, 0]) ranura_interior(tw + 0.4);
    translate([-P / 2 + 10, -P / 2]) regla(P - 20, alto = 3, h_num = 2);
    translate([0, P / 2 - 22]) texto(str("VARILLA ", diametro_varilla, " MM"), h = 3.2, centrado = true);
}

module plano() {
    paso = altura + 2 * (e + fb_sobrante()) + 6;
    for (i = [0 : 3]) translate([0, i * paso]) pared();
    translate([P / 2, 4 * paso + P / 2]) placa();
    translate([P / 2 + P + 8, 4 * paso + P / 2]) placa();
}

module armado() {
    for (k = [0 : 3]) rotate([0, 0, k * 90]) translate([-s / 2 - e / 2, -s / 2, 0]) laja_xz() pared();
    translate([0, 0, -e / 2]) laja() placa();
    translate([0, 0, altura + e / 2]) laja() placa();
    // varilla de referencia (no se imprime)
    %color("gray") cylinder(d = diametro_varilla, h = altura + 120, $fn = 32);
}
