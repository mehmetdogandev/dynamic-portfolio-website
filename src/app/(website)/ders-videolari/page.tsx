import { lessons } from "@/data/mock-lessons";
import { LessonCard } from "@/components/website/lessons/lesson-card";
import { SectionTitle } from "@/components/website/ui/section-title";

export default function DersVideolariPage() {
  return (
    <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle
        title="Ders Videoları"
        subtitle="Konu anlatım videolarına göz atın"
        className="mb-10"
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
