// ======================== NUEZ DOBLE PARA VARILLAS ========================
// Nuez de laboratorio para unir dos varillas en ángulo recto: un bloque con
// dos alojamientos perpendiculares, uno sobre otro, y en cada uno un
// tornillo de apriete que entra por un brazo del bloque. Los alojamientos
// son ABIERTOS (en U): el tornillo aprieta lo que se ponga contra el brazo
// de enfrente, así que además de varillas sujeta placas, tubos, reglas o
// cualquier cosa que entre en la U (se engancha de costado, sin enhebrar).
// La sujeción sigue la misma idea que la base trípode: el agujero del
// tornillo atraviesa el brazo y la rosca la pone una TUERCA metálica
// cautiva, que se mete por una ranura (con una punta hacia abajo) desde la
// cara de arriba (alojamiento superior) o desde la de abajo (inferior). El
// plástico no lleva rosca y el apriete no se desgasta.
// Se imprime parada tal cual sale, sin soportes: la U de abajo tiene techo
// en gota a 45° y los alojamientos de las tuercas son hexágonos con la
// punta hacia arriba o abajo. Con «tipo = cerrada» los alojamientos son
// agujeros completos, solo para varillas.
// Armado: meter cada tuerca en su ranura, enroscar el tornillo desde la
// cara lateral hasta que apriete la varilla. Para aflojar y girar la
// varilla sirve una perilla de apriete o las llaves del catálogo.
// miniaturas: pieza="nuez" | pieza="conjunto" | tipo="cerrada"

/* [Qué imprimir] */
// nuez: la pieza; conjunto: con dos varillas puestas; corte: media nuez para ver tornillos y tuercas
pieza = "nuez"; // [nuez, conjunto, corte]

/* [Alojamientos] */
// abierta: en U, sujeta varillas y también placas o tubos; cerrada: agujeros completos
tipo = "abierta"; // [abierta, cerrada]
// Diámetro de las varillas (ancho de la U), mm
diametro_varilla = 12; // [6:0.5:25]
// Abierta: cuánto sobresalen los brazos por encima de la varilla (mm)
labio = 3; // [1:0.5:10]
// Holgura diametral de los agujeros (mm)
holgura_diametral = 0.4; // [0:0.1:1.5]
// Pared mínima alrededor de cada varilla (mm)
pared = 5; // [3:0.5:10]
// Lado del bloque (mm; 0 = automático: lo justo para la tuerca)
lado = 0; // [0:1:60]
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
// Pared entre la varilla y la tuerca (mm)
pared_tuerca = 2.5; // [1.5:0.5:6]
// Pared por fuera de la tuerca, hasta la cara del bloque (mm)
pared_exterior = 3; // [2:0.5:8]

/* [Hidden] */
$fn = 72;
eps = 0.02;
_T = ["M4", "M5", "M6", "M8"];
_i = search([tornillo], _T)[0];
d_tor = [4, 5, 6, 8][_i];
af    = (tuerca_entre_caras > 0 ? tuerca_entre_caras : [7, 8, 10, 13][_i]) + holgura_tuerca;   // tuerca entre caras, con holgura
e_tue = (tuerca_espesor > 0 ? tuerca_espesor : [3.2, 4.7, 5.2, 6.8][_i]) + holgura_tuerca;      // espesor de la tuerca, con holgura
agujero = diametro_varilla + holgura_diametral;
r = agujero / 2;
techo = 1.6;                                        // altura extra del techo en gota del agujero de la varilla
pared_tor = pared_tuerca + e_tue + pared_exterior;  // pared del lado del tornillo
L = max(lado, ceil(agujero + pared + pared_tor));   // lado del bloque
Hs = tipo == "abierta" ? pared + agujero + labio : agujero + techo + 2 * pared;   // alto de cada sección
H = 2 * Hs;                                         // alto total
c = -L / 2 + pared + r;                             // eje de la varilla (corrido hacia la pared fina)
z1 = Hs - pared - r;                                // eje del alojamiento inferior (a lo largo de X; U abierta hacia abajo)
z2 = Hs + pared + r;                                // eje del alojamiento superior (a lo largo de Y; U abierta hacia arriba)
x_tue = r + pared_tuerca;                           // cara interior de la tuerca, desde el eje de la varilla
assert(lado == 0 || lado >= agujero + pared + pared_tor, str("El lado tiene que ser de al menos ", ceil(agujero + pared + pared_tor), " mm para que entre la tuerca"));
assert(af < Hs - 2, "La tuerca es muy grande para la altura de la sección: subí «pared» o «labio»");
assert(tipo == "cerrada" || af / 2 < r + labio - 0.8, "Abierta: la tuerca asoma por el borde del brazo: subí «labio»");
echo(str("Nuez doble para varillas de ", diametro_varilla, " mm, tornillos ", tornillo, ", tuerca de ", af - holgura_tuerca, " mm entre caras y ", e_tue - holgura_tuerca, " mm de espesor: bloque ", L, " × ", L, " × ", H, " mm"));

