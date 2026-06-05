import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { Calendar, Clock, ArrowLeft, Share2, Tag } from "lucide-react";

import { formatDateTime } from "@/shared/lib/format";
import { useNotification } from "@/shared/ui/notification";
import { mockPosts } from "../data/mockPosts";

export function BlogDetailPage() {
  const { postId } = useParams();
  const notification = useNotification();

  const post = useMemo(() => {
    return mockPosts.find((p) => p.id === postId);
  }, [postId]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return mockPosts.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3);
  }, [post]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notification.success("Đã sao chép liên kết bài viết");
    } catch {
      notification.error("Không thể sao chép liên kết bài viết");
    }
  };

  if (!post) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#181612] text-[#f2eee5]">
        <h1 className="text-2xl font-bold">Không tìm thấy bài viết</h1>
        <Link to="/blog" className="mt-4 flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách tin tức
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#181612] px-4 py-12 text-[#f2eee5] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[800px] space-y-8">
        {/* Nút quay lại */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#8D877C] transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại tin tức
        </Link>

        {/* Header bài viết */}
        <header className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Tag className="h-3 w-3" />
              {post.category}
            </span>
            <span className="text-xs text-[#8D877C]">• Nguồn: {post.source}</span>
          </div>

          <h1 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 border-b border-t border-white/5 py-4 text-xs text-[#8D877C]">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Đăng ngày: {formatDateTime(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Thời gian đọc: {post.readTime}
            </span>
            <button
              onClick={() => void handleShare()}
              className="ml-auto flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </button>
          </div>
        </header>

        {/* Ảnh bìa lớn */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
          <img src={post.thumbnail} alt={post.title} className="h-full w-full object-cover" />
        </div>

        {/* Nội dung bài viết */}
        <article
          className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[#c4bcac] prose-headings:text-white prose-headings:font-serif prose-headings:font-bold prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4 text-sm sm:text-base space-y-6"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Bài viết liên quan */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-white/10 pt-12 space-y-6">
            <h2 className="font-serif text-2xl font-bold text-white">Bài viết liên quan</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {relatedPosts.map((rPost) => (
                <Link
                  key={rPost.id}
                  to={`/blog/${rPost.id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-lg border border-white/5 bg-[#1f1d18] transition-all duration-300 hover:border-primary/20"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={rPost.thumbnail}
                      alt={rPost.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {rPost.category}
                    </span>
                    <h3 className="font-serif text-base font-bold text-white line-clamp-2 transition-colors group-hover:text-primary">
                      {rPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
