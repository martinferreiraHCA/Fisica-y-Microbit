// Carro para micro:bit · cartón encastrable
// Chasis con ranura para parar la micro:bit, dos laterales con agujeros para
// ejes de brochette (palito de madera de 3 mm), dos travesaños que cruzan
// los laterales (marco rígido, en cruz) y cuatro ruedas de cartón.
// Para experimentos de movimiento con el acelerómetro o con Tracker.
// 9 piezas: chasis, 2 laterales iguales, 2 travesaños iguales, 4 ruedas iguales.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Carro] */
// Largo del chasis (mm)
largo = 130; // [80:5:220]
// Ancho del chasis (mm)
ancho = 70; // [50:5:120]
// Diámetro de las ruedas (mm)
rueda = 50; // [30:2:90]
// Diámetro del eje (palito de brochette: 3 mm)
eje = 3; // [2:0.5:8]
// Ancho de la ranura para la placa micro:bit (mm)
ranura_placa = 2.6; // [1.5:0.1:6]

/* [Hidden] */
e = espesor;
hl = rueda / 2 + 6;           // alto de los laterales: el eje queda a rueda/2 del piso y el lateral a 8 mm
tw = 16;
tw2 = 12;                     // pestañas de los travesaños
ex = [20, largo - 20];        // posición de los ejes
tx = [largo / 2 - 30, largo / 2 + 30];   // posición de los travesaños
yl = [8 + e / 2, ancho - 8 - e / 2];     // posición de los laterales
lt = ancho - 16;              // largo de los travesaños (de cara externa a cara externa)

module chasis() difference() {
    rect(largo, ancho, 4);
    for (x = ex, y = yl) translate([x, y]) ranura_interior(tw + 0.4);
    for (x = tx, y = [8 + lt / 4, 8 + 3 * lt / 4]) translate([x, y]) rotate(90) ranura_interior(tw2 + 0.4);
    translate([largo / 2, ancho / 2]) rotate(90) ranura_interior(46, ancho = ranura_placa);   // micro:bit parada, mirando al frente
    translate([largo / 2 + 9, ancho / 2]) rotate(90) texto("MICRO:BIT", h = 3, centrado = true);
    translate([6, 4]) regla(largo - 12, alto = 3, h_num = 2, unidad = "");
    translate([largo / 2 + 16, ancho - 18]) flecha(18);
}
module lateral() difference() {
    union() {
        rect(largo, hl, 2);
        for (x = ex) translate([x, hl]) pestana(e, tw);
    }
    for (x = ex) translate([x, rueda / 2 - 8]) agujero(eje, 0.6);
    for (x = tx) translate([x, hl]) rotate(180) ranura(hl / 2);       // cruce con los travesaños
    translate([largo / 2, 6]) texto("LATERAL", h = 3, centrado = true);
}
// Travesaño: cruza los dos laterales a media altura y se pestañea al chasis
module travesano() difference() {
    union() {
        rect(lt, hl, 2);
        for (x = [lt / 4, 3 * lt / 4]) translate([x, hl]) pestana(e, tw2);
    }
    for (x = [e / 2, lt - e / 2]) translate([x, 0]) ranura(hl / 2);
    translate([lt / 2, hl / 2 - 2]) texto("TRAVESANO", h = 2.6, centrado = true);
}
module rueda_pieza() difference() {
    circle(d = rueda);
    agujero(eje, 0.3);
    marca() difference() { circle(d = rueda - 4); circle(d = rueda - 5); }
    for (a = [0 : 60 : 300]) rotate(a) translate([rueda / 2 - 10, 0]) marca() square([5, 0.4], center = true);
}

module plano() {
    chasis();
    paso = hl + e + fb_sobrante() + 8;
    translate([0, ancho + 8]) lateral();
    translate([0, ancho + 8 + paso]) lateral();
    translate([0, ancho + 8 + 2 * paso]) travesano();
    translate([lt + 8, ancho + 8 + 2 * paso]) travesano();
    for (i = [0 : 3]) translate([largo + 10 + rueda / 2 + (i % 2) * (rueda + 6), rueda / 2 + floor(i / 2) * (rueda + 6)]) rueda_pieza();
}
module armado() {
    translate([0, 0, 8 + hl + e / 2]) laja() chasis();
    for (y = yl) translate([0, y, 8]) laja_xz() lateral();
    for (x = tx) translate([x, 8, 8]) laja_yz() travesano();
    // ruedas en el plano de los laterales (ejes a lo ancho del carro)
    for (x = ex, y = [-4 - e / 2, ancho + 4 + e / 2]) translate([x, y, rueda / 2]) laja_xz() rueda_pieza();
    // ejes de referencia (no se imprimen)
    for (x = ex) %color("tan") translate([x, -10, rueda / 2]) rotate([-90, 0, 0]) cylinder(d = eje, h = ancho + 20, $fn = 12);
}
