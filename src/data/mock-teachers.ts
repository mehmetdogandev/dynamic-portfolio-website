import type { Teacher } from "./types";

export const teachers: Teacher[] = [
  {
    id: "1",
    name: "Özel Ders Hocası 1",
    branch: "Matematik",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    imageAlt: "Matematik öğretmeni",
    shortInfo:
      "15 yıllık deneyim. LGS, TYT, AYT matematik. Bire bir ve grup dersi.",
  },
  {
    id: "2",
    name: "Özel Ders Hocası 2",
    branch: "Fizik",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    imageAlt: "Fizik öğretmeni",
    shortInfo:
      "Yüksek lisans, üniversite hazırlık ve lise fizik. Deney odaklı anlatım.",
  },
  {
    id: "3",
    name: "Özel Ders Hocası 3",
    branch: "Türkçe & Edebiyat",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    imageAlt: "Türkçe öğretmeni",
    shortInfo:
      "Paragraf ve dil bilgisi uzmanı. Sınav teknikleri ve kompozisyon.",
  },
  {
    id: "4",
    name: "Özel Ders Hocası 4",
    branch: "İngilizce",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    imageAlt: "İngilizce öğretmeni",
    shortInfo:
      "YDS, YÖKDİL ve konuşma odaklı dersler. Yurt dışı tecrübesi.",
  },
];
