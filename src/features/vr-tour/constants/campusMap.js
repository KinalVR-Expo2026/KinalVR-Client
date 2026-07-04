import nivel1Plano from '../../../assets/img/N1_Final.svg';
import nivel2Plano from '../../../assets/img/N2_Final.svg';
import nivel3Plano from '../../../assets/img/N3_Final.svg';
import nivel4Plano from '../../../assets/img/N4_Final.svg';

export const LEVEL_PLANS = {
  1: nivel1Plano,
  2: nivel2Plano,
  3: nivel3Plano,
  4: nivel4Plano,
};

export const ZOOM_MIN = 50;
export const ZOOM_MAX = 400;
export const ZOOM_STEP = 25;

export const LEVEL_TO_NUM = { 'PRIMER NIVEL': 1, 'SEGUNDO NIVEL': 2, 'TERCER NIVEL': 3, 'CUARTO NIVEL': 4 };
export const NUM_TO_LEVEL = { 1: 'PRIMER NIVEL', 2: 'SEGUNDO NIVEL', 3: 'TERCER NIVEL', 4: 'CUARTO NIVEL' };

// Devuelve el SVG del plano por número de nivel (1-4).
export const planForLevelNum = (levelNum) => LEVEL_PLANS[levelNum] || null;

// Devuelve el SVG del plano correspondiente a una escena (a partir de su `nivel`
// en string, ej. "SEGUNDO NIVEL"). Fuente única de verdad para el minimapa HTML,
// el minimapa 3D y el mapa grande — evita duplicar la tabla de planos.
export const planForScene = (scene) => {
  const levelNum = scene?.nivel && LEVEL_TO_NUM[scene.nivel];
  return levelNum ? LEVEL_PLANS[levelNum] : null;
};

export const TABS = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'admin', label: 'Admin' },
];
