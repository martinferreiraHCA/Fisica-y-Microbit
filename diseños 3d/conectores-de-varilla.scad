// ================== CONECTORES PARA VARILLAS DE SOPORTE ==================
// Set de nueces y uniones para armar soportes de laboratorio con varillas
// (12 mm por defecto) y tornillería común. Cada conector sujeta la varilla
// con un tornillo prisionero que rosca en una TUERCA CAUTIVA (se mete en una
// ranura, con una punta hacia abajo): el plástico no lleva rosca y el apriete
// no se desgasta. Inspirado en el «Universal laboratory stand» de ToFe
// (Thingiverse 2005771, CC BY-NC-SA): bloque, varilla, tornillo lateral y
// tuerca; este archivo es un diseño propio y paramétrico.
//  · nuez: sujeta una varilla; la cara opuesta tiene otra tuerca cautiva
//    para atornillar algo (una placa, un sensor, otra pieza).
//  · nuez_doble: dos varillas perpendiculares (la clásica «nuez» de soporte).
//  · manguito: une dos varillas en línea.
//  · rotador: articulación con dientes para fijar una varilla en ángulo;
//    se imprimen dos mitades (una aloja la tuerca, la otra la cabeza).
//  · perilla: convierte cualquier tornillo en tornillo de mano (aloja la
//    cabeza o una tuerca).
// Agujeros horizontales en forma de gota: se imprimen sin soporte.

/* [Qué imprimir] */
// Pieza a renderizar y exportar
pieza = "nuez_doble"; // [nuez, nuez_doble, manguito, rotador, perilla, todo, conjunto]

/* [Varillas] */
// Diámetro de la varilla (mm)
diametro_varilla = 12; // [6:0.5:25]
// Holgura diametral del agujero de la varilla (mm)
holgura_varilla = 0.5; // [0:0.1:1.5]
// Pared mínima alrededor de la varilla (mm)
pared = 5; // [3:0.5:10]

/* [Tornillería] */
// Tornillo prisionero y de unión
tornillo = "M6"; // [M3, M4, M5, M6, M8]
// Tipo de tuerca cautiva
tuerca = "hexagonal"; // [hexagonal, cuadrada]
// Holgura del agujero de paso del tornillo (mm)
holgura_tornillo = 0.5; // [0.2:0.1:1]
// Holgura del alojamiento de la tuerca (mm)
holgura_tuerca = 0.3; // [0:0.1:0.8]

/* [Rotador] */
// Diámetro del disco dentado (mm)
diametro_disco = 32; // [24:1:50]
// Cantidad de dientes del disco
dientes = 36; // [12:2:72]

/* [Perilla] */
// Diámetro de la perilla (mm)
diametro_perilla = 26; // [18:1:40]
// La perilla aloja la cabeza del tornillo o una tuerca
perilla_para = "cabeza"; // [cabeza, tuerca]

/* [Hidden] */
$fn = 64;
eps = 0.02;
// Tablas de tornillería (mm): diámetro nominal, tuerca entre caras, espesor
// de tuerca, diámetro de cabeza cilíndrica (Allen), alto de cabeza
function t_i() = tornillo == "M3" ? 0 : tornillo == "M4" ? 1 : tornillo == "M5" ? 2 : tornillo == "M8" ? 4 : 3;
d_tor = [3, 4, 5, 6, 8][t_i()];
e_tue = [5.5, 7, 8, 10, 13][t_i()];
h_tue = [2.4, 3.2, 4.7, 5.2, 6.8][t_i()];
d_cab = [5.5, 7, 8.5, 10, 13][t_i()];
h_cab = [3, 4, 5, 6, 8][t_i()];
d_paso = d_tor + holgura_tornillo;
D = diametro_varilla + holgura_varilla;          // agujero de la varilla
R = D / 2;
pared_t = max(pared, h_tue + holgura_tuerca + 4); // pared del lado del tornillo (aloja la tuerca)
w = D + 2 * pared;                                // ancho del bloque (lado sin tornillo)
L = R + pared_t;                                  // del eje de la varilla a la cara del tornillo
alto = max(D + 2 * pared, e_tue + holgura_tuerca + 8);   // alto de una nuez
x_tue = R + 2;                                    // cara interior de la tuerca, desde el eje
echo(str("Conectores para varilla de ", diametro_varilla, " mm con ", tornillo, " (tuerca ", tuerca, "): bloque de ", w, " × ", R + L, " × ", alto, " mm"));

