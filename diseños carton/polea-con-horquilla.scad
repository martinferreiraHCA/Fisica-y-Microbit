// Polea con horquilla · cartón encastrable
// Polea de tres discos (los dos grandes forman la garganta) sobre un eje de
// brochette, montada en una horquilla con base. Para máquinas de Atwood y
// cambios de dirección de una cuerda. Pegá los tres discos entre sí.
// 6 piezas: 3 discos (2 grandes + 1 chico), 2 brazos iguales, base.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Polea] */
// Diámetro de la polea (mm)
diametro = 60; // [30:2:120]
// Profundidad de la garganta (mm)
garganta = 5; // [2:1:12]
// Diámetro del eje (palito de brochette: 3 mm)
eje = 3; // [2:0.5:8]
// Altura del eje sobre la base (mm)
altura = 90; // [40:5:200]

/* [Hidden] */
e = espesor;
sep = 3 * e + 4;               // separación interior entre brazos
bw = 30;                        // ancho de los brazos
tw = 16;
base_l = diametro + 60;
base_w = sep + 2 * e + 40;

module disco(d) difference() {
    circle(d = d);
    agujero(eje, 0.3);
    marca() difference() { circle(d = d - 6); circle(d = d - 7); }
}
module brazo() difference() {
    union() {
        rect(bw, altura + 12, 3);
        translate([bw / 2, 0]) rotate(180) pestana(e, tw);
    }
    translate([bw / 2, altura]) agujero(eje, 0.6);
    translate([bw / 2, altura / 2]) rotate(90) texto("BRAZO", h = 3.5, centrado = true);
}
module base() difference() {
    rect(base_l, base_w, 4, center = true);
    for (y = [-sep / 2 - e / 2, sep / 2 + e / 2]) translate([0, y]) ranura_interior(tw + 0.4);
    translate([-base_l / 2 + 8, -base_w / 2 + 4]) texto("POLEA", h = 3.5);
}
module plano() {
    disco(diametro);
    translate([diametro + 6, 0]) disco(diametro);
    translate([2 * diametro + 12, 0]) disco(diametro - 2 * garganta);
    yb = diametro / 2 + 10 + e + fb_sobrante();
    translate([-diametro / 2, yb]) brazo();
    translate([-diametro / 2 + bw + 8, yb]) brazo();
    translate([base_l / 2 - diametro / 2, yb + altura + 12 + base_w / 2 + 8]) base();
}
module armado() {
    translate([0, 0, -e / 2]) laja() base();
    for (y = [-sep / 2 - e / 2, sep / 2 + e / 2]) translate([-bw / 2, y, 0]) laja_xz() brazo();
    translate([0, -e, altura]) laja_xz() disco(diametro);
    translate([0, 0, altura]) laja_xz() disco(diametro - 2 * garganta);
    translate([0, e, altura]) laja_xz() disco(diametro);
    %color("tan") translate([0, -base_w / 2, altura]) rotate([-90, 0, 0]) cylinder(d = eje, h = base_w, $fn = 12);
}
