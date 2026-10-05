// ================== BASE TRÍPODE HUECA PARA ARENA, CON TAPÓN ROSCADO ==================
// Base trípode para soporte universal, hueca: se rellena con arena por una
// boca roscada en uno de los pies para ganar masa y estabilidad. Incluye el
// tapón roscado (rosca gruesa propia, no normalizada), un anillo de prueba
// de la rosca y vistas de corte y de la cavidad.
// Prototipo: no ensayado físicamente. Las cámaras son vacíos del CAD: NO se
// rellenan con el infill del laminador. Imprimir la base con las patas sobre
// la cama; el tapón tal como aparece (cabeza plana abajo, rosca hacia arriba).
// Imprimí primero «prueba_rosca» para verificar el ajuste del tapón.

/* [Vista / exportación] */
// Qué pieza se renderiza y exporta
pieza = "base"; // [base, tapon, conjunto, corte, cavidad, prueba_rosca]

/* [Base] */
// Centro de la base al centro de cada apoyo (mm)
radio_patas = 100; // [60:5:180]
// Diámetro de los pies (mm)
diametro_pies = 30; // [20:1:50]
// Altura de los pies (mm)
altura_pies = 28; // [16:1:45]
// Diámetro del cubo central (mm)
diametro_centro = 44; // [36:1:80]
// Altura del cubo central (mm)
altura_centro = 44; // [30:1:80]
// Espesor de pared de las cámaras (mm)
pared = 2; // [2:0.5:3]
// Ancho del brazo en la raíz (mm)
ancho_brazo_raiz = 30; // [20:1:50]
// Ancho del brazo en la punta (mm)
ancho_brazo_punta = 20; // [14:1:40]
// Altura del brazo en la raíz (mm)
altura_brazo_raiz = 36; // [20:1:60]
// Altura del brazo en la punta (mm)
altura_brazo_punta = 28; // [16:1:45]

/* [Varilla y ajuste M6] */
// Diámetro de la varilla (mm)
diametro_varilla = 12; // [6:0.5:25]
// Holgura diametral (se suma una sola vez al diámetro) (mm)
holgura_diametral = 0.4; // [0:0.1:1.5]
// Fondo del alojamiento de la varilla (agujero ciego) (mm)
fondo_alojamiento = 4; // [2:1:12]
// Altura del eje del tornillo M6 (mm)
altura_tornillo = 32; // [26:1:70]
// Ángulo del tornillo: 30° queda entre las patas de 330° y 90° (grados)
angulo_sujecion = 30; // [0:5:355]
// Tuerca M6: entre caras, incluida holgura (mm)
tuerca_ancho = 10.4; // [8:0.1:14]
// Tuerca M6: espesor, incluida holgura (mm)
tuerca_espesor = 5.6; // [4:0.1:8]
// Cara interior de la ranura de la tuerca, desde el eje (mm)
tuerca_x = 12; // [8:0.5:25]
// Tuerca metálica M6: insertar por arriba, con una punta abajo.
// El agujero lateral es de paso; la rosca la proporciona la tuerca M6.

/* [Carga de arena] */
// Ángulo de la pata que lleva la boca de carga (90, 210 o 330) (grados)
angulo_carga = 90; // [90, 210, 330]
// Diámetro del cuello de la boca (mm)
diametro_cuello = 26; // [22:1:36]
// Altura del cuello sobre el pie (mm)
altura_cuello = 11; // [6:1:20]

/* [Rosca del tapón] */
// Paso de la rosca (mm)
paso_rosca = 3.4; // [2:0.1:5]
// Largo de la rosca (mm)
largo_rosca = 10.2; // [6:0.1:16]
// Radio de raíz de la rosca (mm)
radio_raiz = 8; // [6:0.5:12]
// Profundidad del filete (mm)
profundidad_rosca = 1.1; // [0.6:0.1:1.8]
// Holgura radial de la rosca (0,30 radial = 0,60 diametral) (mm)
holgura_rosca = 0.30; // [0.1:0.05:0.6]

/* [Hidden] */
$fn = 72;
eps = 0.02;
agujero = diametro_varilla + holgura_diametral;
radio_manguito = agujero/2 + 4.8;
top_cuello = altura_pies + altura_cuello;
assert(pared >= 2 && pared <= 3);
assert(radio_manguito < diametro_centro/2 - pared - 3);
assert(altura_tornillo - tuerca_ancho/sqrt(3) > 23.5);

