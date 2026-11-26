// ============ BANDEJA PARA MAPEO DE CAMPO ELÉCTRICO ============
// Cubeta baja para mapear potencial y campo eléctrico con una lámina
// de agua: cuadrícula en el fondo para ubicar la punta de prueba,
// encastres para dos electrodos planos (chapas), a la distancia de
// la cuadrícula que se elija, y asientos para dos electrodos
// puntuales (tornillos o tuercas).
// La zona de mapeo coincide con «Dimensiones» del módulo MAPEO del
// sitio: 14 × 10 cm con paso de 1 cm por defecto.
// Imprimir con el fondo sobre la cama, sin soportes, con 3 o más
// perímetros para que no pierda agua. Usar agua de la canilla, 5 a
// 8 mm de alto.
// miniaturas: electrodos="planos" | electrodos="puntuales" | electrodos="plano y punto"

/* [Zona de mapeo] */
// Largo de la zona de mapeo, eje X (mm)
largo_mapeo = 140; // [60:10:300]
// Ancho de la zona de mapeo, eje Y (mm)
ancho_mapeo = 100; // [40:10:250]
// Paso de la cuadrícula (mm)
paso = 10; // [5:5:50]
// Margen libre entre la cuadrícula y las paredes (mm)
margen = 10; // [4:1:40]

/* [Bandeja] */
// Profundidad interior (mm)
profundidad = 15; // [8:1:40]
// Espesor de las paredes (mm)
pared = 2.4; // [1.6:0.4:5]
// Espesor del fondo (mm)
fondo = 2; // [1.2:0.2:5]
// Radio de las esquinas (mm)
radio_esquinas = 4; // [0:1:20]
// Muesca en una esquina para vaciar el agua
con_pico = true;

/* [Cuadrícula] */
// Cómo se marca la cuadrícula en el fondo
cuadricula = "grabada"; // [grabada, en relieve, ninguna]
// Ancho de las líneas (mm)
ancho_linea = 0.6; // [0.4:0.1:1.5]
// Cada cuántas líneas va una más gruesa
linea_gruesa_cada = 5; // [0:1:10]
// Muescas en el borde superior, una por línea de la cuadrícula
muescas_en_el_borde = true;

/* [Electrodos] */
// Qué electrodos lleva
electrodos = "planos"; // [planos, puntuales, plano y punto, ninguno]
// Distancia de los encastres de las chapas al borde de la cuadrícula (mm)
distancia_a_la_grilla = 10; // [0:1:60]
// Separación entre los dos electrodos puntuales, centrada (mm)
separacion_puntuales = 80; // [20:10:300]
// Espesor de la chapa de los electrodos planos, con holgura (mm)
espesor_chapa = 1.5; // [0.5:0.1:4]
// Diámetro del asiento de los electrodos puntuales (mm)
diametro_asiento = 10; // [4:0.5:25]

/* [Calidad] */
// Resolución de las curvas
resolucion = 48; // [16:120]

/* [Hidden] */
$fn = resolucion;
e = 0.01;
con_chapas = electrodos == "planos" || electrodos == "plano y punto";
// en X el margen crece lo necesario para que el encastre, puesto a esa distancia de la cuadrícula, quede dentro de la bandeja
margen_x = con_chapas ? max(margen, distancia_a_la_grilla + espesor_chapa / 2 + 2.8) : margen;
li = largo_mapeo + 2 * margen_x;    // interior
ai = ancho_mapeo + 2 * margen;
le = li + 2 * pared;                // exterior
ae = ai + 2 * pared;
alto = fondo + profundidad;
surco = min(0.5, fondo * 0.3);      // hondo de las líneas grabadas (o alto del relieve)
x_grilla = floor(largo_mapeo / paso + 0.001) * paso / 2;         // última línea de la cuadrícula, medida desde el centro
x_chapa = x_grilla + distancia_a_la_grilla;                     // centro de cada encastre
sep = min(separacion_puntuales, largo_mapeo);                   // los puntuales van dentro de la zona de mapeo
r_ext = min(radio_esquinas + pared, min(le, ae) / 2 - e);
r_int = max(0.01, min(radio_esquinas, min(li, ai) / 2 - e));

