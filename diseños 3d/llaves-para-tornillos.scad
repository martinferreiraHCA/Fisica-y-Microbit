// ================== LLAVES PARA TORNILLOS DE CABEZA HEXAGONAL ==================
// Juego de llaves imprimibles para apretar y aflojar tornillos y tuercas
// hexagonales. Por defecto está pensado para cabezas de 11 mm entre caras y
// 4 mm de alto (los bolts de los soportes), pero todo es paramétrico: medí la
// cabeza con un calibre (distancia entre dos caras opuestas y alto) y cargá
// los valores.
//  · llave_boca: llave fija plana, con boca a 15° como las de taller; puede
//    llevar una segunda boca de otra medida en el otro extremo.
//  · llave_combinada: boca de un lado y anillo (estrella) del otro; el
//    anillo agarra las seis caras y es el que más fuerza soporta.
//  · llave_tubo: tubo con un hexágono en cada extremo (dos medidas) y un
//    agujero transversal para pasar una barra, un destornillador o un bolt.
//  · llave_T: tubo con mango en T, para apretar rápido y con buen par.
//  · destornillador: destornillador de tuercas con empuñadura estriada, el
//    más cómodo para tornillos chicos y lugares estrechos.
//  · barra: barra para la llave de tubo (o usá una varilla o un bolt).
// Todas las piezas salen en posición de impresión: planas o paradas con el
// hexágono hacia arriba, sin soportes. Los hexágonos tienen una boca
// achaflanada para que entren fácil. Si la llave entra floja o forzada,
// ajustá «holgura» (±0,1 mm) y volvé a imprimir.

/* [Qué imprimir] */
// Pieza a renderizar y exportar
pieza = "llave_combinada"; // [llave_boca, llave_combinada, llave_tubo, llave_T, destornillador, barra, todo]

/* [Cabeza del tornillo] */
// Medida entre caras de la cabeza o tuerca (mm)
entre_caras = 11; // [4:0.5:24]
// Alto de la cabeza (mm): profundidad útil del hexágono en las llaves de tubo
alto_cabeza = 4; // [1:0.5:15]
// Holgura del hexágono (mm): sumá 0,1 si entra forzado, restá si queda flojo
holgura = 0.3; // [0:0.05:1]
// Diámetro del agujero para el vástago detrás del hexágono (mm, 0 = ciego): permite usar las llaves de tubo sobre tuercas
diametro_paso = 7; // [0:0.5:16]
// Profundidad de ese agujero (mm)
profundidad_paso = 12; // [0:1:40]

/* [Segunda medida] */
// Medida entre caras del segundo extremo (llave de boca doble y llave de tubo), mm
entre_caras_2 = 10; // [4:0.5:24]
// La llave de boca lleva una segunda boca (con entre_caras_2) en vez de agujero para colgar
segunda_boca = true;

/* [Llaves planas] */
// Espesor de la llave (mm)
espesor = 6; // [3:0.5:12]
// Largo del mango (mm)
largo_mango = 90; // [40:5:160]
// Ancho del mango (mm)
ancho_mango = 14; // [8:1:25]
// Pared alrededor de la boca y del anillo (mm)
pared = 5; // [3:0.5:10]
// Ángulo de la boca respecto del mango (grados)
angulo_boca = 15; // [0:5:30]
// Puntas del anillo: 6 (más fuerte) o 12 (agarra cada 30°)
puntas = 6; // [6, 12]

/* [Llaves de tubo y destornillador] */
// Pared del tubo alrededor del hexágono (mm)
pared_tubo = 3; // [2:0.5:6]
// Largo de la llave de tubo (mm)
largo_tubo = 50; // [30:5:100]
// Diámetro del agujero transversal de la llave de tubo (mm)
diametro_barra = 6; // [3:0.5:12]
// Largo del vástago (llave T y destornillador), mm
largo_vastago = 40; // [15:5:100]
// Largo del mango en T (mm)
largo_T = 70; // [40:5:120]
// Grosor del mango en T (mm)
grosor_T = 10; // [6:1:16]
// Diámetro de la empuñadura del destornillador (mm)
diametro_empunadura = 26; // [18:1:40]
// Largo de la empuñadura (mm)
largo_empunadura = 55; // [30:5:100]
// Cantidad de estrías de la empuñadura
estrias = 8; // [0:1:16]

