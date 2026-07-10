export const EventModal = ({ modalEvent, onClose }) => {
  if (!modalEvent) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, rgba(0,0,0,0.82) 70%)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'modalFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shimmerGlow { 0%, 100% { box-shadow: 0 0 30px rgba(249,115,22,0.10), 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06); } 50% { box-shadow: 0 0 45px rgba(249,115,22,0.18), 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08); } }
      `}</style>
      <div
        className="max-w-4xl w-full max-h-[88vh] md:max-h-none flex flex-col md:flex-row overflow-y-auto md:overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.92) 50%, rgba(15,23,42,0.95) 100%)',
          borderRadius: '20px', border: '1px solid rgba(249,115,22,0.20)',
          animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1), shimmerGlow 4s ease-in-out infinite',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="md:w-[62%] flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.8) 100%)', minHeight: '280px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', background: 'radial-gradient(circle at top left, rgba(249,115,22,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle at bottom right, rgba(249,115,22,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          {modalEvent.urlImagen ? (
            <img src={modalEvent.urlImagen} alt="Evento" crossOrigin="anonymous" className="max-h-[72vh] object-contain relative z-10" style={{ padding: '20px', borderRadius: '16px', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 relative z-10">
              <svg className="w-12 h-12 text-white/15" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span className="text-white/30 text-xs tracking-widest uppercase font-medium">Sin imagen disponible</span>
            </div>
          )}
        </div>
        <div className="md:w-[38%] flex flex-col relative" style={{ borderLeft: '1px solid rgba(249,115,22,0.10)' }}>
          <div style={{ height: '3px', background: 'linear-gradient(90deg, rgba(249,115,22,0.6) 0%, rgba(251,146,60,0.3) 50%, rgba(249,115,22,0.1) 100%)' }} />
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.05) 100%)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Descripción</h3>
            </div>
            <button type="button" onClick={onClose} className="group flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }} />
          <div className="flex-1 overflow-auto px-5 py-4" style={{ maxHeight: '65vh' }}>
            <p className="text-[13.5px] leading-relaxed text-slate-200/85">{modalEvent.descripcion || 'Sin descripción'}</p>
          </div>
          <div className="px-5 py-3 border-t border-white/5">
            <p className="text-[10px] text-center tracking-widest uppercase text-slate-400/50">Click fuera para cerrar</p>
          </div>
        </div>
      </div>
    </div>
  );
};