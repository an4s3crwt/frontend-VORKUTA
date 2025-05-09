import { useState, useEffect } from "react";
import { DEFAULT_FILTERS } from "../constants/map";

const STORAGE_KEY = "user_preferences";

const defaultPreferences = {
  theme: "light",
  filters: {
    originCountry: "",
    destCountry: "",
  },
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultPreferences;
    } catch (error) {
      console.error("Error reading preferences from localStorage", error);
      return defaultPreferences;
    }
  });

  useEffect(() => {
      try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Error saving preferences to localStorage", error);
    }
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
