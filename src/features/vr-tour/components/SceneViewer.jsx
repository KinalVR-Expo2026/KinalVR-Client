import 'aframe';
import { useEffect, useState, useMemo } from 'react';
import { useTourNavigation } from '../hooks/useTourNavigation';
import { ConnectionMarker } from './ConnectionMarker';
import { EventMarker } from './EventMarker';
import { VRControls } from './VRControls';
import { getHighResTextureUrl, getLowResTextureUrl, isImageCached, setAsCached } from '../../../shared/utils/imageUtils';
import { useTourStore } from '../store/useTourStore';
import { updateEvent as apiUpdateEvent } from '../../../shared/api/admin';

const API_BASE_URL = import.meta.env.VITE_ADMIN_URL;

const generateAssetId = (url) => {
  if (!url) return 'default-sky';
  // Identificamos si la URL corresponde a la imagen desenfocada
  const isLowRes = url.includes('e_blur');
  const type = isLowRes ? 'low' : 'high';
  
  // Agregamos el prefijo 'low' o 'high' para garantizar que los IDs jamás choquen
  return `asset-${type}-${url.replace(/[^a-zA-Z0-9]/g, '').slice(-35)}`;
};

export const SceneViewer = () => {
  const {
    scene,
    loading,
    cameraYaw,
    isTransitioning,
    handleNavigationTransition,
    cameraRef
  } = useTourNavigation();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  const preloadedImages = useTourStore((state) => state.preloadedImages);

  useEffect(() => {
    if (!scene || !API_BASE_URL) return undefined;

    const controller = new AbortController();
    const sceneId = scene._id || scene.idEscenario?._id || scene.idEscenario || scene.subId;
    console.log("SceneViewer: escenario actual:", scene);
    console.log("SceneViewer: calculando sceneId:", sceneId);

    const normalizeEvents = (payload) => {
      if (Array.isArray(payload.events)) return payload.events;
      if (Array.isArray(payload.eventos)) return payload.eventos;
      if (Array.isArray(payload)) return payload;
      return [];
    };

    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/events/escenario/${sceneId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`No se pudieron cargar los eventos (${response.status})`);
        }

        const data = await response.json();
        console.log("Datos de eventos recibidos del servidor:", data);
        const normalized = normalizeEvents(data);
        console.log("Eventos normalizados a renderizar:", normalized);
        setEvents(normalized);
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') return;
        console.error("Error cargando eventos:", fetchError);
        setEventsError('No se pudieron cargar los eventos de este escenario.');
        setEvents([]);
      } finally {
        if (!controller.signal.aborted) {
          setEventsLoading(false);
        }
      }
    };

    loadEvents();

    return () => controller.abort();
  }, [scene]);

  const isAdminMode = useTourStore((state) => state.isAdminMode);
  const setAdminMode = useTourStore((state) => state.setAdminMode);
  const selectedConnectionId = useTourStore((state) => state.selectedConnectionId);
  const setSelectedConnectionId = useTourStore((state) => state.setSelectedConnectionId);
  const selectedEventId = useTourStore((state) => state.selectedEventId);
  const setSelectedEventId = useTourStore((state) => state.setSelectedEventId);
  const updateConnectionCoords = useTourStore((state) => state.updateConnectionCoords);
  const saveSceneConnections = useTourStore((state) => state.saveSceneConnections);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveType, setSaveType] = useState(''); // 'success' | 'error'
  const [modalEvent, setModalEvent] = useState(null);
  const [activeSkyAssetId, setActiveSkyAssetId] = useState(null);

  useEffect(() => {
    if (!scene) return;
    
    let isMounted = true;
    const lowResUrl = getLowResTextureUrl(scene.urlImagen);
    const highResUrl = getHighResTextureUrl(scene.urlImagen);

    const lowResId = generateAssetId(lowResUrl);
    const highResId = generateAssetId(highResUrl);

    // ¿La imagen ya está en memoria (ya sea porque pasamos por aquí o se precargó)?
    if (isImageCached(highResUrl)) {
      // ¡Esquivamos la imagen borrosa y cargamos full HD de inmediato!
      setActiveSkyAssetId(highResId);
      return; 
    }

    // Si no está, aplicamos la carga progresiva
    setActiveSkyAssetId(lowResId);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = highResUrl;
    img.onload = () => {
      // Registramos que ya se descargó para futuras visitas
      setAsCached(highResUrl);
      if (isMounted) {
        setActiveSkyAssetId(highResId);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [scene]);

  // Actualizamos los assets que necesita procesar A-Frame
  const allAssetsToLoad = useMemo(() => {
    if (!scene) return preloadedImages;
    const lowResUrl = getLowResTextureUrl(scene.urlImagen);
    const highResUrl = getHighResTextureUrl(scene.urlImagen);
    return Array.from(new Set([lowResUrl, highResUrl, ...preloadedImages]));
  }, [scene, preloadedImages]);

  const selectedConexion = scene?.conexiones.find(
    (c) => c.targetSubId === selectedConnectionId
  );

  const selectedEvent = events.find(ev => (ev._id || ev.id) === selectedEventId);

  const updateEventCoords = (eventId, { position, rotation }) => {
    setEvents((prev) => prev.map((ev) => {
      const id = ev._id || ev.id;
      if (id === eventId) {
        return { ...ev, position: position !== undefined ? position : ev.position, rotation: rotation !== undefined ? rotation : ev.rotation };
      }
      return ev;
    }));
  };

  const handleCoordChange = (type, axis, value) => {
    if (!selectedConexion || !scene) return;
    const [posX, posY, posZ] = selectedConexion.position.split(' ').map(Number);
    const [rotX, rotY, rotZ] = selectedConexion.rotation.split(' ').map(Number);

    let newPos = [posX, posY, posZ];
    let newRot = [rotX, rotY, rotZ];

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
    const [posX, posY, posZ] = (selectedEvent.position || '0 0 0').split(' ').map(Number);
    const [rotX, rotY, rotZ] = (selectedEvent.rotation || '0 0 0').split(' ').map(Number);

    let newPos = [posX, posY, posZ];
    let newRot = [rotX, rotY, rotZ];

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
      console.error('Error guardando evento:', err);
      setSaveType('error');
      setSaveMessage('Error al guardar evento en base de datos');
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isAdminMode || !selectedConnectionId || !scene) return;

    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const currentConn = scene.conexiones.find(c => c.targetSubId === selectedConnectionId);
      if (!currentConn) return;

      const [posValX, posValY, posValZ] = currentConn.position.split(' ').map(Number);
      const [rotValX, rotValY, rotValZ] = currentConn.rotation.split(' ').map(Number);

      let x = posValX;
      let y = posValY;
      let z = posValZ;
      let rx = rotValX;
      let ry = rotValY;
      let rz = rotValZ;

      const posStep = 0.05;
      const rotStep = 5;
      let changed = false;

      if (e.shiftKey) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          ry = (ry - rotStep) % 360;
          changed = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          ry = (ry + rotStep) % 360;
          changed = true;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          rx = (rx - rotStep) % 360;
          changed = true;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          rx = (rx + rotStep) % 360;
          changed = true;
        } else if (e.key === 'q' || e.key === 'Q') {
          rz = (rz - rotStep) % 360;
          changed = true;
        } else if (e.key === 'e' || e.key === 'E') {
          rz = (rz + rotStep) % 360;
          changed = true;
        }
      } else {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          x -= posStep;
          changed = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          x += posStep;
          changed = true;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          z -= posStep;
          changed = true;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          z += posStep;
          changed = true;
        } else if (e.key === 'PageUp' || e.key === 'q' || e.key === 'Q') {
          y += posStep;
          changed = true;
        } else if (e.key === 'PageDown' || e.key === 'e' || e.key === 'E') {
          y -= posStep;
          changed = true;
        }
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminMode, selectedConnectionId, scene, updateConnectionCoords]);

  useEffect(() => {
    if (scene) {
      // Force A-Frame raycasters to refresh their objects list when new markers are mounted
      const timeout = setTimeout(() => {
        const raycasters = document.querySelectorAll('[raycaster]');
        raycasters.forEach(el => {
          if (el.components.raycaster) {
            el.components.raycaster.refreshObjects();
          }
        });
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [scene]);
  // Keyboard controls for selected event (edit position/rotation)
  useEffect(() => {
    if (!isAdminMode || !selectedEvent) return;

    const handleKeyDown = (e) => {
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const [posValX, posValY, posValZ] = (selectedEvent.position || '0 0 0').split(' ').map(Number);
      const [rotValX, rotValY, rotValZ] = (selectedEvent.rotation || '0 0 0').split(' ').map(Number);

      let x = posValX;
      let y = posValY;
      let z = posValZ;
      let rx = rotValX;
      let ry = rotValY;
      let rz = rotValZ;

      const posStep = 0.05;
      const rotStep = 5;
      let changed = false;

      if (e.shiftKey) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          ry = (ry - rotStep) % 360;
          changed = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          ry = (ry + rotStep) % 360;
          changed = true;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          rx = (rx - rotStep) % 360;
          changed = true;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          rx = (rx + rotStep) % 360;
          changed = true;
        } else if (e.key === 'q' || e.key === 'Q') {
          rz = (rz - rotStep) % 360;
          changed = true;
        } else if (e.key === 'e' || e.key === 'E') {
          rz = (rz + rotStep) % 360;
          changed = true;
        }
      } else {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          x -= posStep;
          changed = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          x += posStep;
          changed = true;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          z -= posStep;
          changed = true;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          z += posStep;
          changed = true;
        } else if (e.key === 'PageUp' || e.key === 'q' || e.key === 'Q') {
          y += posStep;
          changed = true;
        } else if (e.key === 'PageDown' || e.key === 'e' || e.key === 'E') {
          y -= posStep;
          changed = true;
        }
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminMode, selectedEvent]);

  if (loading && !isTransitioning) {
    return (
      <div className="flex h-full w-full items-center justify-center font-[var(--font-sans)] text-white bg-black/50">
        <p className="animate-pulse tracking-[4px]">CARGANDO ENTORNO...</p>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="flex h-full w-full items-center justify-center text-red-500">
        <p>Error al cargar el escenario.</p>
      </div>
    );
  }

  const textureUrl = getHighResTextureUrl(scene.urlImagen);
  console.log("Cargando textura de fondo:", textureUrl);
  const skyAssetId = generateAssetId(textureUrl);

  const [posX, posY, posZ] = selectedConexion ? selectedConexion.position.split(' ').map(Number) : [0, 0, 0];
  const [rotX, rotY, rotZ] = selectedConexion ? selectedConexion.rotation.split(' ').map(Number) : [0, 0, 0];

  const renderCoordinateInput = (type, axis, val, step) => {
    return (
      <div className="flex items-center gap-1">
        <span className="w-3 text-center text-[10px] font-bold text-white/40 uppercase">{axis}</span>
        <button
          type="button"
          onClick={() => handleCoordChange(type, axis, val - step)}
          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
        >
          -
        </button>
        <input
          type="number"
          step={step}
          value={isNaN(val) ? 0 : Number(val.toFixed(3))}
          onChange={(e) => handleCoordChange(type, axis, e.target.value)}
          className="w-14 rounded border border-white/10 bg-slate-900/60 py-0.5 text-center text-[11px] font-semibold text-white focus:border-orange-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => handleCoordChange(type, axis, val + step)}
          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div className="h-full w-full relative">
      {/* Botón Modo Admin - Top Right */}
      <div className="absolute top-6 right-6 z-40 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setAdminMode(!isAdminMode)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-medium tracking-[1.5px] uppercase backdrop-blur-md transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer ${isAdminMode
              ? 'border-orange-500/50 bg-orange-950/40 text-orange-400 font-semibold shadow-[0_0_15px_rgba(249,115,22,0.2)]'
              : 'border-white/10 bg-slate-950/45 text-[#e0e4eb] hover:border-white/30 hover:bg-white/5'
            }`}
        >
          <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isAdminMode ? 'rotate-12 scale-110' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            {isAdminMode ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h16.5a1.5 1.5 0 001.5-1.5V12a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 12v8.25a1.5 1.5 0 001.5 1.5z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            )}
          </svg>
          {isAdminMode ? 'Salir Admin' : 'Modo Admin'}
        </button>
      </div>

      {/* Alerta Modo Admin - Top Center */}
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

      {/* Panel de Control - Bottom Center */}
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
              <button
                type="button"
                onClick={() => { selectedConexion ? setSelectedConnectionId(null) : setSelectedEventId(null); }}
                className="text-[10px] text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded px-2 py-0.5 transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Posición */}
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
                          <div className="flex items-center gap-1">
                            <span className="w-3 text-center text-[10px] font-bold text-white/40 uppercase">x</span>
                            <button type="button" onClick={() => handleEventCoordChange('position', 'x', epx - 0.05)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">-</button>
                            <input type="number" step={0.05} value={isNaN(epx) ? 0 : Number(epx.toFixed(3))} onChange={(e) => handleEventCoordChange('position', 'x', e.target.value)} className="w-14 rounded border border-white/10 bg-slate-900/60 py-0.5 text-center text-[11px] font-semibold text-white focus:border-orange-500 focus:outline-none" />
                            <button type="button" onClick={() => handleEventCoordChange('position', 'x', epx + 0.05)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">+</button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 text-center text-[10px] font-bold text-white/40 uppercase">y</span>
                            <button type="button" onClick={() => handleEventCoordChange('position', 'y', epy - 0.05)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">-</button>
                            <input type="number" step={0.05} value={isNaN(epy) ? 0 : Number(epy.toFixed(3))} onChange={(e) => handleEventCoordChange('position', 'y', e.target.value)} className="w-14 rounded border border-white/10 bg-slate-900/60 py-0.5 text-center text-[11px] font-semibold text-white focus:border-orange-500 focus:outline-none" />
                            <button type="button" onClick={() => handleEventCoordChange('position', 'y', epy + 0.05)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">+</button>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 text-center text-[10px] font-bold text-white/40 uppercase">z</span>
                            <button type="button" onClick={() => handleEventCoordChange('position', 'z', epz - 0.05)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">-</button>
                            <input type="number" step={0.05} value={isNaN(epz) ? 0 : Number(epz.toFixed(3))} onChange={(e) => handleEventCoordChange('position', 'z', e.target.value)} className="w-14 rounded border border-white/10 bg-slate-900/60 py-0.5 text-center text-[11px] font-semibold text-white focus:border-orange-500 focus:outline-none" />
                            <button type="button" onClick={() => handleEventCoordChange('position', 'z', epz + 0.05)} className="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-[10px] text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer">+</button>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Rotación */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold tracking-wider text-orange-500 uppercase">Rotación (x, y, z)</span>
                <div className="flex flex-wrap gap-2.5">
                  {renderCoordinateInput('rotation', 'x', rotX, 5)}
                  {renderCoordinateInput('rotation', 'y', rotY, 5)}
                  {renderCoordinateInput('rotation', 'z', rotZ, 5)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col justify-between gap-3 lg:w-72 border-t lg:border-t-0 lg:border-l border-white/5 pt-3 lg:pt-0 lg:pl-4">
            {/* Guía Rápida */}
            <div className="rounded-lg border border-white/5 bg-slate-900/40 p-2 text-[9px] text-white/50 flex-1">
              <span className="block font-semibold text-white/70 uppercase tracking-wider mb-1">Guía Teclado</span>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <div><kbd className="bg-white/10 px-0.5 rounded">A</kbd>/<kbd className="bg-white/10 px-0.5 rounded">D</kbd> Mover X</div>
                <div><kbd className="bg-white/10 px-0.5 rounded">W</kbd>/<kbd className="bg-white/10 px-0.5 rounded">S</kbd> Mover Z</div>
                <div><kbd className="bg-white/10 px-0.5 rounded">Q</kbd>/<kbd className="bg-white/10 px-0.5 rounded">E</kbd> Mover Y</div>
                <div><kbd className="bg-white/10 px-0.5 rounded">Shift+M</kbd> Rotar</div>
              </div>
            </div>

            {/* Acción de Guardar */}
            <div className="flex flex-col gap-1.5 justify-end">
              {saveMessage && (
                <span className={`text-[10px] font-medium text-center ${saveType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {saveMessage}
                </span>
              )}
              <button
                type="button"
                disabled={isSaving}
                onClick={() => selectedConexion ? handleSave() : handleEventSave()}
                className="w-full rounded-lg bg-[linear-gradient(135deg,_#f97316_0%,_#ea580c_100%)] hover:bg-[linear-gradient(135deg,_#fb923c_0%,_#f97316_100%)] disabled:opacity-50 py-2 text-xs font-semibold text-white uppercase tracking-wider shadow-[0_4px_12px_rgba(234,88,12,0.3)] transition-all active:scale-98 cursor-pointer"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      <a-scene
        embedded
        antialias="true"
        style={{ width: '100%', height: '100%' }}
        cursor="rayOrigin: mouse"
        raycaster="objects: .clickable"
        webxr="referenceSpaceType: local-floor"
      >
        <a-assets timeout="10000">
          {allAssetsToLoad.map((url) => (
            <img
              key={generateAssetId(url)}
              id={generateAssetId(url)}
              src={url}
              crossOrigin="anonymous"
            />
          ))}
        </a-assets>

        <a-sky src={activeSkyAssetId ? `#${activeSkyAssetId}` : `#${skyAssetId}`} rotation="0 -90 0" crossOrigin="anonymous"></a-sky>

        <VRControls cameraRef={cameraRef} cameraYaw={cameraYaw} />

        {scene.conexiones.map((conexion) => (
          <ConnectionMarker
            key={conexion.targetSubId}
            conexion={conexion}
            onNavigate={handleNavigationTransition}
          />
        ))}
        {!eventsLoading && !eventsError && events.map((event) => (
          <EventMarker
            key={event._id || event.id}
            event={event}
            onOpenModal={(ev) => setModalEvent(ev)}
          />
        ))}
      </a-scene>

      {/* Modal para ver imagen del evento */}
      {modalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="max-w-4xl w-full bg-slate-900 rounded-lg overflow-hidden shadow-lg flex">
            <div className="w-2/3 bg-black flex items-center justify-center">
              {modalEvent.urlImagen ? (
                <img src={modalEvent.urlImagen} alt="Evento" className="max-h-[80vh] object-contain" />
              ) : (
                <div className="p-8 text-white/60">Sin imagen</div>
              )}
            </div>
            <div className="w-1/3 p-4 text-white flex flex-col gap-3">
              <h3 className="text-sm font-semibold">Descripción</h3>
              <div className="text-[13px] text-white/80 overflow-auto max-h-[70vh]">
                {modalEvent.descripcion || 'Sin descripción'}
              </div>
              <div className="mt-auto flex gap-2">
                <button onClick={() => setModalEvent(null)} className="ml-auto rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition-all cursor-pointer">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};