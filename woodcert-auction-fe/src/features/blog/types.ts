export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  thumbnail: string;
  category: "Thị trường" | "Kiến thức gỗ" | "Tiêu chuẩn kiểm định" | "Phong thủy";
  source: string;
  publishedAt: string;
  readTime: string;
}
