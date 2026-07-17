import { useState } from 'react';

// Modal de edición del escenario que se está viendo (solo modo admin). Reutiliza el
// mismo lenguaje visual que EventModal (gradientes, borde naranja, animaciones).
// Campos editables:
//   - Nombre        -> subId       (identificador único)
//   - Descripción   -> ubicacion
//   - URL Cloudinary -> urlImagen
export const SceneInfoModal = ({ scene, onClose, onSave }) => {
  const [form, setForm] = useState({
    subId: scene?.subId || '',
    ubicacion: scene?.ubicacion || '',
    urlImagen: scene?.urlImagen || '',
  });
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  if (!scene) return null;

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleCopy = () => {
    if (!form.urlImagen) return;
    navigator.clipboard.writeText(form.urlImagen)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subId.trim() || !form.ubicacion.trim() || !form.urlImagen.trim()) {
      setMessageType('error');
      setMessage('Todos los campos son obligatorios');
      return;
    }
    setIsSaving(true);
    setMessage('');
    try {
      await onSave(scene.subId, {
        subId: form.subId.trim(),
        ubicacion: form.ubicacion,
        urlImagen: form.urlImagen.trim(),
      });
      setMessageType('success');
      setMessage('Cambios guardados en MongoDB');
      setTimeout(() => onClose(), 900);
    } catch (err) {
      setMessageType('error');
      setMessage(err?.response?.data?.message || 'Error al guardar en la base de datos');
    } finally {
      setIsSaving(false);
    }
  };

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
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl w-full flex flex-col md:flex-row overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.92) 50%, rgba(15,23,42,0.95) 100%)',
          borderRadius: '20px', border: '1px solid rgba(249,115,22,0.20)',
          animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1), shimmerGlow 4s ease-in-out infinite',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Vista previa 360 del escenario */}
        <div className="md:w-[45%] flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(15,23,42,0.8) 100%)', minHeight: '280px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', background: 'radial-gradient(circle at top left, rgba(249,115,22,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle at bottom right, rgba(249,115,22,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          {form.urlImagen ? (
            <img src={form.urlImagen} alt={form.ubicacion} crossOrigin="anonymous" className="max-h-[72vh] w-full object-cover relative z-10" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 relative z-10">
              <svg className="w-12 h-12 text-white/15" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span className="text-white/30 text-xs tracking-widest uppercase font-medium">Sin imagen disponible</span>
            </div>
          )}
        </div>

        {/* Panel de edición */}
        <div className="md:w-[55%] flex flex-col relative" style={{ borderLeft: '1px solid rgba(249,115,22,0.10)' }}>
          <div style={{ height: '3px', background: 'linear-gradient(90deg, rgba(249,115,22,0.6) 0%, rgba(251,146,60,0.3) 50%, rgba(249,115,22,0.1) 100%)' }} />
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.05) 100%)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Editar Escenario</h3>
            </div>
            <button type="button" onClick={onClose} className="group flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <svg className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="mx-5" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }} />

          <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4" style={{ maxHeight: '65vh' }}>
            {/* Nombre -> subId */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] text-orange-500 uppercase">Nombre (Sub ID · identificador único)</label>
              <input
                type="text"
                value={form.subId}
                onChange={setField('subId')}
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-mono text-white focus:border-orange-500 focus:outline-none"
                placeholder="ej. patio-principal"
              />
            </div>

            {/* Descripción -> ubicacion */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] text-orange-500 uppercase">Descripción (Ubicación)</label>
              <textarea
                rows={3}
                value={form.ubicacion}
                onChange={setField('ubicacion')}
                className="w-full resize-none rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-[13.5px] leading-relaxed text-white focus:border-orange-500 focus:outline-none"
                placeholder="ej. Patio Central"
              />
            </div>

            {/* URL de Cloudinary -> urlImagen */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] text-orange-500 uppercase">URL de Cloudinary</label>
              <textarea
                rows={2}
                value={form.urlImagen}
                onChange={setField('urlImagen')}
                className="w-full resize-none rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-[11px] font-mono break-all text-slate-200 focus:border-orange-500 focus:outline-none"
                placeholder="https://res.cloudinary.com/..."
              />
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleCopy} disabled={!form.urlImagen} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${copied ? 'bg-green-950/60 border border-green-500/50 text-green-400' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/15'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {copied
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m11.25 6.375l-3-3m0 0l-3 3m3-3v6" />}
                  </svg>
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <a href={form.urlImagen || undefined} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70 transition-all cursor-pointer ${form.urlImagen ? 'hover:bg-white/15' : 'pointer-events-none opacity-40'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Abrir
                </a>
              </div>
            </div>

            {/* Nivel (solo lectura, se edita con la guía de posición del minimapa) */}
            <div className="flex flex-col gap-0.5 pt-1">
              <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase">Nivel</span>
              <span className="text-xs text-white/70">{scene.nivel || '—'}</span>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between gap-3">
            {message ? (
              <span className={`text-[11px] font-medium ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message}</span>
            ) : (
              <span className="text-[10px] tracking-widest uppercase text-slate-400/50">Editas la escena actual</span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_100%)] hover:bg-[linear-gradient(135deg,_#fb923c_0%,_#f97316_100%)] disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider shadow-[0_4px_12px_rgba(234,88,12,0.3)] transition-all active:scale-98 cursor-pointer whitespace-nowrap"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
