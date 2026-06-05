const imageCache = new Set();

export const getHighResTextureUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto,w_4096,h_2048,c_scale/');
};

// Genera una imagen de 1024px con un filtro de desenfoque. Pesa apenas ~20kb y descarga instantáneamente.
export const getLowResTextureUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto:low,w_1024,h_512,e_blur:200,c_scale/');
};

export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(url)) {
      resolve();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      imageCache.add(url);
      resolve();
    };

    img.onerror = (err) => {
      console.warn(`Falló la precarga de la imagen: ${url}`, err);
      reject(err);
    };
  });
};

export const isImageCached = (url) => imageCache.has(url);
export const setAsCached = (url) => imageCache.add(url);