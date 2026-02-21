import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/data/mock-projects";
import { ProjectDetailContent } from "@/components/website/projects/project-detail-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetailContent project={project} />;
}
