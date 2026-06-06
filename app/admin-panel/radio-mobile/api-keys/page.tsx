import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { RadioMobileApiKeysTable } from '@/components/tables/radio-mobile/radio-mobile-api-keys-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RadioMobileApiKeysPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Radio Mobil API Anahtarları
            </CardTitle>
            <CardDescription>
              CI ve yerel publish script&apos;leri için kanal bazlı yetkili
              anahtarlar oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioMobileApiKeysTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
