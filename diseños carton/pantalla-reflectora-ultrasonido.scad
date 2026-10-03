// Pantalla reflectora para el sensor ultrasónico · cartón encastrable
// Panel vertical, plano y rígido, para montar sobre un carrito: devuelve el
// eco del HC-SR04 de frente y las distancias salen limpias (sin el panel, el
// eco rebota en bordes y ruedas y la medida salta). Dos escuadras lo cruzan
// a media altura y todo se pestañea a una placa de base que se pega con
// cinta a cualquier carrito. En el «carro para micro:bit» no hace falta la
// placa: el chasis ya trae las ranuras para encastrar panel y escuadras.
// 4 piezas: panel, 2 escuadras iguales, placa de base (opcional).

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Pantalla] */
// Ancho del panel (mm): el haz del HC-SR04 abre unos 15°, a 1 m cubre ~25 cm
ancho = 150; // [80:10:250]
// Alto del panel (mm)
alto = 150; // [60:10:250]
// Profundidad de las escuadras (mm)
profundidad = 36; // [24:2:80]
// Separación entre las pestañas del panel (50 = ranuras del carro para micro:bit)
separacion_pestanas = 50; // [30:2:120]
// Separación entre las escuadras (24 = ranuras del carro para micro:bit)
separacion_escuadras = 24; // [16:2:100]
// Incluir la placa de base (para pegar la pantalla a otro carrito)
con_placa = true;

/* [Hidden] */
e = espesor;
p = profundidad;
tw = 14;
he = min(alto * 0.6, 90);              // alto de las escuadras
fr = e / 2 + 4;                        // cuánto pasa la escuadra por delante del panel
bp = p + fr + 16;                      // profundidad de la placa de base
yp = -bp / 2 + fr + 6;                 // posición del panel en la placa (desde atrás del frente)

module pantalla() difference() {
    union() {
        rect(ancho, alto, 3);
        for (x = [ancho / 2 - separacion_pestanas / 2, ancho / 2 + separacion_pestanas / 2]) translate([x, 0]) rotate(180) pestana(e, tw);
    }
    for (x = [ancho / 2 - separacion_escuadras / 2, ancho / 2 + separacion_escuadras / 2]) translate([x, 0]) ranura(he / 2);
    // blanco de puntería en la cara que mira al sensor
    translate([ancho / 2, alto / 2]) marca() difference() { circle(r = 14); circle(r = 13); }
    translate([ancho / 2, alto / 2]) marca() difference() { circle(r = 5); circle(r = 4); }
    translate([ancho / 2 - 20, alto / 2]) linea([0, 0], [40, 0], 0.4);
    translate([ancho / 2, alto / 2 - 20]) linea([0, 0], [0, 40], 0.4);
    translate([ancho / 2, alto - 10]) texto("ESTA CARA HACIA EL SENSOR", h = 3.2, centrado = true);
    translate([ancho / 2, he / 2 + 6]) texto("REFLECTOR", h = 4, centrado = true);
}
// Escuadra: triángulo detrás del panel (x > 0) con un pico que lo cruza (x < 0)
module escuadra() difference() {
    union() {
        polygon([[-fr, 0], [p, 0], [-fr, he]]);
        translate([p / 2, 0]) rotate(180) pestana(e, tw);
    }
    translate([0, he]) rotate(180) ranura(he / 2);
    translate([p * 0.2, 5]) texto("ESC", h = 2.6);
}
module placa() difference() {
    rect(ancho + 10, bp, 4, center = true);
    for (x = [-separacion_pestanas / 2, separacion_pestanas / 2]) translate([x, yp]) ranura_interior(tw + 0.4);
    for (x = [-separacion_escuadras / 2, separacion_escuadras / 2]) translate([x, yp + p / 2]) rotate(90) ranura_interior(tw + 0.4);
    translate([0, bp / 2 - 7]) texto("PEGAR AL CARRITO · FRENTE ABAJO", h = 3, centrado = true);
    translate([-(ancho + 10) / 2 + 6, -bp / 2]) regla(ancho - 2, alto = 3, h_num = 2, unidad = "");
}

module plano() {
    pantalla();
    gap = e + fb_sobrante() + 8;
    translate([0, alto + gap]) translate([fr, 0]) escuadra();
    translate([p + fr + 10, alto + gap]) translate([fr, 0]) escuadra();
    if (con_placa) translate([(ancho + 10) / 2, alto + gap + he + gap + bp / 2]) placa();
}
module armado() {
    if (con_placa) translate([0, 0, -e / 2]) laja() placa();
    translate([-ancho / 2, yp, 0]) laja_xz() pantalla();
    for (x = [-separacion_escuadras / 2, separacion_escuadras / 2]) translate([x, yp, 0]) laja_yz() escuadra();
}
