// Soporte para el sensor ultrasónico HC-SR04 · cartón encastrable
// Placa frontal con los dos agujeros de los transductores y una base con
// una regla impresa para verificar las distancias que mide el sensor.
// 2 piezas: frente + base.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Sensor] */
// Diámetro de los transductores (HC-SR04: 16 mm)
transductor = 16; // [10:0.5:25]
// Distancia entre centros de los transductores (HC-SR04: 26 mm)
separacion = 26; // [15:0.5:40]
// Altura del centro del sensor sobre la mesa (mm)
altura = 40; // [20:5:120]
// Largo de la base con la regla (mm)
largo_base = 180; // [60:10:280]

/* [Hidden] */
e = espesor;
fw = separacion + transductor + 24;   // ancho del frente
fh = altura + transductor / 2 + 10;
tw = 14;
bw = fw + 10;

module frente() difference() {
    union() {
        rect(fw, fh, 3);
        for (x = [fw / 2 - 18, fw / 2 + 18]) translate([x, 0]) rotate(180) pestana(e, tw);
    }
    for (s = [-1, 1]) translate([fw / 2 + s * separacion / 2, altura]) agujero(transductor, 0.8);
    translate([fw / 2, altura + transductor / 2 + 3]) rotate(180) ranura(6, ancho = 12, entrada = 0);   // paso de los pines
    translate([fw / 2, 10]) texto("HC-SR04", h = 3.5, centrado = true);
}
module base() difference() {
    rect(bw, largo_base, 3);
    for (x = [bw / 2 - 18, bw / 2 + 18]) translate([x, 10]) ranura_interior(tw + 0.4);
    // regla de distancia desde la cara del sensor (que queda en y = 10 + e/2)
    translate([bw - 2, 10 + e / 2]) rotate(90) regla(largo_base - 16 - e / 2, cada = 10, unidad = "");
    translate([bw / 2, largo_base / 2]) rotate(90) texto("DISTANCIA AL SENSOR (MM)", h = 3, centrado = true);
    translate([bw / 2, largo_base - 8]) flecha(0.1);
}
module plano() { frente(); translate([fw + 8, 0]) base(); }
module armado() {
    translate([-bw / 2, 0, -e / 2]) laja() base();
    translate([-fw / 2, 10, 0]) laja_xz() frente();
}
