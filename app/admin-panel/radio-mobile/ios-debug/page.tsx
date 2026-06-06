import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { IosDebugPageTable } from '@/components/tables/radio-mobile/ios-debug/page-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RadioMobileIosDebugPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Radio Mobil — iOS Debug
            </CardTitle>
            <CardDescription>iOS debug dağıtımı yakında.</CardDescription>
          </CardHeader>
          <CardContent>
            <IosDebugPageTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
