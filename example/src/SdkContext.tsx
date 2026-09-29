import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getMachineCode,
  getLicenseStatus,
  getMissingDatabases,
  init,
  lastLicenseError,
  parseLicenseStatus,
  readyStatusMessage,
  setActivation,
  writeStatus,
  SDK_SUCCESS,
  type LicenseStatus,
  NOT_LICENSED,
} from 'face-recognition-sdk';
import { applyEngineDefaults } from './FaceDatabase';
import { demoLicense } from './license';

export type SdkState = {
  status: string;
  ready: boolean;
  loading: boolean;
  machine: string;
  license: LicenseStatus;
  licenseLabel: string;
  missingDatabases: string;
  refresh: () => void;
};

const SdkContext = createContext<SdkState | null>(null);

function statusLabel(code: number): string {
  switch (code) {
    case 0:
      return 'Ready';
    case 1:
      return 'Invalid license!';
    case 2:
      return 'License expired';
    case 3:
      return 'No activated!';
    case 4:
      return 'Init error!';
    default:
      return `Failed (${code})`;
  }
}

export function SdkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState('Starting SDK…');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [machine, setMachine] = useState('');
  const [license, setLicense] = useState<LicenseStatus>(NOT_LICENSED);
  const [licenseLabel, setLicenseLabel] = useState('License…');
  const [missingDatabases, setMissingDatabases] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await applyEngineDefaults();
        setLoading(true);
        setStatus('Starting SDK…');
        setLicenseLabel('License…');
        setReady(false);
        const mc = await getMachineCode();
        if (!cancelled) setMachine(mc);
        const act = await setActivation(demoLicense());
        if (act !== SDK_SUCCESS) {
          const detail = await lastLicenseError();
          if (!cancelled) {
            setStatus(`${statusLabel(act)}${detail ? `: ${detail}` : ''}`);
            setLicenseLabel('No license');
            setLicense(NOT_LICENSED);
            setReady(false);
            setLoading(false);
          }
          return;
        }
        const code = await init();
        if (!cancelled) {
          let message = statusLabel(code);
          let lic = NOT_LICENSED;
          let missing = '';
          if (code === SDK_SUCCESS) {
            try {
              lic = parseLicenseStatus(await getLicenseStatus());
              message = readyStatusMessage(lic.label);
              missing = (await getMissingDatabases())?.trim() ?? '';
            } catch {
              message = 'Ready';
            }
          }
          setLicense(lic);
          setLicenseLabel(lic.label || 'No license');
          setMissingDatabases(missing);
          setStatus(message);
          setReady(code === SDK_SUCCESS);
          setLoading(false);
          try {
            await writeStatus({
              step: 'js',
              status: message,
              ready: code === SDK_SUCCESS,
              machine: mc,
              code,
              missing,
            });
          } catch {
            // ignore
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus(`Init error: ${e?.message ?? String(e)}`);
          setLicense(NOT_LICENSED);
          setLicenseLabel('No license');
          setReady(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const value = useMemo(
    () => ({
      status,
      ready,
      loading,
      machine,
      license,
      licenseLabel,
      missingDatabases,
      refresh,
    }),
    [
      status,
      ready,
      loading,
      machine,
      license,
      licenseLabel,
      missingDatabases,
      refresh,
    ]
  );

  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

export function useSdk(): SdkState {
  const ctx = useContext(SdkContext);
  if (!ctx) throw new Error('useSdk must be used within SdkProvider');
  return ctx;
}
