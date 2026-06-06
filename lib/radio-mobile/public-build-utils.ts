import type { PublicBuildRow } from './public-builds'

export function formatBuildSizeMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatBuildMetaLine(build: PublicBuildRow) {
  const parts: string[] = [
    new Date(build.publishedAt).toLocaleDateString('tr-TR'),
    formatBuildSizeMb(build.sizeBytes),
  ]
  if (build.minSdk != null && build.targetSdk != null) {
    parts.push(`SDK ${build.minSdk}–${build.targetSdk}`)
  }
  if (build.reactNativeVersion) {
    parts.push(`RN ${build.reactNativeVersion}`)
  }
  return parts.join(' · ')
}

export function pickFeaturedBuild(
  builds: PublicBuildRow[]
): PublicBuildRow | null {
  if (builds.length === 0) return null
  const stable = builds.filter((b) => b.isStable)
  const pool = stable.length > 0 ? stable : builds
  return pool.reduce((best, cur) =>
    cur.versionCode > best.versionCode ? cur : best
  )
}
