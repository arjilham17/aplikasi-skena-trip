export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const apiUrl = import.meta.env.VITE_API_URL || '';
  
  let baseUrl = '';
  if (apiUrl.startsWith('http')) {
      try {
          const urlObj = new URL(apiUrl);
          baseUrl = urlObj.origin;
      } catch (e) {
          baseUrl = '';
      }
  }

  // In development, if no explicit API URL is set, we use relative path because Vite proxies /uploads
  // In production, if no explicit API URL is set, we also use relative path assuming backend and frontend share same origin
  return `${baseUrl}${path}`;
};
