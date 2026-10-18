// ======================== NUEZ DOBLE PARA VARILLAS ========================
// Nuez de laboratorio al estilo clásico: dos mordazas en C abiertas hacia el
// frente, en ángulo recto. La mordaza VERTICAL (un canal que atraviesa todo
// el bloque) agarra la varilla del soporte y permite deslizar la nuez por
// ella; la mordaza HORIZONTAL (arriba, abierta al costado) agarra una varilla
// cruzada, una pinza, una placa o un tubo. En cada mordaza, un tornillo con
// mango en T aprieta la pieza contra una RANURA EN V de la cara opuesta, que
// la centra y la traba. Como son abiertas, se enganchan de costado sin
// enhebrar y sirven también para cosas que no son varillas.
// La sujeción sigue la misma idea que la base trípode: el agujero del
// tornillo atraviesa la pared y la rosca la pone una TUERCA metálica cautiva
// que entra por una ranura (la del tornillo lateral desde la cara de arriba,
// la del tornillo vertical desde la cara de atrás). El plástico no lleva
// rosca y el apriete no se desgasta.
// mango_T: mango en T que se calza sobre la cabeza hexagonal del tornillo
// (se imprime con la barra apoyada en la cama). Se imprime todo sin soportes.
// miniaturas: pieza="nuez" | pieza="conjunto" | pieza="mango_T"

/* [Qué imprimir] */
// nuez: el bloque; mango_T: mango para el tornillo (imprimir 2); conjunto: todo armado con varillas; corte: media nuez por los tornillos
pieza = "nuez"; // [nuez, mango_T, conjunto, corte]

/* [Varillas] */
// Diámetro de las varillas (ancho de las mordazas), mm
diametro_varilla = 12; // [6:0.5:25]
// Holgura diametral de las mordazas (mm)
holgura_diametral = 0.4; // [0:0.1:1.5]
// Pared mínima del bloque (mm)
pared = 5; // [3:0.5:10]
// Cuánto sobresalen las mordazas por delante de la varilla (mm)
labio = 3; // [1:0.5:10]
// Profundidad de la ranura en V que centra la varilla (mm; 0 = sin ranura)
ranura_V = 1.5; // [0:0.25:4]
// Redondeo de las aristas verticales (mm)
redondeo = 3; // [0:0.5:8]

/* [Tornillos de apriete] */
// Rosca de los tornillos y tuercas (M4 7 · M5 8 · M6 10 · M8 13 mm entre caras)
tornillo = "M6"; // [M4, M5, M6, M8]
// Holgura del agujero de paso del tornillo (mm)
holgura_tornillo = 0.6; // [0.2:0.1:1.2]
// Medida de la tuerca entre caras, medida con calibre (mm; 0 = la de la tabla según la rosca). Si medís el lado del hexágono, multiplicalo por 1,73
tuerca_entre_caras = 0; // [0:0.1:30]
// Espesor de la tuerca (mm; 0 = el de la tabla según la rosca)
tuerca_espesor = 0; // [0:0.1:20]
// Holgura del alojamiento de la tuerca (mm, entre caras y espesor)
holgura_tuerca = 0.4; // [0:0.1:1]
// Pared entre la mordaza y la tuerca (mm)
pared_tuerca = 2.5; // [1.5:0.5:6]
// Pared por fuera de la tuerca, hasta la cara del bloque (mm)
pared_exterior = 3; // [2:0.5:8]

/* [Mango en T] */
// Largo de la barra del mango (mm)
largo_mango = 40; // [25:5:80]
// Grosor de la barra (mm)
grosor_mango = 7; // [5:0.5:12]
// Alto de la cabeza hexagonal del tornillo (mm; 0 = el de la tabla)
alto_cabeza = 0; // [0:0.1:12]

/* [Hidden] */
$fn = 72;
eps = 0.02;
_T = ["M4", "M5", "M6", "M8"];
_i = search([tornillo], _T)[0];
d_tor = [4, 5, 6, 8][_i];
af    = (tuerca_entre_caras > 0 ? tuerca_entre_caras : [7, 8, 10, 13][_i]) + holgura_tuerca;   // tuerca entre caras, con holgura
e_tue = (tuerca_espesor > 0 ? tuerca_espesor : [3.2, 4.7, 5.2, 6.8][_i]) + holgura_tuerca;      // espesor de la tuerca, con holgura
h_cab = alto_cabeza > 0 ? alto_cabeza : [2.8, 3.5, 4, 5.3][_i];                                 // alto de la cabeza hexagonal
ag = diametro_varilla + holgura_diametral;          // ancho de las mordazas
r = ag / 2;
gv = ranura_V;
techo = 2.5;                                        // chaflanes a 45° en el techo de la mordaza horizontal (puente corto)
tw = pared_tuerca + e_tue + pared_exterior;         // pared que aloja tornillo y tuerca
xh = labio + r;                                     // eje de la varilla horizontal (x)
xa = labio + ag + pared + gv;                       // cara fija de la mordaza vertical (x)
xv = xa + r;                                        // eje de la varilla vertical (x)
yc = labio + r;                                     // eje de la varilla vertical (y)
W = xa + ag + tw;                                   // ancho del bloque (x)
D = labio + ag + pared;                             // fondo del bloque (y)
zc = pared + r;                                     // eje de la varilla horizontal (z)
H = pared + ag + techo + tw;                        // alto del bloque
zs = H / 2;                                         // altura del tornillo lateral
assert(af + 2 < H, "La tuerca es muy grande para el alto del bloque: subí «pared»");
assert(af < D - 1, "La tuerca es muy grande para el fondo del bloque: subí «labio» o «pared»");
echo(str("Nuez doble para varillas de ", diametro_varilla, " mm, tornillos ", tornillo, ", tuerca de ", af - holgura_tuerca, " mm entre caras: bloque ", W, " × ", D, " × ", H, " mm"));