/* [Rótulo] */
// Grabar la medida en cada llave
rotular = true;

/* [Hidden] */
$fn = 64;
eps = 0.02;
r_hex  = (entre_caras + holgura) / sqrt(3);     // radio de los vértices del hexágono
r_hex2 = (entre_caras_2 + holgura) / sqrt(3);
R_cab  = r_hex + pared;                          // radio exterior de la cabeza de la llave plana
D_tubo = 2 * (r_hex + pared_tubo);               // diámetro exterior del tubo
prof   = alto_cabeza + 0.5;                      // profundidad del hexágono en los tubos
function r_de(af) = (af + holgura) / sqrt(3);
echo(str("Hexágono ", entre_caras, " mm entre caras: radio ", round(r_hex * 100) / 100, " mm; tubo de Ø", round(D_tubo * 10) / 10, " mm"));

// ---- Rótulo de la medida (trazos, sin fuentes) ----
_GL = [
    [[[0.3,0],[0.7,0],[1,0.3],[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,0.3],[0.3,0]]],       // 0
    [[[0.5,0],[0.5,2]],[[0.15,1.65],[0.5,2]]],                                          // 1
    [[[0,1.7],[0.3,2],[0.7,2],[1,1.7],[1,1.3],[0,0],[1,0]]],                            // 2
    [[[0,2],[1,2],[0.55,1.15],[1,0.75],[1,0.3],[0.7,0],[0.3,0],[0,0.3]]],               // 3
    [[[0.75,0],[0.75,2],[0,0.6],[1,0.6]]],                                              // 4
    [[[1,2],[0,2],[0,1.1],[0.7,1.1],[1,0.8],[1,0.3],[0.7,0],[0,0]]],                    // 5
    [[[1,2],[0.4,2],[0,1.4],[0,0.3],[0.3,0],[0.7,0],[1,0.3],[1,0.8],[0.7,1.05],[0,1.05]]], // 6
    [[[0,2],[1,2],[0.4,0]]],                                                            // 7
    [[[0.5,1.05],[0.2,1.3],[0.2,1.75],[0.5,2],[0.8,1.75],[0.8,1.3],[0.5,1.05],[0.1,0.8],[0.1,0.25],[0.4,0],[0.6,0],[0.9,0.25],[0.9,0.8],[0.5,1.05]]], // 8
    [[[0,0],[0.6,0],[1,0.6],[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,1.2],[0.3,0.95],[1,0.95]]], // 9
    [[[0.4,0],[0.6,0]]]                                                                 // .
];
function _gi(c) = c == "." ? 10 : search(c, "0123456789", 1)[0];
module rotulo(s, h = 6, g = 1.2, alto = 0.8) {
    k = h / 2; ancho = (len(s) * 1.45 - 0.45) * k;
    translate([-ancho / 2, -h / 2, 0]) for (i = [0 : len(s) - 1]) {
        gi = _gi(s[i]);
        if (gi != undef && gi != [])
            for (p = _GL[gi]) for (j = [0 : len(p) - 2]) hull() {
                translate([(i * 1.45 + p[j][0]) * k, p[j][1] * k, 0]) cylinder(d = g, h = alto, $fn = 12);
                translate([(i * 1.45 + p[j + 1][0]) * k, p[j + 1][1] * k, 0]) cylinder(d = g, h = alto, $fn = 12);
            }
    }
}
function medida(af) = str(af);

