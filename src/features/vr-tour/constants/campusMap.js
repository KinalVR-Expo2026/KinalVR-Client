import nivel1Plano from '../../../assets/img/N1_Final.webp';
import nivel2Plano from '../../../assets/img/N2_Final.webp';
import nivel3Plano from '../../../assets/img/N3_Final.webp';
import nivel4Plano from '../../../assets/img/N4_Final.webp';

export const LEVEL_PLANS = {
  1: nivel1Plano,
  2: nivel2Plano,
  3: nivel3Plano,
  4: nivel4Plano,
};

// Lienzo compartido por los 4 planos (mismas dimensiones en px que los SVG
// originales). MapInteractive, MinimapWidget y planTextures asumen que los 4
// niveles comparten exactamente esta proporción — si se regeneran los WEBP,
// deben exportarse al mismo tamaño de lienzo (no recortados a su contenido) o
// las calibraciones de BACKGROUND_CALIBRATION y este aspect ratio se desalinean.
export const LEVEL_PLAN_ASPECT_CSS = '7500 / 5298';

// Geometría del panel del mapa grande en VR (VRCampusMap). Fuente única de
// verdad para que VRCampusMap y VRLevelSelector no se importen entre sí (evita
// el ciclo de imports que tenían antes).
export const PANEL_HEIGHT = 1.2;

const [MAP_ASPECT_W, MAP_ASPECT_H] = LEVEL_PLAN_ASPECT_CSS.split('/').map(Number);
export const MAP_ASPECT = MAP_ASPECT_W / MAP_ASPECT_H;

export const MAP_WIDTH = PANEL_HEIGHT * MAP_ASPECT;

// Calibración de los planos 2..4 sobre el lienzo del nivel 1 (que hace de base).
// Estos offsets asumen que LEVEL_PLANS[2..4] comparten el mismo lienzo/aspect
// ratio que LEVEL_PLANS[1] (ver LEVEL_PLAN_ASPECT_CSS arriba). Si alguno se
// reexporta con otro tamaño, object-contain le mete letterboxing y estos números
// dejan de alinear con el nivel 1. Fuente única de verdad: la usan el mapa de
// escritorio (MapInteractive), el minimapa HTML (MinimapWidget) y el mapa grande
// en VR (vrMapPlano), que traduce estos %/scale del CSS a transformaciones THREE.
export const BACKGROUND_CALIBRATION = {
  2: { scale: 2.09, x: '-21.5%', y: '-1%' },
  3: { scale: 2.19, x: '-20%', y: '-2.5%' },
  4: { scale: 4.97, x: '-9%', y: '5.5%' },
};

export const ZOOM_MIN = 50;
export const ZOOM_MAX = 400;
export const ZOOM_STEP = 25;

export const LEVEL_TO_NUM = { 'PRIMER NIVEL': 1, 'SEGUNDO NIVEL': 2, 'TERCER NIVEL': 3, 'CUARTO NIVEL': 4 };
export const NUM_TO_LEVEL = { 1: 'PRIMER NIVEL', 2: 'SEGUNDO NIVEL', 3: 'TERCER NIVEL', 4: 'CUARTO NIVEL' };

// Devuelve el plano por número de nivel (1-4).
export const planForLevelNum = (levelNum) => LEVEL_PLANS[levelNum] || null;

// Devuelve el plano correspondiente a una escena (a partir de su `nivel`
// en string, ej. "SEGUNDO NIVEL"). Fuente única de verdad para el minimapa HTML,
// el minimapa 3D y el mapa grande — evita duplicar la tabla de planos.
export const planForScene = (scene) => {
  const levelNum = scene?.nivel && LEVEL_TO_NUM[scene.nivel];
  return levelNum ? LEVEL_PLANS[levelNum] : null;
};

export const TABS = [
  { id: 'mapa', label: 'Mapa' },
];
