import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE = {
  theme: 'hms_theme',
  reducedMotion: 'hms_reduced_motion',
  patientTips: 'hms_patient_tips',
};

function getSystemDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
}

const UiPreferencesContext = createContext(null);

export function UiPreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(STORAGE.theme) || 'system');
  const [systemTick, setSystemTick] = useState(0);
  const [reducedMotion, setReducedMotionState] = useState(() => localStorage.getItem(STORAGE.reducedMotion) === '1');
  const [showPatientTips, setShowPatientTipsState] = useState(
    () => localStorage.getItem(STORAGE.patientTips) !== '0'
  );

  const resolvedDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return getSystemDark();
  }, [theme, systemTick]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [resolvedDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) root.classList.add('reduce-motion');
    else root.classList.remove('reduce-motion');
  }, [reducedMotion]);

  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemTick((n) => n + 1);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [theme]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem(STORAGE.theme, t);
  }, []);

  const setReducedMotion = useCallback((v) => {
    setReducedMotionState(v);
    localStorage.setItem(STORAGE.reducedMotion, v ? '1' : '0');
  }, []);

  const setShowPatientTips = useCallback((v) => {
    setShowPatientTipsState(v);
    localStorage.setItem(STORAGE.patientTips, v ? '1' : '0');
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedDark,
      reducedMotion,
      setReducedMotion,
      showPatientTips,
      setShowPatientTips,
    }),
    [theme, setTheme, resolvedDark, reducedMotion, setReducedMotion, showPatientTips, setShowPatientTips]
  );

  return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>;
}

export function useUiPreferences() {
  const ctx = useContext(UiPreferencesContext);
  if (!ctx) throw new Error('useUiPreferences must be used within UiPreferencesProvider');
  return ctx;
}
