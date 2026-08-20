import { create } from "zustand";
import { ICategory } from "../types/shop";
import { persist } from "zustand/middleware";
import { getCategories } from "../lib/shop/api";

interface CommonState {
  categories: ICategory[] | null;
  setCategories: (u: ICategory[] | null) => void;
  fetchCategories: () => Promise<void>;
}

export const useCommonStore = create<CommonState>()(
  persist(
    (set, get) => ({
      categories: null,
      setCategories: (u) => set({ categories: u }),
      fetchCategories: async () => {
        try {
          const categories = await getCategories();
          set({ categories: categories });
        } catch (e) {
          set({ categories: null });
        }
      },
    }),
    {
      name: "common-storage",
    },
  ),
);
export default useCommonStore;
