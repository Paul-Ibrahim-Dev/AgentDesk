import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/apiClient';

const BusinessContext = createContext(null);

/**
 * Loads the businesses the current user belongs to and tracks which one is
 * "active" in the dashboard. The MVP mainly supports one business per
 * owner, but the data model (business_members) already supports more, so
 * this leaves room for a switcher later without changing every page.
 */
export function BusinessProvider({ children }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [activeBusinessId, setActiveBusinessId] = useState(
    () => localStorage.getItem('agentdesk_active_business_id') || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { businesses: list } = await api.get('/api/businesses');
      setBusinesses(list || []);
      setActiveBusinessId((current) => {
        if (current && list?.some((b) => b.id === current)) return current;
        return list?.[0]?.id || null;
      });
    } catch (err) {
      setError(err.message || 'Could not load your businesses.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (activeBusinessId) localStorage.setItem('agentdesk_active_business_id', activeBusinessId);
  }, [activeBusinessId]);

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) || null;

  const value = {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    loading,
    error,
    refresh,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within a BusinessProvider');
  return ctx;
}
