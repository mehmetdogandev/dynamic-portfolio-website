import type { Lesson } from "./types";

export const lessons: Lesson[] = [
  {
    id: "1",
    slug: "matematik-temel-kavramlar",
    title: "Matematik – Temel Kavramlar",
    description:
      "Sayı kümeleri, işlem önceliği, üslü ve köklü sayılar ile başlayan temel matematik konuları. LGS ve YKS hazırlık için uygun.",
    image: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&q=80",
    imageAlt: "Matematik formülleri ve notlar",
    videoCount: 3,
    videoIds: ["dQw4w9WgXcQ", "jNQXAC9IVRw", "9bZkp7q19f0"],
  },
  {
    id: "2",
    slug: "fizik-hareket-ve-kuvvet",
    title: "Fizik – Hareket ve Kuvvet",
    description:
      "Newton kanunları, sürtünme kuvveti ve basit hareket problemleri. TYT ve AYT fizik için giriş niteliğinde.",
    image: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&q=80",
    imageAlt: "Fizik deneyi ve hareket",
    videoCount: 4,
    videoIds: ["dQw4w9WgXcQ", "jNQXAC9IVRw", "9bZkp7q19f0", "y6120QOlsfU"],
  },
  {
    id: "3",
    slug: "turkce-dil-bilgisi",
    title: "Türkçe – Dil Bilgisi",
    description:
      "İsim, sıfat, fiil ve cümle türleri. Paragraf ve anlam konularına temel oluşturan dil bilgisi videoları.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    imageAlt: "Türkçe kitap ve notlar",
    videoCount: 2,
    videoIds: ["dQw4w9WgXcQ", "jNQXAC9IVRw"],
  },
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}
