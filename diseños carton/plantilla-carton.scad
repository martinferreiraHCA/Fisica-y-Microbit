// Plantilla en blanco · cartón encastrable
// Dos piezas que se cruzan a media altura (encastre en cruz). Cambiala a gusto.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]

/* [Pieza] */
// Largo (mm)
largo = 100; // [30:5:250]
// Alto (mm)
alto = 50; // [20:5:150]

/* [Hidden] */
e = espesor;

// Pieza A: ranura desde abajo. Las marcas (regla, textos) van dentro del
// difference(), como si fueran agujeros: se imprimen pero no se cortan.
module pieza_a() difference() {
    rect(largo, alto, 2);
    translate([largo / 2, 0]) ranura(alto / 2);
    translate([5, alto - 6]) texto("A", h = 4);
}
// Pieza B: ranura desde arriba
module pieza_b() difference() {
    rect(largo, alto, 2);
    translate([largo / 2, alto]) rotate(180) ranura(alto / 2);
    translate([5, 0]) regla(largo - 10, alto = 4, h_num = 2, unidad = "");
    translate([5, alto - 6]) texto("B", h = 4);
}

// Plano de corte: todas las piezas, sin superponerse
module plano() {
    pieza_a();
    translate([0, alto + 8]) pieza_b();
}

// Vista armada en 3D
module armado() {
    translate([-largo / 2, 0, 0]) laja_xz() pieza_a();
    translate([0, -largo / 2, 0]) laja_yz() pieza_b();
}
