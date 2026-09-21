let loaderPromise = null;

export function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google?.maps) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;

  loaderPromise = (async () => {
    const response = await fetch('/api/maps-key', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.key) throw new Error(payload?.error || 'Google Maps API key is missing.');
    const key = payload.key;

    return new Promise((resolve, reject) => {
      const cb = '__astrowalkGoogleReady';
      window[cb] = () => {
        resolve(window.google.maps);
        delete window[cb];
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cb}&v=weekly&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Google Maps could not be loaded.'));
      document.head.appendChild(script);
    });
  })();

  return loaderPromise;
}

export function parseCoordinateQuery(text) {
  const value = String(text || '').trim();
  const match = value.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, source: 'coordinates' };
}

async function geocodeFallback(query) {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !Number.isFinite(Number(payload.lat)) || !Number.isFinite(Number(payload.lng))) {
    throw new Error(payload?.error || 'No matching location was found.');
  }
  return { lat: Number(payload.lat), lng: Number(payload.lng), label: payload.label || query, source: payload.source || 'fallback' };
}

export async function geocodePlace(query) {
  const text = String(query || '').trim();
  if (!text) throw new Error('Enter a location.');

  const coords = parseCoordinateQuery(text);
  if (coords) return coords;

  try {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    const response = await geocoder.geocode({ address: text });
    const r = response?.results?.[0];
    if (r) {
      return {
        lat: r.geometry.location.lat(),
        lng: r.geometry.location.lng(),
        label: r.formatted_address || text,
        source: 'google',
      };
    }
  } catch (error) {
    const status = error?.code || error?.status || '';
    if (status && status !== 'ZERO_RESULTS') console.warn('Google geocoder unavailable; trying fallback.', status);
  }

  return geocodeFallback(text);
}

// Backward-compatible export for existing callers.
export const geocodeWithGoogle = geocodePlace;
