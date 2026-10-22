import { useEffect, useState } from "react";

const PHOTOS_URL = "https://picsum.photos/v2/list?limit=30";

export default function useFetchPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPhotos() {
      try {
        const response = await fetch(PHOTOS_URL, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`The photo service responded with ${response.status}.`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("The photo service returned an unexpected response.");
        }

        setPhotos(data);
        setError(null);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError("We couldn't load the photographs. Check your connection and try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPhotos();

    return () => controller.abort();
  }, []);

  return { photos, loading, error };
}
