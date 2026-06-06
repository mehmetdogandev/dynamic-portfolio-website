import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { AndroidReleasePageTable } from '@/components/tables/radio-mobile/android-release/page-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RadioMobileAndroidReleasePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Radio Mobil — Android Release
            </CardTitle>
            <CardDescription>
              Release APK sürümlerini yönetin; public indirme sayfasında
              göstermek için satır bazlı &quot;Sayfada yayınla&quot; kullanın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AndroidReleasePageTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
