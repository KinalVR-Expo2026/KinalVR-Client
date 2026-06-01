import 'aframe';
import { useEffect, useState } from 'react';
import { getSceneBySubId } from '../../../shared/api/admin';

// Interceptamos la URL de Cloudinary para exigir máxima calidad y tamaño Power of Two
const getHighResTextureUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Agregamos q_100 (calidad 100%) y forzamos resolución 4K a proporción 2:1
  return url.replace('/upload/', '/upload/q_100,w_4096,h_2048,c_scale/');
};

export const SceneViewer = () => {
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScene = async () => {
      try {
        const data = await getSceneBySubId(1);
        setScene(data);
      } catch (error) {
        console.error("Fallo al cargar la escena de KinalVR", error);
      } finally {
        setLoading(false);
      }
    };

    loadScene();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center font-[var(--font-sans)] text-white">
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

  return (
    <div className="h-full w-full">
      {/* Agregamos antialias="true" para suavizar los bordes de los píxeles */}
      <a-scene embedded antialias="true" style={{ width: '100%', height: '100%' }}>
        <a-assets>
          <img 
            id="skyTexture" 
            src={textureUrl} 
            crossOrigin="anonymous" 
            alt={scene.ubicacion} 
          />
        </a-assets>

        <a-sky src="#skyTexture" rotation="0 -90 0"></a-sky>

        <a-entity camera look-controls="reverseMouseDrag: false" position="0 1.6 0"></a-entity>
      </a-scene>
    </div>
  );
};