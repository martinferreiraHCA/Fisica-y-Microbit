// Caja encastrable · cartón
// Caja sin pegamento: base con ranuras y cuatro paredes iguales que se
// encastran entre sí en las esquinas (molinete) y en la base por pestañas.
// Para guardar piezas, sensores o masas. Cambiá largo, ancho y alto.
// 5 piezas: base + 4 paredes (2 largas y 2 cortas si no es cuadrada).

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Caja] */
// Largo entre paredes (de eje a eje; interior = largo − espesor) (mm)
largo = 120; // [40:5:260]
// Ancho entre paredes (mm)
ancho = 80; // [40:5:260]
// Alto de las paredes (mm)
alto = 50; // [20:5:150]

/* [Hidden] */
e = espesor;
tw = 16;
// Cada pared mide (distancia entre paredes que cruza) + e, con una ranura
// desde abajo en un extremo y desde arriba en el otro (molinete).
module pared(l) difference() {
    union() {
        rect(l + e, alto, 1);
        for (x = [(l + e) / 4, 3 * (l + e) / 4]) translate([x, 0]) rotate(180) pestana(e, tw);
    }
    translate([e / 2, 0]) ranura(alto / 2);
    translate([l + e / 2, alto]) rotate(180) ranura(alto / 2);
    translate([(l + e) / 2, alto / 2 - 2]) texto(str(round(l)), h = 3.5, centrado = true);
}
module base() difference() {
    rect(largo + e + 10, ancho + e + 10, 3, center = true);
    for (s = [-1, 1]) {
        for (x = [-(largo + e) / 4, (largo + e) / 4]) translate([x, s * ancho / 2]) ranura_interior(tw + 0.4);
        for (y = [-(ancho + e) / 4, (ancho + e) / 4]) translate([s * largo / 2, y]) rotate(90) ranura_interior(tw + 0.4);
    }
    translate([0, -2]) texto("CAJA", h = 4, centrado = true);
}
module plano() {
    base();
    gap = e + fb_sobrante() + 10;
    y0 = (ancho + e + 10) / 2 + gap;
    translate([-(largo + e) / 2, y0]) pared(largo);
    translate([-(largo + e) / 2, y0 + alto + gap]) pared(largo);
    translate([-(largo + e) / 2, y0 + 2 * (alto + gap)]) pared(ancho);
    translate([-(largo + e) / 2 + ancho + e + 10, y0 + 2 * (alto + gap)]) pared(ancho);
}
module armado() {
    translate([0, 0, -e / 2]) laja() base();
    translate([-(largo + e) / 2, -ancho / 2, 0]) laja_xz() pared(largo);
    translate([largo / 2, -(ancho + e) / 2, 0]) laja_yz() pared(ancho);
    translate([(largo + e) / 2, ancho / 2, 0]) rotate([0, 0, 180]) laja_xz() pared(largo);
    translate([-largo / 2, (ancho + e) / 2, 0]) rotate([0, 0, 180]) laja_yz() pared(ancho);
}
