type StaticMediaKind = 'etkinlik' | 'project' | 'topluluk' | 'teknoloji'

export type StaticMediaGroupSeed = {
  key: string
  name: string
  description?: string
  parentKey: string | null
}

export type StaticMediaSeed = {
  key: string
  groupKey: string
  title: string
  detail: string
  /** Galeri `image_alt`; boşsa seed `title` kullanır */
  imageAlt?: string
  photoPath: string
  kind: StaticMediaKind
  parentKey: string | null
}

/** referance/.../src/data/mock-gallery.ts — 4 kategori */
export const STATIC_MEDIA_GROUPS: StaticMediaGroupSeed[] = [
  {
    key: 'konferans',
    name: 'Konferanslar & Etkinlikler',
    description: 'Konferans, sunum ve workshop etkinlikleri',
    parentKey: null,
  },
  {
    key: 'projeler',
    name: 'Projeler',
    description: 'Yazılım ve teknoloji proje kareleri',
    parentKey: null,
  },
  {
    key: 'topluluk',
    name: 'Topluluk',
    description: 'Topluluk, eğitim ve iş birliği anları',
    parentKey: null,
  },
  {
    key: 'teknoloji',
    name: 'Teknoloji',
    description: 'Kod, ofis ve teknoloji odaklı görseller',
    parentKey: null,
  },
]

