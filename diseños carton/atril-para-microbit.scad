// Atril para micro:bit · cartón encastrable
// Sostiene la placa inclinada (para leer la pantalla y usar la brújula o
// el acelerómetro en un plano fijo). El borde inferior de la placa entra en
// la ranura de dos laterales iguales, que se encastran en una base.
// 3 piezas: 2 laterales iguales + base.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (las pestañas salen más largas, con sobrante para recortar
// después de armar), laser (medidas exactas, compensa el kerf) o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Atril] */
// Inclinación de la placa respecto de la mesa (grados)
inclinacion = 65; // [30:5:85]
// Ancho de la placa que se apoya (micro:bit: 52 mm)
ancho_placa = 52; // [30:1:120]
// Ancho de la ranura donde entra la placa (mm)
ranura_placa = 2.6; // [1.5:0.1:6]

/* [Hidden] */
e = espesor;
h = 28;                                   // altura del respaldo
xf = 22;                                  // dónde apoya el borde inferior de la placa
xb = xf + h / tan(inclinacion);
xl = xf + 12 / tan(inclinacion);
prof = xb + 12;
tw = 12;
sep = ancho_placa - 16;                   // separación entre laterales
B = [ancho_placa + 24, prof + 8];         // base

module lateral() difference() {
    union() {
        polygon([[0, 0], [prof, 0], [prof, h], [xb, h], [xl, 12], [0, 12]]);
        for (x = [8, prof - 10]) translate([x, 0]) rotate(180) pestana(e, tw);
    }
    // bolsillo para el borde de la placa: cerrado abajo (5 mm de puente), abierto en el borde inclinado
    translate([xf, 0]) rotate(inclinacion - 90) translate([-ranura_placa / 2, 5]) square([ranura_placa, 14]);
    translate([(xl + xb) / 2 + 4, (12 + h) / 2 - 2]) rotate(inclinacion - 90) texto(str(inclinacion, "°"), h = 2.6, centrado = true);
}

module base() difference() {
    rect(B[0], B[1], 4, center = true);
    for (y = [-sep / 2, sep / 2], x = [8, prof - 10]) translate([x - prof / 2 - 4, y]) ranura_interior(tw + 0.4);
    translate([0, -2]) texto("MICRO:BIT", h = 4, centrado = true);
    translate([B[0] / 2 - 6, B[1] / 2]) rotate(180) regla(B[0] - 12, alto = 3, h_num = 2, unidad = "");
}

module plano() {
    lateral();
    paso = h + e + fb_sobrante() + 6;
    translate([0, paso]) lateral();
    translate([B[0] / 2, 2 * paso + B[1] / 2]) base();
}

module armado() {
    translate([0, 0, -e / 2]) laja() base();
    for (y = [-sep / 2, sep / 2]) translate([-prof / 2 - 4, y, 0]) laja_xz() lateral();
    // micro:bit de referencia (no se imprime)
    %color("green") translate([-prof / 2 - 4 + xf, 0, 0]) rotate([0, -inclinacion, 0])
        translate([0, -ancho_placa / 2, 0]) cube([43, ancho_placa, 1.6]);
}
