import { useState, useEffect } from 'react';
import { NavItem, staticNavItems } from 'utils/navigation';

export function useNavigation() {
  const [navItems, setNavItems] = useState<NavItem[]>(staticNavItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/navigation');
        if (!response.ok) {
          throw new Error('Failed to fetch navigation');
        }
        const data = await response.json();
        if (data.navItems && Array.isArray(data.navItems)) {
          setNavItems(data.navItems);
        }
      } catch (err) {
        console.error('Error fetching navigation:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Keep static navigation as fallback
        setNavItems(staticNavItems);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to avoid blocking initial render
    const timeoutId = setTimeout(fetchNavigation, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return { navItems, loading, error };
}
