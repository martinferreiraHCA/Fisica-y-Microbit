// Gradilla para tubos de ensayo · cartón encastrable
// Placa superior con agujeros, placa inferior con los apoyos marcados y dos
// laterales con pestañas que atraviesan ambas placas.
// 4 piezas: 2 placas (distintas) + 2 laterales iguales.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Gradilla] */
// Cantidad de tubos
tubos = 6; // [2:1:12]
// Diámetro de los tubos (mm)
diametro_tubo = 16; // [10:1:30]
// Distancia entre centros (mm)
paso = 26; // [15:1:45]
// Altura de la placa superior sobre la base (mm)
altura = 70; // [40:5:120]

/* [Hidden] */
e = espesor;
largo = tubos * paso + 34;
xl = largo / 2 - 9;             // posición de los laterales
ancho = diametro_tubo + 26;
tw = 14;

module placa(agujeros) difference() {
    rect(largo, ancho, 3, center = true);
    for (i = [0 : tubos - 1]) translate([(i - (tubos - 1) / 2) * paso, 0]) {
        if (agujeros) agujero(diametro_tubo, 1);
        else marca() difference() { circle(d = diametro_tubo + 1); circle(d = diametro_tubo - 0.5); }
    }
    for (x = [-xl, xl]) translate([x, 0]) rotate(90) ranura_interior(tw + 0.4);
    if (!agujeros) translate([0, -ancho / 2 + 4]) texto("GRADILLA", h = 3.5, centrado = true);
}
module lateral() difference() {
    union() {
        rect(ancho, altura, 2);
        for (y = [0, altura]) translate([ancho / 2, y]) rotate(y == 0 ? 180 : 0) pestana(e, tw);
    }
    translate([ancho / 2, altura / 2]) texto(str(tubos, " TUBOS"), h = 3.5, centrado = true);
}

module plano() {
    placa(true);
    translate([0, ancho + 8]) placa(false);
    translate([-largo / 2, 2 * ancho + 16]) lateral();
    translate([-largo / 2 + ancho + 8, 2 * ancho + 16]) lateral();
}
module armado() {
    translate([0, 0, e / 2]) laja() placa(false);
    translate([0, 0, altura + e + e / 2]) laja() placa(true);
    for (x = [-xl, xl]) translate([x, -ancho / 2, e]) laja_yz() lateral();
}
