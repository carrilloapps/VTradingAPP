import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type FilterOption = 'all' | 'favorites' | 'crypto' | 'fiat';

interface FilterState {
    selectedFilter: FilterOption;
    setFilter: (filter: FilterOption) => void;
}

export const useFilterStore = create<FilterState>()(
    devtools(
        (set) => ({
            selectedFilter: 'all',
            setFilter: (filter) => set({ selectedFilter: filter }),
        }),
        { name: 'FilterStore' }
    )
);