// ---- Primitivas ----
// Agujero horizontal (eje X) en forma de gota, imprimible sin soporte
module gota_x(d, l) {
    rotate([0, 90, 0]) linear_extrude(height = l, center = true)
        hull() { circle(d = d); translate([-d / 2 * 0.95, 0]) circle(r = 0.01, $fn = 8); }
}
module gota_y(d, l) { rotate([0, 0, 90]) gota_x(d, l); }
// Alojamiento de tuerca cautiva: eje del tornillo sobre +X, tuerca a x_tue,
// ranura de carga hacia +Z (una punta de la tuerca abajo)
module ranura_tuerca(alto_canal) {
    ht = h_tue + holgura_tuerca;
    if (tuerca == "hexagonal") {
        translate([x_tue, 0, 0]) rotate([0, 90, 0]) cylinder(d = (e_tue + holgura_tuerca) / cos(30), h = ht, $fn = 6);
        translate([x_tue, -(e_tue + holgura_tuerca) / 2, 0]) cube([ht, e_tue + holgura_tuerca, alto_canal + eps]);
    } else {
        translate([x_tue, -(e_tue + holgura_tuerca) / 2, -(e_tue + holgura_tuerca) / 2]) cube([ht, e_tue + holgura_tuerca, (e_tue + holgura_tuerca) / 2 + alto_canal + eps]);
    }
}
// Tornillo prisionero: agujero de paso desde la cara +X hasta la varilla, con tuerca cautiva
module prisionero(alto_canal) {
    translate([R - 1, 0, 0]) gota_x(d_paso, 2 * L);
    ranura_tuerca(alto_canal);
}
module cubo_redondeado(sx, sy, sz, r = 2) {
    hull() for (x = [r, sx - r], y = [r, sy - r]) translate([x, y, 0]) cylinder(r = r, h = sz);
}

