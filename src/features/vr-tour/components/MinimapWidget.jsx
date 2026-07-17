import { BACKGROUND_CALIBRATION, LEVEL_PLANS, LEVEL_PLAN_ASPECT_CSS, LEVEL_TO_NUM, planForScene } from '../constants/campusMap';
import { MinimapArrow } from './MinimapArrow';

export const MinimapWidget = ({ currentScene, onOpen }) => {
  const hasPosition = Boolean(currentScene?.posicion && currentScene.posicion.length > 0);
  const planoSrc = hasPosition ? planForScene(currentScene) : null;
  const activeLevelNum = hasPosition ? LEVEL_TO_NUM[currentScene.nivel] : null;
  const bgCalc = activeLevelNum && activeLevelNum !== 1 ? BACKGROUND_CALIBRATION[activeLevelNum] : null;

  return (
    <button
      id="minimap-container"
      type="button"
      onClick={onOpen}
      aria-label="Abrir mapa del campus"
      className="absolute sm:left-6 sm:top-6 left-4 top-4 z-[99999] flex sm:h-[200px] sm:w-[200px] h-[95px] w-[95px] items-center justify-center overflow-hidden rounded-full border border-[#4b6ccc]/50 bg-[#0c0f1e]/80 shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-[#4b6ccc] hover:shadow-[0_0_18px_rgba(75,108,204,0.45)] active:scale-95 cursor-pointer animate-fade-in"
    >
      {hasPosition && planoSrc ? (
        <div
          style={{
            width: '450%',
            height: 'auto',
            aspectRatio: LEVEL_PLAN_ASPECT_CSS,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-${currentScene.posicion[0]}%, -${currentScene.posicion[1]}%)`,
          }}
        >
          <img
            src={LEVEL_PLANS[1]}
            alt="Plano del nivel 1"
            className={`absolute inset-0 w-full h-full object-contain${
              activeLevelNum !== 1 ? ' opacity-30 grayscale z-0' : ''
            }`}
          />

          {activeLevelNum !== 1 && bgCalc && (
            <img
              src={planoSrc}
              alt={`Ubicación actual: ${currentScene.ubicacion ?? ''}`}
              className="absolute inset-0 z-10 w-full h-full object-contain"
              style={{
                transform: `translate(${-parseFloat(bgCalc.x)}%, ${-parseFloat(bgCalc.y)}%) scale(${1 / bgCalc.scale})`,
              }}
            />
          )}
        </div>
      ) : (
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
      )}

      {hasPosition && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 sm:h-7 sm:w-7 h-5.5 w-5.5"
          style={{ transform: 'translate(-50%, -50%) rotate(var(--minimap-rotation, 0deg))' }}
        >
          <MinimapArrow />
        </div>
      )}
    </button>
  );
};
