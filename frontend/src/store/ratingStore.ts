import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BookRating {
  bookId: string;
  rating: number;
  timestamp: string;
}

interface RatingState {
  ratings: Record<string, BookRating>;
  
  // Actions
  setRating: (bookId: string, rating: number) => void;
  getRating: (bookId: string) => number;
  hasRating: (bookId: string) => boolean;
  clearRating: (bookId: string) => void;
  clearAllRatings: () => void;
}

export const useRatingStore = create<RatingState>()(
  persist(
    (set: any, get: any) => ({
      ratings: {},

      setRating: (bookId: string, rating: number) => {
        set((state: RatingState) => ({
          ratings: {
            ...state.ratings,
            [bookId]: {
              bookId,
              rating,
              timestamp: new Date().toISOString(),
            },
          },
        }));
      },

      getRating: (bookId: string) => {
        const rating = get().ratings[bookId];
        return rating ? rating.rating : 0;
      },

      hasRating: (bookId: string) => {
        return bookId in get().ratings;
      },

      clearRating: (bookId: string) => {
        set((state: RatingState) => {
          const newRatings = { ...state.ratings };
          delete newRatings[bookId];
          return { ratings: newRatings };
        });
      },

      clearAllRatings: () => {
        set({ ratings: {} });
      },
    }),
    {
      name: "rating-store",
    }
  )
);
