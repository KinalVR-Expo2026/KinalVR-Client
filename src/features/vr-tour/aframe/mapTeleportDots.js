import { LEVEL_TO_NUM } from '../constants/campusMap';

// Puntos de teletransporte del mapa grande en VR (T8). Son meshes THREE (círculo
// naranja + anillo blanco) que vr-map-plano dibuja DENTRO del overlayGroup, así
// heredan el transform del nivel activo (BACKGROUND_CALIBRATION) y el del zoom.
//
// Los meshes THREE no son raycasteables por el sistema `.clickable` de A-Frame
// (que opera sobre entidades). Por eso el click se resuelve por hit-test manual:
// vr-map-plano, en el listener de click del a-plane host, pasa el punto tocado a
// coords locales del overlayGroup y llama a hitTestDot(). El mismo espacio en el
// que viven los dots, así que la comparación es directa.
//
// El filtro es EXACTO al del mapa de escritorio (MapInteractive): mismo nivel,
// posición válida y distinta de (0,0), excluyendo la escena actual (ahí va la
// flecha del usuario, no un dot).

// Radio del disco naranja del dot, en unidades de mundo (sobre el plano W×H).
const DOT_RADIUS = 0.018;
const RING_INNER = 0.018;
const RING_OUTER = 0.024;

// Construye/actualiza los dots dentro de `overlayGroup`. Reconstruye desde cero
// (limpia los anteriores) — se llama de forma throttleada (~1 Hz), es barato.
// Devuelve un array de descriptores { subId, x, y } para el hit-test.
export const buildDots = (THREE, overlayGroup, dotsGroupRef, scenes, activeLevel, activeSubId, W, H) => {
  // Grupo contenedor propio (para no pisar la flecha ni el overlayMesh).
  let group = dotsGroupRef.current;
  if (!group) {
    group = new THREE.Group();
    group.position.z = 0.005; // un pelo delante del plano del nivel
    overlayGroup.add(group);
    dotsGroupRef.current = group;
  }

  // Limpiar dots anteriores.
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i];
    group.remove(child);
    child.traverse?.((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        obj.material?.dispose();
      }
    });
  }

  const list = Array.isArray(scenes) ? scenes : [];
  const filtered = list.filter((s) =>
    s.nivel && LEVEL_TO_NUM[s.nivel] === activeLevel &&
    Array.isArray(s.posicion) && s.posicion.length >= 2 &&
    !(s.posicion[0] === 0 && s.posicion[1] === 0) &&
    s.subId !== activeSubId
  );

  const descriptors = [];
  filtered.forEach((s) => {
    const px = (s.posicion[0] || 0) / 100;
    const py = (s.posicion[1] || 0) / 100;
    const x = (px - 0.5) * W;
    const y = (0.5 - py) * H;

    const dot = new THREE.Group();
    dot.position.set(x, y, 0);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(RING_INNER, RING_OUTER, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    ring.position.z = 0.0005;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(DOT_RADIUS, 24),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    disc.position.z = 0.001;
    dot.add(ring, disc);
    group.add(dot);

    descriptors.push({ subId: s.subId, x, y });
  });

  return descriptors;
};

// Hit-test: dado un punto en coords locales del overlayGroup, devuelve el subId
// del dot más cercano dentro de `hitRadius`, o null. Elige el más cercano por si
// hay dots solapados.
export const hitTestDot = (localPoint, dots, hitRadius) => {
  if (!Array.isArray(dots) || dots.length === 0) return null;
  let best = null;
  let bestDist = hitRadius;
  dots.forEach((d) => {
    const dist = Math.hypot(localPoint.x - d.x, localPoint.y - d.y);
    if (dist <= bestDist) {
      bestDist = dist;
      best = d.subId;
    }
  });
  return best;
};

// Limpieza de recursos (se llama en remove() de vr-map-plano).
export const disposeDots = (dotsGroupRef) => {
  const group = dotsGroupRef.current;
  if (!group) return;
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.geometry?.dispose();
      obj.material?.dispose();
    }
  });
  group.parent?.remove(group);
  dotsGroupRef.current = null;
};
