/**
 * Cache Metrics Visualization Component
 *
 * Displays cache performance metrics in a user-friendly format
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, Database, Zap } from 'lucide-react'

interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
}

interface CacheMetrics {
  permissions: CacheStats
  entities: CacheStats
  columns: CacheStats
  overall: CacheStats
}

interface CacheMetricsCardProps {
  metrics: CacheMetrics
}

function getHitRateColor(hitRate: number): string {
  if (hitRate >= 90) return 'text-green-600 bg-green-50 border-green-200'
  if (hitRate >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function getHitRateBadgeColor(
  hitRate: number
): 'default' | 'secondary' | 'destructive' {
  if (hitRate >= 90) return 'default'
  if (hitRate >= 70) return 'secondary'
  return 'destructive'
}

function StatCard({
  title,
  stats,
  icon: Icon,
  description,
}: {
  title: string
  stats: CacheStats
  icon: React.ElementType
  description: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant={getHitRateBadgeColor(stats.hitRate)}>
            {stats.hitRate.toFixed(1)}% Hit Rate
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Cache Performance</span>
              <span>{stats.totalRequests} requests</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  stats.hitRate >= 90
                    ? 'bg-green-500'
                    : stats.hitRate >= 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${stats.hitRate}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cache Hits</p>
              <p className="text-2xl font-bold text-green-600">{stats.hits}</p>
              <p className="text-xs text-muted-foreground">
                Veritabanı sorgusu yapılmadı
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cache Misses</p>
              <p className="text-2xl font-bold text-red-600">{stats.misses}</p>
              <p className="text-xs text-muted-foreground">
                Veritabanından çekildi
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CacheMetricsCard({ metrics }: CacheMetricsCardProps) {
  // Calculate performance gains
  const totalQueries = metrics.overall.hits + metrics.overall.misses
  const queriesSaved = metrics.overall.hits
  const reductionPercentage =
    totalQueries > 0 ? ((queriesSaved / totalQueries) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className={`border-2 ${getHitRateColor(metrics.overall.hitRate)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Zap className="h-6 w-6" />
                Genel Performans
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Cache sistemi sayesinde{' '}
                <span className="font-bold text-green-600">{queriesSaved}</span>{' '}
                veritabanı sorgusu önlendi ({reductionPercentage}% azalma)
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {metrics.overall.hitRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Hit Rate</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {metrics.overall.hits}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Cache&apos;den Hızlı
              </div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-red-600">
                {metrics.overall.misses}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                DB&apos;den Yavaş
              </div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {metrics.overall.totalRequests}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Toplam İstek
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Impact */}
      <Card className="bg-linear-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Performans Kazancı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Veritabanı Yükü
                </div>
                <div className="text-2xl font-bold text-green-600">
                  -{reductionPercentage}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {queriesSaved} sorgu engellendi
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Ortalama Yanıt Süresi
                </div>
                <div className="text-2xl font-bold text-blue-600">~5-10ms</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Cache&apos;den (DB: ~50-200ms)
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Hız Artışı</div>
                <div className="text-2xl font-bold text-purple-600">10-40x</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Daha hızlı yanıt
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Ne Anlama Geliyor?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Her cache hit, PostgreSQL&apos;e gitmek yerine
                    Redis&apos;ten (bellek) alınan veridir. Bu,{' '}
                    <span className="font-semibold text-green-600">
                      10-40x daha hızlı
                    </span>{' '}
                    yanıt ve
                    <span className="font-semibold text-blue-600">
                      {' '}
                      {reductionPercentage}% daha az veritabanı yükü
                    </span>{' '}
                    demektir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Yetki Kontrolleri"
          description="Kullanıcı izinlerinin kontrol edilmesi"
          stats={metrics.permissions}
          icon={Activity}
        />
        <StatCard
          title="Entity ID'leri"
          description="Organizasyon, lokasyon vb. ID'ler"
          stats={metrics.entities}
          icon={Database}
        />
        <StatCard
          title="Sütun İzinleri"
          description="Alan düzeyinde erişim kontrolleri"
          stats={metrics.columns}
          icon={Zap}
        />
      </div>
    </div>
  )
}
