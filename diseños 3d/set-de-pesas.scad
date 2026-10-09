// ================== SET DE PESAS RELLENABLES ==================
// Pesas huecas para imprimir en 3D y rellenar con arena, perdigones, agua o
// tornillos hasta la MASA que elijas: el deslizador «masa» calcula la altura
// de la cámara según el relleno y el plástico. La masa queda grabada en la
// tapa. Dos tipos:
//  · colgante: cilindro con tapa roscada. La anilla de carga va en la tapa
//    (se imprime con ella, en forma de gota, sin soportes) o, si preferís,
//    la pesa lleva dos orejas con agujeros para un alambre de enganche.
//  · apilable: discos con agujero central y tapón de llenado roscado, que
//    se apilan en una percha con gancho (juego de pesas tipo laboratorio).
// Rosca gruesa propia (no normalizada). Imprimí primero «prueba_rosca».
// Imprimir al 100 % de relleno las paredes finas no hace falta: el peso lo
// pone el relleno. Pesá la pieza terminada y corregí con relleno si hace falta.

/* [Qué imprimir] */
// Pieza a renderizar y exportar
pieza = "pesa"; // [pesa, tapa, todo, conjunto, percha, prueba_rosca]
// Tipo de pesa
tipo = "colgante"; // [colgante, apilable]

/* [Masa] */
// Masa total buscada (g)
masa = 100; // [20:10:1000]
// Material de relleno
relleno = "arena"; // [arena, perdigones, agua, tornillos]
// Diámetro exterior (mm): colgante 40, apilable 56 recomendados
diametro = 40; // [28:1:80]
// Enganche (solo colgante): anilla en la tapa o alambre por dos orejas
enganche = "anilla"; // [anilla, alambre]

/* [Impresión] */
// Espesor de pared (mm)
pared = 1.6; // [1.2:0.2:3]
// Densidad del plástico impreso (g/cm3): PLA 1.24, PETG 1.27, ABS 1.04
densidad_plastico = 1.24; // [0.9:0.01:1.5]
// Fracción de la cámara que realmente se llena (0.9 = 90 %)
llenado = 0.92; // [0.6:0.02:1]

/* [Rosca] */
// Paso de la rosca (mm)
paso_rosca = 3.4; // [2:0.1:5]
// Largo de la rosca (mm)
largo_rosca = 9; // [6:0.5:16]
// Profundidad del filete (mm)
profundidad_rosca = 1.1; // [0.6:0.1:1.8]
// Holgura radial de la rosca (mm)
holgura_rosca = 0.30; // [0.1:0.05:0.6]

/* [Apilable] */
// Diámetro de la varilla de la percha (mm)
eje_percha = 8; // [6:1:12]
// Largo útil de la percha (mm)
largo_percha = 120; // [60:10:250]

/* [Hidden] */
$fn = 64;                               // igual que los segmentos de la rosca (evita caras casi coincidentes)
eps = 0.02;
// Densidades aparentes de relleno (g/cm3): arena seca 1.5, perdigones de plomo
// 6.5, agua 1.0, tornillos y tuercas sueltos 4.0
densidad_relleno = relleno == "perdigones" ? 6.5 : relleno == "agua" ? 1.0 : relleno == "tornillos" ? 4.0 : 1.5;
R = diametro / 2;
base = 2;                              // espesor del fondo
cabeza = 5;                            // espesor de la cabeza de la tapa
// Rosca grande (tapa de la pesa colgante): raíz adentro de la pared
radio_raiz = R - pared - profundidad_rosca - 0.6;
r_cam = R - pared;                      // radio interior de la cámara
d_eje = eje_percha + 1;                 // agujero central del disco apilable
r_tubo = d_eje / 2 + pared;             // tubo central del disco apilable
// Rosca chica (tapón de llenado de la pesa apilable): se achica si el disco es angosto
radio_raiz_chico = min(5.5, (r_cam - r_tubo) / 2 - profundidad_rosca - holgura_rosca - 1.2);
function cm3(v) = v / 1000;             // mm3 → cm3
function area_anillo(ro, ri) = PI * (ro * ro - ri * ri);

// ---- Masas y altura calculada (pesa colgante) ----
// Volumen fijo de plástico: fondo + boca roscada + tapa (aprox.)
v_fijo_col = PI * R * R * base
           + area_anillo(R, radio_raiz) * (largo_rosca + 1)
           + PI * R * R * cabeza + PI * radio_raiz * radio_raiz * largo_rosca * 0.55
           + (enganche == "anilla" ? 2200 : 2 * 650);
