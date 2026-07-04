import { useState } from 'react';
import { createEvent as apiCreateEvent } from '../../../shared/api/admin';

export const CreateEventModal = ({ isOpen, onClose, scene, onEventCreated }) => {
  const [newEventData, setNewEventData] = useState({ urlImagen: '', descripcion: '', sourceMode: 'file', imagen: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scene) return;
    
    const { descripcion, sourceMode, urlImagen, imagen } = newEventData;
    if (!descripcion) {
      setError('La descripción es obligatoria');
      return;
    }
    
    if (sourceMode === 'file' && !imagen) {
      setError('Debe seleccionar un archivo de imagen');
      return;
    }
    
    if (sourceMode === 'url' && !urlImagen) {
      setError('Debe ingresar un link de Cloudinary o URL');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      let payload;
      if (sourceMode === 'file') {
        payload = new FormData();
        payload.append('idEscenario', scene._id || scene.id);
        payload.append('descripcion', descripcion);
        payload.append('imagen', imagen);
        payload.append('position', '0 1.6 -3');
        payload.append('rotation', '0 0 0');
      } else {
        payload = {
          idEscenario: scene._id || scene.id,
          descripcion,
          urlImagen,
          position: '0 1.6 -3',
          rotation: '0 0 0'
        };
      }
      
      const createdEvent = await apiCreateEvent(payload);
      
      alert('¡Evento creado exitosamente! Se ha posicionado al frente tuyo en el entorno 3D. Utiliza los controles para acomodarlo.');
      
      if (typeof onEventCreated === 'function') {
        onEventCreated(createdEvent);
      }
      
      setNewEventData({ urlImagen: '', descripcion: '', sourceMode: 'file', imagen: null });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al crear el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-[450px] rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-white">Crear Nuevo Evento</h3>
        
        {error && <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded">{error}</div>}
        
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase text-white/70">Descripción del Evento</label>
          <textarea required value={newEventData.descripcion} onChange={e => setNewEventData({...newEventData, descripcion: e.target.value})} className="rounded bg-slate-800 p-2 text-sm text-white border border-white/10 focus:border-purple-500 outline-none h-20 resize-none" placeholder="Descripción del evento..." />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase text-white/70">Origen de la Imagen</label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setNewEventData({...newEventData, sourceMode: 'file'})}
              className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-all cursor-pointer ${newEventData.sourceMode === 'file' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-white/60 border-white/10 hover:bg-slate-700'}`}
            >
              Subir Archivo
            </button>
            <button
              type="button"
              onClick={() => setNewEventData({...newEventData, sourceMode: 'url'})}
              className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-all cursor-pointer ${newEventData.sourceMode === 'url' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-white/60 border-white/10 hover:bg-slate-700'}`}
            >
              Link Cloudinary / URL
            </button>
          </div>
        </div>

        {newEventData.sourceMode === 'file' ? (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase text-white/70">Imagen (Archivo)</label>
            <input type="file" required={newEventData.sourceMode === 'file'} accept="image/*" onChange={e => setNewEventData({...newEventData, imagen: e.target.files[0]})} className="text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase text-white/70">Link de Cloudinary o URL de Imagen</label>
            <input type="url" required={newEventData.sourceMode === 'url'} value={newEventData.urlImagen} onChange={e => setNewEventData({...newEventData, urlImagen: e.target.value})} className="rounded bg-slate-800 p-2 text-sm text-white border border-white/10 focus:border-purple-500 outline-none" placeholder="https://res.cloudinary.com/..." />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setError('');
              setNewEventData({ urlImagen: '', descripcion: '', sourceMode: 'file', imagen: null });
              onClose();
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creando...' : 'Crear Evento'}
          </button>
        </div>
      </form>
    </div>
  );
};
