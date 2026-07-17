// Geometría 3D de la flecha de navegación, con la MISMA silueta que MinimapArrow
// (path "M50 15 L72 82 L50 68 L28 82 Z", viewBox 100x100 con y hacia abajo).
// Se centra en (50,50) y se convierte a 3D (y hacia arriba): (x-50, 50-y).
// `scale` es el factor respecto al viewBox de 100 (p.ej. tamaño/100).
// Reutilizada por el radar de muñeca (vrMinimap) y el mapa grande (vrMapPlano).
export const buildArrowGeometry = (THREE, scale) => {
  const pts = [[50, 15], [72, 82], [50, 68], [28, 82]];
  const shape = new THREE.Shape();
  pts.forEach(([x, y], i) => {
    const px = (x - 50) * scale;
    const py = (50 - y) * scale;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
};
