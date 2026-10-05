// ================== BASE TRÍPODE ==================
// Base trípode para soporte universal: tres patas con pies de apoyo y un
// cubo central con alojamiento ciego para la varilla (metálica, no se
// imprime) y sujeción opcional con tuerca y tornillo M6.
// Interpretación de una fotografía; dimensiones propuestas, no medidas del
// original. Imprimir con las tres patas sobre la cama. Prototipo sin ensayo
// de carga: la estabilidad depende de masa, altura y carga.

/* [Dimensiones principales] */
// Centro de la base al centro de cada apoyo (mm)
radio_patas = 100; // [60:5:180]
// Diámetro de los pies (mm)
diametro_pies = 30; // [15:1:50]
// Altura de los pies (mm)
altura_pies = 15; // [6:1:30]
// Diámetro del cubo central (mm)
diametro_centro = 44; // [30:1:80]
// Altura del cubo central (mm)
altura_centro = 32; // [20:1:70]
// Ancho del brazo en la raíz (mm)
ancho_brazo_raiz = 30; // [15:1:50]
// Ancho del brazo en la punta (mm)
ancho_brazo_punta = 20; // [10:1:40]
// Altura del brazo en la raíz (mm)
altura_brazo_raiz = 28; // [12:1:50]
// Altura del brazo en la punta (mm)
altura_brazo_punta = 12; // [6:1:30]
// Despeje de los brazos: solo los tres pies apoyan en la mesa (mm)
despeje_brazos = 2; // [0:0.5:6]

/* [Varilla] */
// Diámetro de la varilla (mm)
diametro_varilla = 12; // [6:0.5:25]
// Holgura diametral (se suma una sola vez al diámetro) (mm)
holgura_diametral = 0.4; // [0:0.1:1.5]
// Fondo del alojamiento (agujero ciego, con fondo) (mm)
fondo_alojamiento = 4; // [2:1:12]

/* [Sujeción M6 opcional] */
// Agregar alojamiento de tuerca y paso de tornillo M6
sujecion_m6 = true;
// Diámetro de paso del tornillo (mm)
diametro_paso_tornillo = 6.6; // [5:0.1:9]
// Altura del eje del tornillo (mm)
altura_tornillo = 20; // [10:1:50]
// Ángulo del tornillo: 30° queda entre las patas de 330° y 90° (grados)
angulo_sujecion = 30; // [0:5:355]
// Tuerca: entre caras, incluida holgura (mm)
tuerca_ancho = 10.4; // [8:0.1:14]
// Tuerca: espesor, incluida holgura (mm)
tuerca_espesor = 5.6; // [4:0.1:8]
// Cara interior de la ranura de la tuerca, desde el eje (mm)
tuerca_x = 12; // [8:0.5:25]
// Insertar una tuerca M6 desde arriba, con eje horizontal y un vértice abajo.
// El fondo hexagonal la centra frente al paso del tornillo.
// Introducir un tornillo M6 desde el lateral hasta sujetar la varilla.
// El orificio impreso es de paso; la rosca la aporta la tuerca metálica.
// Elegir largo según cabeza/arandela; M6x20 es un punto de partida.
// Los parámetros M6 son independientes: revisar al cambiar diametro_centro.

/* [Vista] */
// Mostrar la varilla (solo vista previa en OpenSCAD de escritorio; nunca va al STL)
mostrar_varilla = false;
// Altura de la varilla en la vista previa (mm)
altura_varilla_vista = 130; // [50:10:300]

/* [Hidden] */
$fn = 96;
eps = 0.02;
agujero = diametro_varilla + holgura_diametral;

assert(radio_patas > diametro_centro/2 + diametro_pies/2);
assert(agujero < diametro_centro-8);
assert(fondo_alojamiento > despeje_brazos);
assert(altura_centro > fondo_alojamiento+5);
assert(altura_brazo_punta > despeje_brazos);
assert(!sujecion_m6 || (tuerca_x > agujero/2+2 &&
       tuerca_x+tuerca_espesor < diametro_centro/2-2));
assert(!sujecion_m6 || (altura_tornillo-tuerca_ancho/sqrt(3) > fondo_alojamiento));
assert(!sujecion_m6 || (altura_tornillo+tuerca_ancho/sqrt(3) < altura_centro));
assert(!sujecion_m6 ||
       sqrt(pow(tuerca_x+tuerca_espesor,2)+pow(tuerca_ancho/2,2))
       < diametro_centro/2-2);

module alojamiento_tuerca() {
    // Eje del hexágono sobre X, coaxial con el tornillo lateral.
    // En esta orientación hay dos caras verticales y un vértice abajo.
    translate([tuerca_x,0,altura_tornillo])
        rotate([0,90,0])
            cylinder(d=tuerca_ancho/cos(30),h=tuerca_espesor,$fn=6);
    // Canal de carga: SOLO desde el eje hacia arriba.
    // No cortar el asiento inferior inclinado que posiciona la tuerca.
    translate([tuerca_x,-tuerca_ancho/2,altura_tornillo])
        cube([tuerca_espesor,tuerca_ancho,
              altura_centro-altura_tornillo+eps]);
}

module pata() {
    // Dos secciones enlazadas: brazo macizo con pendiente superior.
    hull() {
        translate([diametro_centro/2-8,0,despeje_brazos])
            cylinder(d=ancho_brazo_raiz,
                     h=altura_brazo_raiz-despeje_brazos);
        translate([radio_patas,0,despeje_brazos])
            cylinder(d=ancho_brazo_punta,
                     h=altura_brazo_punta-despeje_brazos);
    }
    translate([radio_patas,0,0])
        cylinder(d=diametro_pies,h=altura_pies);
}

module base_tripode() {
    difference() {
        union() {
            translate([0,0,despeje_brazos])
                cylinder(d=diametro_centro,h=altura_centro-despeje_brazos);
            for(a=[90,210,330]) rotate([0,0,a]) pata();
        }
        translate([0,0,fondo_alojamiento])
            cylinder(d=agujero,h=altura_centro+eps);
        // Chaflán de entrada de 0.8 mm.
        translate([0,0,altura_centro-0.8])
            cylinder(d1=agujero,d2=agujero+1.6,h=0.8+eps);
        if(sujecion_m6) rotate([0,0,angulo_sujecion]) {
            // Taladrar hasta FUERA del conjunto, no solo hasta el radio
            // del cilindro central: los brazos pueden tapar esa salida.
            translate([0,0,altura_tornillo]) rotate([0,90,0])
                cylinder(d=diametro_paso_tornillo,
                         h=radio_patas+diametro_pies+diametro_centro);
            alojamiento_tuerca();
        }
    }
}

base_tripode();
if(mostrar_varilla && $preview)
    %translate([0,0,fondo_alojamiento])
        cylinder(d=diametro_varilla,h=altura_varilla_vista);
