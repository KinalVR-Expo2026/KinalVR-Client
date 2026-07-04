import { useState } from 'react';
import { createScene } from '../../../shared/api/admin';

export const CreateSceneModal = ({ isOpen, onClose, onSceneCreated }) => {
  const [newSceneData, setNewSceneData] = useState({ subId: '', ubicacion: '', nivel: 'PRIMER NIVEL', imagen: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSceneData.subId || !newSceneData.ubicacion || !newSceneData.nivel || !newSceneData.imagen) {
      setError('Todos los campos son requeridos');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('subId', newSceneData.subId);
      formData.append('ubicacion', newSceneData.ubicacion);
      formData.append('nivel', newSceneData.nivel);
      formData.append('imagen', newSceneData.imagen);
      
      const newScene = await createScene(formData);
      
      alert(`Escenario ${newScene.subId} creado exitosamente!`);
      
      if (typeof onSceneCreated === 'function') {
        onSceneCreated(newScene);
      }
      
      setNewSceneData({ subId: '', ubicacion: '', nivel: 'PRIMER NIVEL', imagen: null });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el escenario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-[450px] rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-white">Crear Nuevo Escenario</h3>
        
        {error && <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded">{error}</div>}
        
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase text-white/70">Sub ID (Identificador único)</label>
          <input type="text" required value={newSceneData.subId} onChange={e => setNewSceneData({...newSceneData, subId: e.target.value})} className="rounded bg-slate-800 p-2 text-sm text-white border border-white/10 focus:border-blue-500 outline-none" placeholder="ej. patio-principal" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase text-white/70">Ubicación (Nombre amigable)</label>
          <input type="text" required value={newSceneData.ubicacion} onChange={e => setNewSceneData({...newSceneData, ubicacion: e.target.value})} className="rounded bg-slate-800 p-2 text-sm text-white border border-white/10 focus:border-blue-500 outline-none" placeholder="ej. Patio Central" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase text-white/70">Nivel</label>
          <select value={newSceneData.nivel} onChange={e => setNewSceneData({...newSceneData, nivel: e.target.value})} className="rounded bg-slate-800 p-2 text-sm text-white border border-white/10 focus:border-blue-500 outline-none">
            <option value="PRIMER NIVEL">PRIMER NIVEL</option>
            <option value="SEGUNDO NIVEL">SEGUNDO NIVEL</option>
            <option value="TERCER NIVEL">TERCER NIVEL</option>
            <option value="CUARTO NIVEL">CUARTO NIVEL</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase text-white/70">Imagen 360 (Archivo)</label>
          <input type="file" required accept="image/*" onChange={e => setNewSceneData({...newSceneData, imagen: e.target.files[0]})} className="text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600" />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creando...' : 'Crear Escenario'}
          </button>
        </div>
      </form>
    </div>
  );
};
