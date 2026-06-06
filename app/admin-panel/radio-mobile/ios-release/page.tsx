import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { IosReleasePageTable } from '@/components/tables/radio-mobile/ios-release/page-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RadioMobileIosReleasePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Radio Mobil — iOS Release
            </CardTitle>
            <CardDescription>
              iOS dağıtımı yakında. Şema hazır; yükleme şimdilik devre dışı.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IosReleasePageTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
