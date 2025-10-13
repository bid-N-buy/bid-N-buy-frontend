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
      console.log("[Category] loadTop: already loaded → skip");
      return;
    }

    const t0 = performance.now();
    console.log("[Category] loadTop: start");
    set({ loadingTop: true });

    try {
      console.log("[Category] calling fetchTopCategories()");
      const raw: TopCategoriesResponse = await fetchTopCategories();
      console.log(
        "[Category] /category/top typeof:",
        typeof raw,
        "isArray:",
        Array.isArray(raw)
      );

      const tops: CategoryNode[] = Array.isArray(raw) ? raw : [raw];

      const subsByParent: Record<number, CategoryNode[]> = {};
      for (const m of tops) {
        if (Array.isArray(m.children) && m.children.length > 0) {
          subsByParent[m.categoryId] = m.children;
        }
      }

      set({ mains: tops, subsByParent, loadedTop: true });
      console.log(
        `[Category] loadTop OK → mains=${tops.length}, cachedParents=${Object.keys(subsByParent).length}`
      );
    } catch (err) {
      console.log("[Category] loadTop FAILED:", err);
      throw err;
    } finally {
      set({ loadingTop: false });
      console.log(
        `[Category] loadTop: end (${(performance.now() - t0).toFixed(1)}ms)`
      );
    }
  },

  loadSubs: async (parentId: number) => {
    const s = get();
    if (s.subsByParent[parentId]?.length) {
      console.log(`[Category] loadSubs(${parentId}): cache hit`);
      return;
    }

    const t0 = performance.now();
    console.log("[Category] loadSubs: start parentId=", parentId);
    set({ loadingSubs: { ...s.loadingSubs, [parentId]: true } });

    try {
      console.log(`[Category] calling fetchChildren(${parentId})`);
      const subs = await fetchChildren(parentId);
      console.log(
        `[Category] /category/children/${parentId} isArray:`,
        Array.isArray(subs),
        "len:",
        subs.length
      );

      set({ subsByParent: { ...get().subsByParent, [parentId]: subs } });
      console.log(
        `[Category] loadSubs OK → parentId=${parentId}, subs=${subs.length}`
      );
    } catch (err) {
      console.log(`[Category] loadSubs(${parentId}) FAILED:`, err);
      throw err;
    } finally {
      const ls = { ...get().loadingSubs };
      delete ls[parentId];
      set({ loadingSubs: ls });
      console.log(
        `[Category] loadSubs: end parentId=${parentId} (${(performance.now() - t0).toFixed(1)}ms)`
      );
    }
  },
}));
