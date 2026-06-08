import { useEffect, useRef, useState } from 'react';
import 'aframe';

// Billboard component — rotates entity so its +Z axis (content face) always points toward the camera.
// Uses atan2 on Y-axis only — much more reliable than lookAt() which orients -Z toward target.
if (typeof AFRAME !== 'undefined' && !AFRAME.components['billboard']) {
  AFRAME.registerComponent('billboard', {
    tick: function () {
      const camera = this.el.sceneEl.camera;
      if (!camera) return;

      const camWPos = new THREE.Vector3();
      camera.getWorldPosition(camWPos);

      const panelWPos = new THREE.Vector3();
      this.el.object3D.getWorldPosition(panelWPos);

      const dx = camWPos.x - panelWPos.x;
      const dz = camWPos.z - panelWPos.z;
      this.el.object3D.rotation.y = Math.atan2(dx, dz);
    }
  });
}

/**
 * VREventDetailPanel — Floating 3D panel inside the A-Frame scene
 * that shows event image + description in immersive VR mode.
 */
export const VREventDetailPanel = ({ event, cameraRef, onClose }) => {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [position, setPosition] = useState('0 1.6 -2.5');
  const [imgDims, setImgDims] = useState({ width: 1.0, height: 0.75 });

  const PANEL_WIDTH = 1.5;
  const PANEL_HEIGHT = 1.8;
  const PANEL_DISTANCE = 2.5;

  // Position the panel in front of the camera when it mounts or event changes
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const cameraEl = cameraRef?.current;
        if (!cameraEl || !cameraEl.object3D) return;

        const cam = cameraEl.object3D;
        const worldPos = new THREE.Vector3();
        const worldDir = new THREE.Vector3();

        cam.getWorldPosition(worldPos);
        cam.getWorldDirection(worldDir);

        // THREE.js getWorldDirection returns -Z in world space (the "look at" direction).
        // Negate it because in A-Frame's coordinate system the camera faces +Z.
        worldDir.negate();

        // Place panel in front, but dampen the vertical offset for comfort
        const panelPos = new THREE.Vector3(
          worldPos.x + worldDir.x * PANEL_DISTANCE,
          worldPos.y + worldDir.y * PANEL_DISTANCE * 0.3,
          worldPos.z + worldDir.z * PANEL_DISTANCE
        );

        setPosition(
          `${panelPos.x.toFixed(3)} ${panelPos.y.toFixed(3)} ${panelPos.z.toFixed(3)}`
        );
      } catch (err) {
        console.warn('VREventDetailPanel: camera position error', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [cameraRef, event]);

  // Compute image aspect ratio
  useEffect(() => {
    if (!event?.urlImagen) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = event.urlImagen;

    const MAX_W = 1.15;
    const MAX_H = 0.85;

    img.onload = () => {
      const ratio = img.naturalHeight / img.naturalWidth;
      let w = MAX_W;
      let h = w * ratio;
      if (h > MAX_H) { h = MAX_H; w = h / ratio; }
      setImgDims({ width: +w.toFixed(4), height: +h.toFixed(4) });
    };

    img.onerror = () => setImgDims({ width: 1.0, height: 0.75 });

    return () => { img.onload = null; img.onerror = null; };
  }, [event?.urlImagen]);

  // Close button click + raycaster refresh
  useEffect(() => {
    const el = closeBtnRef.current;
    if (!el) return;

    const handleClose = (e) => {
      e.stopPropagation();
      if (typeof onClose === 'function') onClose();
    };

    el.addEventListener('click', handleClose);
    el.addEventListener('mousedown', handleClose);

    // Refresh raycasters so the close button is pickable by VR controllers
    const timer = setTimeout(() => {
      document.querySelectorAll('[raycaster]').forEach(rc => {
        if (rc.components && rc.components.raycaster) {
          rc.components.raycaster.refreshObjects();
        }
      });
    }, 120);

    return () => {
      clearTimeout(timer);
      el.removeEventListener('click', handleClose);
      el.removeEventListener('mousedown', handleClose);
    };
  }, [onClose]);

  if (!event) return null;

  const description = event.descripcion
    ? event.descripcion.length > 180
      ? event.descripcion.slice(0, 177) + '...'
      : event.descripcion
    : 'Sin descripcion';

  // ─── Layout calculations ───
  const imgY = PANEL_HEIGHT / 2 - 0.18 - imgDims.height / 2;
  const dividerY = imgY - imgDims.height / 2 - 0.10;
  const descY = dividerY - 0.14;

  return (
    <a-entity ref={panelRef} position={position} billboard>

      {/* ── Outer glow layer 1 (wide, soft) ── */}
      <a-plane
        width={PANEL_WIDTH + 0.14}
        height={PANEL_HEIGHT + 0.14}
        color="#f97316"
        opacity="0.05"
        material="shader: flat; transparent: true; side: double"
        position="0 0 -0.008"
      />

      {/* ── Outer glow layer 2 (tighter) ── */}
      <a-plane
        width={PANEL_WIDTH + 0.08}
        height={PANEL_HEIGHT + 0.08}
        color="#f97316"
        opacity="0.09"
        material="shader: flat; transparent: true; side: double"
        position="0 0 -0.005"
      />

      {/* ── Border (gradient-like effect via layered planes) ── */}
      <a-plane
        width={PANEL_WIDTH + 0.03}
        height={PANEL_HEIGHT + 0.03}
        color="#f97316"
        opacity="0.40"
        material="shader: flat; transparent: true; side: double"
        position="0 0 -0.002"
      />

      {/* ── Background ── */}
      <a-plane
        width={PANEL_WIDTH}
        height={PANEL_HEIGHT}
        color="#0c1222"
        opacity="0.97"
        material="shader: flat; transparent: true; side: double"
      />

      {/* ── Subtle inner dark overlay for depth ── */}
      <a-plane
        width={PANEL_WIDTH - 0.04}
        height={PANEL_HEIGHT - 0.04}
        color="#0f172a"
        opacity="0.3"
        material="shader: flat; transparent: true; side: double"
        position="0 0 0.001"
      />

      {/* ── Header bar (gradient-like) ── */}
      <a-plane
        width={PANEL_WIDTH}
        height="0.07"
        color="#ea580c"
        opacity="0.75"
        position={`0 ${PANEL_HEIGHT / 2 - 0.035} 0.003`}
        material="shader: flat; transparent: true; side: double"
      />
      {/* Header accent line (bottom edge) */}
      <a-plane
        width={PANEL_WIDTH}
        height="0.004"
        color="#fb923c"
        opacity="0.5"
        position={`0 ${PANEL_HEIGHT / 2 - 0.072} 0.004`}
        material="shader: flat; transparent: true; side: double"
      />

      {/* ── Header title ── */}
      <a-text
        value="EVENTO"
        align="center"
        color="#fff"
        width="1.4"
        position={`0 ${PANEL_HEIGHT / 2 - 0.035} 0.006`}
        side="double"
      />

      {/* ── Event image (centered, top portion) ── */}
      {event.urlImagen ? (
        <>
          {/* Image background frame */}
          <a-plane
            width={imgDims.width + 0.06}
            height={imgDims.height + 0.06}
            color="#1e293b"
            opacity="0.5"
            position={`0 ${imgY} 0.003`}
            material="shader: flat; transparent: true; side: double"
          />
          <a-image
            src={event.urlImagen}
            width={imgDims.width}
            height={imgDims.height}
            position={`0 ${imgY} 0.005`}
            crossOrigin="anonymous"
            material="shader: flat; transparent: true; side: double"
          />
        </>
      ) : (
        <a-plane
          width="0.8"
          height="0.6"
          color="#1e293b"
          position={`0 ${imgY} 0.005`}
          material="shader: flat; side: double"
        >
          <a-text value="Sin imagen" align="center" color="#64748b" width="1.5" side="double" />
        </a-plane>
      )}

      {/* ── Divider ── */}
      <a-plane
        width={PANEL_WIDTH - 0.12}
        height="0.004"
        color="#f97316"
        opacity="0.50"
        position={`0 ${dividerY} 0.005`}
        material="shader: flat; transparent: true; side: double"
      />
      {/* Divider side accents */}
      <a-plane
        width="0.04"
        height="0.004"
        color="#fb923c"
        opacity="0.8"
        position={`${-(PANEL_WIDTH - 0.12) / 2 + 0.02} ${dividerY} 0.006`}
        material="shader: flat; transparent: true; side: double"
      />
      <a-plane
        width="0.04"
        height="0.004"
        color="#fb923c"
        opacity="0.8"
        position={`${(PANEL_WIDTH - 0.12) / 2 - 0.02} ${dividerY} 0.006`}
        material="shader: flat; transparent: true; side: double"
      />

      {/* ── Description ── */}
      <a-entity position={`0 ${descY} 0.005`}>
        <a-text
          value="Descripción"
          align="center"
          color="#fb923c"
          width="1.5"
          anchor="center"
          baseline="top"
          side="double"
        />
        <a-text
          value={description}
          align="center"
          color="#e2e8f0"
          width="1.4"
          wrap-count="36"
          anchor="center"
          baseline="top"
          position="0 -0.12 0"
          side="double"
        />
      </a-entity>

      {/* ── Close button (top-right, refined) ── */}
      <a-entity
        ref={closeBtnRef}
        className="clickable"
        position={`${PANEL_WIDTH / 2 - 0.10} ${PANEL_HEIGHT / 2 - 0.035} 0.01`}
        geometry="primitive: plane; width: 0.13; height: 0.055"
        material="color: #dc2626; opacity: 0; shader: flat; transparent: true; side: double"
        animation__mouseenter="property: material.opacity; to: 0.7; startEvents: mouseenter; dur: 100"
        animation__mouseleave="property: material.opacity; to: 0; startEvents: mouseleave; dur: 150"
      >
        <a-text value="✕" align="center" color="#fff" width="1.6" position="0 0 0.002" side="double" />
      </a-entity>

      {/* ── Bottom accent bar ── */}
      <a-plane
        width={PANEL_WIDTH}
        height="0.004"
        color="#f97316"
        opacity="0.3"
        position={`0 ${-PANEL_HEIGHT / 2 + 0.002} 0.003`}
        material="shader: flat; transparent: true; side: double"
      />

      {/* ── Hint ── */}
      <a-text
        value="Apunta a la ✕ para cerrar"
        align="center"
        color="#64748b"
        width="1.0"
        position={`0 ${-PANEL_HEIGHT / 2 + 0.04} 0.005`}
        side="double"
      />
    </a-entity>
  );
};