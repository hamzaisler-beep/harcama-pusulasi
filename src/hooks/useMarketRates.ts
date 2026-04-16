import { useState, useEffect } from 'react';
import { fetchMarketRates, MarketRate } from '../services/api';
import { RATES as FALLBACK_RATES } from '../types';

export function useMarketRates() {
  const [rates, setRates] = useState<MarketRate>(FALLBACK_RATES as MarketRate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function updateRates() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchMarketRates();
        setRates(data);
      } catch (err: any) {
        console.warn('Live rates failed, using fallback:', err.message);
        setError(err.message);
        // Fallback already set as initial state
      } finally {
        setIsLoading(false);
      }
    }

    updateRates();
    
    // Refresh every 30 minutes
    const interval = setInterval(updateRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { rates, isLoading, error };
}