// ---- Perfiles ----
module gota2d(d) { rr = d / 2; hull() { circle(d = d); translate([0, rr * sqrt(2) - 0.02]) circle(r = 0.02, $fn = 8); } }
// Agujero en gota (punta arriba) desde x = 0 hacia +X
module gota_x(d, Lg) { rotate([90, 0, 90]) linear_extrude(Lg) gota2d(d); }
module bloque() { linear_extrude(H) offset(r = redondeo) offset(delta = -redondeo) square([W, D]); }

// Mordaza horizontal: canal a lo largo de Y, abierto en la cara x = 0, con techo achaflanado
module mordaza_horizontal() {
    translate([0, D / 2, 0]) rotate([90, 0, 0]) linear_extrude(D + 2, center = true)
        polygon([[-1, pared], [labio + ag, pared], [labio + ag, pared + ag], [labio + ag - techo, pared + ag + techo], [-1, pared + ag + techo]]);
    // ranura en V en el piso
    if (gv > 0) translate([0, D / 2, 0]) rotate([90, 0, 0]) linear_extrude(D + 2, center = true)
        polygon([[xh - gv, pared + eps], [xh, pared - gv], [xh + gv, pared + eps]]);
    // chaflán de entrada en el labio de arriba
    translate([-1, D / 2, pared + ag + techo]) rotate([90, 0, 0]) linear_extrude(D + 2, center = true) polygon([[0, -1.2], [0, 1.2 + eps], [2.4 + 1, 1.2 + eps]]);
}
// Mordaza vertical: canal que atraviesa el bloque, abierto en la cara y = 0
module mordaza_vertical() {
    translate([xa, -1, -1]) cube([ag, labio + ag + 1, H + 2]);
    if (gv > 0) translate([0, 0, -1]) linear_extrude(H + 2) polygon([[xa + eps, yc - gv], [xa - gv, yc], [xa + eps, yc + gv]]);
}
// Tornillo lateral (mordaza vertical): entra por la cara +X; tuerca por la cara de arriba, con una punta hacia abajo
module sujecion_lateral() {
    translate([xa + r, yc, zs]) gota_x(d_tor + holgura_tornillo, W);
    x_n = xa + ag + pared_tuerca;
    translate([x_n, yc, zs]) rotate([0, 90, 0]) cylinder(d = af / cos(30), h = e_tue, $fn = 6);
    translate([x_n, yc - af / 2, zs]) cube([e_tue, af, H]);
}
// Tornillo vertical (mordaza horizontal): entra por la cara de arriba; tuerca por la cara de atrás (+Y)
module sujecion_vertical() {
    translate([xh, D / 2, zc]) cylinder(d = d_tor + holgura_tornillo, h = H);
    z_n = pared + ag + techo + pared_tuerca;
    translate([xh, D / 2, z_n]) rotate([0, 0, 30]) cylinder(d = af / cos(30), h = e_tue, $fn = 6);
    translate([xh - af / 2, D / 2, z_n]) cube([af, D, e_tue]);
}
module nuez() {
    difference() {
        bloque();
        mordaza_horizontal();
        mordaza_vertical();
        sujecion_lateral();
        sujecion_vertical();
    }
}

// ---- Mango en T (se imprime con la barra apoyada; se usa dado vuelta) ----
module mango_T() {
    d_hub = af + 7; h_hub = h_cab + 3.5; g = grosor_mango;
    difference() {
        union() {
            linear_extrude(g * 0.85) hull() for (s = [-1, 1]) translate([s * (largo_mango / 2 - g / 2), 0]) circle(d = g);
            translate([0, 0, g * 0.85 - eps]) cylinder(d = d_hub, h = h_hub + eps);
            translate([0, 0, g * 0.85 - eps]) cylinder(d1 = d_hub + 3, d2 = d_hub, h = 1.5);
        }
        translate([0, 0, g * 0.85 + h_hub - h_cab - 0.5]) cylinder(r = af / sqrt(3), h = h_cab + 1, $fn = 6);
        translate([0, 0, g * 0.85 + h_hub - 0.6]) cylinder(r1 = af / sqrt(3), r2 = af / sqrt(3) + 0.7, h = 0.6 + eps, $fn = 6);
    }
}

// ---- Conjunto: nuez con varillas, tornillos y mangos ----
module tornillo_con_mango(largo) {
    // eje del tornillo hacia -Z: cabeza en z = 0, punta en z = -largo
    cylinder(d = d_tor, h = h_cab);
    translate([0, 0, -largo]) cylinder(d = d_tor, h = largo + eps);
    translate([0, 0, h_cab + 3.5 + grosor_mango * 0.85]) mirror([0, 0, 1]) mango_T();
}
module conjunto() {
    nuez();
    color("silver") {
        translate([xv, yc, -40]) cylinder(d = diametro_varilla, h = H + 80);
        translate([xh, D / 2, zc]) rotate([90, 0, 0]) cylinder(d = diametro_varilla, h = D + 80, center = true);
        translate([xh, D / 2, H]) tornillo_con_mango(H - zc - r + 0.5);
        translate([W, yc, zs]) rotate([0, 90, 0]) tornillo_con_mango(W - xv - r + 0.5);
    }
}
if (pieza == "mango_T") mango_T();
else if (pieza == "conjunto") conjunto();
else if (pieza == "corte") intersection() { nuez(); translate([-1, yc, -1]) cube([W + 2, D, H + 2]); }
else nuez();
