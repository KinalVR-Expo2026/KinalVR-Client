import { useEffect, useRef } from 'react';
import { MAP_WIDTH } from './VRCampusMap';

// Botón 3D clickeable (láser/pellizco), con el patrón ref + addEventListener que
// usa el resto del tour (ver ConnectionMarker). Bloques sólidos en blanco; el
// activo se resalta en naranja — mismos colores que el selector de escritorio
// (MapInteractive.jsx: bg-orange-500 activo / bg-slate-100 inactivo).
const VRButton = ({ label, active, onSelect, position, width = 0.26, height = 0.22 }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e) => {
      e.stopPropagation?.();
      onSelect();
    };
    el.addEventListener('click', handle);
    el.addEventListener('mousedown', handle);
    el.addEventListener('touchstart', handle);
    return () => {
      el.removeEventListener('click', handle);
      el.removeEventListener('mousedown', handle);
      el.removeEventListener('touchstart', handle);
    };
  }, [onSelect]);

  return (
    <a-entity
      ref={ref}
      className="clickable"
      position={position}
      geometry={`primitive: plane; width: ${width}; height: ${height}`}
      material={`shader: flat; color: ${active ? '#ea580c' : '#e2e8f0'}; opacity: 1; side: double`}
    >
      <a-text
        value={label}
        align="center"
        position="0 0 0.01"
        color={active ? '#ffffff' : '#1e293b'}
        scale="0.5 0.5 0.5"
      ></a-text>
    </a-entity>
  );
};

// Selector de niveles: columna a la derecha del mapa, afuera de su área,
// orden ascendente de abajo hacia arriba (1 abajo … 4 arriba) — mismo
// orden que el selector de escritorio, solo vertical junto al mapa en
// vez de aparte. Incluye el botón de cerrar (X) arriba a la derecha.
export const VRLevelSelector = ({ activeLevel, onSelectLevel, onClose, buttonX, centerY, step, topY }) => (
  <>
    {[1, 2, 3, 4].map((level, i) => (
      <VRButton
        key={level}
        label={String(level)}
        active={activeLevel === level}
        onSelect={() => onSelectLevel(level)}
        position={`${buttonX} ${centerY - 0.45 + i * step} 0.02`}
      />
    ))}

    {/* Cerrar */}
    <VRButton
      label="X"
      active={false}
      onSelect={onClose}
      position={`${MAP_WIDTH / 2 - 0.05} ${topY - 0.05} 0.02`}
      width={0.2}
      height={0.2}
    />
  </>
);
