// Actualiza partes.json, la copia de los sensores de la extensión FisicaBit de MakeCode que viene con el sitio.
// (El sitio igual lee la extensión de GitHub cada vez que se abre; esta copia es lo que se ve sin red.)
//
//   node circuitos/partes/actualizar.mjs                  lee de GitHub
//   node circuitos/partes/actualizar.mjs <carpeta>        lee de una copia local de pxt-fisicabit-usb
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deGitHub, REPO, RAMA } from '../partes.js';

const carpeta = process.argv[2];
const leer = carpeta
  ? (ruta) => fs.readFile(path.join(carpeta, ruta), 'utf8')
  : async (ruta) => { const r = await fetch('https://raw.githubusercontent.com/' + REPO + '/' + RAMA + '/' + ruta); if (!r.ok) throw new Error(ruta + ' ' + r.status); return r.text(); };
const d = await deGitHub(leer);
const salida = path.join(path.dirname(fileURLToPath(import.meta.url)), 'partes.json');
await fs.writeFile(salida, JSON.stringify(d, null, 1) + '\n');
console.log(d.partes.length + ' sensores → ' + salida);
for (const p of d.partes) console.log('  ' + p.id + ' · ' + p.titulo + ' · ' + p.pines.map((q) => q.n + (q.destino ? '→' + q.destino : '')).join(' ') + ' · ' + p.bloques.length + ' bloques');