module rect_red(l, a, r) {
    if (r <= 0.02) square([l, a], center = true);
    else hull() for (sx = [-1, 1], sy = [-1, 1]) translate([sx * (l / 2 - r), sy * (a / 2 - r)]) circle(r = r);
}

// Líneas de la cuadrícula (2D), centradas en el origen
module lineas() {
    nx = floor(largo_mapeo / paso + 0.001);
    ny = floor(ancho_mapeo / paso + 0.001);
    x0 = -nx * paso / 2;
    y0 = -ny * paso / 2;
    for (i = [0 : nx]) {
        g = (linea_gruesa_cada > 0 && (i % linea_gruesa_cada == 0)) ? 2 : 1;
        translate([x0 + i * paso, 0]) square([ancho_linea * g, ny * paso + ancho_linea], center = true);
    }
    for (j = [0 : ny]) {
        g = (linea_gruesa_cada > 0 && (j % linea_gruesa_cada == 0)) ? 2 : 1;
        translate([0, y0 + j * paso]) square([nx * paso + ancho_linea, ancho_linea * g], center = true);
    }
}

// Muescas en el canto superior de las paredes, alineadas con la cuadrícula
module muescas() {
    nx = floor(largo_mapeo / paso + 0.001);
    ny = floor(ancho_mapeo / paso + 0.001);
    for (i = [0 : nx]) {
        g = (linea_gruesa_cada > 0 && (i % linea_gruesa_cada == 0)) ? 2 : 1;
        for (s = [-1, 1]) translate([-nx * paso / 2 + i * paso, s * (ae / 2 - pared / 2), alto - 0.6 * g + e])
            linear_extrude(0.6 * g) square([0.8, pared + 1], center = true);
    }
    for (j = [0 : ny]) {
        g = (linea_gruesa_cada > 0 && (j % linea_gruesa_cada == 0)) ? 2 : 1;
        for (s = [-1, 1]) translate([s * (le / 2 - pared / 2), -ny * paso / 2 + j * paso, alto - 0.6 * g + e])
            linear_extrude(0.6 * g) square([pared + 1, 0.8], center = true);
    }
}

// Par de nervios en las dos paredes largas que guían una chapa parada en x
module guia_chapa(x) {
    largo_nervio = min(6, margen - 1);
    for (s = [-1, 1]) for (d = [-1, 1])
        translate([x + d * (espesor_chapa / 2 + 0.8), s * (ai / 2 - largo_nervio / 2), fondo - e])
            linear_extrude(profundidad * 0.8) square([1.6, largo_nervio], center = true);
}

// Asiento circular bajo para ubicar un tornillo o una tuerca
module asiento(x) {
    translate([x, 0, fondo - surco]) cylinder(d = diametro_asiento, h = surco + e);
}

difference() {
    union() {
        difference() {
            linear_extrude(alto) rect_red(le, ae, r_ext);
            translate([0, 0, fondo]) linear_extrude(profundidad + 1) rect_red(li, ai, r_int);
        }
        if (cuadricula == "en relieve") translate([0, 0, fondo - e]) linear_extrude(surco) lineas();
        if (electrodos == "planos") { guia_chapa(-x_chapa); guia_chapa(x_chapa); }
        if (electrodos == "plano y punto") guia_chapa(-x_chapa);
    }
    if (cuadricula == "grabada") translate([0, 0, fondo - surco]) linear_extrude(surco + e) lineas();
    if (muescas_en_el_borde) muescas();
    if (electrodos == "puntuales") { asiento(-sep / 2); asiento(sep / 2); }
    if (electrodos == "plano y punto") asiento(sep / 2);
    // pico: una muesca en V en el borde de una esquina (sin voladizos, no necesita soportes)
    if (con_pico) translate([li / 2 - r_int * 0.29, ai / 2 - r_int * 0.29, alto - min(4, profundidad * 0.3)]) rotate([0, 0, 45])
        linear_extrude(profundidad) polygon([[-3, -4], [pared * 1.5 + 4, -1.8], [pared * 1.5 + 4, 1.8], [-3, 4]]);
}
