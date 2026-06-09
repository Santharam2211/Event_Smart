const API_BASE = 'http://localhost:5000';

export const getImageUrl = (imagePath, fallback = null) => {
    if (!imagePath) return fallback;
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    return `${API_BASE}/uploads/${imagePath}`;
};

export default getImageUrl;
