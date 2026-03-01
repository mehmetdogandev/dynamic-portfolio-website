"use client";

import Image from "next/image";
import { authClient } from "@/lib/better-auth/client";
import { api } from "@/lib/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/utils/avatar";

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const { data: roles, isLoading } = api.profile.getMyRoles.useQuery();

  if (!session?.user) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <p className="text-muted-foreground">Giriş yapmanız gerekiyor.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-muted-foreground">
          Hesap bilgileriniz ve rolleriniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hesap Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {(() => {
            const avatarUrl = getAvatarUrl(session.user.image);
            return avatarUrl ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={avatarUrl}
                  alt={session.user.name ?? ""}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-medium text-muted-foreground">
                {session.user.name?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
            );
          })()}
          <div>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rollerim</CardTitle>
          <p className="text-sm text-muted-foreground">
            Doğrudan atanmış rolleriniz ve rol gruplarınızdaki roller.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Yükleniyor...</p>
          ) : roles ? (
            <div className="space-y-6">
              {roles.directRoles.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Doğrudan Roller</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {roles.directRoles.map((r) => (
                      <li key={`${r.roleName}-${r.page}`}>
                        {r.roleName} ({r.page})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {roles.roleGroups.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Rol Grupları</h3>
                  <div className="space-y-3">
                    {roles.roleGroups.map((g) => (
                      <div key={g.groupName} className="pl-4 border-l-2 border-muted">
                        <p className="font-medium text-sm">{g.groupName}</p>
                        <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground mt-1">
                          {g.roles.map((r) => (
                            <li key={`${r.roleName}-${r.page}`}>
                              {r.roleName} ({r.page})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {roles.directRoles.length === 0 && roles.roleGroups.length === 0 && (
                <p className="text-muted-foreground text-sm">Henüz rol atanmamış.</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Rol bilgisi alınamadı.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
