import { useState, useEffect, useRef } from "react";
import { Howl } from "howler";

export default function usePokemonCry(cryUrl, cryUrlBackup) {
  const [crySoundLoaded, setCrySoundLoaded] = useState(false);
  const cryRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (cryRef.current) {
        cryRef.current.unload();
      }
    };
  }, []);

  useEffect(() => {
    if (!cryUrl) {
      setCrySoundLoaded(false);
      return;
    }

    // Unload previous sound if exists
    if (cryRef.current) {
      cryRef.current.unload();
    }

    // Create new Howl instance
    cryRef.current = new Howl({
      src: [cryUrl, cryUrlBackup].filter(Boolean),
      html5: true,
      format: ["mp3", "ogg"],
      onload: () => {
        if (isMounted.current) {
          setCrySoundLoaded(true);
        }
      },
      onloaderror: (id, error) => {
        console.error("Error loading cry sound:", error);
        // Try loading backup if primary fails
        if (cryRef.current._src === cryUrl && cryUrlBackup) {
          cryRef.current = new Howl({
            src: [cryUrlBackup],
            html5: true,
            format: ["ogg"],
            onload: () => {
              if (isMounted.current) {
                setCrySoundLoaded(true);
              }
            },
            onloaderror: () => console.error("Both cry sources failed to load"),
          });
        }
      },
    });

    // Cleanup function
    return () => {
      if (cryRef.current) {
        cryRef.current.unload();
      }
    };
  }, [cryUrl, cryUrlBackup]);

  const playCry = () => {
    if (cryRef.current && crySoundLoaded) {
      cryRef.current.play();
    }
  };

  return { crySoundLoaded, playCry };
}
