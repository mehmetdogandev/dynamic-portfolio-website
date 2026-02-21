import { blogPosts } from "@/data/mock-blog";
import { BlogCard } from "@/components/website/blog/blog-card";
import { SectionTitle } from "@/components/website/ui/section-title";

export default function BlogPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <SectionTitle
        title="Blog İçerikleri"
        subtitle="Eğitim, sınav hazırlığı ve öğrenme ipuçları"
        className="mb-10"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
