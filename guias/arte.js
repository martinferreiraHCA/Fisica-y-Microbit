// Dibujo de línea: convierte piezas 3D en una ilustración técnica
// (rellenos planos, contornos negros, trama de puntos) con cámara isométrica.
// Tres pasadas: color, normales + identificador de pieza (con profundidad) y
// detección de bordes en pantalla (cambio de pieza, arista o salto de profundidad).
import * as THREE from 'three';

const VERT = `
varying vec3 vN;
void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG_COLOR = `
uniform vec3 uColor; uniform vec3 uTinta; uniform float uTrama; uniform float uPeriodo; uniform float uSombra;
varying vec3 vN;
void main() {
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  float l = clamp(dot(n, normalize(vec3(-0.45, 0.55, 0.70))), 0.0, 1.0);
  vec3 col = uColor * (1.0 - uSombra * (1.0 - l));
  if (uTrama > 0.5) {
    vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / uPeriodo;
    float d = length(fract(q) - 0.5);
    col = mix(uTinta, col, smoothstep(0.17, 0.25, d));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const FRAG_NI = `
uniform float uId; varying vec3 vN;
void main() { vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; gl_FragColor = vec4(n * 0.5 + 0.5, uId / 255.0); }`;
const VERT_POST = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAG_POST = `
uniform sampler2D tColor; uniform sampler2D tNI; uniform sampler2D tDepth;
uniform vec2 uTexel; uniform float uR; uniform float uNThr; uniform float uDThr; uniform vec3 uTinta;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tColor, vUv); vec4 ni = texture2D(tNI, vUv);
  float d = texture2D(tDepth, vUv).r; vec3 n = ni.rgb * 2.0 - 1.0;
  float e = 0.0;
  vec2 dirs[4];
  dirs[0] = vec2(1.0, 0.0); dirs[1] = vec2(0.0, 1.0); dirs[2] = vec2(0.7071, 0.7071); dirs[3] = vec2(0.7071, -0.7071);
  for (int i = 0; i < 4; i++) {
    vec2 o = dirs[i] * uR * uTexel;
    vec4 a = texture2D(tNI, vUv + o); vec4 b = texture2D(tNI, vUv - o);
    bool sa = abs(a.a - ni.a) < 0.002; bool sb = abs(b.a - ni.a) < 0.002;
    if (!sa || !sb) e = 1.0;
    else if (ni.a > 0.0) {
      if (dot(n, a.rgb * 2.0 - 1.0) < uNThr || dot(n, b.rgb * 2.0 - 1.0) < uNThr) e = 1.0;
      float da = texture2D(tDepth, vUv + o).r; float db = texture2D(tDepth, vUv - o).r;
      if (abs(da + db - 2.0 * d) > uDThr) e = 1.0;
    }
  }
  gl_FragColor = vec4(mix(c.rgb, uTinta, e), max(c.a, e));
}`;

// Los sombreadores escriben el color tal cual: se deshace la conversión a lineal de THREE.Color
const hex = (h) => new THREE.Color(h).convertLinearToSRGB();

export class Arte {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(1);
    this.renderer.autoClear = true;
    this.tColor = null; this.tNI = null; this.tOut = null; this.w = 0; this.h = 0;
    this.postScene = new THREE.Scene();
    this.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postMat = new THREE.ShaderMaterial({
      vertexShader: VERT_POST, fragmentShader: FRAG_POST, depthTest: false, depthWrite: false, blending: THREE.NoBlending,
      uniforms: { tColor: { value: null }, tNI: { value: null }, tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, uR: { value: 2 }, uNThr: { value: 0.8 }, uDThr: { value: 0.001 }, uTinta: { value: hex('#111111') } }
    });
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMat));
  }
  _targets(w, h) {
    if (this.w === w && this.h === h) return;
    [this.tColor, this.tNI, this.tOut].forEach((t) => t && t.dispose());
    const opt = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.UnsignedByteType };
    this.tColor = new THREE.WebGLRenderTarget(w, h, opt);
    this.tNI = new THREE.WebGLRenderTarget(w, h, opt);
    this.tNI.depthTexture = new THREE.DepthTexture(w, h);
    this.tOut = new THREE.WebGLRenderTarget(w, h, Object.assign({ depthBuffer: false }, opt));
    this.w = w; this.h = h;
  }
  /* items: [{ geometry, matrix: Matrix4, color: '#fff', trama: bool, id: 1..254 }]
     opts: { w, h (px finales), dir: [x,y,z] hacia la cámara, margen (0..0.4), linea (px finales), sombra (0..1), tinta, ss }
     → { canvas, w, h, proyectar(Vector3) → [x, y], ids: Uint8Array(w*h), mmPorPx } */
  dibujar(items, opts) {
    const ss = opts.ss || 2, W = Math.round(opts.w), H = Math.round(opts.h), w = W * ss, h = H * ss;
    this._targets(w, h);
    const scene = new THREE.Scene();
    const dir = new THREE.Vector3().fromArray(opts.dir || [1, -1.25, 0.95]).normalize();
    const caja = new THREE.Box3();
    const meshes = items.map((it) => {
      const m = new THREE.Mesh(it.geometry);
      m.matrixAutoUpdate = false; m.matrix.copy(it.matrix); m.matrixWorld.copy(it.matrix);
      if (!it.geometry.boundingBox) it.geometry.computeBoundingBox();
      caja.union(it.geometry.boundingBox.clone().applyMatrix4(it.matrix));
      m.userData.it = it; scene.add(m); return m;
    });
    if (caja.isEmpty()) caja.set(new THREE.Vector3(-10, -10, -10), new THREE.Vector3(10, 10, 10));
    // Cámara ortográfica ajustada a las piezas
    const centro = caja.getCenter(new THREE.Vector3()), diag = caja.getSize(new THREE.Vector3()).length() || 1;
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    cam.up.set(0, 0, 1);
    if (Math.abs(dir.z) > 0.999) cam.up.set(0, 1, 0);
    cam.position.copy(centro).addScaledVector(dir, diag * 2);
    cam.lookAt(centro); cam.updateMatrixWorld(true);
    const inv = cam.matrixWorldInverse.clone().copy(cam.matrixWorld).invert();
    const ext = new THREE.Box3(), v = new THREE.Vector3();
    const mv = new THREE.Matrix4();
    items.forEach((it) => {   // encuadre exacto: con los vértices, no con la caja
      mv.multiplyMatrices(inv, it.matrix);
      const a = it.geometry.attributes.position.array, paso = Math.max(3, Math.floor(a.length / 60000 / 3) * 3);
      for (let i = 0; i < a.length; i += paso) { v.set(a[i], a[i + 1], a[i + 2]).applyMatrix4(mv); ext.expandByPoint(v); }
    });
    if (opts.extra) opts.extra.forEach((p) => ext.expandByPoint(v.copy(p).applyMatrix4(inv)));
    const margen = opts.margen == null ? 0.08 : opts.margen;
    let ew = (ext.max.x - ext.min.x) || 1, eh = (ext.max.y - ext.min.y) || 1;
    const cx = (ext.max.x + ext.min.x) / 2, cy = (ext.max.y + ext.min.y) / 2;
    const esc = Math.max(ew / (W * (1 - 2 * margen)), eh / (H * (1 - 2 * margen)));   // mm por px final
    cam.left = cx - esc * W / 2; cam.right = cx + esc * W / 2; cam.top = cy + esc * H / 2; cam.bottom = cy - esc * H / 2;
    cam.near = Math.max(0.01, -ext.max.z - diag * 0.05); cam.far = -ext.min.z + diag * 0.05;
    cam.updateProjectionMatrix();
    const rango = cam.far - cam.near;
    // Pasada 1: color
    const r = this.renderer;
    const tinta = hex(opts.tinta || '#111111');
    meshes.forEach((m) => {
      const it = m.userData.it;
      m.material = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG_COLOR, side: THREE.DoubleSide, blending: THREE.NoBlending,
        uniforms: { uColor: { value: hex(it.color || '#ffffff') }, uTinta: { value: tinta }, uTrama: { value: it.trama ? 1 : 0 }, uPeriodo: { value: 6.5 * ss }, uSombra: { value: opts.sombra || 0 } }
      });
    });
    r.setRenderTarget(this.tColor); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, cam);
    const matsColor = meshes.map((m) => m.material);
    // Pasada 2: normales + id
    meshes.forEach((m) => {
      m.material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG_NI, side: THREE.DoubleSide, blending: THREE.NoBlending, uniforms: { uId: { value: m.userData.it.id || 1 } } });
    });
    r.setRenderTarget(this.tNI); r.setClearColor(0x000000, 0); r.clear(); r.render(scene, cam);
    // Pasada 3: bordes
    const u = this.postMat.uniforms;
    const radio = Math.max(1, (opts.linea || 1.8) * ss / 2);
    u.tColor.value = this.tColor.texture; u.tNI.value = this.tNI.texture; u.tDepth.value = this.tNI.depthTexture;
    u.uTexel.value.set(1 / w, 1 / h); u.uR.value = radio; u.uNThr.value = 0.80;
    u.uDThr.value = 3.0 * (radio * esc / ss) / rango; u.uTinta.value = tinta;
    r.setRenderTarget(this.tOut); r.clear(); r.render(this.postScene, this.postCam);
    // Lectura
    const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(this.tOut, 0, 0, w, h, px);
    const ni = new Uint8Array(w * h * 4); r.readRenderTargetPixels(this.tNI, 0, 0, w, h, ni);
    r.setRenderTarget(null);
    matsColor.forEach((m) => m.dispose()); meshes.forEach((m) => m.material.dispose());
    const big = document.createElement('canvas'); big.width = w; big.height = h;
    const img = new ImageData(w, h);
    for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    big.getContext('2d').putImageData(img, 0, 0);
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(big, 0, 0, W, H);
    const ids = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ids[y * W + x] = ni[((h - 1 - (y * ss + (ss >> 1))) * w + x * ss + (ss >> 1)) * 4 + 3];
    const pm = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    const proyectar = (p) => { const q = new THREE.Vector3().copy(p).applyMatrix4(pm); return [(q.x * 0.5 + 0.5) * W, (1 - (q.y * 0.5 + 0.5)) * H]; };
    return { canvas, w: W, h: H, proyectar, ids, mmPorPx: esc };
  }
}