// Por cada mm de altura de cámara: pared de plástico + relleno
m_por_mm_col = densidad_plastico * cm3(area_anillo(R, r_cam)) + densidad_relleno * llenado * cm3(PI * r_cam * r_cam);
altura_camara_col = max(8, (masa - densidad_plastico * cm3(v_fijo_col)) / m_por_mm_col);
altura_col = base + altura_camara_col + largo_rosca + 1;   // altura total del cuerpo

// ---- Masas y altura calculada (disco apilable) ----
v_fijo_api = 2 * PI * R * R * base + 1500;   // dos tapas del disco + tapón de llenado
m_por_mm_api = densidad_plastico * cm3(area_anillo(R, r_cam) + area_anillo(r_tubo, d_eje / 2))
             + densidad_relleno * llenado * cm3(area_anillo(r_cam, r_tubo));
altura_camara_api = max(6, (masa - densidad_plastico * cm3(v_fijo_api)) / m_por_mm_api);
altura_api = 2 * base + altura_camara_api;

echo(str("Pesa ", tipo, " de ", masa, " g con ", relleno, ": altura del cuerpo ",
     round(tipo == "apilable" ? altura_api : altura_col), " mm; plástico ≈ ",
     round(densidad_plastico * cm3(tipo == "apilable"
        ? v_fijo_api + (area_anillo(R, r_cam) + area_anillo(r_tubo, d_eje / 2)) * altura_camara_api
        : v_fijo_col + area_anillo(R, r_cam) * altura_camara_col)),
     " g; relleno ≈ ", round(masa - densidad_plastico * cm3(tipo == "apilable"
        ? v_fijo_api + (area_anillo(R, r_cam) + area_anillo(r_tubo, d_eje / 2)) * altura_camara_api
        : v_fijo_col + area_anillo(R, r_cam) * altura_camara_col)), " g"));
assert(radio_raiz > 6, "El diámetro es muy chico para la rosca: subí el diámetro o bajá la pared");
assert(tipo == "colgante" || radio_raiz_chico >= 3, "Disco apilable: el diámetro es muy chico para el tapón de llenado (usá 40 mm o más)");

// ---- Rosca (perfil helicoidal, polyhedron) ----
module perfil_rosca(rr, extra = 0) {
    n = 64; vueltas = ceil(largo_rosca / paso_rosca) + 2;
    perfil = [[rr + extra - 0.15, -1.25 - extra / 2],
              [rr + extra + profundidad_rosca, -0.15 - extra / 2],
              [rr + extra + profundidad_rosca, 0.15 + extra / 2],
              [rr + extra - 0.15, 1.25 + extra / 2]];
    puntos = [for (i = [0 : vueltas * n]) for (q = perfil)
        let (a = -360 + 360 * i / n)
        [q[0] * cos(a), q[0] * sin(a), paso_rosca * a / 360 + q[1]]];
    caras = concat([[0, 1, 2, 3]],
        [for (i = [0 : vueltas * n - 1]) for (j = [0 : 3]) for (k = [0 : 1])
          k == 0 ? [4 * i + j, 4 * (i + 1) + j, 4 * (i + 1) + (j + 1) % 4] :
                   [4 * i + j, 4 * (i + 1) + (j + 1) % 4, 4 * i + (j + 1) % 4]],
        [[for (j = [3 : -1 : 0]) 4 * vueltas * n + j]]);
    intersection() {
        polyhedron(points = puntos, faces = caras, convexity = 20);
        translate([-rr - 10, -rr - 10, 0]) cube([2 * rr + 20, 2 * rr + 20, largo_rosca]);
    }
}
module tornillo(rr, extra = 0) {
    union() { cylinder(r = rr + extra, h = largo_rosca); perfil_rosca(rr, extra); }
}

// ---- Rótulo de la masa (trazos, sin fuentes) ----
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
    [[[1,1.7],[0.7,2],[0.3,2],[0,1.7],[0,0.3],[0.3,0],[0.7,0],[1,0.3],[1,0.9],[0.55,0.9]]] // G
];
function _gi(c) = c == "G" ? 10 : search(c, "0123456789", 1)[0];
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
module moleteado(r, h, n = 24) {
    for (a = [0 : 360 / n : 359]) rotate([0, 0, a]) translate([r, 0, -eps]) cylinder(d = 2.4, h = h + 2 * eps, $fn = 16);
}

