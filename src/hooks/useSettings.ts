import { useState, useCallback } from "react";
import type { Settings } from "../types";
import { getSettings, saveSettings } from "../lib/store";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => getSettings());

  const updateSettings = useCallback((newSettings: Settings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const hasApiKey = settings.apiKey.length > 0;

  return { settings, updateSettings, hasApiKey };
}
