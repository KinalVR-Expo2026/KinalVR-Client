import { useState } from 'react';

export const AddConnectionModal = ({ isOpen, onClose, scene, availableScenes, onAddConnection }) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredScenes = availableScenes.filter(s => 
    s.subId !== scene?.subId && 
    (s.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.subId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[400px] rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold text-white">Añadir Nueva Conexión</h3>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded bg-slate-800 p-2 text-sm text-white border border-white/10 focus:border-orange-500 outline-none"
          />
        </div>
        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
          {filteredScenes.map((s) => (
            <button
              key={s._id || s.id}
              onClick={() => {
                onAddConnection(s.subId);
                onClose();
              }}
              className="flex flex-col rounded-lg border border-white/10 bg-slate-800 p-3 text-left transition-all hover:border-orange-500 hover:bg-slate-700 cursor-pointer"
            >
              <span className="text-sm font-bold text-white">{s.nombre || s.subId}</span>
              <span className="text-[10px] text-white/50 font-mono">{s.subId}</span>
            </button>
          ))}
          {availableScenes.length === 0 && (
            <p className="text-center text-sm text-white/50 py-4">Cargando escenarios...</p>
          )}
          {availableScenes.length > 0 && filteredScenes.length === 0 && (
            <p className="text-center text-sm text-white/50 py-4">No se encontraron escenarios</p>
          )}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