// ---- Geometría común ----
// Hexágono (2D) con dos caras paralelas al eje X; con 12 puntas agarra cada 30°
module hex2d(af, p = 6) {
    circle(r = r_de(af), $fn = 6);
    if (p == 12) rotate(30) circle(r = r_de(af), $fn = 6);
}
// Hueco hexagonal 3D con boca achaflanada en z = z_boca (arriba si arriba = true)
module hueco_hex(af, h, z_boca, arriba = true) {
    r = r_de(af);
    translate([0, 0, arriba ? z_boca - h : z_boca]) linear_extrude(h) hex2d(af);
    if (arriba) translate([0, 0, z_boca - 0.8]) cylinder(r1 = r, r2 = r + 0.9, h = 0.8 + eps, $fn = 6);
    else translate([0, 0, z_boca - eps]) cylinder(r1 = r + 0.9, r2 = r, h = 0.8 + eps, $fn = 6);
}
// Agujero para el vástago del tornillo detrás del hexágono
module paso(z_fondo_hex, arriba = true) {
    if (diametro_paso > 0 && profundidad_paso > 0)
        translate([0, 0, arriba ? z_fondo_hex - profundidad_paso : z_fondo_hex - eps]) cylinder(d = diametro_paso, h = profundidad_paso + eps);
}
// Agujero horizontal en gota (se imprime sin soporte), a lo largo de X
module gota_x(d, L) {
    r = d / 2;
    rotate([90, 0, 90]) linear_extrude(L, center = true) { circle(r); polygon([[-r * 0.7071, r * 0.7071], [0, r * 1.4142], [r * 0.7071, r * 0.7071]]); }
}

// ---- Llaves planas ----
// Contorno de la cabeza con boca abierta hacia +X
module cabeza2d(af) {
    r = r_de(af); x_tip = r / 2 + 0.65 * af;
    hull() {
        circle(R_cab);
        for (s = [-1, 1]) translate([x_tip - pared / 2, s * ((af + holgura) / 2 + pared / 2)]) circle(pared / 2);
    }
}
// Hueco de la boca: hexágono más canal hacia +X
module boca2d(af) {
    hex2d(af);
    translate([0, -(af + holgura) / 2]) square([R_cab + 20, af + holgura]);
}
module mango2d(L) {
    hull() { circle(ancho_mango / 2); translate([-L, 0]) circle(ancho_mango / 2); }
}
module grabado_mango(x, s) {
    if (rotular) translate([x, 0, espesor - eps]) rotulo(s, h = min(6, ancho_mango - 5), alto = 0.6 + eps);
}
module llave_boca() {
    L = R_cab + largo_mango;
    union() {
        difference() {
            linear_extrude(espesor) union() {
                rotate(angulo_boca) cabeza2d(entre_caras);
                mango2d(L);
                if (segunda_boca) translate([-L, 0]) rotate(180 + angulo_boca) cabeza2d(entre_caras_2);
            }
            translate([0, 0, -eps]) linear_extrude(espesor + 2 * eps) {
                rotate(angulo_boca) boca2d(entre_caras);
                if (segunda_boca) translate([-L, 0]) rotate(180 + angulo_boca) boca2d(entre_caras_2);
                else translate([-L, 0]) circle(d = 4.5);
            }
        }
        grabado_mango(-(R_cab + 8), medida(entre_caras));
        if (segunda_boca) grabado_mango(-(L - R_cab - 8), medida(entre_caras_2));
    }
}
module llave_combinada() {
    L = R_cab + largo_mango;
    union() {
        difference() {
            linear_extrude(espesor) union() {
                rotate(angulo_boca) cabeza2d(entre_caras);
                mango2d(L);
                translate([-L, 0]) circle(R_cab);
            }
            translate([0, 0, -eps]) linear_extrude(espesor + 2 * eps) {
                rotate(angulo_boca) boca2d(entre_caras);
                translate([-L, 0]) rotate(90) hex2d(entre_caras, puntas);
            }
        }
        grabado_mango(-(R_cab + 8), medida(entre_caras));
    }
}

