// Regla y transportador para imprimir y pegar sobre cartón
// Instrumentos de medida impresos: regla de 20 cm (1 mm) y transportador de
// 180° (1°). Se pueden pegar sobre otras piezas o usar sueltos.
// 2 piezas.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (las pestañas salen más largas, con sobrante para recortar
// después de armar), laser (medidas exactas, compensa el kerf) o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Instrumentos] */
// Largo de la regla (mm)
largo_regla = 200; // [50:10:280]
// Radio del transportador (mm)
radio = 60; // [30:5:95]
// Agujero en el centro del transportador (para un eje o un hilo)
agujero_centro = true;

/* [Hidden] */
alto_regla = 24;

module regla_pieza() difference() {
    rect(largo_regla + 10, alto_regla, 2);
    translate([5, 0]) regla(largo_regla, cada = 10);
    translate([largo_regla + 5, alto_regla]) rotate(180) regla(largo_regla, paso = 5, cada = 50, unidad = "", h_num = 2.2);
    translate([largo_regla / 2 + 5, alto_regla / 2 - 1.5]) texto("FISICABIT", h = 3, centrado = true);
}

module transportador_pieza() difference() {
    union() { intersection() { circle(r = radio); translate([-radio, 0]) square([2 * radio, radio]); }
              translate([-radio, -8]) square([2 * radio, 8]); }
    if (agujero_centro) agujero(2, 0);
    transportador(radio - 3, 0, 180, paso = 1, cada = 10);
    translate([0, radio * 0.42]) texto("GRADOS", h = 3, centrado = true);
    translate([-radio + 6, -6]) regla(2 * radio - 12, alto = 3, cada = 10, numeros = false);
}

module plano() {
    regla_pieza();
    translate([radio, alto_regla + 16]) transportador_pieza();
}

module armado() {
    laja() regla_pieza();
    translate([radio, alto_regla + 16, 0]) laja() transportador_pieza();
}
