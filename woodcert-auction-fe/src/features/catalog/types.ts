export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  description: string | null;
}
