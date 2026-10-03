// Plano inclinado con transportador y regla · cartón encastrable
// Dos triángulos iguales (con el ángulo impreso) sostienen la rampa, que
// trae una regla para medir el recorrido. Un travesaño une los triángulos.
// 4 piezas: rampa, 2 triángulos iguales, travesaño.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]

/* [Rampa] */
// Ángulo de la rampa (grados)
angulo = 20; // [5:1:45]
// Largo de la rampa (mm)
largo = 280; // [120:10:400]
// Ancho de la rampa (mm)
ancho = 70; // [40:5:150]
// Largo de la base de los triángulos (mm)
base = 180; // [80:10:300]

/* [Hidden] */
e = espesor;
h = base * tan(angulo);          // altura del triángulo
Lh = base / cos(angulo);         // largo de la hipotenusa
tw = 16;                          // ancho de pestañas
sal = 20;                         // la rampa sobresale por arriba
xt = 12;                          // posición del travesaño desde el fondo
ht = 0.6 * h * (1 - xt / base);   // altura del travesaño
ys = [ancho / 4, 3 * ancho / 4];  // posición de los triángulos bajo la rampa
us = [0.2, 0.75];                 // posición de las pestañas sobre la hipotenusa

module rampa() difference() {
    rect(largo, ancho, 3);
    for (u = us, y = ys) translate([sal + u * Lh, y]) ranura_interior(tw + 0.4);
    translate([10, 0]) regla(largo - 20, cada = 10);
    translate([largo / 2, ancho - 10]) texto(str("RAMPA ", angulo, "°"), h = 4, centrado = true);
}

module triangulo() difference() {
    union() {
        polygon([[0, 0], [base, 0], [0, h]]);
        for (u = us) translate([u * Lh * cos(angulo), h - u * Lh * sin(angulo)])
            rotate(-angulo) pestana(e, tw);
    }
    translate([xt, 0]) ranura(ht / 2);
    translate([base, 0]) arco(min(base, 60) * 0.55, 180 - angulo, 180);
    translate([base - min(base, 60) * 0.55 - 6, 4]) texto(str(angulo, "°"), h = 4, centrado = true);
    translate([xt + 8, 6]) texto("PLANO INCLINADO", h = 3.2);
}

module travesano() difference() {
    rect(ancho + 16, ht, 2, center = true);
    for (y = ys) translate([y - ancho / 2, ht / 2]) rotate(180) ranura(ht / 2);
}

module plano() {
    rampa();
    translate([0, ancho + 8]) triangulo();
    translate([2 * base + 8, ancho + 8 + h]) rotate(180) triangulo();
    translate([2 * base + 16 + (ancho + 16) / 2, ancho + 8 + ht / 2 + 2]) travesano();
}

module armado() {
    for (y = ys) translate([0, y, 0]) laja_xz() triangulo();
    translate([0, 0, h]) rotate([0, angulo, 0]) translate([-sal, 0, e / 2]) laja() rampa();
    translate([xt, ancho / 2, ht / 2]) laja_yz() travesano();
}
