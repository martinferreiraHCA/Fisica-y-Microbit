// Soporte de péndulo con escala de ángulos · cartón encastrable
// Columna sobre dos pies cruzados, brazo con agujero para el hilo y una
// escala semicircular (0° abajo, simétrica) que cuelga del brazo bajo el
// pivote. La columna lleva una regla para medir el largo del hilo.
// 5 piezas: columna, 2 pies iguales, brazo, escala.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]

/* [Soporte] */
// Altura de la columna (mm)
altura = 260; // [120:10:400]
// Ancho de la columna (mm)
ancho_columna = 70; // [40:5:120]
// Largo del brazo desde la columna hasta el pivote (mm)
brazo = 110; // [50:5:200]
// Largo de los pies (mm)
pie = 170; // [80:10:300]
// Radio de la escala de ángulos (mm)
radio_escala = 55; // [30:5:90]

/* [Hidden] */
e = espesor;
hb = 30;                       // alto del brazo
hp = 45;                       // alto de los pies
sep = ancho_columna / 2;       // separación entre pies
rs = radio_escala;

module columna() difference() {
    rect(ancho_columna, altura, 3);
    for (x = [ancho_columna / 2 - sep / 2, ancho_columna / 2 + sep / 2]) translate([x, 0]) ranura(hp / 2);
    translate([ancho_columna / 2, altura]) rotate(180) ranura(hb / 2);
    // regla vertical: 0 en el pivote (= tope del brazo), crece hacia abajo
    translate([0, altura - 5]) rotate(-90) regla(altura - hp - 30, cada = 10, desde = hb / 2 + 5, unidad = "");
    translate([ancho_columna - 8, altura / 2]) rotate(90) texto("LARGO DEL HILO DESDE EL PIVOTE (MM)", h = 2.6, centrado = true);
}

module pie_pieza() difference() {
    rect(pie, hp, 3);
    translate([pie / 2, hp]) rotate(180) ranura(hp / 2);
    translate([pie / 2, 6]) texto("PIE", h = 3.5, centrado = true);
}

module brazo_pieza() difference() {
    rect(brazo + ancho_columna / 2 + 10, hb, 3);
    translate([10, 0]) ranura(hb / 2);                             // va en la columna
    translate([10 + brazo, 0]) ranura(hb / 2);                     // sostiene la escala
    translate([10 + brazo, hb - 6]) agujero(2, 0);                 // agujero para el hilo
    translate([10 + brazo, hb]) rotate(180) ranura(6.5, ancho = 1, entrada = 0.8); // rendija para pasar el hilo
    translate([10 + brazo / 2, 4]) texto("BRAZO", h = 3.2, centrado = true);
}

module escala() difference() {
    union() {
        intersection() { circle(r = rs); translate([-rs, -rs]) square([2 * rs, rs]); }
        translate([-rs * 0.5, 0]) square([rs, hb / 2 + 1]);
    }
    translate([0, hb / 2]) rotate(180) ranura(hb / 2);
    // pivote = extremo superior del brazo = hb/2 por encima del centro de la escala
    translate([0, hb / 2]) transportador(rs - 4, desde = 210, hasta = 330, paso = 1, cada = 10, cero = 270, simetrico = true, numeros_adentro = true, linea_base = false);
    translate([0, -rs + 8]) texto("GRADOS", h = 3, centrado = true);
}

module plano() {
    columna();
    translate([ancho_columna + 8, 0]) pie_pieza();
    translate([ancho_columna + 8, hp + 8]) pie_pieza();
    translate([ancho_columna + 8, 2 * hp + 16]) brazo_pieza();
    translate([ancho_columna + 8 + rs, 2 * hp + 16 + hb + 8 + rs]) escala();
}

module armado() {
    translate([-ancho_columna / 2, 0, 0]) laja_xz() columna();
    for (x = [-sep / 2, sep / 2]) translate([x, -pie / 2, 0]) laja_yz() pie_pieza();
    translate([0, -10, altura - hb / 2]) laja_yz() brazo_pieza();
    translate([0, brazo, altura]) rotate([0, 0, 0]) laja_xz() translate([0, -hb / 2]) escala();
    // hilo y pesa de referencia (no se imprimen)
    %color("gray") translate([0, brazo, altura + hb / 2]) rotate([180, 0, 0]) cylinder(d = 1, h = altura - 40, $fn = 8);
    %color("gray") translate([0, brazo, hb / 2 + 40 - 8]) sphere(r = 8, $fn = 24);
}
