// ================== POLEA ==================
// Polea con garganta para cordel, para montar
// sobre un eje o tornillo.

/* [Dimensiones] */
// Diámetro exterior (mm)
diametro_exterior = 50; // [20:150]
// Altura de la polea (mm)
altura = 12; // [6:40]
// Diámetro del agujero del eje (mm)
diametro_eje = 8; // [2:25]
// Profundidad de la garganta (mm)
garganta = 4; // [1:12]

/* [Aligerado] */
// Cantidad de agujeros de aligeramiento
agujeros = 6; // [0:12]

/* [Calidad] */
// Resolución de las curvas (más = más suave y más lento)
resolucion = 90; // [24:160]

/* [Hidden] */
$fn = resolucion;
r_ext = diametro_exterior / 2;
r_medio = (r_ext - garganta + diametro_eje / 2) / 2;
d_alig = (r_ext - garganta - diametro_eje / 2) * 0.45;

difference() {
    cylinder(h = altura, r = r_ext, center = true);
    // Agujero del eje
    cylinder(h = altura + 2, d = diametro_eje, center = true);
    // Garganta para el cordel
    rotate_extrude()
        translate([r_ext, 0, 0])
            circle(r = garganta);
    // Agujeros de aligeramiento
    if (agujeros > 0 && d_alig > 2)
        for (i = [0 : agujeros - 1])
            rotate([0, 0, i * 360 / agujeros])
                translate([r_medio, 0, 0])
                    cylinder(h = altura + 2, d = d_alig, center = true);
}
