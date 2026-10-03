// Soporte de péndulo con escala de ángulos · cartón encastrable
// Columna encastrada en dos pies trapezoidales que la cruzan, todo
// pestañeado sobre una placa de base ancha (no se vuelca ni se desarma).
// Brazo con agujero y rendija para el hilo, y una escala semicircular
// (0° abajo, simétrica) que cuelga del brazo bajo el pivote. La columna
// lleva una regla para medir el largo del hilo.
// 6 piezas: columna, 2 pies iguales, placa de base, brazo, escala.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (las pestañas salen más largas, con sobrante para recortar
// después de armar), laser (medidas exactas, compensa el kerf) o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Soporte] */
// Altura de la columna (mm)
altura = 260; // [120:10:400]
// Ancho de la columna (mm)
ancho_columna = 70; // [40:5:120]
// Largo del brazo desde la columna hasta el pivote (mm)
brazo = 110; // [50:5:200]
// Largo de los pies y de la placa de base (mm)
pie = 180; // [80:10:300]
// Alto de los pies (mm)
alto_pie = 90; // [40:5:150]
// Radio de la escala de ángulos (mm)
radio_escala = 55; // [30:5:90]

/* [Hidden] */
e = espesor;
hb = 30;                       // alto del brazo
hp = alto_pie;                 // alto de los pies
sep = ancho_columna / 2;       // separación entre pies
rs = radio_escala;
tw = 16;                       // pestañas de los pies
twc = 10;                      // pestañas de la columna
PL = [pie + 16, ancho_columna + 70];   // placa de base

module columna() difference() {
    union() {
        rect(ancho_columna, altura, 3);
        for (x = [7, ancho_columna - 7]) translate([x, 0]) rotate(180) pestana(e, twc);
    }
    for (x = [ancho_columna / 2 - sep / 2, ancho_columna / 2 + sep / 2]) translate([x, 0]) ranura(hp / 2);
    translate([ancho_columna / 2, altura]) rotate(180) ranura(hb / 2);
    // regla vertical: 0 en el pivote (= tope del brazo), crece hacia abajo
    translate([0, altura - 5]) rotate(-90) regla(altura - hp - 30, cada = 10, desde = hb / 2 + 5, unidad = "");
    translate([ancho_columna - 8, altura / 2]) rotate(90) texto("LARGO DEL HILO DESDE EL PIVOTE (MM)", h = 2.6, centrado = true);
}

// Pie: trapecio ancho abajo, con ranura desde arriba (cruce con la columna)
// y dos pestañas que atraviesan la placa de base
module pie_pieza() difference() {
    union() {
        polygon([[0, 0], [pie, 0], [pie - 35, hp], [35, hp]]);
        for (x = [pie / 4, 3 * pie / 4]) translate([x, 0]) rotate(180) pestana(e, tw);
    }
    translate([pie / 2, hp]) rotate(180) ranura(hp / 2);
    translate([pie / 2 - 30, 8]) texto("PIE", h = 3.5, centrado = true);
}
// Placa de base: ranuras para las pestañas de la columna y de los pies
module placa_base() difference() {
    rect(PL[0], PL[1], 5, center = true);
    for (x = [-ancho_columna / 2 + 7, ancho_columna / 2 - 7]) translate([x, 0]) ranura_interior(twc + 0.4);
    for (x = [-sep / 2, sep / 2], y = [-pie / 4, pie / 4]) translate([x, y]) rotate(90) ranura_interior(tw + 0.4);
    translate([0, -PL[1] / 2 + 8]) texto("PENDULO", h = 4, centrado = true);
    translate([-PL[0] / 2 + 8, PL[1] / 2 - 4]) regla(PL[0] - 16, alto = 3, h_num = 2, unidad = "");
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
    paso = hp + e + fb_sobrante() + 8;
    translate([0, e + fb_sobrante() + 2]) columna();
    translate([ancho_columna + 8, e + fb_sobrante() + 2]) pie_pieza();
    translate([ancho_columna + 8, e + fb_sobrante() + 2 + paso]) pie_pieza();
    translate([ancho_columna + 8, e + fb_sobrante() + 2 + 2 * paso]) brazo_pieza();
    translate([ancho_columna + 8 + rs, e + fb_sobrante() + 2 + 2 * paso + hb + 8 + rs]) escala();
    translate([ancho_columna + 8 + PL[0] / 2, e + fb_sobrante() + 2 + 2 * paso + hb + 8 + 2 * rs + 12 + PL[1] / 2]) placa_base();
}

module armado() {
    translate([0, 0, -e / 2]) laja() placa_base();
    translate([-ancho_columna / 2, 0, 0]) laja_xz() columna();
    for (x = [-sep / 2, sep / 2]) translate([x, -pie / 2, 0]) laja_yz() pie_pieza();
    translate([0, -10, altura - hb / 2]) laja_yz() brazo_pieza();
    translate([0, brazo, altura]) rotate([0, 0, 0]) laja_xz() translate([0, -hb / 2]) escala();
    // hilo y pesa de referencia (no se imprimen)
    %color("gray") translate([0, brazo, altura + hb / 2]) rotate([180, 0, 0]) cylinder(d = 1, h = altura - 40, $fn = 8);
    %color("gray") translate([0, brazo, hb / 2 + 40 - 8]) sphere(r = 8, $fn = 24);
}
