import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Calendar, Clock, Search, BookOpen } from "lucide-react";

import { formatDateTime } from "@/shared/lib/format";
import { mockPosts } from "../data/mockPosts";

const CATEGORIES = [
  "Tất cả",
  "Thị trường",
  "Kiến thức gỗ",
  "Tiêu chuẩn kiểm định",
  "Phong thủy",
] as const;
type CategoryType = (typeof CATEGORIES)[number];

export function BlogListPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    return mockPosts.filter((post) => {
      const matchCategory = activeCategory === "Tất cả" || post.category === activeCategory;
      const matchSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  // Bài viết nổi bật là bài đầu tiên trong danh sách (hoặc bài có ID 1)
  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  return (
    <main className="min-h-screen bg-[#181612] px-4 py-12 text-[#f2eee5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px] space-y-10">
        {/* Banner/Header */}
        <header className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Tin tức & Kiến thức
            </p>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-white md:text-5xl">
              WoodCert Journal
            </h1>
            <p className="max-w-md text-sm text-[#8D877C]">
              Cập nhật tin tức thị trường gỗ mỹ nghệ, kiến thức chuyên ngành và các tiêu chuẩn kiểm
              định quốc tế.
            </p>
          </div>

          {/* Ô tìm kiếm bài viết */}
          <div className="relative w-full max-w-xs shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D877C]" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border-none bg-[#24211b] pl-10 pr-4 text-sm text-white placeholder:text-[#8D877C] focus:bg-[#2e2a22] focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </header>

        {/* Tab Danh mục */}
        <nav
          className="flex gap-2 overflow-x-auto border-b border-white/5 pb-2"
          aria-label="Danh mục tin tức"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-[#c4bcac] hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </nav>

        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <BookOpen className="h-12 w-12 text-[#8D877C]/40 animate-pulse" />
            <p className="text-[#8D877C]">Không tìm thấy bài viết nào phù hợp.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Bài viết nổi bật (Featured Post) - Chỉ hiển thị khi không gõ tìm kiếm sâu hoặc ở trang 1 */}
            {featuredPost && (
              <article className="group overflow-hidden rounded-xl border border-white/5 bg-[#1f1d18] transition-all duration-500 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5">
                <Link to={`/blog/${featuredPost.id}`} className="grid gap-6 md:grid-cols-2">
                  <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-full">
                    <img
                      src={featuredPost.thumbnail}
                      alt={featuredPost.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                  </div>
                  <div className="flex flex-col justify-between p-6 md:py-10 md:pr-10">
                    <div className="space-y-4">
                      <span className="inline-block rounded bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                        {featuredPost.category}
                      </span>
                      <h2 className="font-serif text-2xl font-bold text-white transition-colors group-hover:text-primary md:text-3xl">
                        {featuredPost.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-[#c4bcac]">
                        {featuredPost.summary}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-4 border-t border-white/5 pt-4 text-xs text-[#8D877C]">
                      <span className="font-medium text-white/80">{featuredPost.source}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(featuredPost.publishedAt).split(" ")[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            )}

            {/* Danh sách các bài viết thường */}
            {regularPosts.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-[#1f1d18] transition-all duration-300 hover:border-primary/20"
                  >
                    <Link to={`/blog/${post.id}`}>
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={post.thumbnail}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="space-y-3 p-5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {post.category}
                        </span>
                        <h3 className="font-serif text-lg font-bold text-white line-clamp-2 transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="text-xs leading-relaxed text-[#c4bcac] line-clamp-3">
                          {post.summary}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center justify-between border-t border-white/5 p-5 pt-3 text-[11px] text-[#8D877C]">
                      <span>{post.source}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTime}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
