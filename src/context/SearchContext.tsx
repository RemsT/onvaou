import React, { createContext, useContext, useState } from 'react';
import { RecentSearch } from '../services/recentSearchService';

interface SearchContextType {
  pendingRelaunch: RecentSearch | null;
  setPendingRelaunch: (search: RecentSearch | null) => void;
}

const SearchContext = createContext<SearchContextType>({
  pendingRelaunch: null,
  setPendingRelaunch: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [pendingRelaunch, setPendingRelaunch] = useState<RecentSearch | null>(null);
  return (
    <SearchContext.Provider value={{ pendingRelaunch, setPendingRelaunch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  return useContext(SearchContext);
}
