import { useEffect, useState } from 'react';
import { masterStorage } from '@/utils/masterStorage';

export function useFirstRun() {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkFirstRun() {
      setIsLoading(true);
      try {
        const setupDone = localStorage.getItem('finplan-setup-complete') === 'true';
        if (setupDone) {
          setIsFirstRun(false);
        } else {
          // If setup not done in localStorage, check if we have data in DB.
          // masterStorage.getItem returns the DESERIALIZED value: the marker is
          // persisted as the JSON string '"true"' (→ parsed to the string
          // 'true'), or the bare boolean true. Accept both forms.
          const val = (await masterStorage.getItem('finplan-setup-complete')) as unknown;
          const setupComplete = val === 'true' || val === true;
          setIsFirstRun(!setupComplete);
        }
      } catch {
        setIsFirstRun(true);
      } finally {
        setIsLoading(false);
      }
    }
    checkFirstRun();
  }, []);

  const completeSetup = async () => {
    localStorage.setItem('finplan-setup-complete', 'true');
    await masterStorage.setItem('finplan-setup-complete', '"true"');
    setIsFirstRun(false);
  };

  const skipSetup = async () => {
    localStorage.setItem('finplan-setup-complete', 'true');
    await masterStorage.setItem('finplan-setup-complete', '"true"');
    setIsFirstRun(false);
  };

  const resetSetup = async () => {
    localStorage.removeItem('finplan-setup-complete');
    await masterStorage.removeItem('finplan-setup-complete');
    setIsFirstRun(true);
  };

  return { isFirstRun, isLoading, completeSetup, skipSetup, resetSetup };
}
