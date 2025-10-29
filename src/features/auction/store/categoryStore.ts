import { create } from "zustand";
import type { CategoryNode, TopCategoriesResponse } from "../api/categories";
import { fetchTopCategories, fetchChildren } from "../api/categories";

type CategoryState = {
  mains: CategoryNode[];
  subsByParent: Record<number, CategoryNode[]>;
  loadingTop: boolean;
  loadingSubs: Record<number, boolean>;
  loadedTop: boolean;
  loadTop: () => Promise<void>;
  loadSubs: (parentId: number) => Promise<void>;
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  mains: [],
  subsByParent: {},
  loadingTop: false,
  loadingSubs: {},
  loadedTop: false,

  loadTop: async () => {
    const s = get();
    if (s.loadedTop) {
      return;
    }
    const t0 = performance.now();
    set({ loadingTop: true });

    try {
      const raw: TopCategoriesResponse = await fetchTopCategories();

      const tops: CategoryNode[] = Array.isArray(raw) ? raw : [raw];

      const subsByParent: Record<number, CategoryNode[]> = {};

      for (const m of tops) {
        if (Array.isArray(m.children) && m.children.length > 0) {
          subsByParent[m.categoryId] = m.children;
        }
      }

      set({ mains: tops, subsByParent, loadedTop: true });
      // eslint-disable-next-line no-useless-catch
    } catch (err) {
      throw err;
    } finally {
      set({ loadingTop: false });
    }
  },

  loadSubs: async (parentId: number) => {
    const s = get();
    if (s.subsByParent[parentId]?.length) {
      return;
    }
    const t0 = performance.now();
    set({ loadingSubs: { ...s.loadingSubs, [parentId]: true } });

    try {
      const subs = await fetchChildren(parentId);
      set({ subsByParent: { ...get().subsByParent, [parentId]: subs } });
      // eslint-disable-next-line no-useless-catch
    } catch (err) {
      throw err;
    } finally {
      const ls = { ...get().loadingSubs };
      delete ls[parentId];
      set({ loadingSubs: ls });
    }
  },
}));
