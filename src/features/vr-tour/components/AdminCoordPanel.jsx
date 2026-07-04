import { useState, useEffect } from 'react';
import { useTourStore } from '../store/useTourStore';
import { updateEvent as apiUpdateEvent, deleteEvent as apiDeleteEvent } from '../../../shared/api/admin';

export const AdminCoordPanel = ({ scene, events, updateEventCoords }) => {
  const isAdminMode = useTourStore((state) => state.isAdminMode);
  const selectedConnectionId = useTourStore((state) => state.selectedConnectionId);
  const setSelectedConnectionId = useTourStore((state) => state.setSelectedConnectionId);
  const selectedEventId = useTourStore((state) => state.selectedEventId);
  const setSelectedEventId = useTourStore((state) => state.setSelectedEventId);
  const updateConnectionCoords = useTourStore((state) => state.updateConnectionCoords);
  const saveSceneConnections = useTourStore((state) => state.saveSceneConnections);
  const removeConnection = useTourStore((state) => state.removeConnection);
  const removeEventFromSceneCache = useTourStore((state) => state.removeEventFromSceneCache);
  const updateEventInSceneCache = useTourStore((state) => state.updateEventInSceneCache);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveType, setSaveType] = useState('');

  const selectedConexion = scene?.conexiones.find((c) => c.targetSubId === selectedConnectionId);
  const selectedEvent = events.find(ev => (ev._id || ev.id) === selectedEventId);

  // Teclado para conexiones
  useEffect(() => {
    if (!isAdminMode || !selectedConnectionId || !scene) return;
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const currentConn = scene.conexiones.find(c => c.targetSubId === selectedConnectionId);
      if (!currentConn) return;

      let [x, y, z] = currentConn.position.split(' ').map(Number);
      let [rx, ry, rz] = currentConn.rotation.split(' ').map(Number);
      let changed = false;

      if (e.shiftKey) {
        if (['ArrowLeft', 'a', 'A'].includes(e.key)) { ry = (ry - 5) % 360; changed = true; }
        else if (['ArrowRight', 'd', 'D'].includes(e.key)) { ry = (ry + 5) % 360; changed = true; }
        else if (['ArrowUp', 'w', 'W'].includes(e.key)) { rx = (rx - 5) % 360; changed = true; }
        else if (['ArrowDown', 's', 'S'].includes(e.key)) { rx = (rx + 5) % 360; changed = true; }
        else if (['q', 'Q'].includes(e.key)) { rz = (rz - 5) % 360; changed = true; }
        else if (['e', 'E'].includes(e.key)) { rz = (rz + 5) % 360; changed = true; }
      } else {
        if (['ArrowLeft', 'a', 'A'].includes(e.key)) { x -= 0.05; changed = true; }
        else if (['ArrowRight', 'd', 'D'].includes(e.key)) { x += 0.05; changed = true; }
        else if (['ArrowUp', 'w', 'W'].includes(e.key)) { z -= 0.05; changed = true; }
        else if (['ArrowDown', 's', 'S'].includes(e.key)) { z += 0.05; changed = true; }
        else if (['PageUp', 'q', 'Q'].includes(e.key)) { y += 0.05; changed = true; }
        else if (['PageDown', 'e', 'E'].includes(e.key)) { y -= 0.05; changed = true; }
      }

      if (changed) {
        e.preventDefault();
        updateConnectionCoords(scene.subId, selectedConnectionId, {
          position: `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`,
          rotation: `${rx} ${ry} ${rz}`
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMode, selectedConnectionId, scene, updateConnectionCoords]);

  // Teclado para eventos
  useEffect(() => {
    if (!isAdminMode || !selectedEvent) return;
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      let [x, y, z] = (selectedEvent.position || '0 0 0').split(' ').map(Number);
      let [rx, ry, rz] = (selectedEvent.rotation || '0 0 0').split(' ').map(Number);
      let changed = false;

      if (e.shiftKey) {
        if (['ArrowLeft', 'a', 'A'].includes(e.key)) { ry = (ry - 5) % 360; changed = true; }
        else if (['ArrowRight', 'd', 'D'].includes(e.key)) { ry = (ry + 5) % 360; changed = true; }
        else if (['ArrowUp', 'w', 'W'].includes(e.key)) { rx = (rx - 5) % 360; changed = true; }
        else if (['ArrowDown', 's', 'S'].includes(e.key)) { rx = (rx + 5) % 360; changed = true; }
        else if (['q', 'Q'].includes(e.key)) { rz = (rz - 5) % 360; changed = true; }
        else if (['e', 'E'].includes(e.key)) { rz = (rz + 5) % 360; changed = true; }
      } else {
        if (['ArrowLeft', 'a', 'A'].includes(e.key)) { x -= 0.05; changed = true; }
        else if (['ArrowRight', 'd', 'D'].includes(e.key)) { x += 0.05; changed = true; }
        else if (['ArrowUp', 'w', 'W'].includes(e.key)) { z -= 0.05; changed = true; }
        else if (['ArrowDown', 's', 'S'].includes(e.key)) { z += 0.05; changed = true; }
        else if (['PageUp', 'q', 'Q'].includes(e.key)) { y += 0.05; changed = true; }
        else if (['PageDown', 'e', 'E'].includes(e.key)) { y -= 0.05; changed = true; }
      }

      if (changed) {
        e.preventDefault();
        updateEventCoords(selectedEvent._id || selectedEvent.id, {
          position: `${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`,
          rotation: `${rx} ${ry} ${rz}`
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminMode, selectedEvent, updateEventCoords]);

  if (!isAdminMode || (!selectedConexion && !selectedEvent)) return null;

  const [posX, posY, posZ] = selectedConexion ? selectedConexion.position.split(' ').map(Number) : [0, 0, 0];
  const [rotX, rotY, rotZ] = selectedConexion ? selectedConexion.rotation.split(' ').map(Number) : [0, 0, 0];

  const handleCoordChange = (type, axis, value) => {
    if (!selectedConexion || !scene) return;
    let newPos = [...[posX, posY, posZ]];
    let newRot = [...[rotX, rotY, rotZ]];
    const val = parseFloat(value);
    if (isNaN(val)) return;

    if (type === 'position') {
      if (axis === 'x') newPos[0] = val;
      if (axis === 'y') newPos[1] = val;
      if (axis === 'z') newPos[2] = val;
    } else {
      if (axis === 'x') newRot[0] = val;
      if (axis === 'y') newRot[1] = val;
      if (axis === 'z') newRot[2] = val;
    }

    updateConnectionCoords(scene.subId, selectedConnectionId, {
      position: `${newPos[0].toFixed(3)} ${newPos[1].toFixed(3)} ${newPos[2].toFixed(3)}`,
      rotation: `${newRot[0]} ${newRot[1]} ${newRot[2]}`
    });
  };

  const handleEventCoordChange = (type, axis, value) => {
    if (!selectedEvent) return;
    const [epx, epy, epz] = (selectedEvent.position || '0 0 0').split(' ').map(Number);
    const [erx, ery, erz] = (selectedEvent.rotation || '0 0 0').split(' ').map(Number);
    
    let newPos = [epx, epy, epz];
    let newRot = [erx, ery, erz];
    const val = parseFloat(value);
    if (isNaN(val)) return;

    if (type === 'position') {
      if (axis === 'x') newPos[0] = val;
      if (axis === 'y') newPos[1] = val;
      if (axis === 'z') newPos[2] = val;
    } else {
      if (axis === 'x') newRot[0] = val;
      if (axis === 'y') newRot[1] = val;
      if (axis === 'z') newRot[2] = val;
    }

    updateEventCoords(selectedEvent._id || selectedEvent.id, {
      position: `${newPos[0].toFixed(3)} ${newPos[1].toFixed(3)} ${newPos[2].toFixed(3)}`,
      rotation: `${newRot[0]} ${newRot[1]} ${newRot[2]}`
    });
  };

  const handleSave = async () => {
    if (!scene) return;
    setIsSaving(true);
    setSaveMessage('');
    try {
      await saveSceneConnections(scene.subId);
      setSaveType('success');
      setSaveMessage('Posición guardada exitosamente en MongoDB');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveType('error');
      setSaveMessage('Error al guardar en base de datos');
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEventSave = async () => {
    if (!selectedEvent) return;
    setIsSaving(true);
    setSaveMessage('');
    try {
      const id = selectedEvent._id || selectedEvent.id;
      const payload = { position: selectedEvent.position, rotation: selectedEvent.rotation };
      await apiUpdateEvent(id, payload);
      
      updateEventInSceneCache(scene.subId, id, payload);
      
      setSaveType('success');
      setSaveMessage('Evento guardado exitosamente en MongoDB');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveType('error');
      setSaveMessage('Error al guardar evento en base de datos');
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConnection = async () => {
    if (!scene || !selectedConexion) return;
    if (!window.confirm(`¿Estás seguro de que deseas borrar la conexión hacia ${selectedConexion.targetSubId}?`)) return;
    
    removeConnection(scene.subId, selectedConexion.targetSubId);
    
    try {
      await saveSceneConnections(scene.subId);
    } catch (err) {
      console.error(err);
      alert('Error al borrar la conexión en la base de datos');
    }
  };

  const handleDeleteEvent = async () => {
    if (!scene || !selectedEvent) return;
    if (!window.confirm('¿Estás seguro de que deseas borrar este evento?')) return;
    
    setIsSaving(true);
    setSaveMessage('');
    try {
      const id = selectedEvent._id || selectedEvent.id;
      await apiDeleteEvent(id);
      
      removeEventFromSceneCache(scene.subId, id);
      setSelectedEventId(null);
      
      setSaveType('success');
      setSaveMessage('Evento eliminado exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveType('error');
      setSaveMessage('Error al eliminar el evento de la base de datos');
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const renderCoordinateInput = (type, axis, val, step, isEvent = false) => {
    const handler = isEvent ? handleEventCoordChange : handleCoordChange;
    return (
      <div className="flex items-center gap-1">
        <span className="w-3 text-center text-[10px] font-bold text-white/40 uppercase">{axis}</span>
        <button type="button" onClick={() => handler(type, axis, val - step)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">-</button>
        <input type="number" step={step} value={isNaN(val) ? 0 : Number(val.toFixed(3))} onChange={(e) => handler(type, axis, e.target.value)} className="w-14 rounded border border-white/10 bg-slate-900/60 py-0.5 text-center text-[11px] font-semibold text-white focus:border-orange-500 focus:outline-none" />
        <button type="button" onClick={() => handler(type, axis, val + step)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">+</button>
      </div>
    );
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-3xl rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.75)] animate-fade-in flex flex-col lg:flex-row gap-4 justify-between">
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">{selectedConexion ? 'Ajustar Conexión' : 'Ajustar Evento'}</h3>
            {selectedConexion ? (
              <p className="text-[10px] text-white/50">Hacia: <span className="text-orange-400 font-mono font-medium">{selectedConexion.targetSubId}</span></p>
            ) : (
              <p className="text-[10px] text-white/50">Evento: <span className="text-orange-400 font-mono font-medium">{(selectedEvent && (selectedEvent._id || selectedEvent.id)) || '—'}</span></p>
            )}
          </div>
          <button type="button" onClick={() => { selectedConexion ? setSelectedConnectionId(null) : setSelectedEventId(null); }} className="text-[10px] text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded px-2 py-0.5 transition-all cursor-pointer">
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-orange-500 uppercase">Posición (x, y, z)</span>
            <div className="flex flex-wrap gap-2.5">
              {selectedConexion ? (
                <>
                  {renderCoordinateInput('position', 'x', posX, 0.05)}
                  {renderCoordinateInput('position', 'y', posY, 0.05)}
                  {renderCoordinateInput('position', 'z', posZ, 0.05)}
                </>
              ) : (
                (() => {
                  const [epx, epy, epz] = selectedEvent ? (selectedEvent.position || '0 0 0').split(' ').map(Number) : [0, 0, 0];
                  return (
                    <>
                      {renderCoordinateInput('position', 'x', epx, 0.05, true)}
                      {renderCoordinateInput('position', 'y', epy, 0.05, true)}
                      {renderCoordinateInput('position', 'z', epz, 0.05, true)}
                    </>
                  );
                })()
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-orange-500 uppercase">Rotación (x, y, z)</span>
            <div className="flex flex-wrap gap-2.5">
              {selectedConexion ? (
                <>
                  {renderCoordinateInput('rotation', 'x', rotX, 5)}
                  {renderCoordinateInput('rotation', 'y', rotY, 5)}
                  {renderCoordinateInput('rotation', 'z', rotZ, 5)}
                </>
              ) : (
                (() => {
                  const [erx, ery, erz] = selectedEvent ? (selectedEvent.rotation || '0 0 0').split(' ').map(Number) : [0, 0, 0];
                  return (
                    <>
                      {renderCoordinateInput('rotation', 'x', erx, 5, true)}
                      {renderCoordinateInput('rotation', 'y', ery, 5, true)}
                      {renderCoordinateInput('rotation', 'z', erz, 5, true)}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row lg:flex-col justify-between gap-3 lg:w-72 border-t lg:border-t-0 lg:border-l border-white/5 pt-3 lg:pt-0 lg:pl-4">
        <div className="rounded-lg border border-white/5 bg-slate-900/40 p-2 text-[9px] text-white/50 flex-1">
          <span className="block font-semibold text-white/70 uppercase tracking-wider mb-1">Guía Teclado</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div><kbd className="bg-white/10 px-0.5 rounded">A</kbd>/<kbd className="bg-white/10 px-0.5 rounded">D</kbd> Mover X</div>
            <div><kbd className="bg-white/10 px-0.5 rounded">W</kbd>/<kbd className="bg-white/10 px-0.5 rounded">S</kbd> Mover Z</div>
            <div><kbd className="bg-white/10 px-0.5 rounded">Q</kbd>/<kbd className="bg-white/10 px-0.5 rounded">E</kbd> Mover Y</div>
            <div><kbd className="bg-white/10 px-0.5 rounded">Shift</kbd> Rotar</div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 justify-end">
          {saveMessage && (
            <span className={`text-[10px] font-medium text-center ${saveType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {saveMessage}
            </span>
          )}
          {selectedConexion && (
            <button type="button" onClick={handleDeleteConnection} className="w-full rounded-lg bg-red-950/60 border border-red-500/50 hover:bg-red-900 hover:border-red-500 py-1.5 text-[10px] font-semibold text-red-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer">
              Borrar Conexión
            </button>
          )}
          {selectedEvent && (
            <button type="button" onClick={handleDeleteEvent} className="w-full rounded-lg bg-red-950/60 border border-red-500/50 hover:bg-red-900 hover:border-red-500 py-1.5 text-[10px] font-semibold text-red-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer">
              Borrar Evento
            </button>
          )}
          <button type="button" disabled={isSaving} onClick={() => selectedConexion ? handleSave() : handleEventSave()} className="w-full rounded-lg bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_100%)] hover:bg-[linear-gradient(135deg,_#fb923c_0%,_#f97316_100%)] disabled:opacity-50 py-2 text-xs font-semibold text-white uppercase tracking-wider shadow-[0_4px_12px_rgba(234,88,12,0.3)] transition-all active:scale-98 cursor-pointer">
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};
