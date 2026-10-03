// Soporte de celular para filmar · cartón encastrable
// Para grabar videos de movimiento (Tracker, Video + Movimiento) con el
// celular fijo. Dos laterales con un bolsillo inclinado donde apoya el
// borde del teléfono y una base ancha. Sirve vertical u horizontal.
// 3 piezas: 2 laterales iguales + base.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Soporte] */
// Inclinación del celular respecto de la mesa (grados)
inclinacion = 75; // [45:5:90]
// Grosor del celular con funda (mm)
grosor_celular = 11; // [6:0.5:18]
// Separación entre los laterales (mm)
separacion = 60; // [40:5:140]
// Alto del respaldo (mm)
alto = 70; // [40:5:140]

/* [Hidden] */
e = espesor;
h = alto;
xf = 30;                                    // apoyo del borde inferior del celular
xb = xf + h / tan(inclinacion);
xl = xf + 14 / tan(inclinacion);
prof = xb + 14;
tw = 14;
B = [separacion + 2 * e + 30, prof + 10];

module lateral() difference() {
    union() {
        polygon([[0, 0], [prof, 0], [prof, h], [xb, h], [xl, 14], [0, 14]]);
        for (x = [10, prof - 12]) translate([x, 0]) rotate(180) pestana(e, tw);
    }
    translate([xf, 0]) rotate(inclinacion - 90) translate([-grosor_celular / 2, 5]) square([grosor_celular, 16]);
    translate([(xl + xb) / 2 + 7, (14 + h) / 2 - 3]) rotate(inclinacion - 90) texto(str(inclinacion, "°"), h = 2.8, centrado = true);
}
module base() difference() {
    rect(B[0], B[1], 4, center = true);
    for (y = [-separacion / 2, separacion / 2], x = [10, prof - 12]) translate([x - prof / 2 - 5, y]) ranura_interior(tw + 0.4);
    translate([0, -2]) texto("SOPORTE CELULAR", h = 4, centrado = true);
    translate([B[0] / 2 - 6, B[1] / 2]) rotate(180) regla(B[0] - 12, alto = 3, h_num = 2, unidad = "");
}
module plano() {
    lateral();
    translate([0, h + e + 14]) lateral();
    translate([B[0] / 2, 2 * (h + e + 14) + B[1] / 2]) base();
}
module armado() {
    translate([0, 0, -e / 2]) laja() base();
    for (y = [-separacion / 2, separacion / 2]) translate([-prof / 2 - 5, y, 0]) laja_xz() lateral();
    %color("gray") translate([-prof / 2 - 5 + xf, 0, 0]) rotate([0, -inclinacion, 0]) translate([0, -36, 0]) cube([150, 72, grosor_celular - 1]);
}
