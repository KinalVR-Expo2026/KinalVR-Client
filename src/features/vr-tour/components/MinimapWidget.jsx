export const MinimapWidget = ({ onOpen }) => {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Abrir mapa del campus"
      className="absolute left-6 top-6 z-40 flex h-[240px] w-[240px] items-center justify-center rounded-full border border-[#4b6ccc]/50 bg-[#0c0f1e]/80 shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-[#4b6ccc] hover:shadow-[0_0_18px_rgba(75,108,204,0.45)] active:scale-95 cursor-pointer animate-fade-in"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(75,108,204,0.35)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Plano miniatura (esquemático, marcador de posición) */}
        <g stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" fill="none" strokeLinejoin="round">
          <rect x="30" y="28" width="16" height="14" />
          <rect x="48" y="24" width="14" height="18" />
          <path d="M46 42 L46 50 L62 50 L62 42" />
        </g>

        {/* Cono de orientación */}
        <path d="M50 50 L38 22 A15 15 0 0 1 62 22 Z" fill="url(#minimapCone)" opacity="0.85" />
        <circle cx="50" cy="50" r="3" fill="#e0e4eb" />

        <defs>
          <linearGradient id="minimapCone" x1="50" y1="50" x2="50" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4b6ccc" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#4b6ccc" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      </svg>
    </button>
  );
};
