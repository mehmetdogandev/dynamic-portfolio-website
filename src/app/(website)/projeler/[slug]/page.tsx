import { ProjectDetailClient } from "@/components/website/projects/project-detail-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProjectDetailClient slug={slug} />;
}
