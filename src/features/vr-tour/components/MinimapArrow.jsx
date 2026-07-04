// Flecha de navegación (estilo Zelda) del minimapa: triángulo azul oscuro sólido
// con borde blanco. Fuente única del path/colores, reutilizada por el minimapa
// flotante (MinimapWidget) y por el mapa grande (MapInteractive). Quien la usa
// controla tamaño/rotación desde el elemento que la envuelve.
export const MinimapArrow = ({ className = 'h-full w-full overflow-visible drop-shadow-md' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <path
      d="M50 15 L72 82 L50 68 L28 82 Z"
      fill="#20346B"
      stroke="white"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
  </svg>
);
