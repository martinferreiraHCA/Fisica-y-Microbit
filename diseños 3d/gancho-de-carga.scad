// ============== GANCHO DE CARGA ==============
// Gancho con ojal superior para colgar pesas o
// engancharlo a un dinamómetro.

/* [Gancho] */
// Diámetro interior del gancho (mm)
diametro_gancho = 22; // [10:60]
// Grosor del material (mm)
grosor = 5; // [3:14]
// Largo del vástago recto (mm)
vastago = 30; // [10:90]
// Diámetro interior del ojal de colgado (mm)
ojal = 8; // [4:24]
// Apertura de la boca del gancho (grados)
apertura = 75; // [30:150]

/* [Calidad] */
// Resolución de las curvas
resolucion = 64; // [24:160]

/* [Hidden] */
$fn = resolucion;
rg = diametro_gancho / 2;
barrido = 360 - apertura;

rotate([90, 0, 0])  // Ponerlo de pie
union() {
    // Curva del gancho
    rotate([0, 0, 90 - barrido])
        rotate_extrude(angle = barrido)
            translate([rg, 0, 0])
                circle(d = grosor);
    // Punta redondeada
    rotate([0, 0, 90 - barrido])
        translate([rg, 0, 0])
            sphere(d = grosor);
    // Vástago recto
    translate([0, rg, 0])
        rotate([-90, 0, 0])
            cylinder(h = vastago + 0.1, d = grosor);
    // Ojal de colgado
    translate([0, rg + vastago + ojal / 2, 0])
        rotate_extrude()
            translate([(ojal + grosor) / 2, 0, 0])
                circle(d = grosor);
}
