import { useEffect, useState } from 'react';
import { EventsList } from '../components/EventsList';
import { MapHeader } from '../components/MapHeader';
import { AdminSidebar } from '../components/AdminSidebar';
import { MapInteractive } from '../components/MapInteractive';
import { getScenes, updateScenePosition } from '../../../shared/api/scenes';
import { LEVEL_TO_NUM, NUM_TO_LEVEL, ZOOM_MIN, ZOOM_MAX } from '../constants/campusMap';

export const CampusMapPage = ({ onClose, currentScene }) => {
  const [activeTab, setActiveTab] = useState('mapa');
  const [activeLevel, setActiveLevel] = useState(
    () => (currentScene?.nivel && LEVEL_TO_NUM[currentScene.nivel]) || 3
  );
  const [zoom, setZoom] = useState(100);
  const [scenes, setScenes] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [tempPos, setTempPos] = useState(null);
  const [tempAngle, setTempAngle] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userRotation] = useState(() => {
    const minimap = document.getElementById('minimap-container');
    return minimap?.style.getPropertyValue('--minimap-rotation') || '0deg';
  });

  const isMapTab = activeTab === 'mapa';
  const isAdminTab = activeTab === 'admin';

  const handleZoom = (delta) => {
    setZoom((prev) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta)));
  };

  useEffect(() => {
    const fetchScenes = async () => {
      try {
        const scenesData = await getScenes();
        setScenes(scenesData);
      } catch (error) {
        console.error('Error al cargar los escenarios:', error);
      }
    };
    fetchScenes();
  }, []);

  const handleSelectScene = (e) => {
    const subId = e.target.value;
    setSelectedSubId(subId);

    const scene = scenes.find((s) => s.subId === subId);
    if (!scene) {
      setTempPos(null);
      setTempAngle(0);
      return;
    }

    setTempPos(scene.posicion && scene.posicion.length > 0 ? scene.posicion : null);
    setTempAngle(scene.coordinacionAngulo ? scene.coordinacionAngulo : 0);

    const levelNum = LEVEL_TO_NUM[scene.nivel];
    if (levelNum) {
      setActiveLevel(levelNum);
    }
  };

  const handleMapClick = (e) => {
    if (activeTab !== 'admin' || !selectedSubId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTempPos([Number(x.toFixed(2)), Number(y.toFixed(2))]);
  };

  const handleSavePosition = async () => {
    if (!selectedSubId || !tempPos) return;

    setLoading(true);
    try {
      await updateScenePosition({
        subId: selectedSubId,
        posicion: tempPos,
        nivel: NUM_TO_LEVEL[activeLevel],
        coordinacionAngulo: Number(tempAngle),
      });

      setScenes((prev) =>
        prev.map((scene) =>
          scene.subId === selectedSubId
            ? { ...scene, posicion: tempPos, nivel: NUM_TO_LEVEL[activeLevel], coordinacionAngulo: Number(tempAngle) }
            : scene
        )
      );
      alert('Posición guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar la posición:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-[#eef1f6]"
      style={{ animation: 'campusMapFadeIn 0.25s ease-out' }}
    >
      <style>{`
        @keyframes campusMapFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <MapHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeLevel={activeLevel}
        zoom={zoom}
        handleZoom={handleZoom}
        onClose={onClose}
        isMapTab={isMapTab}
        isAdminTab={isAdminTab}
      />

      {/* Cuerpo */}
      {isMapTab || isAdminTab ? (
        <>
          <div className="relative flex flex-1 overflow-hidden">
            {isAdminTab && (
              <AdminSidebar
                scenes={scenes}
                selectedSubId={selectedSubId}
                handleSelectScene={handleSelectScene}
                tempPos={tempPos}
                tempAngle={tempAngle}
                setTempAngle={setTempAngle}
                handleSavePosition={handleSavePosition}
                loading={loading}
              />
            )}

            <MapInteractive
              activeLevel={activeLevel}
              setActiveLevel={setActiveLevel}
              zoom={zoom}
              handleMapClick={handleMapClick}
              tempPos={tempPos}
              tempAngle={tempAngle}
              isAdminTab={isAdminTab}
              isMapTab={isMapTab}
              currentScene={currentScene}
              userRotation={userRotation}
            />
          </div>

          {isMapTab && (
            <footer className="bg-[#dfe3ea] px-4 py-2 text-center text-[11px] text-slate-500">
              Tocá un piso en el mapa para cambiar de nivel
            </footer>
          )}
        </>
      ) : (
        <EventsList />
      )}
    </div>
  );
};
