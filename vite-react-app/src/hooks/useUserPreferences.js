import { useState, useEffect } from "react";

const STORAGE_KEY = "user_preferences";

const defaultPreferences = {
  theme: "light", // tema por defecto
  filters: {
    minAltitude: 1000,
    maxAltitude: 40000,
  },
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const savePreferences = (newPrefs) => {
    setPreferences((prev) => ({
      ...prev,
      ...newPrefs,
    }));
  };

  return {
    preferences,
    savePreferences,
  };
}
