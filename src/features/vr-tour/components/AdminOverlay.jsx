import { useState, useEffect } from 'react';
import { useTourStore } from '../store/useTourStore';
import { getScenesList } from '../../../shared/api/admin';
import { CreateSceneModal } from './CreateSceneModal';
import { CreateEventModal } from './CreateEventModal';
import { AddConnectionModal } from './AddConnectionModal';
import { AdminCoordPanel } from './AdminCoordPanel';

export const AdminOverlay = ({ scene, events, updateEventCoords, isFullscreen, toggleFullscreen }) => {
  const isAdminMode = useTourStore((state) => state.isAdminMode);
  const setAdminMode = useTourStore((state) => state.setAdminMode);
  const addConnection = useTourStore((state) => state.addConnection);
  
  const addEventToSceneCache = useTourStore((state) => state.addEventToSceneCache);
  const setSelectedEventId = useTourStore((state) => state.setSelectedEventId);

  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [availableScenes, setAvailableScenes] = useState([]);

  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const handleEventCreated = (createdEvent) => {
    addEventToSceneCache(scene.subId, createdEvent);
    setSelectedEventId(createdEvent._id || createdEvent.id);
  };

  useEffect(() => {
    if (isAddingConnection && availableScenes.length === 0) {
      getScenesList().then(data => setAvailableScenes(data)).catch(console.error);
    }
  }, [isAddingConnection, availableScenes.length]);

  const handleAddConnection = (targetSubId) => {
    if (scene) {
      addConnection(scene.subId, targetSubId);
      setIsAddingConnection(false);
    }
  };

  return (
    <>
      <div className="absolute top-6 right-6 z-40 flex flex-col items-end gap-2">
        {isAdminMode && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsCreatingScene(true)} className="flex items-center gap-2 rounded-full border border-blue-500/50 bg-blue-950/40 px-4 py-2 text-[10px] font-semibold text-blue-400 tracking-[1.5px] uppercase backdrop-blur-md transition-all duration-300 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:bg-blue-900/60 cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Crear Escenario
            </button>
            <button type="button" onClick={() => setIsCreatingEvent(true)} className="flex items-center gap-2 rounded-full border border-purple-500/50 bg-purple-950/40 px-4 py-2 text-[10px] font-semibold text-purple-400 tracking-[1.5px] uppercase backdrop-blur-md transition-all duration-300 shadow-[0_4px_12px_rgba(168,85,247,0.3)] hover:bg-purple-900/60 cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Añadir Evento
            </button>
            <button type="button" onClick={() => setIsAddingConnection(true)} className="flex items-center gap-2 rounded-full border border-green-500/50 bg-green-950/40 px-4 py-2 text-[10px] font-semibold text-green-400 tracking-[1.5px] uppercase backdrop-blur-md transition-all duration-300 shadow-[0_4px_12px_rgba(34,197,94,0.3)] hover:bg-green-900/60 cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Añadir Conexión
            </button>
          </div>
        )}
        <button type="button" onClick={() => setAdminMode(!isAdminMode)} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-medium tracking-[1.5px] uppercase backdrop-blur-md transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer ${isAdminMode ? 'border-orange-500/50 bg-orange-950/40 text-orange-400 font-semibold shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'border-white/10 bg-slate-950/45 text-[#e0e4eb] hover:border-white/30 hover:bg-white/5'}`}>
          <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isAdminMode ? 'rotate-12 scale-110' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {isAdminMode ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h16.5a1.5 1.5 0 001.5-1.5V12a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 12v8.25a1.5 1.5 0 001.5 1.5z" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />}
          </svg>
          {isAdminMode ? 'Salir Admin' : 'Modo Admin'}
        </button>
        <button type="button" onClick={() => toggleFullscreen().catch(() => {})} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/45 text-[#e0e4eb] shadow-[0_4px_12px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 cursor-pointer hover:border-white/30 hover:bg-white/5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={isFullscreen ? 'M9 9H5V5m10 0h4v4M5 15h4v4m10-4h-4v4' : 'M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M8 21H5a2 2 0 01-2-2v-3m18 0v3a2 2 0 01-2 2h-3'} />
          </svg>
        </button>
      </div>

      {isAdminMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/50 backdrop-blur-md px-4 py-1.5 text-[9px] font-semibold uppercase tracking-[2px] text-red-400 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Modo Admin Activo
          </div>
        </div>
      )}

      <AdminCoordPanel
        scene={scene}
        events={events}
        updateEventCoords={updateEventCoords}
      />

      <AddConnectionModal
        isOpen={isAddingConnection}
        onClose={() => setIsAddingConnection(false)}
        scene={scene}
        availableScenes={availableScenes}
        onAddConnection={handleAddConnection}
      />

      <CreateSceneModal
        isOpen={isCreatingScene}
        onClose={() => setIsCreatingScene(false)}
        onSceneCreated={(newScene) => {
          getScenesList().then(data => setAvailableScenes(data)).catch(console.error);
        }}
      />

      <CreateEventModal
        isOpen={isCreatingEvent}
        onClose={() => setIsCreatingEvent(false)}
        scene={scene}
        onEventCreated={handleEventCreated}
      />
    </>
  );
};