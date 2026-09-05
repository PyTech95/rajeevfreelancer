import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SITE_DEFAULTS, setSiteConfig, initTracking } from "@/lib/siteConfig";

const SettingsContext = createContext(SITE_DEFAULTS);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(SITE_DEFAULTS);

  useEffect(() => {
    let alive = true;
    api
      .get("/settings")
      .then(({ data }) => {
        if (!alive) return;
        setSiteConfig(data);
        setSettings(data);
        initTracking();
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export const useSiteSettings = () => useContext(SettingsContext);
