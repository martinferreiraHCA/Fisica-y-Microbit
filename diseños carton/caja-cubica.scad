// Caja cúbica encastrable con agujeros (cámara oscura, mirilla, caja de luz) · cartón
// Cubo cerrado de 10 × 10 × 10 cm por defecto. Las seis caras se unen entre
// sí por DIENTES encastrados (uniones dentadas) en las doce aristas: cada
// cara tiene dientes que entran en los huecos de la cara vecina, sin
// pegamento; en cartón los dientes salen un poco de más y se recortan al
// ras después de armar. La tapa entra igual y se puede sacar.
// En cada una de las seis caras podés abrir un agujero redondo con el
// diámetro y la posición que quieras: uno de 25–30 mm para apoyar el OJO
// (mirilla), uno de 1–2 mm como estenopo (cámara oscura), uno para una
// lente, un LED o un sensor… Cada agujero lleva impreso su diámetro.
// 6 piezas: frente, atrás, izquierda, derecha, base y tapa.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
// Ancho extra de las ranuras (mm): + más flojo, − más apretado
holgura = 0; // [-0.6:0.1:0.8]
// Material: carton (pestañas con sobrante), laser o impresion3d
material = "carton"; // [carton, laser, impresion3d]

/* [Caja] */
// Lado exterior del cubo (mm)
lado = 100; // [40:5:300]
// Incluir la tapa (si no, queda abierta por arriba)
con_tapa = true;
// Cantidad de dientes por arista (impar; 0 = automático, de unos 18 mm cada uno)
dientes = 0; // [0:1:15]

/* [Agujero del frente] */
// Diámetro (mm; 0 = sin agujero). 25–30 mm para el ojo
agujero_frente = 28; // [0:0.5:120]
// Posición en la cara (mirando la caja desde afuera)
posicion_frente = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de atrás] */
// Diámetro (mm; 0 = sin agujero). 1–2 mm para un estenopo
agujero_atras = 0; // [0:0.5:120]
posicion_atras = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de la izquierda] */
agujero_izquierda = 0; // [0:0.5:120]
posicion_izquierda = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de la derecha] */
agujero_derecha = 0; // [0:0.5:120]
posicion_derecha = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de la tapa] */
agujero_tapa = 0; // [0:0.5:120]
// arriba = hacia atrás, derecha = hacia la derecha (vista desde arriba)
posicion_tapa = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Agujero de la base] */
agujero_base = 0; // [0:0.5:120]
posicion_base = "centro"; // [centro, arriba, abajo, izquierda, derecha]

/* [Hidden] */
e = espesor;
Li = lado - 2 * e;                       // cuerpo de cada cara (cuadrado interior, sin los dientes)
n_auto = max(3, 2 * floor(Li / 36) + 1);  // dientes de ~18 mm, cantidad impar
n = dientes > 0 ? (dientes % 2 == 1 ? dientes : dientes + 1) : n_auto;
w = Li / n;                               // ancho de cada diente
hj = fb_holgura() - fb_kerf();            // los dientes salen más angostos que los huecos
sal = e + fb_sobrante();                  // lo que sobresale cada diente (en cartón, con sobrante para recortar)
assert(Li > 3 * 8, "El cubo es muy chico para ese espesor de cartón");

// Dientes de una arista (la de abajo del dibujo, y = 0): los segmentos pares o los impares
module dientes_borde(pares) {
    for (k = [0 : n - 1]) if ((k % 2 == 0) == pares)
        translate([k * w + hj / 2, -sal]) square([w - hj, sal + 0.01]);
}
// Cara: cuadrado Li × Li con dientes en sus 4 bordes (abajo, derecha, arriba, izquierda).
// par[i] = true → esa arista lleva los dientes pares (la cara vecina lleva los impares).
// Donde dos aristas pares se juntan, la esquina se rellena (así el cubo no queda con huecos).
module cara(par) {
    union() {
        square([Li, Li]);
        for (i = [0 : 3]) translate([Li / 2, Li / 2]) rotate(i * 90) translate([-Li / 2, -Li / 2]) {
            dientes_borde(par[i]);
            if (par[i] && par[(i + 1) % 4]) translate([Li - w / 2, -sal]) square([w / 2 + sal, sal + w / 2]);
        }
    }
}
// Desplazamiento del agujero según la posición pedida; der = +1 si la x del dibujo
// es la derecha de quien mira la cara desde afuera, −1 si es la izquierda
function desp(pos, der) =
    pos == "arriba" ? [0, Li / 4] : pos == "abajo" ? [0, -Li / 4] :
    pos == "izquierda" ? [-der * Li / 4, 0] : pos == "derecha" ? [der * Li / 4, 0] : [0, 0];
