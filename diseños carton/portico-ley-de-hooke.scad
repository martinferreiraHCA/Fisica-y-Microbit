// Pórtico para ley de Hooke · cartón encastrable
// Estructura para colgar un resorte y medir su estiramiento con una masa
// colgante o en oscilación. Dos columnas en cruz (dos paneles trapezoidales
// que se atraviesan en toda su altura) reciben una viga superior que trabaja
// a compresión; dos tirantes abajo fijan la separación. La viga lleva el
// gancho del resorte y una escala milimetrada que cuelga al lado.
// 8 piezas: 2 paneles A, 2 paneles B, viga, 2 tirantes, escala.
// Para masas de 0,5 a 1 kg usá cartón de 5 mm (doble onda) y, si podés,
// pegá dos capas en los paneles. Las pestañas no hacen falta: todo es
// encastre en cruz, que es lo que mejor aguanta en cartón.

/* [Cartón] */
// Grosor del cartón (mm): 5 mm recomendado para masas de hasta 1 kg
espesor = 5; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton, laser (compensa kerf) o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Pórtico] */
// Altura de las columnas (mm)
altura = 320; // [200:10:450]
// Separación entre columnas (mm)
luz = 200; // [150:10:400]
// Ancho de la base de los paneles frontales (mm)
base_a = 160; // [80:10:260]
// Ancho de la base de los paneles laterales (mm)
base_b = 140; // [80:10:260]
// Ancho de los paneles arriba (mm)
tope = 70; // [40:5:120]
// Alto de la viga (mm)
viga_alto = 60; // [40:5:100]
// Largo de la escala colgante (mm)
escala_largo = 230; // [100:10:300]
// Diámetro del agujero para el gancho del resorte (mm)
gancho = 6; // [3:1:12]

/* [Hidden] */
e = espesor;
hb = viga_alto;
ht = 40;                  // alto de los tirantes
d = 40;                   // tirantes a ±d del centro de la columna
L = luz;
xs = 28;                  // la escala cuelga a xs del gancho
y_gancho = 12;            // centro del agujero del gancho, desde abajo de la viga
cero_escala = escala_largo - (hb - y_gancho);   // nivel del gancho sobre la escala

module trapecio(wb, wt, h) polygon([[0, 0], [wb, 0], [(wb + wt) / 2, h], [(wb - wt) / 2, h]]);

// Panel A (frontal, plano XZ): ranura desde arriba hasta la mitad; la viga
// se aloja en esa misma ranura, por encima del cruce con el panel B.
module panel_a() difference() {
    trapecio(base_a, tope, altura);
    translate([base_a / 2, altura]) rotate(180) ranura(altura / 2);
    translate([base_a / 2 - 22, 12]) rotate(90) texto("PANEL A", h = 4);
    translate([base_a / 2 + 24, altura - 40]) rotate(-90) texto("LEY DE HOOKE", h = 4);
}
// Panel B (lateral, plano YZ): ranura desde abajo hasta la mitad (cruce con A),
// ranura arriba para la viga y dos ranuras abajo para los tirantes.
module panel_b() difference() {
    trapecio(base_b, tope, altura);
    translate([base_b / 2, 0]) ranura(altura / 2);
    translate([base_b / 2, altura]) rotate(180) ranura(hb / 2);
    for (y = [-d, d]) translate([base_b / 2 + y, 0]) ranura(ht / 2);
    translate([base_b / 2 - 22, ht + 10]) rotate(90) texto("PANEL B", h = 4);
}
module viga() difference() {
    rect(L + 60, hb, 2);
    for (x = [30, 30 + L]) translate([x, 0]) ranura(hb / 2);
    translate([30 + L / 2 + xs, 0]) ranura(hb / 2);
    translate([30 + L / 2, y_gancho]) agujero(gancho, 0);
    translate([30 + L / 2, 0]) ranura(y_gancho, ancho = 2.5, entrada = 1.2);   // rendija para enganchar el resorte
    translate([30 + L / 2, hb - 12]) texto("VIGA · LEY DE HOOKE", h = 4.5, centrado = true);
    translate([30 + L / 2 - 20, y_gancho + 6]) texto("GANCHO", h = 2.6, centrado = true);
}
module tirante() difference() {
    rect(L + 40, ht, 2);
    for (x = [20, 20 + L]) translate([x, ht]) rotate(180) ranura(ht / 2);
    translate([20 + L / 2, 8]) texto("TIRANTE", h = 4, centrado = true);
}
// Escala: cuelga de la viga junto al resorte; 0 a la altura del gancho.
module escala() difference() {
    rect(50, escala_largo, 2);
    translate([25, escala_largo]) rotate(180) ranura(hb / 2);
    translate([0, cero_escala]) rotate(-90) regla(cero_escala - 6, cada = 10, desde = 0, unidad = "");
    translate([44, escala_largo / 2 - 20]) rotate(90) texto("MM DESDE EL GANCHO", h = 3, centrado = true);
    translate([25, escala_largo - 8]) marca() circle(d = 1.5);
}

module plano() {
    panel_a();
    translate([base_a + 8, 0]) panel_a();
    translate([2 * base_a + 16, 0]) panel_b();
    translate([2 * base_a + base_b + 24, 0]) panel_b();
    translate([0, altura + 10]) viga();
    translate([0, altura + hb + 20]) tirante();
    translate([0, altura + hb + ht + 30]) tirante();
    translate([L + 70, altura + 10]) escala();
}

module armado() {
    for (x = [-L / 2, L / 2]) {
        translate([x - base_a / 2, 0, 0]) laja_xz() panel_a();
        translate([x, -base_b / 2, 0]) laja_yz() panel_b();
    }
    translate([-L / 2 - 30, 0, altura - hb]) laja_xz() viga();
    for (y = [-d, d]) translate([-L / 2 - 20, y, 0]) laja_xz() tirante();
    translate([xs, -25, altura - escala_largo]) laja_yz() escala();
    // resorte y masa de referencia (no se imprimen)
    %color("gray") translate([0, 0, altura - hb + y_gancho - 80]) cylinder(d = 12, h = 80, $fn = 24);
    %color("gray") translate([0, 0, altura - hb + y_gancho - 110]) cylinder(d = 30, h = 30, $fn = 32);
}
