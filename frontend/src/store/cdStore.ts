import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CD, CDQuery, CDResponse } from '../types/product.types';
import { getCDs, getCDById, getFeaturedCDs, getAllCategories } from '../api/cds';

interface CDState {
  cds: CD[];
  featuredCDs: CD[];
  categories: string[];
  selectedCD: CD | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;

  // Actions
  fetchCDs: (query?: CDQuery) => Promise<void>;
  fetchCDById: (id: string) => Promise<CD | null>;
  fetchFeaturedCDs: (limit?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  setSelectedCD: (cd: CD | null) => void;
  clearError: () => void;
  resetState: () => void;
}

const initialState = {
  cds: [],
  featuredCDs: [],
  categories: [],
  selectedCD: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalItems: 0,
};

export const useCDStore = create<CDState>()(
  persist(
    (set: any, get: any) => ({
      ...initialState,

      fetchCDs: async (query: CDQuery = {}) => {
        try {
          set({ isLoading: true, error: null });
          
          const response: CDResponse = await getCDs(query);
          
          set({
            cds: response.cds,
            totalItems: response.total,
            currentPage: response.page,
            totalPages: Math.ceil(response.total / response.limit),
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching CDs:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch CDs',
            isLoading: false,
          });
        }
      },

      fetchCDById: async (id: string): Promise<CD | null> => {
        try {
          set({ isLoading: true, error: null });
          
          const cd = await getCDById(id);
          
          set({
            selectedCD: cd,
            isLoading: false,
          });
          
          return cd;
        } catch (error) {
          console.error('Error fetching CD by ID:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch CD',
            isLoading: false,
          });
          return null;
        }
      },

      fetchFeaturedCDs: async (limit: number = 6) => {
        try {
          set({ isLoading: true, error: null });
          
          const featuredCDs = await getFeaturedCDs(limit);
          
          set({
            featuredCDs,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching featured CDs:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch featured CDs',
            isLoading: false,
          });
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await getAllCategories();
          set({ categories });
        } catch (error) {
          console.error('Error fetching CD categories:', error);
          // Don't set error state for categories as it's not critical
        }
      },

      setSelectedCD: (cd: CD | null) => {
        set({ selectedCD: cd });
      },

      clearError: () => {
        set({ error: null });
      },

      resetState: () => {
        set(initialState);
      },
    }),
    {
      name: 'cd-store',
      partialize: (state: CDState) => ({
        featuredCDs: state.featuredCDs,
        categories: state.categories,
      }),
    }
  )
);