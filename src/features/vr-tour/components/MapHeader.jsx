import { TABS, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../constants/campusMap';

export const MapHeader = ({
  activeTab,
  setActiveTab,
  activeLevel,
  zoom,
  handleZoom,
  onClose,
  isMapTab,
  isAdminTab,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 bg-[#151a30] px-4 py-3 sm:px-6">
      <div className="flex items-center gap-4">
        {/* 
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
        */}

        {/* 
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
        */}
      </div>

      {(isMapTab || isAdminTab) && (
        <p className="text-[11px] font-semibold uppercase tracking-[2px] text-orange-400">
          N.0{activeLevel} Nivel {activeLevel}
        </p>
      )}

      <div className="flex items-center gap-2">
        {(isMapTab || isAdminTab) && (
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
  );
};
