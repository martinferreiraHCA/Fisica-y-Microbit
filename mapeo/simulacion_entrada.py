# Simulación del error de lectura de P1 con una fuente de alta resistencia (la punta en el agua).
#
# V1 (nRF51822): modelo de Nordic ("Determining capacitor size ... nRF51 ADC voltage divider"):
#   fuera de la conversión la entrada es un circuito abierto; durante la conversión (68 us a 10 bits)
#   es R_AIN (389,2 kOhm con prescaler 1/3, el que usa la micro:bit) hacia una tensión interna U.
#   U no está documentada para esta configuración: se prueban 0 V y media escala.
# V2 (nRF52833): capacitor de muestreo de 2,5 pF (máximo de la hoja de datos) que se conecta 3 us
#   (TACQ que fija CODAL). Peor caso: el capacitor arranca descargado en cada muestra.
# En las dos: resistencia externa fija de 10 MOhm de P1 a 3V (la del sensor táctil de los anillos).
import math

VDD = 3.3
RPU = 10e6


def paso(v, t, C, ramas):
    """Avanza t segundos un nodo con capacidad C conectado a ramas [(tension, resistencia)]. Solución exacta."""
    g = sum(1.0 / r for _, r in ramas)
    veq = sum(u / r for u, r in ramas) / g
    tau = C / g
    v1 = veq + (v - veq) * math.exp(-t / tau)
    medio = veq + (v - veq) * tau / t * (1 - math.exp(-t / tau))  # promedio en el intervalo
    return v1, medio


def v1_lectura(vs, rs, cext, u, pausa, n=20, rain=389.2e3, tconv=68e-6, cpar=100e-12):
    C = cpar + cext
    fuera = [(vs, rs), (VDD, RPU)]
    dentro = fuera + [(u, rain)]
    v = sum(x / r for x, r in fuera) / sum(1 / r for _, r in fuera)  # reposo: la punta ya está apoyada
    lect = []
    for _ in range(n):
        v, medio = paso(v, tconv, C, dentro)
        lect.append(medio)
        v, _ = paso(v, pausa, C, fuera)
    return sum(lect) / n


def v2_lectura(vs, rs, cext, fs=11000.0, cs=2.5e-12, tacq=3e-6, cpar=100e-12, n=4000, descarga=True):
    C = cpar + cext
    fuera = [(vs, rs), (VDD, RPU)]
    v = sum(x / r for x, r in fuera) / sum(1 / r for _, r in fuera)
    vc = 0.0
    ult = v
    for _ in range(n):
        if descarga:
            vc = 0.0
        v = (v * C + vc * cs) / (C + cs)          # reparto de carga al cerrar la llave
        v, _ = paso(v, tacq, C + cs, fuera)       # adquisición
        vc = v
        ult = v
        v, _ = paso(v, 1.0 / fs - tacq, C, fuera)  # hasta la muestra siguiente
    return ult


def fila(nombre, vals):
    print(nombre.ljust(44) + '  '.join(f'{x:+7.2f}%' for x in vals))


print('Error de lectura (lectura - tensión real del agua) / 3,3 V, con la punta en un punto a 1,0 V y a 2,3 V')
print('Resistencia de la punta en el agua:'.ljust(44) + '  '.join(f'{r/1e3:5.0f} kΩ' for r in (5e3, 20e3, 50e3, 100e3)))
for vs in (1.0, 2.3):
    print(f'\n--- punto a {vs} V ---')
    for u in (0.0, VDD / 2):
        for cext, pausa, nom in ((0, 2e-3, 'sin capacitor'), (100e-9, 2e-3, '100 nF, pausa 2 ms'), (100e-9, 5e-3, '100 nF, pausa 5 ms'), (1e-6, 5e-3, '1 µF, pausa 5 ms')):
            fila(f'V1, interna {u:.2f} V, {nom}', [100 * (v1_lectura(vs, rs, cext, u, pausa) - vs) / VDD for rs in (5e3, 20e3, 50e3, 100e3)])
    for cext, nom in ((0, 'sin capacitor (peor caso)'), (100e-9, '100 nF')):
        fila(f'V2, {nom}', [100 * (v2_lectura(vs, rs, cext) - vs) / VDD for rs in (5e3, 20e3, 50e3, 100e3)])
    fila('V2, sin capacitor, sin descarga interna', [100 * (v2_lectura(vs, rs, 0, descarga=False) - vs) / VDD for rs in (5e3, 20e3, 50e3, 100e3)])

# La prueba de las tres resistencias iguales (3V - R - B - R - A - R - GND): ¿recupera R_AIN y la tensión interna?
print('\nPrueba con tres resistencias de 100 kΩ (V1, sin capacitor):')
R = 100e3
rth = 2 * R / 3
for u in (0.0, VDD / 2, 0.55):
    ra = v1_lectura(VDD / 3, rth, 0, u, 5e-3)
    rb = v1_lectura(2 * VDD / 3, rth, 0, u, 5e-3)
    k = 1 - (rb - ra) / (VDD / 3)
    rin = rth * (1 - k) / k
    uu = (ra - (VDD / 3) * (1 - k)) / k
    print(f'  interna real {u:.2f} V → lecturas {ra:.3f} y {rb:.3f} V → k = {k:.3f}, R de entrada = {rin/1e3:.0f} kΩ, interna = {uu:.2f} V')
ra = v1_lectura(VDD / 3, rth, 100e-9, 0.0, 5e-3)
rb = v1_lectura(2 * VDD / 3, rth, 100e-9, 0.0, 5e-3)
print(f'  con 100 nF: lecturas {ra:.3f} y {rb:.3f} V (ideales {VDD/3:.3f} y {2*VDD/3:.3f})')