// ---- Pesa colgante ----
module cuerpo_colgante() {
    difference() {
        union() {
            cylinder(r = R, h = altura_col);
            if (enganche == "alambre") for (s = [-1, 1]) oreja(s);
        }
        // cámara (hasta el collar roscado de la boca, que es más angosto)
        translate([0, 0, base]) cylinder(r = r_cam, h = altura_col - base - largo_rosca - 1);
        translate([0, 0, altura_col - largo_rosca - 1 - eps]) cylinder(r1 = r_cam, r2 = radio_raiz + holgura_rosca, h = 1 + 2 * eps);
        // boca roscada (hembra) y chaflán de entrada
        translate([0, 0, altura_col - largo_rosca]) tornillo(radio_raiz, holgura_rosca);
        translate([0, 0, altura_col - 0.8]) cylinder(r1 = radio_raiz + holgura_rosca, r2 = radio_raiz + holgura_rosca + 1.2, h = 0.82);
        if (enganche == "alambre") for (s = [-1, 1])
            translate([s * (R + 3.5), 0, altura_col - 9]) rotate([90, 0, 0]) cylinder(d = 3.2, h = 30, center = true, $fn = 20);
        // rótulo en el fondo
        translate([0, 0, -eps]) mirror([0, 0, 1]) rotulo(str(masa, "G"), h = min(8, R * 0.35), alto = 0.6);
    }
}
// Oreja lateral con apoyo a 45° (imprimible sin soporte) y agujero para alambre
module oreja(s) {
    hull() {
        translate([s * (R + 3.5), 0, altura_col - 9]) rotate([90, 0, 0]) cylinder(d = 9, h = 8, center = true);
        translate([s * (R - 1), 0, altura_col - 20]) rotate([90, 0, 0]) cylinder(d = 2, h = 8, center = true);
        translate([s * (R - 1), 0, altura_col - 4.5]) rotate([90, 0, 0]) cylinder(d = 2, h = 8, center = true);
    }
}
// Anilla de carga en forma de gota: se imprime de pie con la tapa, sin soporte
module anilla() {
    rotate([90, 0, 0]) linear_extrude(height = 6, center = true) difference() {
        hull() { circle(r = 10.5); translate([0, 11]) circle(r = 2.5); }
        hull() { circle(r = 5.5); translate([0, 6.5]) circle(r = 0.6); }
    }
}
// Tapa: se imprime como aparece, con la rosca abajo y la anilla arriba.
// simple = true: espiga lisa en vez de rosca (solo para la vista «conjunto»,
// donde la rosca queda oculta dentro de la boca).
module tapa_colgante(simple = false) {
    difference() {
        union() {
            if (simple) cylinder(r = radio_raiz - 0.6, h = largo_rosca); else tornillo(radio_raiz);
            translate([0, 0, largo_rosca - eps]) cylinder(r = R, h = cabeza);
            if (enganche == "anilla") translate([0, 0, largo_rosca + cabeza - eps]) {
                translate([0, 0, 0]) cylinder(r = 8, h = 2);
                translate([0, 0, 10.5 + 1]) anilla();
            }
        }
        translate([0, 0, largo_rosca]) moleteado(R, cabeza);
        // chaflán en la punta de la rosca
        translate([0, 0, -eps]) difference() {
            cylinder(r = R, h = 1);
            cylinder(r1 = radio_raiz - 0.5, r2 = radio_raiz + profundidad_rosca + 0.3, h = 1.01);
        }
        if (enganche != "anilla")
            translate([0, 0, largo_rosca + cabeza - 0.6]) rotulo(str(masa, "G"), h = min(8, R * 0.35), alto = 0.7);
        else
            for (s = [-1, 1]) translate([s * R * 0.55, 0, largo_rosca + cabeza - 0.6]) rotate([0, 0, 90]) rotulo(str(masa, "G"), h = min(6, R * 0.25), alto = 0.7);
    }
}
// ---- Pesa apilable (disco) ----
x_tapon = (r_cam + r_tubo) / 2;     // posición del tapón de llenado
module disco_apilable() {
    difference() {
        cylinder(r = R, h = altura_api);
        // cámara anular entre el tubo central y la pared
        translate([0, 0, base]) difference() {
            cylinder(r = r_cam, h = altura_camara_api);
            translate([0, 0, -1]) cylinder(r = r_tubo, h = altura_camara_api + 2);
        }
        // agujero central para la percha
        translate([0, 0, -1]) cylinder(d = d_eje, h = altura_api + 2);
        // boca de llenado roscada (hembra) en la cara superior
        translate([x_tapon, 0, altura_api - largo_rosca]) tornillo(radio_raiz_chico, holgura_rosca);
        translate([x_tapon, 0, altura_api - 0.8]) cylinder(r1 = radio_raiz_chico + holgura_rosca, r2 = radio_raiz_chico + holgura_rosca + 1, h = 0.82);
        // rótulo
        translate([-x_tapon, 0, altura_api - 0.6]) rotate([0, 0, 90]) rotulo(str(masa, "G"), h = min(7, (r_cam - r_tubo) * 0.5), alto = 0.7);
    }
}
module tapon_apilable(simple = false) {
    difference() {
        union() {
            if (simple) cylinder(r = radio_raiz_chico - 0.6, h = largo_rosca); else tornillo(radio_raiz_chico);
            translate([0, 0, largo_rosca - eps]) cylinder(r = radio_raiz_chico + profundidad_rosca + 2.5, h = 3);
        }
        translate([0, 0, largo_rosca]) moleteado(radio_raiz_chico + profundidad_rosca + 2.5, 3, 12);
        translate([0, 0, largo_rosca + 3 - 1.2]) cube([2, radio_raiz_chico * 1.6, 3], center = true);   // ranura para moneda / destornillador
    }
}
// Percha: varilla con gancho arriba y travesaño abajo, se imprime acostada
module percha() {
    e = 6;
    linear_extrude(height = e, center = true) {
        hull() { translate([-eje_percha / 2, 0]) square([eje_percha, largo_percha]); }
        translate([0, largo_percha]) difference() {           // gancho
            hull() { circle(d = eje_percha + 22); translate([0, 4]) circle(d = eje_percha + 22); }
            hull() { circle(d = eje_percha + 7); translate([0, 4]) circle(d = eje_percha + 7); }
            translate([-eje_percha * 2, -(eje_percha + 22)]) square([eje_percha * 2, eje_percha + 22 - 2]);
        }
        translate([-22, -eje_percha]) square([44, eje_percha]);  // travesaño de apoyo
    }
}