// ---------- Base ----------
module en_boca() {
    rotate([0,0,angulo_carga]) translate([radio_patas,0,0]) children();
}
module exterior() {
    union() {
        cylinder(d=diametro_centro,h=altura_centro);
        for(a=[90,210,330]) rotate([0,0,a]) {
            hull() {
                translate([14,0,0]) cylinder(d=ancho_brazo_raiz,h=altura_brazo_raiz);
                translate([radio_patas,0,0]) cylinder(d=ancho_brazo_punta,h=altura_brazo_punta);
            }
            translate([radio_patas,0,0]) cylinder(d=diametro_pies,h=altura_pies);
        }
        en_boca() translate([0,0,altura_pies-0.1])
            cylinder(d=diametro_cuello,h=altura_cuello+0.1);
    }
}
// Sección de cavidad en forma de casa: paredes verticales + techo a 45 grados.
module seccion(x,ancho,cima) {
    w=ancho/2;
    translate([x,0,0]) rotate([90,0,90]) linear_extrude(height=0.05)
        polygon([[-w,pared],[w,pared],[w,cima-w],[0,cima],[-w,cima-w]]);
}
module camaras() {
    difference() {
        union() {
            // Anillo comunicante; techo de dos pendientes a 45 grados.
            rotate_extrude() polygon([
                [radio_manguito,pared],[diametro_centro/2-pared,pared],
                [diametro_centro/2-pared,18],
                [(radio_manguito+diametro_centro/2-pared)/2,
                 18+(diametro_centro/2-pared-radio_manguito)/2],
                [radio_manguito,18]]);
            for(a=[90,210,330]) rotate([0,0,a]) {
                hull() {
                    seccion(14,ancho_brazo_raiz-2*pared,altura_brazo_raiz-2*pared);
                    seccion(radio_patas,ancho_brazo_punta-2*pared,altura_brazo_punta-2*pared);
                }
                translate([radio_patas,0,pared]) {
                    cylinder(r=diametro_pies/2-pared,h=10-pared);
                    translate([0,0,10-pared-eps])
                        cylinder(r1=diametro_pies/2-pared,r2=0,
                                 h=diametro_pies/2-pared);
                }
            }
        }
        // Aislar la arena del alojamiento de la varilla, con pared reforzada.
        translate([0,0,-1]) cylinder(r=radio_manguito,h=altura_centro+2);
    }
}
module alojamiento_tuerca() {
    translate([tuerca_x,0,altura_tornillo]) rotate([0,90,0])
        cylinder(d=tuerca_ancho/cos(30),h=tuerca_espesor,$fn=6);
    translate([tuerca_x,-tuerca_ancho/2,altura_tornillo])
        cube([tuerca_espesor,tuerca_ancho,altura_centro-altura_tornillo+eps]);
}
module paso_m6() {
    // Techo en gota a 45 grados: reduce el puente del taladro horizontal.
    rotate([0,90,0]) linear_extrude(height=radio_patas+diametro_pies)
        hull() {
            circle(d=6.6);
            translate([-4.65,0]) circle(r=0.02,$fn=12);
        }
}
module base_tripode() {
    difference() {
        exterior();
        camaras();
        translate([0,0,fondo_alojamiento]) cylinder(d=agujero,h=altura_centro);
        translate([0,0,altura_centro-0.8]) cylinder(d1=agujero,d2=agujero+1.6,h=0.82);
        rotate([0,0,angulo_sujecion]) {
            translate([0,0,altura_tornillo]) paso_m6();
            alojamiento_tuerca();
        }
        en_boca() {
            // Conducto vertical que desemboca dentro del depósito del pie.
            translate([0,0,pared+0.2]) cylinder(r=radio_raiz+holgura_rosca,
                                              h=top_cuello);
            translate([0,0,top_cuello-largo_rosca]) tornillo_tapon(holgura_rosca);
            translate([0,0,top_cuello-0.7])
                cylinder(r1=8.3,r2=9.5,h=0.72);
        }
    }
}
module prueba_rosca() {
    // Anillo de prueba pequeño: imprimir antes que la base completa.
    difference() {
        cylinder(d=diametro_cuello,h=largo_rosca);
        translate([0,0,-0.1]) cylinder(r=radio_raiz+holgura_rosca,h=largo_rosca+0.2);
        tornillo_tapon(holgura_rosca);
    }
}
module tapon_montado() {
    en_boca() translate([0,0,top_cuello+4]) rotate([180,0,0]) tapon();
}

// ---------- Tapón (rosca gruesa propia, no normalizada) ----------
module perfil_rosca(extra=0) {
    n=64; vueltas=ceil(largo_rosca/paso_rosca)+2;
    perfil=[[radio_raiz+extra-0.15,-1.25-extra/2],
            [radio_raiz+extra+profundidad_rosca,-0.15-extra/2],
            [radio_raiz+extra+profundidad_rosca,0.15+extra/2],
            [radio_raiz+extra-0.15,1.25+extra/2]];
    puntos=[for(i=[0:vueltas*n]) for(q=perfil)
        let(a=-360+360*i/n)
        [q[0]*cos(a),q[0]*sin(a),paso_rosca*a/360+q[1]]];
    caras=concat([[0,1,2,3]],
        [for(i=[0:vueltas*n-1]) for(j=[0:3]) for(k=[0:1])
          k==0 ? [4*i+j,4*(i+1)+j,4*(i+1)+(j+1)%4] :
                 [4*i+j,4*(i+1)+(j+1)%4,4*i+(j+1)%4]],
        [[for(j=[3:-1:0]) 4*vueltas*n+j]]);
    intersection() {
        polyhedron(points=puntos,faces=caras,convexity=20);
        translate([-15,-15,0]) cube([30,30,largo_rosca]);
    }
}
module tornillo_tapon(extra=0) {
    union() {
        cylinder(r=radio_raiz+extra,h=largo_rosca);
        perfil_rosca(extra);
    }
}
module tapon() {
    // Imprimir tal como aparece: cabeza plana abajo, rosca hacia arriba.
    difference() {
        union() {
            cylinder(d=28,h=4);
            translate([0,0,3.99]) tornillo_tapon();
        }
        for(a=[0:30:330]) rotate([0,0,a])
            translate([14.4,0,-0.1]) cylinder(d=3,h=4.2,$fn=24);
        // Chaflán en la punta para iniciar la rosca.
        translate([0,0,4+largo_rosca-0.8]) difference() {
            cylinder(r=12,h=1);
            cylinder(r1=9.3,r2=7.6,h=1.01);
        }
    }
}

// ---------- Selección de pieza ----------
if(pieza=="base") base_tripode();
if(pieza=="tapon") tapon();
if(pieza=="conjunto") {base_tripode(); color("orange") tapon_montado();}
if(pieza=="cavidad") camaras();
if(pieza=="prueba_rosca") prueba_rosca();
if(pieza=="corte") difference() {
    base_tripode();
    translate([-200,-200,-1]) cube([200,400,100]);
}
