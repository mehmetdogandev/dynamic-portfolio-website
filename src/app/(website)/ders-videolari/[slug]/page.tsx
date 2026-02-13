import { notFound } from "next/navigation";
import { getLessonBySlug } from "@/data/mock-lessons";
import { LessonDetailLayout } from "@/components/website/lessons/lesson-detail-layout";

type Props = { params: Promise<{ slug: string }> };

export default async function DersSlugPage({ params }: Props) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return <LessonDetailLayout lesson={lesson} />;
}