// ---- Nuez simple: varilla vertical (Z), prisionero por +X y, en la cara -X,
// un agujero con tuerca cautiva para atornillar una placa, un sensor, etc. ----
module nuez() {
    difference() {
        translate([-L, -w / 2, 0]) cubo_redondeado(2 * L, w, alto, 2.5);
        translate([0, 0, -1]) cylinder(d = D, h = alto + 2);
        translate([0, 0, alto / 2]) prisionero(alto / 2);
        translate([0, 0, alto / 2]) mirror([1, 0, 0]) prisionero(alto / 2);
    }
}
// ---- Nuez doble: varilla vertical (Z) a la izquierda, horizontal (Y) a la derecha ----
module nuez_doble() {
    difference() {
        translate([-(R + L), -w / 2, 0]) cubo_redondeado(2 * (R + L), w, alto, 2.5);
        // varilla vertical, tornillo hacia -X
        translate([-L, 0, 0]) {
            translate([0, 0, -1]) cylinder(d = D, h = alto + 2);
            translate([0, 0, alto / 2]) mirror([1, 0, 0]) prisionero(alto / 2);
        }
        // varilla horizontal (Y), tornillo hacia +X
        translate([L, 0, alto / 2]) {
            gota_y(D, w + 2);
            prisionero(alto / 2);
        }
    }
}
// ---- Manguito: dos varillas en línea (eje Z), dos prisioneros opuestos ----
module manguito() {
    h = 2 * alto;
    difference() {
        translate([-R - pared, -w / 2, 0]) cubo_redondeado(R + pared + L, w, h, 2.5);
        translate([0, 0, -1]) cylinder(d = D, h = h + 2);
        for (z = [alto / 2, h - alto / 2]) translate([0, 0, z]) prisionero(w);   // ranuras abiertas al costado +Y
        translate([-w, -w, h / 2 - 0.6]) cube([2 * w, w / 2, 1.2]);                 // marca del medio
    }
}
// ---- Rotador: disco dentado (eje Z, dientes arriba) + bloque con prisionero ----
module disco_dentado() {
    g = 6;                                   // espesor del disco
    cylinder(d = diametro_disco, h = g);
    // dientes triangulares radiales sobre la cara superior
    for (a = [0 : 360 / dientes : 359]) rotate([0, 0, a])
        hull() {
            translate([d_paso / 2 + 1, 0, g - eps]) cube([0.01, 0.01, 0.01]);
            translate([diametro_disco / 2 - 0.5, 0, g - eps]) rotate([0, 0, 0])
                linear_extrude(height = 1.2, scale = [1, 0.05]) square([0.01, PI * diametro_disco / dientes * 0.9], center = true);
        }
}
module rotador(lado = "tuerca") {
    bl = R + L;                              // largo del bloque (hacia -Y)
    difference() {
        union() {
            disco_dentado();
            // bloque de la varilla: debajo del disco en -Y, misma altura que el disco + alto
            translate([-w / 2, -diametro_disco / 2 - bl + 2, 0]) cubo_redondeado(w, bl, alto, 2.5);
        }
        // agujero del tornillo de la articulación
        translate([0, 0, -1]) cylinder(d = d_paso, h = 20);
        if (lado == "tuerca") translate([0, 0, -eps]) cylinder(d = (e_tue + holgura_tuerca) / cos(30), h = h_tue + holgura_tuerca, $fn = tuerca == "hexagonal" ? 6 : 4);
        else translate([0, 0, -eps]) cylinder(d = d_cab + holgura_tornillo, h = h_cab + 0.5);
        // varilla a lo largo de X en el bloque, prisionero desde -Y con ranura hacia arriba
        translate([0, -diametro_disco / 2 - bl + 2 + R + pared, alto / 2]) {
            gota_x(D, w + 2);
            rotate([0, 0, -90]) prisionero(alto / 2);
        }
    }
}
// ---- Perilla: tornillo de mano; aloja la cabeza o una tuerca (se imprime con el alojamiento arriba) ----
module perilla() {
    hp = 12;
    difference() {
        union() {
            cylinder(d = diametro_perilla * 0.82, h = hp);
            for (a = [0 : 60 : 359]) rotate([0, 0, a]) translate([diametro_perilla / 2 - 4, 0, 0]) cylinder(d = 8, h = hp);
        }
        translate([0, 0, -1]) cylinder(d = d_paso, h = hp + 2);
        if (perilla_para == "tuerca") translate([0, 0, hp - h_tue - holgura_tuerca]) cylinder(d = (e_tue + holgura_tuerca) / cos(30), h = h_tue + holgura_tuerca + 1, $fn = tuerca == "hexagonal" ? 6 : 4);
        else translate([0, 0, hp - h_cab - 0.5]) cylinder(d = d_cab + holgura_tornillo, h = h_cab + 1);
    }
}

// ---- Selección ----
if (pieza == "nuez") nuez();
if (pieza == "nuez_doble") nuez_doble();
if (pieza == "manguito") manguito();
if (pieza == "rotador") { translate([-diametro_disco / 2 - 4, 0, 0]) rotador("tuerca"); translate([diametro_disco / 2 + 4, 0, 0]) rotador("cabeza"); }
if (pieza == "perilla") perilla();
if (pieza == "todo") {
    nuez();
    translate([2 * (R + L) + 10, 0, 0]) nuez_doble();
    translate([4 * (R + L) + 24, 0, 0]) manguito();
    translate([0, w + 2 * diametro_disco, 0]) { translate([-diametro_disco / 2 - 4, 0, 0]) rotador("tuerca"); translate([diametro_disco / 2 + 4, 0, 0]) rotador("cabeza"); }
    translate([2 * (R + L) + 40, w + 2 * diametro_disco, 0]) perilla();
}
if (pieza == "conjunto") {
    // varilla vertical con una nuez doble que sostiene una varilla horizontal,
    // un manguito más arriba y un rotador con una varilla inclinada
    color("gray") cylinder(d = diametro_varilla, h = 200);
    translate([L, 0, 60]) nuez_doble();
    color("gray") translate([2 * L, -60, 60 + alto / 2]) rotate([-90, 0, 0]) cylinder(d = diametro_varilla, h = 120);
    translate([0, 0, 150]) manguito();
    translate([2 * L, 70, 60 + alto / 2]) rotate([0, 0, 90]) rotate([90, 0, 0]) translate([0, diametro_disco / 2 + R + L - 2, -alto / 2]) rotador("tuerca");
}
