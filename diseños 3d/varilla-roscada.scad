// ======================= VARILLAS ROSCADAS POR TRAMOS =======================
// Tramos de varilla que se enroscan entre sí por la punta: cada tramo tiene
// un TORNILLO largo en un extremo y un AGUJERO ROSCADO igual de hondo en el
// otro, así se arma una varilla del largo que haga falta (soportes de
// laboratorio, ejes, mástiles). Por defecto: varilla de 11 mm de ancho y
// 150 mm de cuerpo, tornillo de 40 mm y agujero de 40 mm.
//  · Rosca trapezoidal de paso grande (3 mm) con flancos a 45°: se imprime
//    sin soportes y con muchas capas por filete, por eso es fuerte.
//  · Cada extremo puede ser macho, hembra o liso: con «liso» hacés el último
//    tramo, y con hembra–hembra o macho–macho, uniones especiales.
//  · Sección redonda (entra en las nueces de «conectores de varilla») o
//    hexagonal (se aprieta con las «llaves para tornillos»).
//  · tuerca: tuerca con esta misma rosca para fijar placas o piezas contra
//    el hombro de la varilla.  · prueba_rosca: pareja corta para calibrar
//    la holgura antes de imprimir los tramos largos.
// CÓMO SE IMPRIME: parada (de pie), con el extremo INFERIOR apoyado en la
// cama: así la rosca sale redonda y sin soportes. Usá brim (el apoyo es
// chico), 3 o más perímetros, 40 % o más de relleno y capas de 0,2 mm.
// Si el tramo queda demasiado alto para tu impresora, bajá «largo». Las
// capas quedan perpendiculares a la varilla: para tramos que trabajen muy a
// flexión conviene PETG y un cuerpo más ancho.

/* [Qué imprimir] */
// Pieza a renderizar y exportar
pieza = "varilla"; // [varilla, tuerca, prueba_rosca, conjunto, todo]

/* [Varilla] */
// Ancho de la varilla (diámetro o distancia entre caras), mm
diametro = 11; // [7:0.5:30]
// Largo del cuerpo (lo que suma cada tramo al armar; el tornillo va aparte), mm
largo = 150; // [20:5:300]
// Sección del cuerpo
seccion = "redonda"; // [redonda, hexagonal]
// Extremo que apoya en la cama al imprimir
extremo_inferior = "hembra"; // [hembra, macho, liso]
// Extremo de arriba
extremo_superior = "macho"; // [hembra, macho, liso]

/* [Rosca] */
// Largo del tornillo de la punta (mm)
largo_tornillo = 40; // [10:1:100]
// Profundidad del agujero roscado (mm)
profundidad_agujero = 40; // [10:1:100]
// Diámetro exterior del tornillo (mm): dejá al menos 1,2 mm de pared hasta el ancho de la varilla
diametro_rosca = 7.5; // [4:0.25:26]
// Paso de la rosca (mm por vuelta): más grande = más fácil de imprimir
paso = 3; // [1.5:0.25:6]
// Altura del filete (mm)
altura_filete = 0.9; // [0.5:0.1:2.5]
// Holgura diametral entre tornillo y agujero (mm): subí 0,1 si no enrosca, bajá si queda flojo
holgura_rosca = 0.3; // [0:0.05:1]
// Juego en el fondo del agujero para que apoyen las caras (mm)
juego_fondo = 1; // [0:0.5:3]

/* [Tuerca] */
// Medida entre caras de la tuerca (mm)
entre_caras_tuerca = 13; // [8:0.5:30]
// Alto de la tuerca (mm)
alto_tuerca = 8; // [4:1:30]

/* [Hidden] */
$fn = 64;                                   // igual que los segmentos de la rosca
eps = 0.02;
rr = diametro_rosca / 2 - altura_filete;    // radio del núcleo del tornillo
hol = holgura_rosca / 2;                    // holgura radial
r_cuerpo = seccion == "hexagonal" ? diametro / sqrt(3) : diametro / 2;
pared = diametro / 2 - (rr + altura_filete + hol);
z0 = extremo_inferior == "macho" ? largo_tornillo : 0;   // base del cuerpo
z1 = z0 + largo;                                          // tope del cuerpo
alto_total = z1 + (extremo_superior == "macho" ? largo_tornillo : 0);
assert(pared >= 1, str("La pared alrededor del agujero roscado queda de ", pared, " mm: bajá «diametro_rosca» o subí «diametro»"));
assert(rr >= 1.5, "El núcleo del tornillo queda muy fino: subí «diametro_rosca» o bajá «altura_filete»");
assert(paso > 2 * altura_filete + 0.6, "El paso es chico para esa altura de filete (flancos a 45°): subí «paso»");
assert(extremo_inferior != "hembra" || extremo_superior != "hembra" || largo > 2 * profundidad_agujero + 4, "Dos agujeros roscados no entran en ese largo");
assert(extremo_inferior == "liso" && extremo_superior == "liso" || largo > profundidad_agujero + 3 || (extremo_inferior != "hembra" && extremo_superior != "hembra"), "El agujero roscado es más hondo que el cuerpo");
echo(str("Varilla de ", diametro, " mm: altura de impresión ", alto_total, " mm; núcleo del tornillo Ø", 2 * rr,
         " mm; pared junto al agujero ", round(pared * 100) / 100, " mm; ", ceil((largo_tornillo) / paso), " vueltas para enroscar"));