// ---- Llaves de tubo ----
module llave_tubo() {
    D = 2 * (max(r_hex, r_hex2) + pared_tubo); L = largo_tubo;
    difference() {
        cylinder(d = D, h = L);
        hueco_hex(entre_caras, prof, L, true);
        paso(L - prof, true);
        hueco_hex(entre_caras_2, prof, 0, false);
        paso(prof, false);
        translate([0, 0, L / 2]) gota_x(diametro_barra, D + 2);
        // rótulo grabado en el costado, junto a cada boca
        if (rotular) {
            translate([0, -D / 2 + 0.5, L - prof - 6]) rotate([90, 0, 0]) rotulo(medida(entre_caras), h = 5, alto = 1);
            translate([0, -D / 2 + 0.5, prof + 6]) rotate([90, 0, 0]) rotulo(medida(entre_caras_2), h = 5, alto = 1);
        }
    }
}
module llave_T() {
    t = grosor_T; z_top = t + largo_vastago;
    difference() {
        union() {
            hull() {
                for (s = [-1, 1]) translate([s * (largo_T / 2 - t / 2), 0, 0]) cylinder(d = t, h = t);
                cylinder(d = D_tubo + 6, h = t);
            }
            translate([0, 0, t - eps]) cylinder(d = D_tubo, h = largo_vastago + eps);
        }
        hueco_hex(entre_caras, prof, z_top, true);
        paso(z_top - prof, true);
        if (rotular) translate([0, -D_tubo / 2 + 0.5, z_top - prof - 6]) rotate([90, 0, 0]) rotulo(medida(entre_caras), h = 5, alto = 1);
    }
}
module destornillador() {
    De = diametro_empunadura; Lg = largo_empunadura; z_top = Lg + largo_vastago;
    difference() {
        union() {
            cylinder(d1 = De - 3, d2 = De, h = 1.5);
            translate([0, 0, 1.5 - eps]) cylinder(d = De, h = Lg - 4.5 + 2 * eps);
            translate([0, 0, Lg - 3]) cylinder(d1 = De, d2 = D_tubo + 2, h = 3);
            translate([0, 0, Lg - eps]) cylinder(d = D_tubo, h = largo_vastago + eps);
        }
        if (estrias > 0) for (a = [0 : 360 / estrias : 359]) rotate([0, 0, a])
            translate([De / 2 + 1.3, 0, 4]) cylinder(d = 5, h = Lg - 11);
        hueco_hex(entre_caras, prof, z_top, true);
        paso(z_top - prof, true);
        if (rotular) translate([0, 0, -eps]) mirror([1, 0, 0]) rotulo(medida(entre_caras), h = min(9, De * 0.35), alto = 0.6 + eps);
    }
}
module barra() {
    d = diametro_barra - 0.4;
    intersection() {
        union() {
            translate([0, 0, d / 2 - 0.4]) rotate([0, 90, 0]) cylinder(d = d, h = largo_T, center = true);
            translate([largo_T / 2 - 2, 0, d / 2 - 0.4]) rotate([0, 90, 0]) cylinder(d = d + 4, h = 4, center = true);
        }
        translate([-largo_T, -50, 0]) cube([2 * largo_T, 100, 50]);
    }
}

// ---- Selección ----
module todo() {
    y1 = R_cab + diametro_empunadura / 2 + 8;
    llave_boca();
    translate([0, -(2 * R_cab + 6), 0]) llave_combinada();
    translate([-(largo_mango + R_cab), y1, 0]) destornillador();
    translate([-40, y1, 0]) llave_T();
    translate([diametro_empunadura / 2 + 2, y1, 0]) llave_tubo();
    translate([largo_T / 2 + 10 + diametro_empunadura / 2, y1 + D_tubo / 2 + diametro_barra, 0]) barra();
}
if (pieza == "llave_boca") llave_boca();
else if (pieza == "llave_combinada") llave_combinada();
else if (pieza == "llave_tubo") llave_tubo();
else if (pieza == "llave_T") llave_T();
else if (pieza == "destornillador") destornillador();
else if (pieza == "barra") barra();
else todo();
