// ============ SOPORTE DE VARILLA ============
// Abrazadera partida con base atornillable para
// sujetar una varilla vertical de laboratorio.

/* [Varilla] */
// Diámetro de la varilla (mm)
diametro_varilla = 12.5; // [4:0.5:30]
// Altura de la abrazadera (mm)
altura_abrazadera = 25; // [10:60]
// Espesor de pared alrededor de la varilla (mm)
pared = 6; // [3:15]
// Ancho de la ranura de apriete (mm)
ranura = 3; // [1:8]
// Diámetro del tornillo de apriete (mm)
tornillo_apriete = 4; // [2:8]

/* [Base] */
// Largo de la base (mm)
base_largo = 70; // [40:140]
// Ancho de la base (mm)
base_ancho = 30; // [20:60]
// Espesor de la base (mm)
base_espesor = 6; // [4:15]
// Diámetro de los tornillos de fijación (mm)
tornillo_base = 5; // [3:8]

/* [Calidad] */
// Resolución de las curvas
resolucion = 64; // [24:160]

/* [Hidden] */
$fn = resolucion;
d_ext = diametro_varilla + 2 * pared;

// Base con agujeros de fijación
difference() {
    translate([0, 0, base_espesor / 2])
        cube([base_largo, base_ancho, base_espesor], center = true);
    for (x = [-1, 1])
        translate([x * (base_largo / 2 - tornillo_base * 1.6), 0, base_espesor / 2])
            cylinder(h = base_espesor + 2, d = tornillo_base, center = true);
}

// Abrazadera partida
translate([0, 0, base_espesor])
difference() {
    cylinder(h = altura_abrazadera, d = d_ext);
    // Alojamiento de la varilla (apoya sobre la base)
    translate([0, 0, -1])
        cylinder(h = altura_abrazadera + 2, d = diametro_varilla);
    // Ranura de apriete
    translate([0, d_ext / 2, altura_abrazadera / 2])
        cube([ranura, d_ext, altura_abrazadera + 2], center = true);
    // Tornillo de apriete, atraviesa la ranura
    translate([0, diametro_varilla / 2 + pared / 2, altura_abrazadera / 2])
        rotate([0, 90, 0])
            cylinder(h = d_ext + 2, d = tornillo_apriete, center = true);
}
