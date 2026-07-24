// ============= PIE PARA VARILLA =============
// Base pesada con alojamiento vertical y tornillo
// prisionero para fijar una varilla de soporte.

/* [Pie] */
// Diámetro de la base (mm)
diametro_base = 80; // [40:170]
// Altura de la base (mm)
altura_base = 10; // [6:25]
// Diámetro de la varilla (mm)
diametro_varilla = 12.5; // [4:0.5:30]
// Altura del cubo portavarilla (mm)
altura_cubo = 30; // [15:70]
// Espesor de pared del cubo (mm)
pared = 8; // [4:18]
// Diámetro del tornillo prisionero (mm)
prisionero = 4; // [2:8]

/* [Calidad] */
// Resolución de las curvas
resolucion = 96; // [24:160]

/* [Hidden] */
$fn = resolucion;
d_cubo = diametro_varilla + 2 * pared;

difference() {
    union() {
        // Base con borde achaflanado
        cylinder(h = altura_base, d1 = diametro_base,
                 d2 = max(diametro_base - 2 * altura_base, d_cubo));
        // Cubo portavarilla
        cylinder(h = altura_base + altura_cubo, d = d_cubo);
    }
    // Alojamiento de la varilla (ciego)
    translate([0, 0, altura_base / 2])
        cylinder(h = altura_base / 2 + altura_cubo + 1, d = diametro_varilla);
    // Tornillo prisionero
    translate([0, 0, altura_base + altura_cubo / 2])
        rotate([0, 90, 0])
            cylinder(h = d_cubo, d = prisionero);
}
