import type { RadioMobileChannelValue } from './channels'
import { PUBLIC_PATH_BY_CHANNEL } from './channels'

export type RadioMobilePublicPageMeta = {
  breadcrumbPlatform: 'Android' | 'iOS'
  breadcrumbChannel: string
  subtitle: string
  title: string
  description: string
  trustBadge: string
  installSteps: string[]
  heroImageSrc: string
  metadataTitle: string
  metadataDescription: string
  canonicalSegment: string
  downloadAriaSuffix: string
}

export const RADIO_MOBILE_PUBLIC_PAGE: Record<
  RadioMobileChannelValue,
  RadioMobilePublicPageMeta
> = {
  android_release: {
    breadcrumbPlatform: 'Android',
    breadcrumbChannel: 'Release',
    subtitle: 'Radio Mobil · Android',
    title: 'Android Release',
    description:
      'Kurumsal kullanım için imzalı release APK sürümleri. Stabil sürümler öne çıkarılır.',
    trustBadge: 'İmzalı release APK',
    installSteps: [
      'Cihazınızda “Bilinmeyen kaynaklardan uygulama yükleme” iznini etkinleştirin.',
      'İndirdiğiniz APK dosyasını açın.',
      'Kurulum isteminde “Yine de yükle” veya “Kur” seçeneğini onaylayın.',
      'Kurulum tamamlandıktan sonra uygulamayı açın ve kurumsal hesabınızla giriş yapın.',
    ],
    heroImageSrc: '/radio-mobile/hero-android.svg',
    metadataTitle: 'Radio Mobil — Android Release',
    metadataDescription:
      'AksiyonSoft Radio mobil uygulaması Android release APK indirme.',
    canonicalSegment: 'radio-mobile/android/release',
    downloadAriaSuffix: 'Android Release',
  },
  android_debug: {
    breadcrumbPlatform: 'Android',
    breadcrumbChannel: 'Debugging',
    subtitle: 'Radio Mobil · Android',
    title: 'Android Debug',
    description:
      'Test ve geliştirme için debug APK sürümleri. Yalnızca yetkili ekipler için önerilir.',
    trustBadge: 'Geliştirme / test sürümü',
    installSteps: [
      'Bu sürüm yalnızca test ve geliştirme amaçlıdır; üretim ortamında kullanmayın.',
      'Bilinmeyen kaynaklardan yükleme iznini geçici olarak açın.',
      'APK dosyasını indirip kurun.',
      'Sorun yaşarsanız destek ekibiyle iletişime geçin.',
    ],
    heroImageSrc: '/radio-mobile/hero-android.svg',
    metadataTitle: 'Radio Mobil — Android Debug',
    metadataDescription:
      'AksiyonSoft Radio mobil uygulaması Android debug APK indirme.',
    canonicalSegment: 'radio-mobile/android/debugging',
    downloadAriaSuffix: 'Android Debug',
  },
  ios_release: {
    breadcrumbPlatform: 'iOS',
    breadcrumbChannel: 'Release',
    subtitle: 'Radio Mobil · iOS',
    title: 'iOS Release',
    description:
      'Kurumsal iOS dağıtımı için release sürümleri. Dağıtım kanalı yakında açılacaktır.',
    trustBadge: 'Kurumsal iOS dağıtımı',
    installSteps: [
      'Kurumsal MDM veya TestFlight davetiniz hazır olmalıdır.',
      'Yöneticinizden dağıtım bağlantısını veya profili alın.',
      'Cihazınızda gerekli güven profilini onaylayın.',
      'Uygulamayı açıp kurumsal hesabınızla oturum açın.',
    ],
    heroImageSrc: '/radio-mobile/hero-ios.svg',
    metadataTitle: 'Radio Mobil — iOS Release',
    metadataDescription: 'AksiyonSoft Radio mobil uygulaması iOS release.',
    canonicalSegment: 'radio-mobile/ios/release',
    downloadAriaSuffix: 'iOS Release',
  },
  ios_debug: {
    breadcrumbPlatform: 'iOS',
    breadcrumbChannel: 'Debugging',
    subtitle: 'Radio Mobil · iOS',
    title: 'iOS Debug',
    description:
      'Geliştirme ve iç test için iOS debug dağıtımı. Yakında bu sayfadan erişilebilecek.',
    trustBadge: 'Geliştirme / test sürümü',
    installSteps: [
      'Yalnızca yetkili geliştirici cihazları için geçerlidir.',
      'Xcode veya kurumsal dağıtım profilinizin güncel olduğundan emin olun.',
      'Yöneticinizden debug dağıtım talimatlarını alın.',
      'Sorun yaşarsanız destek ekibiyle iletişime geçin.',
    ],
    heroImageSrc: '/radio-mobile/hero-ios.svg',
    metadataTitle: 'Radio Mobil — iOS Debug',
    metadataDescription: 'AksiyonSoft Radio mobil uygulaması iOS debug.',
    canonicalSegment: 'radio-mobile/ios/debugging',
    downloadAriaSuffix: 'iOS Debug',
  },
}

const PATH_TO_CHANNEL = Object.fromEntries(
  Object.entries(PUBLIC_PATH_BY_CHANNEL).map(([channel, path]) => [
    path,
    channel as RadioMobileChannelValue,
  ])
) as Record<string, RadioMobileChannelValue>

export function getChannelByPublicPath(
  pathname: string
): RadioMobileChannelValue | null {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  for (const [path, channel] of Object.entries(PATH_TO_CHANNEL)) {
    if (normalized === path) return channel
  }
  return null
}

export function getPublicPageMeta(
  channel: RadioMobileChannelValue
): RadioMobilePublicPageMeta {
  return RADIO_MOBILE_PUBLIC_PAGE[channel]
}

/** Same-platform channel pairs for pill navigation */
export const CHANNEL_NAV_SIBLINGS: Record<
  'android' | 'ios',
  [RadioMobileChannelValue, RadioMobileChannelValue]
> = {
  android: ['android_release', 'android_debug'],
  ios: ['ios_release', 'ios_debug'],
}
