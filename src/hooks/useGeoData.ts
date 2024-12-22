import { useState, useEffect } from 'react';
import { geoDataLoader } from '@/utils/geoDataLoader';

interface GeoLocation {
  country: string;
  state: string;
  city: string;
  continent: string;
}

interface UseGeoDataResult {
  loading: boolean;
  error: Error | null;
  location: GeoLocation | null;
}

export function useGeoData(lat: number | null, lon: number | null): UseGeoDataResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadGeoData = async () => {
      if (lat === null || lon === null) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await geoDataLoader.searchLocation(lat, lon);
        if (mounted) {
          setLocation(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGeoData();

    return () => {
      mounted = false;
    };
  }, [lat, lon]);

  return { loading, error, location };
}

// Example usage:
/*
function LocationDisplay({ latitude, longitude }) {
  const { loading, error, location } = useGeoData(latitude, longitude);

  if (loading) return <div>Loading location data...</div>;
  if (error) return <div>Error loading location: {error.message}</div>;
  if (!location) return null;

  return (
    <div>
      <p>Country: {location.country}</p>
      <p>State: {location.state}</p>
      <p>City: {location.city}</p>
      <p>Continent: {location.continent}</p>
    </div>
  );
}
*/
