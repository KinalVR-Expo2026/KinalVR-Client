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
  const backdropRef = useRef(null);
  const [position, setPosition] = useState('0 1.6 -2.5');
  const [imgDims, setImgDims] = useState({ width: 1.0, height: 0.75 });

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

  // Close button + backdrop click + raycaster refresh
  useEffect(() => {
    const closeBtn = closeBtnRef.current;
    const backdrop = backdropRef.current;

    const handleClose = (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      if (typeof onClose === 'function') onClose();
    };

    // Attach listeners to close button
    if (closeBtn) {
      closeBtn.addEventListener('click', handleClose);
      closeBtn.addEventListener('mousedown', handleClose);
    }

    // Attach listeners to backdrop (click outside to close)
    if (backdrop) {
      backdrop.addEventListener('click', handleClose);
      backdrop.addEventListener('mousedown', handleClose);
    }

    // Refresh raycasters multiple times with staggered delays
    // so the X and backdrop are immediately pickable.
    const refreshRaycasters = () => {
      document.querySelectorAll('[raycaster]').forEach(rc => {
        if (rc.components && rc.components.raycaster) {
          rc.components.raycaster.refreshObjects();
        }
      });
    };
    const t1 = setTimeout(refreshRaycasters, 100);
    const t2 = setTimeout(refreshRaycasters, 400);
    const t3 = setTimeout(refreshRaycasters, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (closeBtn) {
        closeBtn.removeEventListener('click', handleClose);
        closeBtn.removeEventListener('mousedown', handleClose);
      }
      if (backdrop) {
        backdrop.removeEventListener('click', handleClose);
        backdrop.removeEventListener('mousedown', handleClose);
      }
    };
  }, [onClose]);

  if (!event) return null;

  const description = event.descripcion
    ? event.descripcion.length > 180
      ? event.descripcion.slice(0, 177) + '...'
      : event.descripcion
    : 'Sin descripcion';

  // ─── Horizontal layout dimensions ───
  const PW = 2.6;       // panel width (wide horizontal)
  const PH = 1.4;       // panel height
  const HEADER_H = 0.08; // header bar height
  const BORDER = 0.02;   // border thickness
  const LEFT_W = PW * 0.48;  // left section (image)
  const RIGHT_W = PW * 0.52; // right section (description)

  // Image area — constrained to left section
  const imgMaxW = LEFT_W - 0.3;
  const imgMaxH = PH - HEADER_H - 0.3;
  let imgW = Math.min(imgDims.width, imgMaxW);
  let imgH = imgW * (imgDims.height / imgDims.width);
  if (imgH > imgMaxH) { imgH = imgMaxH; imgW = imgH * (imgDims.width / imgDims.height); }

  // Positions
  const imgCenterX = -PW / 2 + LEFT_W / 2;         // center of left section
  const imgCenterY = -HEADER_H / 2 + 0.02;          // vertically centered below header
  const descCenterX = PW / 2 - RIGHT_W / 2;         // center of right section
  const dividerX = -PW / 2 + LEFT_W;                // vertical divider x
  const frameW = imgW + 0.08;   // frame border around image
  const frameH = imgH + 0.08;

  return (
    <a-entity ref={panelRef} position={position} billboard>

      {/* ═══════════════════════════════════════════════
          OUTER GLOW — soft orange aura
          ═══════════════════════════════════════════════ */}
      <a-plane
        width={PW + 0.16}
        height={PH + 0.16}
        color="#f97316"
        opacity="0.04"
        material="shader: flat; transparent: true; side: double"
        position="0 0 -0.010"
      />
      <a-plane
        width={PW + 0.08}
        height={PH + 0.08}
        color="#f97316"
        opacity="0.07"
        material="shader: flat; transparent: true; side: double"
        position="0 0 -0.006"
      />

      {/* ═══════════════════════════════════════════════
          ORANGE BORDER FRAME
          ═══════════════════════════════════════════════ */}
      <a-plane
        width={PW + BORDER * 2}
        height={PH + BORDER * 2}
        color="#ea580c"
        opacity="0.55"
        material="shader: flat; transparent: true; side: double"
        position="0 0 -0.003"
      />

      {/* ═══════════════════════════════════════════════
          TRANSPARENT BACKGROUND — the scene shows through
          ═══════════════════════════════════════════════ */}
      <a-plane
        width={PW}
        height={PH}
        color="#0a0f1a"
        opacity="0.55"
        material="shader: flat; transparent: true; side: double"
        position="0 0 -0.001"
      />

      {/* ═══════════════════════════════════════════════
          CORNER ACCENTS — circuit/tech style decorations
          ═══════════════════════════════════════════════ */}
      {/* Top-left corner */}
      <a-plane width="0.15" height="0.004" color="#fb923c" opacity="0.7"
        position={`${-PW/2 + 0.075} ${PH/2 - HEADER_H - 0.02} 0.004`}
        material="shader: flat; transparent: true; side: double" />
      <a-plane width="0.004" height="0.10" color="#fb923c" opacity="0.7"
        position={`${-PW/2 + 0.02} ${PH/2 - HEADER_H - 0.07} 0.004`}
        material="shader: flat; transparent: true; side: double" />
      <a-plane width="0.025" height="0.025" color="#f97316" opacity="0.5"
        position={`${-PW/2 + 0.02} ${PH/2 - HEADER_H - 0.02} 0.005`}
        material="shader: flat; transparent: true; side: double" />

      {/* Top-right corner */}
      <a-plane width="0.15" height="0.004" color="#fb923c" opacity="0.7"
        position={`${PW/2 - 0.075} ${PH/2 - HEADER_H - 0.02} 0.004`}
        material="shader: flat; transparent: true; side: double" />
      <a-plane width="0.004" height="0.10" color="#fb923c" opacity="0.7"
        position={`${PW/2 - 0.02} ${PH/2 - HEADER_H - 0.07} 0.004`}
        material="shader: flat; transparent: true; side: double" />
      <a-plane width="0.025" height="0.025" color="#f97316" opacity="0.5"
        position={`${PW/2 - 0.02} ${PH/2 - HEADER_H - 0.02} 0.005`}
        material="shader: flat; transparent: true; side: double" />

      {/* Bottom-left corner */}
      <a-plane width="0.15" height="0.004" color="#fb923c" opacity="0.5"
        position={`${-PW/2 + 0.075} ${-PH/2 + 0.02} 0.004`}
        material="shader: flat; transparent: true; side: double" />
      <a-plane width="0.004" height="0.10" color="#fb923c" opacity="0.5"
        position={`${-PW/2 + 0.02} ${-PH/2 + 0.07} 0.004`}
        material="shader: flat; transparent: true; side: double" />

      {/* Bottom-right corner */}
      <a-plane width="0.15" height="0.004" color="#fb923c" opacity="0.5"
        position={`${PW/2 - 0.075} ${-PH/2 + 0.02} 0.004`}
        material="shader: flat; transparent: true; side: double" />
      <a-plane width="0.004" height="0.10" color="#fb923c" opacity="0.5"
        position={`${PW/2 - 0.02} ${-PH/2 + 0.07} 0.004`}
        material="shader: flat; transparent: true; side: double" />

      {/* ═══════════════════════════════════════════════
          HEADER BAR — "EVENTO"
          ═══════════════════════════════════════════════ */}
      <a-plane
        width={PW}
        height={HEADER_H}
        color="#ea580c"
        opacity="0.80"
        position={`0 ${PH/2 - HEADER_H/2} 0.003`}
        material="shader: flat; transparent: true; side: double"
      />
      {/* Header bottom accent line */}
      <a-plane
        width={PW}
        height="0.004"
        color="#fb923c"
        opacity="0.6"
        position={`0 ${PH/2 - HEADER_H} 0.004`}
        material="shader: flat; transparent: true; side: double"
      />
      {/* Header title */}
      <a-text
        value="EVENTO"
        align="center"
        color="#fff"
        width="1.6"
        position={`0 ${PH/2 - HEADER_H/2} 0.006`}
        side="double"
      />

      {/* ═══════════════════════════════════════════════
          VERTICAL DIVIDER — separates image from description
          ═══════════════════════════════════════════════ */}
      <a-plane
        width="0.003"
        height={PH - HEADER_H - 0.08}
        color="#f97316"
        opacity="0.35"
        position={`${dividerX} ${-HEADER_H/2 - 0.02} 0.004`}
        material="shader: flat; transparent: true; side: double"
      />

      {/* ═══════════════════════════════════════════════
          LEFT SECTION — Image with ornate frame
          ═══════════════════════════════════════════════ */}
      {event.urlImagen ? (
        <>
          {/* Outer frame glow */}
          <a-plane
            width={frameW + 0.04}
            height={frameH + 0.04}
            color="#b45309"
            opacity="0.15"
            position={`${imgCenterX} ${imgCenterY} 0.003`}
            material="shader: flat; transparent: true; side: double"
          />

          {/* Frame outer edge (gold/dark) */}
          <a-plane
            width={frameW}
            height={frameH}
            color="#92400e"
            opacity="0.8"
            position={`${imgCenterX} ${imgCenterY} 0.004`}
            material="shader: flat; transparent: true; side: double"
          />

          {/* Frame inner highlight (warm gold) */}
          <a-plane
            width={frameW - 0.02}
            height={frameH - 0.02}
            color="#d97706"
            opacity="0.7"
            position={`${imgCenterX} ${imgCenterY} 0.005`}
            material="shader: flat; transparent: true; side: double"
          />

          {/* Frame inner dark edge */}
          <a-plane
            width={imgW + 0.03}
            height={imgH + 0.03}
            color="#78350f"
            opacity="0.9"
            position={`${imgCenterX} ${imgCenterY} 0.006`}
            material="shader: flat; transparent: true; side: double"
          />

          {/* Actual image */}
          <a-image
            src={event.urlImagen}
            width={imgW}
            height={imgH}
            position={`${imgCenterX} ${imgCenterY} 0.007`}
            crossOrigin="anonymous"
            material="shader: flat; transparent: true; side: double"
          />
        </>
      ) : (
        <a-entity position={`${imgCenterX} ${imgCenterY} 0.005`}>
          <a-plane
            width="0.7"
            height="0.5"
            color="#1e293b"
            opacity="0.5"
            material="shader: flat; transparent: true; side: double"
          >
            <a-text value="Sin imagen" align="center" color="#64748b" width="1.4" side="double" />
          </a-plane>
        </a-entity>
      )}

      {/* ═══════════════════════════════════════════════
          RIGHT SECTION — Description
          ═══════════════════════════════════════════════ */}
      <a-entity position={`${descCenterX} ${imgCenterY + 0.18} 0.005`}>
        {/* "Descripcion" label */}
        <a-text
          value="Descripcion"
          align="center"
          color="#fb923c"
          width="1.6"
          anchor="center"
          baseline="top"
          side="double"
        />
        {/* Decorative line under label */}
        <a-plane
          width="0.5"
          height="0.003"
          color="#f97316"
          opacity="0.4"
          position="0 -0.08 0"
          material="shader: flat; transparent: true; side: double"
        />
        {/* Description text */}
        <a-text
          value={description}
          align="center"
          color="#e2e8f0"
          width="1.3"
          wrap-count="28"
          anchor="center"
          baseline="top"
          position="0 -0.14 0"
          side="double"
        />
      </a-entity>

      {/* ═══════════════════════════════════════════════
          CLOSE BUTTON — top-right of header
          ═══════════════════════════════════════════════ */}
      <a-entity
        ref={closeBtnRef}
        className="clickable"
        position={`${PW/2 - 0.10} ${PH/2 - HEADER_H/2} 0.01`}
        geometry="primitive: plane; width: 0.13; height: 0.06"
        material="color: #dc2626; opacity: 0.6; shader: flat; transparent: true; side: double"
        animation__mouseenter="property: material.opacity; to: 0.9; startEvents: mouseenter; dur: 100"
        animation__mouseleave="property: material.opacity; to: 0.6; startEvents: mouseleave; dur: 150"
      >
        <a-text value="X" align="center" color="#fff" width="1.6" position="0 0 0.002" side="double" />
      </a-entity>

      {/* ═══════════════════════════════════════════════
          BOTTOM ACCENT & HINT
          ═══════════════════════════════════════════════ */}
      <a-plane
        width={PW}
        height="0.004"
        color="#f97316"
        opacity="0.25"
        position={`0 ${-PH/2 + 0.002} 0.003`}
        material="shader: flat; transparent: true; side: double"
      />
      <a-text
        value="Apunta a la X para cerrar o cualquier lugar fuera del cuadro"
        align="center"
        color="#64748b"
        width="0.9"
        position={`0 ${-PH/2 + 0.035} 0.005`}
        side="double"
      />
      {/* ═══════════════════════════════════════════════
          BACKDROP — large invisible clickable plane behind panel
          Click anywhere outside the panel content to close
          ═══════════════════════════════════════════════ */}
      <a-plane
        ref={backdropRef}
        className="clickable"
        width="8"
        height="6"
        color="#000"
        opacity="0"
        material="shader: flat; transparent: true; side: double"
        position="0 0 -0.02"
      />
    </a-entity>
  );
};