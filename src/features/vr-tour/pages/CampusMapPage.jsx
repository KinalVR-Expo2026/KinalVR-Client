import { useState } from 'react';
import { EventsList } from '../components/EventsList';
import nivel1Plano from '../../../assets/img/NIVEL-1-KINAL.svg';
import nivel2Plano from '../../../assets/img/NIVEL 2 KINAL.svg';
import nivel3Plano from '../../../assets/img/NIVEL 3 KINAL.svg';
import nivel4Plano from '../../../assets/img/NIVEL 4 KINAL.svg';

const LEVEL_PLANS = {
  1: nivel1Plano,
  2: nivel2Plano,
  3: nivel3Plano,
  4: nivel4Plano,
};

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 25;

const TABS = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'eventos', label: 'Eventos' },
];

export const CampusMapPage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('mapa');
  const [activeLevel, setActiveLevel] = useState(3);
  const [zoom, setZoom] = useState(100);

  const isMapTab = activeTab === 'mapa';

  const handleZoom = (delta) => {
    setZoom((prev) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#eef1f6]"
      style={{ animation: 'campusMapFadeIn 0.25s ease-out' }}
    >
      <style>{`
        @keyframes campusMapFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[#151a30] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f9c846] font-[var(--font-display)] text-base font-semibold text-[#151a30]">
              K
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold tracking-[2px] text-white">KINAL</p>
              <p className="text-[10px] tracking-[1px] text-white/50">
                {isMapTab ? 'Mapa del campus' : 'Bitácora de eventos del campus'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[1px] transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-[0_2px_8px_rgba(234,88,12,0.35)]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isMapTab && (
          <p className="text-[11px] font-semibold uppercase tracking-[2px] text-orange-400">
            N.0{activeLevel} Nivel {activeLevel}
          </p>
        )}

        <div className="flex items-center gap-2">
          {isMapTab && (
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-1">
              <button
                type="button"
                onClick={() => handleZoom(-ZOOM_STEP)}
                disabled={zoom <= ZOOM_MIN}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              >
                −
              </button>
              <span className="w-9 text-center text-[10px] font-medium text-white/70">{zoom}%</span>
              <button
                type="button"
                onClick={() => handleZoom(ZOOM_STEP)}
                disabled={zoom >= ZOOM_MAX}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar mapa"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-red-400/40 hover:text-red-400 cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Cuerpo */}
      {isMapTab ? (
        <>
          <div className="relative flex flex-1">
            <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500 shadow-sm">
              N
            </div>

            <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
              <img
                src={LEVEL_PLANS[activeLevel]}
                alt={`Plano del nivel ${activeLevel}`}
                className="h-full w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            </div>

            {/* Selector de niveles */}
            <div className="flex flex-col justify-center gap-2 border-l border-slate-200 bg-white/60 px-3 py-4">
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
          </div>

          <footer className="bg-[#dfe3ea] px-4 py-2 text-center text-[11px] text-slate-500">
            Tocá un piso en el mapa para cambiar de nivel
          </footer>
        </>
      ) : (
        <EventsList />
      )}
    </div>
  );
};
