import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DVD, DVDQuery, DVDResponse } from '../types/product.types';
import { getDVDs, getDVDById, getFeaturedDVDs, getAllFilmTypes, getAllDiscTypes } from '../api/dvds';

interface DVDState {
  dvds: DVD[];
  featuredDVDs: DVD[];
  filmTypes: string[];
  discTypes: string[];
  selectedDVD: DVD | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;

  // Actions
  fetchDVDs: (query?: DVDQuery) => Promise<void>;
  fetchDVDById: (id: string) => Promise<DVD | null>;
  fetchFeaturedDVDs: (limit?: number) => Promise<void>;
  fetchFilmTypes: () => Promise<void>;
  fetchDiscTypes: () => Promise<void>;
  setSelectedDVD: (dvd: DVD | null) => void;
  clearError: () => void;
  resetState: () => void;
}

const initialState = {
  dvds: [],
  featuredDVDs: [],
  filmTypes: [],
  discTypes: [],
  selectedDVD: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
};

export const useDVDStore = create<DVDState>()(
  persist(
    (set: any, get: any) => ({
      ...initialState,

      fetchDVDs: async (query: DVDQuery = {}) => {
        try {
          set({ isLoading: true, error: null });
          
          const response: DVDResponse = await getDVDs(query);
          
          set({
            dvds: response.dvds,
            totalItems: response.total,
            currentPage: response.page,
            totalPages: Math.ceil(response.total / response.limit),
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching DVDs:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch DVDs',
            isLoading: false,
          });
        }
      },

      fetchDVDById: async (id: string): Promise<DVD | null> => {
        try {
          set({ isLoading: true, error: null });
          
          const dvd = await getDVDById(id);
          
          set({
            selectedDVD: dvd,
            isLoading: false,
          });
          
          return dvd;
        } catch (error) {
          console.error('Error fetching DVD by ID:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch DVD',
            isLoading: false,
          });
          return null;
        }
      },

      fetchFeaturedDVDs: async (limit: number = 6) => {
        try {
          set({ isLoading: true, error: null });
          
          const featuredDVDs = await getFeaturedDVDs(limit);
          
          set({
            featuredDVDs,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching featured DVDs:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch featured DVDs',
            isLoading: false,
          });
        }
      },

      fetchFilmTypes: async () => {
        try {
          const filmTypes = await getAllFilmTypes();
          set({ filmTypes });
        } catch (error) {
          console.error('Error fetching DVD film types:', error);
          // Don't set error state for film types as it's not critical
        }
      },

      fetchDiscTypes: async () => {
        try {
          const discTypes = await getAllDiscTypes();
          set({ discTypes });
        } catch (error) {
          console.error('Error fetching DVD disc types:', error);
          // Don't set error state for disc types as it's not critical
        }
      },

      setSelectedDVD: (dvd: DVD | null) => {
        set({ selectedDVD: dvd });
      },

      clearError: () => {
        set({ error: null });
      },

      resetState: () => {
        set(initialState);
      },
    }),
    {
      name: 'dvd-store',
      partialize: (state: DVDState) => ({
        featuredDVDs: state.featuredDVDs,
        filmTypes: state.filmTypes,
        discTypes: state.discTypes,
      }),
    }
  )
);