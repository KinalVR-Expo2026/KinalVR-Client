import { useEffect, useRef } from 'react';

const refreshRaycasters = () => {
  document.querySelectorAll('[raycaster]').forEach((rc) => {
    if (rc.components?.raycaster?.refreshObjects) {
      rc.components.raycaster.refreshObjects();
    }
  });
};

// Plano invisible detrás de un panel VR que lo cierra al tocar/clickear
// cualquier punto fuera de él. Compartido por VREventDetailPanel y VRCampusMap.
export const VRBackdrop = ({ onClose }) => {
  const backdropRef = useRef(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;

    const handleClose = (e) => {
      e?.stopPropagation?.();
      onClose?.();
    };

    backdrop.addEventListener('click', handleClose);
    backdrop.addEventListener('mousedown', handleClose);
    backdrop.addEventListener('touchstart', handleClose);

    // Refresco escalonado para que el backdrop sea clickeable de inmediato
    // (el raycaster de A-Frame cachea sus objetos intersectables).
    const t1 = setTimeout(refreshRaycasters, 100);
    const t2 = setTimeout(refreshRaycasters, 400);
    const t3 = setTimeout(refreshRaycasters, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      backdrop.removeEventListener('click', handleClose);
      backdrop.removeEventListener('mousedown', handleClose);
      backdrop.removeEventListener('touchstart', handleClose);
    };
  }, [onClose]);

  return (
    <a-plane
      ref={backdropRef}
      className="clickable"
      width="8"
      height="6"
      color="#000"
      opacity="0"
      material="shader: flat; transparent: true; side: double"
      position="0 0 -0.02"
    ></a-plane>
  );
};
