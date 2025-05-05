const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export default function useCache() {
    const getFromCache = (key) => {
        try {
            const cachedData = localStorage.getItem(key);
            if (!cachedData) return null;

            const { data, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp > CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    };

    const setToCache = (key, data) => {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(cacheItem));
        } catch (error) {
            console.error('Error writing to cache:', error);
        }
    };

    return { getFromCache, setToCache };
}
