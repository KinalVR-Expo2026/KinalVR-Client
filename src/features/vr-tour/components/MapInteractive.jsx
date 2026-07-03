import { LEVEL_PLANS, LEVEL_TO_NUM } from '../constants/campusMap';

export const MapInteractive = ({
  activeLevel,
  setActiveLevel,
  zoom,
  handleMapClick,
  tempPos,
  tempAngle,
  isAdminTab,
  isMapTab,
  currentScene,
  userRotation,
}) => {
  return (
    <>
      <div className="relative flex flex-1 min-w-0 overflow-auto p-6">
        {isMapTab && (
          <div className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500 shadow-sm">
            N
          </div>
        )}

        <div className="relative m-auto transition-all duration-200 shrink-0" style={{ width: `${zoom}%` }}>
          <img
            src={LEVEL_PLANS[activeLevel]}
            alt={`Plano del nivel ${activeLevel}`}
            className="w-full h-auto object-contain block"
            onClick={handleMapClick}
          />
          {isAdminTab && tempPos && (
            <div
              className="pointer-events-none absolute flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-t-4 border-t-red-700 border-red-500 bg-red-500/20 shadow-sm"
              style={{
                left: `${tempPos[0]}%`,
                top: `${tempPos[1]}%`,
                transform: `translate(-50%, -50%) rotate(${tempAngle}deg)`,
              }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-red-600"></div>
            </div>
          )}

          {isMapTab && currentScene?.posicion && activeLevel === LEVEL_TO_NUM[currentScene.nivel] && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8"
              style={{
                left: `${currentScene.posicion[0]}%`,
                top: `${currentScene.posicion[1]}%`,
                transform: `translate(-50%, -50%) rotate(${userRotation})`,
              }}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible drop-shadow-md">
                <path
                  d="M50 15 L72 82 L50 68 L28 82 Z"
                  fill="#20346B"
                  stroke="white"
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Selector de niveles */}
      {isMapTab && (
        <div className="flex flex-shrink-0 z-10 flex-col justify-center gap-2 border-l border-slate-200 bg-white/60 px-3 py-4">
          {[4, 3, 2, 1].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveLevel(level)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeLevel === level
                  ? 'bg-orange-500 text-white shadow-[0_4px_12px_rgba(234,88,12,0.35)]'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
