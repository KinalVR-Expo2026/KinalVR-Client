import { useState } from 'react';
import { BACKGROUND_CALIBRATION, LEVEL_PLANS, LEVEL_TO_NUM } from '../constants/campusMap';
import { MinimapArrow } from './MinimapArrow';

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
  scenes = [],
  onTeleport,
}) => {
  const [teleportTarget, setTeleportTarget] = useState(null);
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
              className="absolute z-20 h-8 w-8"
              style={{
                left: `${tempPos[0]}%`,
                top: `${tempPos[1]}%`,
                transform: `translate(-50%, -50%) rotate(${tempAngle}deg)`,
              }}
            >
              <MinimapArrow />
            </div>
          )}

          {isMapTab && currentScene?.posicion && activeLevel === LEVEL_TO_NUM[currentScene.nivel] && (
            <div
              className="pointer-events-none absolute z-20 h-8 w-8"
              style={{
                left: `${currentScene.posicion[0]}%`,
                top: `${currentScene.posicion[1]}%`,
                transform: `translate(-50%, -50%) rotate(${userRotation})`,
              }}
            >
              <MinimapArrow />
            </div>
          )}

          {/* Minimalist Scene Dots on current level */}
          {isMapTab && scenes
            .filter((s) => s.nivel && LEVEL_TO_NUM[s.nivel] === activeLevel && s.posicion && s.posicion.length >= 2 && !(s.posicion[0] === 0 && s.posicion[1] === 0))
            .map((s) => {
              // Exclude active scene from showing dot (since arrow covers it)
              const isActive = currentScene && s.subId === currentScene.subId && activeLevel === LEVEL_TO_NUM[currentScene.nivel];
              if (isActive) return null;

              return (
                <div
                  key={s.subId}
                  className="absolute z-20 cursor-pointer pointer-events-auto group"
                  style={{
                    left: `${s.posicion[0]}%`,
                    top: `${s.posicion[1]}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => setTeleportTarget(s)}
                  onDoubleClick={() => onTeleport?.(s.subId)}
                >
                  {/* Minimalist Dot Node */}
                  <div className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400/30 animate-pulse"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 border border-white shadow-sm transition-transform duration-200 group-hover:scale-125 group-hover:bg-orange-400"></span>
                  </div>

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 bg-slate-900/90 text-white text-[10px] font-semibold py-1 px-2 rounded-lg whitespace-nowrap shadow-md border border-white/10 backdrop-blur-sm pointer-events-none transition-all">
                    {s.ubicacion}
                  </div>
                </div>
              );
            })}
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

      {/* Minimalist Confirmation Modal Overlay */}
      {teleportTarget && (
        <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto animate-fade-in">
          <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-5 w-72 text-center shadow-2xl flex flex-col gap-4 animate-scale-up">
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">Confirmar Viaje</h4>
              <p className="text-sm font-semibold text-white mt-1.5">{teleportTarget.ubicacion}</p>
              <p className="text-[10px] text-white/50 mt-1">¿Deseas viajar a esta zona del campus?</p>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setTeleportTarget(null)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onTeleport?.(teleportTarget.subId);
                  setTeleportTarget(null);
                }}
                className="flex-1 rounded-lg bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_100%)] hover:bg-[linear-gradient(135deg,_#fb923c_0%,_#f97316_100%)] py-2 text-xs font-semibold text-white uppercase tracking-wider shadow-[0_4px_12px_rgba(234,88,12,0.3)] transition-all cursor-pointer"
              >
                Viajar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
