// Peine de prueba de ajuste · imprimilo primero
// Tiene ranuras de distinto ancho alrededor del grosor de tu cartón.
// Probá cuál encastra justo con un recorte de cartón y usá ese valor como
// «holgura» en los demás diseños. 1 pieza.

/* [Cartón] */
// Grosor del cartón (mm)
espesor = 3; // [1:0.5:8]
holgura = 0; // [-0.6:0.1:0.8]

/* [Peine] */
// Cantidad de ranuras de prueba
ranuras = 5; // [3:1:9]
// Diferencia de ancho entre ranuras vecinas (mm)
paso = 0.2; // [0.1:0.05:0.5]

module plano() peine_ajuste(ranuras, paso, 18);
module armado() laja() peine_ajuste(ranuras, paso, 18);
