import Link from "next/link";
import { Users, Shield, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_LINKS = [
  { title: "Kullanıcılar", href: "/admin-panel/users", icon: Users },
  { title: "Roller", href: "/admin-panel/roles", icon: Shield },
  { title: "Ayarlar", href: "/admin-panel/settings", icon: Settings },
] as const;

export default function AdminPanelPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <p className="text-muted-foreground">
          Admin paneline hoş geldiniz. Aşağıdaki bölümlere hızlıca erişebilirsiniz.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {item.title} yönetim sayfasına git
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
