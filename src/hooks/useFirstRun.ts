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
          // If setup not done in localStorage, check if we have data in DB
          const val = await masterStorage.getItem('finplan-setup-complete');
          const hasNoData = !val || (val as { state: unknown }).state !== '"true"';
          setIsFirstRun(hasNoData);
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
    await masterStorage.setItem('finplan-setup-complete', '"true"' as any);
    setIsFirstRun(false);
  };

  const skipSetup = async () => {
    localStorage.setItem('finplan-setup-complete', 'true');
    await masterStorage.setItem('finplan-setup-complete', '"true"' as any);
    setIsFirstRun(false);
  };

  const resetSetup = async () => {
    localStorage.removeItem('finplan-setup-complete');
    await masterStorage.removeItem('finplan-setup-complete');
    setIsFirstRun(true);
  };

  return { isFirstRun, isLoading, completeSetup, skipSetup, resetSetup };
}