export const STATIC_MEDIA_ITEMS: StaticMediaSeed[] = [
  {
    key: 'g-k1',
    groupKey: 'konferans',
    title: 'Teknoloji konferansı',
    imageAlt: 'Teknoloji konferansı ana salon',
    detail: 'Teknoloji ve inovasyon odaklı konferans katılımı.',
    photoPath: 'photo-1540575467063-178a50c2df87',
    kind: 'etkinlik',
    parentKey: null,
  },
  {
    key: 'g-k2',
    groupKey: 'konferans',
    title: 'Sunum salonu',
    imageAlt: 'Sunum salonu ve sahne',
    detail: 'Sunum ve bilgi paylaşımı oturumu.',
    photoPath: 'photo-1475721027785-f74eccf877e2',
    kind: 'etkinlik',
    parentKey: null,
  },
  {
    key: 'g-k3',
    groupKey: 'konferans',
    title: 'Workshop etkinliği',
    imageAlt: 'Workshop etkinliği çalışma alanı',
    detail: 'Uygulamalı workshop ve atölye çalışması.',
    photoPath: 'photo-1505373877841-8d25f7d46678',
    kind: 'etkinlik',
    parentKey: null,
  },
  {
    key: 'g-k4',
    groupKey: 'konferans',
    title: 'Networking',
    imageAlt: 'Networking ve sohbet',
    detail: 'Etkinlik sonrası networking ve fikir alışverişi.',
    photoPath: 'photo-1515187029135-18ee286d815b',
    kind: 'etkinlik',
    parentKey: null,
  },
  {
    key: 'g-k5',
    groupKey: 'konferans',
    title: 'Konferans katılımcıları',
    imageAlt: 'Konferans katılımcıları salonu',
    detail: 'Çok katılımcılı teknoloji etkinliği.',
    photoPath: 'photo-1475721027785-f74eccf877e2',
    kind: 'etkinlik',
    parentKey: null,
  },
  {
    key: 'g-p1',
    groupKey: 'projeler',
    title: 'Yazılım geliştirme',
    imageAlt: 'Yazılım geliştirme çalışma ortamı',
    detail: 'Proje geliştirme ve kodlama süreci.',
    photoPath: 'photo-1551434678-e076c223a692',
    kind: 'project',
    parentKey: null,
  },
  {
    key: 'g-p2',
    groupKey: 'projeler',
    title: 'Veri analizi',
    imageAlt: 'Veri analizi ekranı',
    detail: 'Dashboard ve veri görselleştirme çalışması.',
    photoPath: 'photo-1460925895917-afdab827c52f',
    kind: 'project',
    parentKey: null,
  },
  {
    key: 'g-p3',
    groupKey: 'projeler',
    title: 'IoT projesi',
    imageAlt: 'IoT ve gömülü sistem projesi',
    detail: 'IoT ve donanım yazılımı proje çalışması.',
    photoPath: 'photo-1558494949-ef010cbdcc31',
    kind: 'project',
    parentKey: null,
  },
  {
    key: 'g-p4',
    groupKey: 'projeler',
    title: 'Dashboard',
    imageAlt: 'Operasyonel dashboard ekranı',
    detail: 'KPI ve operasyonel izleme paneli.',
    photoPath: 'photo-1551288049-bebda4e38f71',
    kind: 'project',
    parentKey: null,
  },
  {
    key: 'g-p5',
    groupKey: 'projeler',
    title: 'Proje yönetimi',
    imageAlt: 'Proje yönetimi planlama',
    detail: 'Sprint planlama ve teslimat takibi.',
    photoPath: 'photo-1611224923853-80b023f02d71',
    kind: 'project',
    parentKey: null,
  },
  {
    key: 'g-t1',
    groupKey: 'topluluk',
    title: 'Topluluk etkinliği',
    imageAlt: 'Topluluk etkinliği grup çalışması',
    detail: 'Üniversite teknoloji topluluğu etkinliği.',
    photoPath: 'photo-1522202176988-66273c2fd55f',
    kind: 'topluluk',
    parentKey: null,
  },
  {
    key: 'g-t2',
    groupKey: 'topluluk',
    title: 'Takım çalışması',
    imageAlt: 'Takım çalışması ve iş birliği',
    detail: 'Çapraz fonksiyon ekip çalışması.',
    photoPath: 'photo-1524178232363-1fb2b075b655',
    kind: 'topluluk',
    parentKey: null,
  },
  {
    key: 'g-t3',
    groupKey: 'topluluk',
    title: 'Eğitim oturumu',
    imageAlt: 'Eğitim oturumu sınıf',
    detail: 'Mentorluk ve eğitim oturumu.',
    photoPath: 'photo-1523240795612-9a054b0db644',
    kind: 'topluluk',
    parentKey: null,
  },
  {
    key: 'g-t4',
    groupKey: 'topluluk',
    title: 'İş birliği',
    imageAlt: 'İş birliği ve proje toplantısı',
    detail: 'Proje iş birliği ve fikir geliştirme.',
    photoPath: 'photo-1522071820081-009f0129c71c',
    kind: 'topluluk',
    parentKey: null,
  },
  {
    key: 'g-t5',
    groupKey: 'topluluk',
    title: 'Workshop',
    imageAlt: 'Topluluk workshop etkinliği',
    detail: 'Teknoloji workshop ve uygulamalı oturum.',
    photoPath: 'photo-1531482615713-2afd69097998',
    kind: 'topluluk',
    parentKey: null,
  },
  {
    key: 'g-tech1',
    groupKey: 'teknoloji',
    title: 'Kod yazma',
    imageAlt: 'Kod yazma ve geliştirme',
    detail: 'Günlük yazılım geliştirme rutini.',
    photoPath: 'photo-1517694712202-14dd9538aa97',
    kind: 'teknoloji',
    parentKey: null,
  },
  {
    key: 'g-tech2',
    groupKey: 'teknoloji',
    title: 'Yazılım geliştirme',
    imageAlt: 'Yazılım geliştirme ortamı',
    detail: 'IDE ve geliştirme araçları.',
    photoPath: 'photo-1504639725590-34d0984388bd',
    kind: 'teknoloji',
    parentKey: null,
  },
  {
    key: 'g-tech3',
    groupKey: 'teknoloji',
    title: 'Teknoloji ofisi',
    imageAlt: 'Teknoloji ofisi çalışma alanı',
    detail: 'Modern teknoloji ofisi ve ekip alanı.',
    photoPath: 'photo-1534665482403-a909d0d97c67',
    kind: 'teknoloji',
    parentKey: null,
  },
  {
    key: 'g-tech4',
    groupKey: 'teknoloji',
    title: 'AI ve makine öğrenimi',
    imageAlt: 'Yapay zeka ve makine öğrenimi',
    detail: 'Yapay zeka modeli ve veri bilimi çalışması.',
    photoPath: 'photo-1620712943543-bcc4688e7485',
    kind: 'teknoloji',
    parentKey: null,
  },
  {
    key: 'g-tech5',
    groupKey: 'teknoloji',
    title: 'Veritabanı',
    imageAlt: 'Veritabanı ve altyapı',
    detail: 'Veritabanı modelleme ve altyapı planlaması.',
    photoPath: 'photo-1550751827-4bd374c3f58b',
    kind: 'teknoloji',
    parentKey: null,
  },
]