// ---- Rosca trapezoidal (perfil helicoidal, polyhedron) ----
// Filete simétrico con flancos a 45°: ancho en la raíz paso-0.3, en la cresta paso-0.3-2*altura
module filete(r_raiz, L, extra = 0) {
    n = 64; vueltas = ceil(L / paso) + 2;
    wr = (paso - 0.3) / 2 + extra; wc = wr - altura_filete;
    perfil = [[r_raiz - 0.15, -wr], [r_raiz + altura_filete + extra, -wc], [r_raiz + altura_filete + extra, wc], [r_raiz - 0.15, wr]];
    puntos = [for (i = [0 : vueltas * n]) for (q = perfil)
        let (a = -360 + 360 * i / n) [q[0] * cos(a), q[0] * sin(a), paso * a / 360 + q[1]]];
    caras = concat([[0, 1, 2, 3]],
        [for (i = [0 : vueltas * n - 1]) for (j = [0 : 3]) for (k = [0 : 1])
          k == 0 ? [4 * i + j, 4 * (i + 1) + j, 4 * (i + 1) + (j + 1) % 4] :
                   [4 * i + j, 4 * (i + 1) + (j + 1) % 4, 4 * i + (j + 1) % 4]],
        [[for (j = [3 : -1 : 0]) 4 * vueltas * n + j]]);
    intersection() {
        polyhedron(points = puntos, faces = caras, convexity = 20);
        translate([-r_raiz - 10, -r_raiz - 10, 0]) cube([2 * r_raiz + 20, 2 * r_raiz + 20, L]);
    }
}
// Tornillo macho de largo L, con la punta achaflanada; simple = cilindro liso (vistas armadas)
module tornillo(L, simple = false) {
    if (simple) cylinder(r = rr + 0.2, h = L - 1);
    else difference() {
        union() { cylinder(r = rr, h = L); filete(rr, L); }
        translate([0, 0, L]) rotate_extrude() polygon([[rr + 0.3, eps], [rr + altura_filete + 2, eps], [rr + altura_filete + 2, -(altura_filete + 1.7)]]);
    }
}
// Hueco hembra (para restar): agujero de profundidad P con boca achaflanada en z = 0
module hueco(P) {
    translate([0, 0, -eps]) cylinder(r = rr + hol, h = P + eps);
    translate([0, 0, -eps]) filete(rr + hol, P + eps);
    translate([0, 0, -eps]) cylinder(r1 = rr + altura_filete + hol + 0.8, r2 = rr + hol, h = altura_filete + 0.8 + eps);
}
module cuerpo(h) {
    if (seccion == "hexagonal") cylinder(r = r_cuerpo, h = h, $fn = 6);
    else union() {
        cylinder(r1 = r_cuerpo - 0.8, r2 = r_cuerpo, h = 0.8);
        translate([0, 0, 0.8 - eps]) cylinder(r = r_cuerpo, h = h - 1.6 + 2 * eps);
        translate([0, 0, h - 0.8]) cylinder(r1 = r_cuerpo, r2 = r_cuerpo - 0.8, h = 0.8);
    }
}

// ---- Piezas ----
module varilla(simple = false) {
    difference() {
        union() {
            translate([0, 0, z0]) cuerpo(largo);
            if (extremo_inferior == "macho") mirror([0, 0, 1]) translate([0, 0, -z0]) tornillo(largo_tornillo, simple);
            if (extremo_superior == "macho") translate([0, 0, z1 - eps]) tornillo(largo_tornillo + eps, simple);
        }
        if (extremo_inferior == "hembra") translate([0, 0, z0]) hueco(profundidad_agujero + juego_fondo);
        if (extremo_superior == "hembra") translate([0, 0, z1]) mirror([0, 0, 1]) hueco(profundidad_agujero + juego_fondo);
    }
}
module tuerca() {
    difference() {
        cylinder(r = entre_caras_tuerca / sqrt(3), h = alto_tuerca, $fn = 6);
        hueco(alto_tuerca + 1);
        translate([0, 0, alto_tuerca]) mirror([0, 0, 1]) hueco(alto_tuerca + 1);
    }
}
module prueba_rosca() {
    Lp = min(12, largo_tornillo);
    // macho corto sobre un disco
    union() { cylinder(r = r_cuerpo, h = 3); translate([0, 0, 3 - eps]) tornillo(Lp + eps); }
    // anillo hembra
    translate([2 * r_cuerpo + 6, 0, 0]) difference() { cuerpo(Lp + 3); hueco(Lp + 1); }
}
module conjunto() {
    varilla(simple = true);
    translate([0, 0, z1]) varilla(simple = true);
    translate([0, 0, z1 + largo + 12]) tuerca();
}
module todo() {
    varilla();
    translate([diametro + 8 + entre_caras_tuerca / 2, 0, 0]) tuerca();
    translate([diametro + 8 + entre_caras_tuerca + 8 + r_cuerpo, 0, 0]) prueba_rosca();
}
if (pieza == "varilla") varilla();
else if (pieza == "tuerca") tuerca();
else if (pieza == "prueba_rosca") prueba_rosca();
else if (pieza == "conjunto") conjunto();
else todo();
