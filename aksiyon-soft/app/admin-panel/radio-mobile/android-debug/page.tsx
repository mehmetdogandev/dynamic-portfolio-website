import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { AndroidDebugPageTable } from '@/components/tables/radio-mobile/android-debug/page-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RadioMobileAndroidDebugPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Radio Mobil — Android Debug
            </CardTitle>
            <CardDescription>
              Debug APK sürümleri; test dağıtımı için debugging indirme
              sayfasında listelenebilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AndroidDebugPageTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
