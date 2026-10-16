// Plano inclinado / pista inclinada con sensor ultrasónico · cartón encastrable
// La RAMPA mide lo que vale «largo»: ese largo es la hipotenusa de los
// triángulos que la sostienen (o de la pista, si va sobre caballetes). El
// ángulo va de 10° a 80°. Soportes:
//  · triangulos: dos triángulos iguales con el ángulo impreso y un travesaño
//    (rampas cortas, hasta unos 35 cm de base).
//  · caballetes: dos largueros de canto con costillas verticales cada tanto
//    (pistas largas e inclinadas de hasta 1,5 m, con piezas chicas).
//  · auto: triángulos si la base entra en 350 mm, si no caballetes.
// Opcional: un SENSOR ULTRASÓNICO HC-SR04 en lo más alto, al ras de la
// superficie y mirando hacia abajo, para medir la distancia a un carrito o a
// lo que caiga por la rampa; la rampa trae una regla con la distancia a la
// cara del sensor. Opcional: guías laterales para que el carrito no se salga.
// Las piezas largas se reparten solas en hojas A4 (o se descargan en un SVG
// para cortar en láser).

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (las pestañas salen más largas, con sobrante para recortar
// después de armar), laser (medidas exactas, compensa el kerf) o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Rampa] */
// Ángulo de la rampa (grados)
angulo = 20; // [10:1:80]
// Largo de la rampa = hipotenusa de los soportes (mm)
largo = 300; // [150:10:1500]
// Ancho de la rampa (mm)
ancho = 70; // [40:5:150]
// Soportes: triángulos (rampa corta), caballetes (pista larga) o automático
soporte = "auto"; // [auto, triangulos, caballetes]
// Caballetes: distancia entre costillas, medida sobre la rampa (mm)
separacion_costillas = 250; // [120:10:500]

/* [Sensor ultrasónico] */
// Poner un HC-SR04 en lo más alto, al ras de la superficie, mirando hacia abajo
sensor_ultrasonico = false;
// Diámetro de los transductores (HC-SR04: 16 mm)
transductor = 16; // [10:0.5:25]
// Distancia entre centros de los transductores (HC-SR04: 26 mm)
separacion = 26; // [15:0.5:40]

/* [Guías laterales] */
// Agregar dos guías a lo largo de los bordes (pista para carritos)
guias = false;
// Alto de las guías (mm)
alto_guias = 18; // [8:1:40]

/* [Hidden] */
e = espesor;
tw = 16;                                        // ancho de pestañas
gap = e + fb_sobrante() + 10;                   // separación entre piezas en el plano
sal = sensor_ultrasonico ? 28 : 0;              // lo que la rampa sigue por arriba del soporte (sensor)
Lh = largo - sal;                               // hipotenusa de los soportes
h = Lh * sin(angulo);                           // altura del extremo alto
base = Lh * cos(angulo);                        // base
usa_triangulos = soporte == "triangulos" || (soporte == "auto" && base <= 350);
ys = [ancho / 4, 3 * ancho / 4];                // posición de los soportes bajo la rampa (y)
us = [0.2, 0.75];                               // pestañas de los triángulos sobre la hipotenusa
xt = 12;                                        // travesaño: distancia desde el borde vertical (extremo alto)
ht = min(0.6 * h * (1 - xt / base), 120);       // altura del travesaño
// Caballetes
hr = 30;                                        // alto de los largueros (de canto)
z_min = hr + tw + 8;                            // altura mínima de una costilla
n_cost = max(1, floor((h - z_min) / (separacion_costillas * sin(angulo))) + 1);
function s_cost(j) = Lh - j * separacion_costillas;             // posición de la costilla j sobre la rampa
function x_cost(j) = s_cost(j) * cos(angulo);                   // desde el extremo bajo, en la base
function z_cost(j) = s_cost(j) * sin(angulo) - e / 2 * tan(angulo);   // altura de la costilla (toca la rampa por su cara baja)
ext_bajo = min(25, (z_cost(n_cost - 1) - hr - 3) / tan(angulo));
ext_alto = 25;
x_larg = x_cost(n_cost - 1) - ext_bajo;         // comienzo de los largueros
L_larg = x_cost(0) - x_cost(n_cost - 1) + ext_bajo + ext_alto;
// Sensor
x_sen = Lh + 3;                                 // cara del frente del sensor (sobre la rampa, desde abajo)
wf = ancho; hf = transductor + 16;              // frente: ancho y alto
he = 18; be = 16; fr = e / 2 + 3;               // escuadras: alto, profundidad, pico que cruza el frente
y_esc = [4 + e / 2, ancho - 4 - e / 2];         // posición de las escuadras
// Guías
paso_guias = 120;
xg = [for (x = [25 : paso_guias : Lh - 20]) x];
assert(!sensor_ultrasonico || ancho >= 60, "Con sensor la rampa tiene que medir al menos 60 mm de ancho (la placa del HC-SR04 mide 45 mm)");
assert(usa_triangulos || h > z_min, "Pista muy baja para caballetes: subí el ángulo o el largo, o usá triángulos");
echo(str("Rampa de ", largo, " mm a ", angulo, "°: base ", round(base), " mm, altura ", round(h), " mm; soporte ", usa_triangulos ? "triángulos" : str("caballetes (", n_cost, " costillas)")));

// ---------- Rampa ----------
module rampa() difference() {
    rect(largo, ancho, 3);
    if (usa_triangulos) for (u = us, y = ys) translate([u * Lh, y]) ranura_interior(tw + 0.4);
    else for (j = [0 : n_cost - 1], y = ys) translate([s_cost(j), y]) rotate(90) ranura_interior(tw + 0.4, ancho = fb_ranura() / cos(angulo));
    if (sensor_ultrasonico) {
        for (y = [wf / 2 - 18, wf / 2 + 18]) translate([x_sen, y]) rotate(90) ranura_interior(tw + 0.4);
        for (y = y_esc) translate([x_sen + e / 2 + be / 2, y]) ranura_interior(tw + 0.4);
    }
    if (guias) for (x = xg, y = [4 + e / 2, ancho - 4 - e / 2]) translate([x, y]) ranura_interior(tw + 0.4);
    // regla del recorrido desde el extremo bajo
    translate([8, 0]) regla(Lh - 16, cada = 10);
    // regla de distancia a la cara del sensor (crece hacia abajo)
    if (sensor_ultrasonico) translate([x_sen - e / 2, ancho]) rotate(180) regla(x_sen - e / 2 - 12, cada = 10);
    translate([largo / 2, ancho / 2 + (sensor_ultrasonico ? -2 : 4)]) texto(str("PLANO INCLINADO ", angulo, "°"), h = 4, centrado = true);
    if (sensor_ultrasonico) translate([x_sen - 30, ancho / 2 + 6]) texto("SENSOR", h = 3, centrado = true);
}

// ---------- Soporte con triángulos ----------
module triangulo() difference() {
    union() {
        polygon([[0, 0], [base, 0], [0, h]]);
        for (u = us) translate([base - u * Lh * cos(angulo), u * Lh * sin(angulo)])
            rotate(-angulo) pestana(e, tw);
    }
    translate([xt, 0]) ranura(ht / 2);
    translate([base, 0]) arco(min(base, 60) * 0.55, 180 - angulo, 180);
    translate([base - min(base, 60) * 0.55 - 6, 4]) texto(str(angulo, "°"), h = 4, centrado = true);
    translate([8, 6]) texto("PLANO INCLINADO", h = min(3.2, base / 30));
}
module travesano() difference() {
    rect(ancho + 16, ht, 2, center = true);
    for (y = ys) translate([y - ancho / 2, ht / 2]) rotate(180) ranura(ht / 2);
}

// ---------- Soporte con caballetes ----------
module larguero() difference() {
    rect(L_larg, hr, 2);
    for (j = [0 : n_cost - 1]) translate([x_cost(j) - x_larg, hr]) rotate(180) ranura(hr / 2);
    translate([8, 6]) texto(str("LARGUERO ", angulo, "°"), h = 3);
}
module costilla(j) difference() {
    union() {
        rect(ancho, z_cost(j), 2);
        for (y = ys) translate([y, z_cost(j)]) pestana(e / cos(angulo), tw);
    }
    for (y = ys) translate([y, 0]) ranura(hr / 2);
    translate([ancho / 2, z_cost(j) / 2]) texto(str("C", j + 1), h = 4, centrado = true);
}

// ---------- Sensor ultrasónico (frente + 2 escuadras) ----------
module frente() difference() {
    union() {
        rect(wf, hf, 3);
        for (x = [wf / 2 - 18, wf / 2 + 18]) translate([x, 0]) rotate(180) pestana(e, tw);
    }
    for (s = [-1, 1]) translate([wf / 2 + s * separacion / 2, transductor / 2 + 2.5]) agujero(transductor, 0.8);
    translate([wf / 2, hf]) rotate(180) ranura(6, ancho = 12, entrada = 0);   // paso de los pines
    for (y = y_esc) translate([y, 0]) ranura(he / 2);
    translate([wf / 2, hf - 4]) texto("HC-SR04", h = 2.6, centrado = true);
}
module escuadra() difference() {
    union() {
        polygon([[-fr, 0], [be, 0], [-fr, he]]);
        translate([be / 2, 0]) rotate(180) pestana(e, tw);
    }
    translate([0, he]) rotate(180) ranura(he / 2);
}

// ---------- Guías laterales ----------
module guia() difference() {
    union() {
        rect(Lh, alto_guias, 2);
        for (x = xg) translate([x, 0]) rotate(180) pestana(e, tw);
    }
    translate([Lh / 2, alto_guias / 2]) texto("GUIA", h = min(3, alto_guias - 4), centrado = true);
}

// ---------- Plano de corte ----------
module plano() {
    rampa();
    y1 = ancho + gap;
    if (usa_triangulos) {
        translate([0, y1]) triangulo();
        translate([2 * base + 12, y1 + h]) rotate(180) triangulo();
        translate([2 * base + 20 + (ancho + 16) / 2, y1 + ht / 2 + 2]) travesano();
    } else {
        translate([0, y1]) larguero();
        translate([0, y1 + hr + gap]) larguero();
        for (j = [0 : n_cost - 1]) translate([j * (ancho + gap), y1 + 2 * (hr + gap)]) costilla(j);
    }
    y2 = y1 + (usa_triangulos ? h + gap : 2 * (hr + gap) + z_cost(0) + gap + e + fb_sobrante());
    if (sensor_ultrasonico) {
        translate([0, y2]) frente();
        translate([wf + gap + fr, y2]) escuadra();
        translate([wf + gap + fr + be + fr + 8, y2]) escuadra();
    }
    y3 = y2 + (sensor_ultrasonico ? hf + gap : 0);
    if (guias) for (k = [0, 1]) translate([0, y3 + k * (alto_guias + gap)]) guia();
}

// ---------- Armado ----------
module armado() {
    // soportes
    if (usa_triangulos) {
        for (y = ys) translate([0, y, 0]) laja_xz() triangulo();
        translate([xt, ancho / 2, ht / 2]) laja_yz() travesano();
    } else {
        for (y = ys) translate([base - x_larg - L_larg, y, 0]) laja_xz() larguero();
        for (j = [0 : n_cost - 1]) translate([base - x_cost(j), 0, 0]) laja_yz() costilla(j);
    }
    // rampa (su x va del extremo bajo al alto) con el sensor y las guías montados encima
    translate([base, 0, 0]) rotate([0, angulo, 0]) rotate([0, 0, 180]) translate([0, -ancho, 0]) {
        translate([0, 0, e / 2]) laja() rampa();
        if (sensor_ultrasonico) {
            translate([x_sen, 0, e]) laja_yz() frente();
            for (y = y_esc) translate([x_sen, y, e]) laja_xz() escuadra();
        }
        if (guias) for (y = [4 + e / 2, ancho - 4 - e / 2]) translate([0, y, e]) laja_xz() guia();
    }
}
