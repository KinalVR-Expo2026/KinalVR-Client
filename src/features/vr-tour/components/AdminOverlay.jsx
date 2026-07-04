import { useState, useEffect } from 'react';
import { useTourStore } from '../store/useTourStore';
import { updateEvent as apiUpdateEvent, getScenesList, createScene } from '../../../shared/api/admin';
import { parseCoordString, clampCoord, POSITION_BOUND, ROTATION_BOUND } from '../../../shared/utils/coordinateUtils';
import { SceneInfoModal } from './SceneInfoModal';

export const AdminOverlay = ({ scene, events, updateEventCoords, isFullscreen, toggleFullscreen }) => {
  const isAdminMode = useTourStore((state) => state.isAdminMode);
  const setAdminMode = useTourStore((state) => state.setAdminMode);
  const selectedConnectionId = useTourStore((state) => state.selectedConnectionId);
  const setSelectedConnectionId = useTourStore((state) => state.setSelectedConnectionId);
  const selectedEventId = useTourStore((state) => state.selectedEventId);
  const setSelectedEventId = useTourStore((state) => state.setSelectedEventId);
  const updateConnectionCoords = useTourStore((state) => state.updateConnectionCoords);
  const saveSceneConnections = useTourStore((state) => state.saveSceneConnections);
  const addConnection = useTourStore((state) => state.addConnection);
  const removeConnection = useTourStore((state) => state.removeConnection);
  const saveSceneInfo = useTourStore((state) => state.saveSceneInfo);

  const [isEditingScene, setIsEditingScene] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveType, setSaveType] = useState('');
  
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [availableScenes, setAvailableScenes] = useState([]);
  const [connectionSearchQuery, setConnectionSearchQuery] = useState('');

  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [newSceneData, setNewSceneData] = useState({ subId: '', ubicacion: '', nivel: 'PRIMER NIVEL', imagen: null });
  const [isSubmittingScene, setIsSubmittingScene] = useState(false);
  const [sceneSubmitError, setSceneSubmitError] = useState('');

  const handleCreateSceneSubmit = async (e) => {
    e.preventDefault();
    if (!newSceneData.subId || !newSceneData.ubicacion || !newSceneData.nivel || !newSceneData.imagen) {
      setSceneSubmitError('Todos los campos son requeridos');
      return;
    }
    setIsSubmittingScene(true);
    setSceneSubmitError('');
    try {
      const formData = new FormData();
      formData.append('subId', newSceneData.subId);
      formData.append('ubicacion', newSceneData.ubicacion);
      formData.append('nivel', newSceneData.nivel);
      formData.append('imagen', newSceneData.imagen);
      
      const newScene = await createScene(formData);
      setIsCreatingScene(false);
      setNewSceneData({ subId: '', ubicacion: '', nivel: 'PRIMER NIVEL', imagen: null });
      // Añadir el escenario recién creado a la caché local en vez de re-consultar
      // el listado completo; evita que quede desactualizada si el modal de
      // conexión no está abierto en este momento.
      setAvailableScenes((prev) => [...prev, newScene]);
      alert(`Escenario ${newScene.subId} creado exitosamente!`);
    } catch (err) {
      setSceneSubmitError(err.response?.data?.message || 'Error al crear el escenario');
    } finally {
      setIsSubmittingScene(false);
    }
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

  const selectedConexion = scene?.conexiones.find((c) => c.targetSubId === selectedConnectionId);
  const selectedEvent = events.find(ev => (ev._id || ev.id) === selectedEventId);

  const [posX, posY, posZ] = selectedConexion ? parseCoordString(selectedConexion.position) : [0, 0, 0];
  const [rotX, rotY, rotZ] = selectedConexion ? parseCoordString(selectedConexion.rotation) : [0, 0, 0];

  const handleCoordChange = (type, axis, value) => {
    if (!selectedConexion || !scene) return;
    let newPos = [...[posX, posY, posZ]];
    let newRot = [...[rotX, rotY, rotZ]];
    const val = parseFloat(value);
    if (isNaN(val)) return;
    const bound = type === 'position' ? POSITION_BOUND : ROTATION_BOUND;
    const clamped = clampCoord(val, bound);

    if (type === 'position') {
      if (axis === 'x') newPos[0] = clamped;
      if (axis === 'y') newPos[1] = clamped;
      if (axis === 'z') newPos[2] = clamped;
    } else {
      if (axis === 'x') newRot[0] = clamped;
      if (axis === 'y') newRot[1] = clamped;
      if (axis === 'z') newRot[2] = clamped;
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

  // Teclado para conexiones
  useEffect(() => {
    if (!isAdminMode || !selectedConnectionId || !scene) return;
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const currentConn = scene.conexiones.find(c => c.targetSubId === selectedConnectionId);
      if (!currentConn) return;

      let [x, y, z] = parseCoordString(currentConn.position);
      let [rx, ry, rz] = parseCoordString(currentConn.rotation);
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
        x = clampCoord(x, POSITION_BOUND);
        y = clampCoord(y, POSITION_BOUND);
        z = clampCoord(z, POSITION_BOUND);
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

  const renderCoordinateInput = (type, axis, val, step, isEvent = false) => {
    const handler = isEvent ? handleEventCoordChange : handleCoordChange;
    const bound = type === 'position' ? POSITION_BOUND : ROTATION_BOUND;
    return (
      <div className="flex items-center gap-1">
        <span className="w-3 text-center text-[10px] font-bold text-white/40 uppercase">{axis}</span>
        <button type="button" onClick={() => handler(type, axis, val - step)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">-</button>
        <input type="number" step={step} min={-bound} max={bound} value={isNaN(val) ? 0 : Number(val.toFixed(3))} onChange={(e) => handler(type, axis, e.target.value)} className="w-14 rounded border border-white/10 bg-slate-900/60 py-0.5 text-center text-[11px] font-semibold text-white focus:border-orange-500 focus:outline-none" />
        <button type="button" onClick={() => handler(type, axis, val + step)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">+</button>
      </div>
    );
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
            <button type="button" onClick={() => setIsAddingConnection(true)} className="flex items-center gap-2 rounded-full border border-green-500/50 bg-green-950/40 px-4 py-2 text-[10px] font-semibold text-green-400 tracking-[1.5px] uppercase backdrop-blur-md transition-all duration-300 shadow-[0_4px_12px_rgba(34,197,94,0.3)] hover:bg-green-900/60 cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Añadir Conexión
            </button>
            <button type="button" onClick={() => setIsEditingScene(true)} disabled={!scene} className="flex items-center gap-2 rounded-full border border-orange-500/50 bg-orange-950/40 px-4 py-2 text-[10px] font-semibold text-orange-400 tracking-[1.5px] uppercase backdrop-blur-md transition-all duration-300 shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:bg-orange-900/60 disabled:opacity-40 cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Editar Escenario
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

      {isAdminMode && (selectedConexion || selectedEvent) && (
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
              <button type="button" disabled={isSaving} onClick={() => selectedConexion ? handleSave() : handleEventSave()} className="w-full rounded-lg bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_100%)] hover:bg-[linear-gradient(135deg,_#fb923c_0%,_#f97316_100%)] disabled:opacity-50 py-2 text-xs font-semibold text-white uppercase tracking-wider shadow-[0_4px_12px_rgba(234,88,12,0.3)] transition-all active:scale-98 cursor-pointer">
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isAddingConnection && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[400px] rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-white">Añadir Nueva Conexión</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={connectionSearchQuery}
                onChange={(e) => setConnectionSearchQuery(e.target.value)}
                className="w-full rounded bg-slate-800 p-2 text-sm text-white border border-white/10 focus:border-orange-500 outline-none"
              />
            </div>
            <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
              {availableScenes.filter(s => s.subId !== scene?.subId && (s.nombre?.toLowerCase().includes(connectionSearchQuery.toLowerCase()) || s.subId.toLowerCase().includes(connectionSearchQuery.toLowerCase()))).map((s) => (
                <button
                  key={s._id || s.id}
                  onClick={() => handleAddConnection(s.subId)}
                  className="flex flex-col rounded-lg border border-white/10 bg-slate-800 p-3 text-left transition-all hover:border-orange-500 hover:bg-slate-700 cursor-pointer"
                >
                  <span className="text-sm font-bold text-white">{s.nombre || s.subId}</span>
                  <span className="text-[10px] text-white/50 font-mono">{s.subId}</span>
                </button>
              ))}
              {availableScenes.length === 0 && (
                <p className="text-center text-sm text-white/50 py-4">Cargando escenarios...</p>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsAddingConnection(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditingScene && scene && (
        <SceneInfoModal
          scene={scene}
          onSave={saveSceneInfo}
          onClose={() => setIsEditingScene(false)}
        />
      )}

      {isCreatingScene && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleCreateSceneSubmit} className="w-[450px] rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-white">Crear Nuevo Escenario</h3>
            
            {sceneSubmitError && <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded">{sceneSubmitError}</div>}
            
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
                onClick={() => setIsCreatingScene(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingScene}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {isSubmittingScene ? 'Creando...' : 'Crear Escenario'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};