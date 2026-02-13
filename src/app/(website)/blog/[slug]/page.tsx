import { notFound } from "next/navigation";
import { getBlogBySlug } from "@/data/mock-blog";
import { BlogDetailContent } from "@/components/website/blog/blog-detail-content";

type Props = { params: Promise<{ slug: string }> };

export default async function BlogSlugPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogDetailContent post={post} />;
}