// ---- Perfiles ----
// Gota 2D (punta hacia +Y) con el techo recortado a «techo» mm por encima del círculo
module gota2d(d, techo_max = 100) {
    rr = d / 2;
    intersection() {
        hull() { circle(d = d); translate([0, rr * sqrt(2) - 0.02]) circle(r = 0.02, $fn = 8); }
        translate([-d, -d]) square([2 * d, d + rr + techo_max]);
    }
}
// Agujero en gota a lo largo de Y (centrado) o de X (desde x = 0 hacia +X)
module gota_y(d, Lg, techo_max = 100) { rotate([90, 0, 0]) linear_extrude(Lg, center = true) gota2d(d, techo_max); }
module gota_x(d, Lg, techo_max = 100) { rotate([90, 0, 90]) linear_extrude(Lg) gota2d(d, techo_max); }
// Bloque con aristas verticales redondeadas
module bloque() {
    linear_extrude(H) offset(r = redondeo) offset(delta = -redondeo) square(L, center = true);
}
// Tornillo y tuerca cautiva de un agujero: eje de la varilla en el origen, varilla a lo largo de Y,
// tornillo hacia +X, ranura de la tuerca hacia arriba (hacia_arriba) o hacia abajo
module sujecion(hacia_arriba) {
    // paso del tornillo (gota, punta arriba) desde el eje hasta fuera de la cara
    gota_x(d_tor + holgura_tornillo, L);
    // alojamiento hexagonal de la tuerca, con una punta hacia abajo y otra hacia arriba
    translate([x_tue, 0, 0]) rotate([0, 90, 0]) cylinder(d = af / cos(30), h = e_tue, $fn = 6);
    // ranura para meter la tuerca desde la cara de arriba o de abajo
    translate([x_tue, -af / 2, hacia_arriba ? 0 : -Hs]) cube([e_tue, af, Hs + eps]);
}
// Alojamiento de la varilla (eje en el origen, a lo largo de Y): agujero completo o U abierta hacia +Z
module alojamiento(abierto_arriba) {
    if (tipo == "cerrada") {
        gota_y(agujero, L + 2, techo);
        for (s = [-1, 1]) translate([0, s * L / 2, 0]) rotate([s * 90, 0, 0]) cylinder(d1 = agujero + 2.4, d2 = agujero, h = 1.2);
    } else {
        mirror([0, 0, abierto_arriba ? 0 : 1]) rotate([90, 0, 0]) linear_extrude(L + 2, center = true) {
            // fondo redondo (al imprimir, la U de abajo queda con techo en gota)
            if (abierto_arriba) circle(d = agujero); else gota2d(agujero, techo);
            translate([-r, 0]) square([agujero, r + labio + 1]);
            // boca ensanchada para entrar de costado
            translate([0, r + labio]) polygon([[-r - 1.2, 1], [-r, -1.2], [r, -1.2], [r + 1.2, 1]]);
        }
    }
}
module nuez() {
    difference() {
        bloque();
        // alojamiento inferior: varilla a lo largo de X, tornillo hacia +Y, tuerca por abajo, U abierta hacia abajo
        translate([0, c, z1]) rotate([0, 0, -90]) { alojamiento(false); sujecion(false); }
        // alojamiento superior: varilla a lo largo de Y, tornillo hacia +X, tuerca por arriba, U abierta hacia arriba
        translate([c, 0, z2]) { alojamiento(true); sujecion(true); }
    }
}
module varillas() {
    translate([0, c, z1]) rotate([0, 90, 0]) cylinder(d = diametro_varilla, h = L + 90, center = true);
    translate([c, 0, z2]) rotate([90, 0, 0]) cylinder(d = diametro_varilla, h = L + 90, center = true);
}
if (pieza == "conjunto") { nuez(); color("silver") varillas(); }
else if (pieza == "corte") intersection() { nuez(); translate([-L, -L, -1]) cube([2 * L, L, H + 2]); }
else nuez();