// Agujero con su diámetro impreso al lado (y un aro de tinta para ubicarlo)
module agujero_cara(d, c) {
    if (d > 0) translate(c) {
        circle(d = d);
        marca() difference() { circle(d = d + 3); circle(d = d + 2); }
        translate([0, -d / 2 - 5.5]) texto(str("O", d), h = 3, centrado = true);
    }
}
function cabe(d, c) = d <= 0 || (c[0] - d / 2 >= 4 && c[0] + d / 2 <= Li - 4 && c[1] - d / 2 >= 4 && c[1] + d / 2 <= Li - 4);

// Una cara completa con su agujero y su nombre impreso
module cara_con_agujero(nombre, par, d, pos, der) {
    c = [Li / 2, Li / 2] + desp(pos, der);
    assert(cabe(d, c), str("El agujero de ", nombre, " no entra en la cara: achicá el diámetro o cambiá la posición"));
    difference() {
        cara(par);
        agujero_cara(d, c);
        translate([Li / 2, 7]) texto(nombre, h = 3.2, centrado = true);
    }
}
// Reparto de los dientes: frente y atrás llevan los pares en sus 4 aristas (y rellenan las
// esquinas); izquierda y derecha, pares arriba y abajo e impares en las verticales;
// base y tapa, impares en todo. Así cada arista junta una cara par con una impar.
P_FA = [true, true, true, true];
P_ID = [true, false, true, false];
P_BT = [false, false, false, false];
module frente()    cara_con_agujero("FRENTE", P_FA, agujero_frente, posicion_frente, 1);
module atras()     cara_con_agujero("ATRAS", P_FA, agujero_atras, posicion_atras, 1);
module izquierda() cara_con_agujero("IZQUIERDA", P_ID, agujero_izquierda, posicion_izquierda, -1);
module derecha()   cara_con_agujero("DERECHA", P_ID, agujero_derecha, posicion_derecha, -1);
module base()      cara_con_agujero("BASE", P_BT, agujero_base, posicion_base, 1);
module tapa()      cara_con_agujero("TAPA", P_BT, agujero_tapa, posicion_tapa, 1);

module plano() {
    paso = Li + 2 * sal + 6;
    pieza("frente") translate([sal, sal]) frente();
    pieza("derecha") translate([sal + paso, sal]) derecha();
    pieza("atras") translate([sal, sal + paso]) atras();
    pieza("izquierda") translate([sal + paso, sal + paso]) izquierda();
    pieza("base") translate([sal, sal + 2 * paso]) base();
    if (con_tapa) pieza("tapa") translate([sal + paso, sal + 2 * paso]) tapa();
}
module armado() {
    translate([-Li / 2, -Li / 2, e / 2]) laja() base();
    if (con_tapa) translate([-Li / 2, -Li / 2, lado - e / 2]) laja() tapa();
    translate([-Li / 2, -lado / 2 + e / 2, e]) laja_xz() frente();
    translate([Li / 2, lado / 2 - e / 2, e]) rotate([0, 0, 180]) laja_xz() atras();
    translate([lado / 2 - e / 2, -Li / 2, e]) laja_yz() derecha();
    translate([-lado / 2 + e / 2, Li / 2, e]) rotate([0, 0, 180]) laja_yz() izquierda();
}
