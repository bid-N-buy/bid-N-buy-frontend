import api from "../../../shared/api/axiosInstance";

// 타입
export type CategoryNode = {
  categoryId: number;
  categoryName: string;
  parentId: number | null;
  children: CategoryNode[]; // /category/top은 children 포함
};

export type TopCategoriesResponse = CategoryNode[] | CategoryNode;

// 대분류
export async function fetchTopCategories(): Promise<TopCategoriesResponse> {
  const { data } = await api.get<TopCategoriesResponse>("/category/top");
  return data;
}

// 소분류
export async function fetchChildren(parentId: number): Promise<CategoryNode[]> {
  const { data } = await api.get<CategoryNode[]>(
    `/category/children/${parentId}`
  );
  return data;
}
