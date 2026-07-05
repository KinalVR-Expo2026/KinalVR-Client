import { LEVEL_PLANS, LEVEL_TO_NUM } from '../constants/campusMap';
import { MinimapArrow } from './MinimapArrow';

// Estos offsets asumen que LEVEL_PLANS[2..4] comparten el mismo lienzo/aspect
// ratio que LEVEL_PLANS[1] (ver LEVEL_PLAN_ASPECT_CSS en constants/campusMap.js).
// Si alguno se reexporta con otro tamaño, object-contain le mete letterboxing
// y estos números dejan de alinear con el nivel 1.
const BACKGROUND_CALIBRATION = {
  2: { scale: 2.09, x: '-21.5%', y: '-1%' },
  3: { scale: 2.19, x: '-20%', y: '-2.5%' },
  4: { scale: 4.97, x: '-9%', y: '5.5%' },
};

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
  const calc = activeLevel !== 1 ? BACKGROUND_CALIBRATION[activeLevel] : null;

  return (
    <>
      <div className="relative flex flex-1 min-w-0 overflow-auto p-6">
        {isMapTab && (
          <div className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500 shadow-sm">
            N
          </div>
        )}

        <div
          className="relative m-auto transition-all duration-200 shrink-0"
          style={{ width: `${zoom}%` }}
          onClick={handleMapClick}
        >
          <img
            src={LEVEL_PLANS[1]}
            alt="Plano del nivel 1"
            className={`relative z-0 block h-auto w-full object-contain${
              activeLevel !== 1 ? ' opacity-40 grayscale brightness-75' : ''
            }`}
          />

          {activeLevel !== 1 && (
            <img
              src={LEVEL_PLANS[activeLevel]}
              alt={`Plano del nivel ${activeLevel}`}
              className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
              style={{
                transform: `translate(${-parseFloat(calc.x)}%, ${-parseFloat(calc.y)}%) scale(${1 / calc.scale})`,
              }}
            />
          )}

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
              className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-8 w-8"
              style={{
                left: `${currentScene.posicion[0]}%`,
                top: `${currentScene.posicion[1]}%`,
                transform: `translate(-50%, -50%) rotate(${userRotation})`,
              }}
            >
              <MinimapArrow />
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
