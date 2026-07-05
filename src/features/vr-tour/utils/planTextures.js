import { LEVEL_PLANS } from '../constants/campusMap';

// Rasteriza los planos (N1..N4_Final.webp) a un <canvas> y los expone como
// THREE.CanvasTexture, usando el MISMO asset que el minimapa HTML
// (constants/campusMap.js), tal como pidió el requerimiento.
//
// El CANVAS se rasteriza a lo sumo una vez por nivel y por sesión (canvasCache).
// Sobre ese mismo canvas se crean texturas INDEPENDIENTES por consumidor: el
// radar de muñeca necesita recortar (repeat/offset propios) y el mapa grande
// muestra el plano completo — como repeat/offset viven en la textura, cada uno
// necesita su propia instancia.
//
// El canvas conserva la relación de aspecto real del plano (no lo estira) y esa
// relación se publica en `texture.userData.aspect` (= ancho/alto) para mapear
// posiciones y dimensionar geometría sin deformar. Vale 1 hasta que la imagen carga.
//
// El canvas se mantiene TRANSPARENTE (clearRect, no un relleno de color): los
// planos webp traen canal alfa (fondo transparente) y rellenarlo pintaba un
// recuadro claro alrededor del dibujo. El fondo lo pone quien consume la textura
// (el panel atenuado del mapa grande, o el disco del radar).

const MAX_DIM = 2048;        // lado mayor del lienzo; subir a 4096 si se ve borroso

// level -> { canvas, aspect, textures:Set<THREE.CanvasTexture> }
const canvasCache = new Map();

const getTHREE = () => window.THREE || window.AFRAME?.THREE || null;

const ensureCanvas = (levelNum) => {
  if (canvasCache.has(levelNum)) return canvasCache.get(levelNum);

  const canvas = document.createElement('canvas');
  canvas.width = MAX_DIM;
  canvas.height = MAX_DIM;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const entry = { canvas, aspect: 1, textures: new Set() };
  canvasCache.set(levelNum, entry);

  const svgUrl = LEVEL_PLANS[levelNum];
  if (!svgUrl) return entry;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const aspect = (img.naturalWidth && img.naturalHeight)
      ? img.naturalWidth / img.naturalHeight
      : 1;

    const cw = aspect >= 1 ? MAX_DIM : Math.round(MAX_DIM * aspect);
    const ch = aspect >= 1 ? Math.round(MAX_DIM / aspect) : MAX_DIM;
    canvas.width = cw;
    canvas.height = ch;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);

    entry.aspect = aspect;
    // Propagar a todas las texturas creadas sobre este canvas.
    entry.textures.forEach((t) => {
      t.userData.aspect = aspect;
      t.needsUpdate = true;
    });
  };
  img.onerror = (err) => {
    console.warn(`No se pudo rasterizar el plano del nivel ${levelNum} (${svgUrl})`, err);
  };
  img.src = svgUrl;

  return entry;
};

// Crea una textura del plano de un nivel (independiente en repeat/offset). El
// canvas subyacente se comparte y se rasteriza una sola vez. Los consumidores
// deben cachear la textura que reciben por nivel (no llamar en cada frame).
export const getPlanTexture = (levelNum) => {
  const THREE = getTHREE();
  if (!THREE) return null;

  const entry = ensureCanvas(levelNum);
  const texture = new THREE.CanvasTexture(entry.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.userData.aspect = entry.aspect;
  texture.needsUpdate = true;

  entry.textures.add(texture);
  return texture;
};
