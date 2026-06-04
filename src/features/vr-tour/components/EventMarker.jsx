import 'aframe';

export const EventMarker = ({ event }) => {
  return (
    <a-entity
      position={event.position || "0 1 -3"}
      rotation={event.rotation || "0 0 0"}
      geometry="primitive: box; width: 0.8; height: 0.8; depth: 0.05"
      material="opacity: 0; transparent: true"
    >
      {event.urlImagen ? (
        <a-image
          src={event.urlImagen}
          width="0.75"
          height="0.75"
          position="0 0 0"
          crossOrigin="anonymous"
          crossorigin="anonymous"
          transparent="true"
          opacity="0.95"
        />
      ) : (
        <a-circle
          radius="0.22"
          color="#f97316"
          opacity="0.9"
        />
      )}

      {event.descripcion ? (
        <a-text
          value={event.descripcion}
          align="center"
          position="0 -0.55 0"
          color="#FFFFFF"
          width="2.5"
          wrap-count="24"
          scale="0.65 0.65 0.65"
        />
      ) : null}
    </a-entity>
  );
};