// ---- Prueba de rosca ----
module prueba_rosca() {
    // Anillo hembra + espiga macho: imprimí los dos y probá que rosquen bien
    rr = tipo == "apilable" ? radio_raiz_chico : radio_raiz;
    difference() {
        cylinder(r = rr + profundidad_rosca + holgura_rosca + 2.5, h = largo_rosca + 2);
        translate([0, 0, -0.1]) cylinder(r = rr + holgura_rosca, h = largo_rosca + 2.2);
        translate([0, 0, 1]) tornillo(rr, holgura_rosca);   // desplazada: evita caras coplanares
    }
    translate([(rr + profundidad_rosca + 2.5) * 2 + 6, 0, 0]) { tornillo(rr); translate([0, 0, largo_rosca - eps]) cylinder(r = rr + profundidad_rosca + 2.5, h = 3); }
}

// ---- Selección ----
module pesa() { if (tipo == "apilable") disco_apilable(); else cuerpo_colgante(); }
module tapa() { if (tipo == "apilable") tapon_apilable(); else tapa_colgante(); }
if (pieza == "pesa") pesa();
if (pieza == "tapa") tapa();
if (pieza == "todo") { pesa(); translate([diametro + 12, 0, 0]) tapa(); }
if (pieza == "percha") percha();
if (pieza == "prueba_rosca") prueba_rosca();
if (pieza == "conjunto") {
    if (tipo == "apilable") {
        // tres discos apilados en la percha (de pie)
        color("gray") translate([0, 0, eje_percha]) rotate([90, 0, 0]) percha();
        for (i = [0 : 2]) translate([0, 0, eje_percha + i * (altura_api + 0.4)]) rotate([0, 0, i * 120]) {
            disco_apilable();
            color("orange") translate([x_tapon, 0, altura_api - largo_rosca + 0.3]) scale([0.97, 0.97, 1]) tapon_apilable(simple = true);
        }
    } else {
        cuerpo_colgante();
        // la tapa se monta en la misma orientación en que se imprime: rosca dentro de la boca
        // (apenas levantada y más angosta para que no haya caras coincidentes en la vista)
        color("orange") translate([0, 0, altura_col - largo_rosca + 0.4]) scale([0.985, 0.985, 1]) tapa_colgante(simple = true);
    }
}
