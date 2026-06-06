type StaticMediaKind = 'etkinlik' | 'solution' | 'topluluk'

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

export const STATIC_MEDIA_GROUPS: StaticMediaGroupSeed[] = [
  {
    key: 'konferans',
    name: 'Konferanslar ve etkinlikler',
    description: 'Sahne, sunum ve topluluk buluşmaları',
    parentKey: null,
  },
  {
    key: 'solution',
    name: 'Çözümler ve teslimat',
    description: 'Saha ve merkezden kareler',
    parentKey: null,
  },
  {
    key: 'topluluk',
    name: 'Topluluk ve ekip',
    description: 'Çalışma kültürü',
    parentKey: null,
  },
  {
    key: 'musteri',
    name: 'Müşteri ortak çalışması',
    description: 'Atölye ve keşif',
    parentKey: 'konferans',
  },
  {
    key: 'saha',
    name: 'Saha ve operasyon',
    description: 'Sahadan merkeze veri',
    parentKey: 'solution',
  },
  {
    key: 'urun',
    name: 'Ürün ve inovasyon',
    description: 'Tasarım ve lansman',
    parentKey: 'solution',
  },
]

export const STATIC_MEDIA_ITEMS: StaticMediaSeed[] = [
  {
    key: 'g-k1',
    groupKey: 'konferans',
    title: 'Teknoloji zirvesi 2025',
    imageAlt: 'Teknoloji zirvesi 2025 ana sahne ve katılımcılar',
    detail:
      'Ana sahne: gözlemlenebilirlik ve kurumsal dönüşüm oturumu; 400+ katılımcı.',
    photoPath: 'photo-1517248135467-4c7edcad34c4',
    kind: 'etkinlik',
    parentKey: null,
  },
  {
    key: 'g-k2',
    groupKey: 'konferans',
    title: 'Yönetici buluşması',
    imageAlt: 'Yönetici buluşması kapalı oturum',
    detail:
      'Kapalı oturum: ürün yol haritası ve müşteri geri bildirimi panelleri.',
    photoPath: 'photo-1515187029135-18ee286d815b',
    kind: 'etkinlik',
    parentKey: 'g-k1',
  },
  {
    key: 'g-p1',
    groupKey: 'solution',
    title: 'Komuta merkezi',
    imageAlt: 'Operasyon komuta merkezi KPI ekranları',
    detail: 'Operasyon KPI duvarı ve anlık uyarı akışı devreye alma haftası.',
    photoPath: 'photo-1454165804606-c3d57bc86b40',
    kind: 'solution',
    parentKey: null,
  },
  {
    key: 'g-p2',
    groupKey: 'solution',
    title: 'Planlama sprinti',
    imageAlt: 'Ekip planlama sprinti beyaz tahta',
    detail: 'Haftalık teslimat planlama ve risk kayıtları.',
    photoPath: 'photo-1552664730-d307ca884978',
    kind: 'solution',
    parentKey: 'g-p1',
  },
  {
    key: 'g-t1',
    groupKey: 'topluluk',
    title: 'Ekip kahvaltısı',
    imageAlt: 'Şirket içi ekip kahvaltısı ve sohbet',
    detail: 'Çapraz fonksiyon ekipleri ile çeyrek değerlendirme kahvaltısı.',
    photoPath: 'photo-1522071820081-009f0129c71c',
    kind: 'topluluk',
    parentKey: null,
  },
  {
    key: 'g-t2',
    groupKey: 'topluluk',
    title: 'Mentorluk saati',
    imageAlt: 'Mühendislik mentorluk oturumu',
    detail: 'Kıdemli mühendislik mentorluğu ve kariyer sohbetleri.',
    photoPath: 'photo-1521737604893-d14cc237f11d',
    kind: 'topluluk',
    parentKey: 'g-t1',
  },
  {
    key: 'g-m1',
    groupKey: 'musteri',
    title: 'Keşif atölyesi',
    imageAlt: 'Müşteri keşif atölyesi çalışma duvarı',
    detail: 'İş süreçleri haritalama ve önceliklendirme oturumu.',
    photoPath: 'photo-1553877522-43269d4ea984',
    kind: 'etkinlik',
    parentKey: null,
  },
  {
    key: 'g-m2',
    groupKey: 'musteri',
    title: 'Paydaş sunumu',
    imageAlt: 'Yönetim paydaş sunumu salonu',
    detail: 'Yönetim özet sunumu ve yol haritası onayı.',
    photoPath: 'photo-1600880292203-757bb62b4baf',
    kind: 'etkinlik',
    parentKey: 'g-m1',
  },
  {
    key: 'g-s1',
    groupKey: 'saha',
    title: 'Depo turu',
    imageAlt: 'Lojistik depo saha turu ve envanter',
    detail: 'Envanter doğrulama ve barkod süreçlerinin saha kontrolü.',
    photoPath: 'photo-1586528116311-ad8dd3c8310d',
    kind: 'solution',
    parentKey: null,
  },
  {
    key: 'g-s2',
    groupKey: 'saha',
    title: 'Saha mühendisi',
    imageAlt: 'Saha mühendisi bakım görevinde',
    detail: 'Bakım iş emri kapatma ve fotoğraf kanıtı yükleme.',
    photoPath: 'photo-1504384308090-c894fdcc538d',
    kind: 'solution',
    parentKey: 'g-s1',
  },
  {
    key: 'g-u1',
    groupKey: 'urun',
    title: 'Tasarım kritiği',
    imageAlt: 'Ürün tasarım kritik toplantısı ekran başında',
    detail: 'UI bileşen seti ve erişilebilirlik ince ayarları.',
    photoPath: 'photo-1531482615713-2afd69097998',
    kind: 'solution',
    parentKey: null,
  },
  {
    key: 'g-u2',
    groupKey: 'urun',
    title: 'Ürün lansmanı',
    imageAlt: 'Ürün lansmanı sunumu ve ekip alkışı',
    detail: 'Yeni modül duyurusu ve canlı metrik izleme.',
    photoPath: 'photo-1460925895917-afdab827c52f',
    kind: 'etkinlik',
    parentKey: 'g-u1',
  },
]
