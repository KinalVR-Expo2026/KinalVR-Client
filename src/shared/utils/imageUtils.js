const imageCache = new Set();

export const getHighResTextureUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_100,w_4096,h_2048,c_scale/');
};

export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(url)) {
      resolve();
      return;
    }

    const img = new Image();
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