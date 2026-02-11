"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";
import { ExternalLink } from "lucide-react";

const SOCIAL_FIELDS: Array<{ key: string; label: string }> = [
  { key: "website", label: "Web" },
  { key: "twitter", label: "Twitter" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "pinterest", label: "Pinterest" },
  { key: "reddit", label: "Reddit" },
  { key: "telegram", label: "Telegram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "viber", label: "Viber" },
  { key: "skype", label: "Skype" },
  { key: "discord", label: "Discord" },
  { key: "twitch", label: "Twitch" },
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "amazonMusic", label: "Amazon Music" },
  { key: "deezer", label: "Deezer" },
  { key: "soundcloud", label: "SoundCloud" },
];

type DetailUserDialogProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailUserDialog({
  userId,
  open,
  onOpenChange,
}: DetailUserDialogProps) {
  const { data: user, isLoading } = api.user.getById.useQuery(
    { id: userId },
    { enabled: open && !!userId }
  );

  const userInfo = user && "userInfo" in user ? user.userInfo : null;
  const socialLinks = userInfo
    ? SOCIAL_FIELDS.filter((f) => {
        const v = (userInfo as Record<string, unknown>)[f.key];
        return v != null && String(v).trim() !== "";
      })
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kullanıcı Detayı</DialogTitle>
          <DialogDescription>
            Kullanıcı bilgileri salt okunur.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : user ? (
          <div className="space-y-4">
            {userInfo?.profilePicture && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Profil fotoğrafı</p>
                <img
                  src={userInfo.profilePicture.startsWith("/") ? userInfo.profilePicture : `/${userInfo.profilePicture}`}
                  alt="Profil"
                  className="h-24 w-24 rounded-full object-cover border"
                />
              </div>
            )}
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="font-medium text-muted-foreground">Ad Soyad</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">E-posta</dt>
                <dd>{user.email}</dd>
              </div>
              {userInfo && (
                <>
                  {(userInfo as Record<string, unknown>).lastName && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Soyad</dt>
                      <dd>{(userInfo as Record<string, unknown>).lastName as string}</dd>
                    </div>
                  )}
                  {userInfo.displayName && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Görünen ad</dt>
                      <dd>{userInfo.displayName}</dd>
                    </div>
                  )}
                  {userInfo.phoneNumber && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Telefon</dt>
                      <dd>{userInfo.phoneNumber}</dd>
                    </div>
                  )}
                  {(userInfo as Record<string, unknown>).address && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Adres</dt>
                      <dd>{(userInfo as Record<string, unknown>).address as string}</dd>
                    </div>
                  )}
                  {(userInfo as Record<string, unknown>).city && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Şehir</dt>
                      <dd>{(userInfo as Record<string, unknown>).city as string}</dd>
                    </div>
                  )}
                  {(userInfo as Record<string, unknown>).state && (
                    <div>
                      <dt className="font-medium text-muted-foreground">İl / Eyalet</dt>
                      <dd>{(userInfo as Record<string, unknown>).state as string}</dd>
                    </div>
                  )}
                  {(userInfo as Record<string, unknown>).zipCode && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Posta kodu</dt>
                      <dd>{(userInfo as Record<string, unknown>).zipCode as string}</dd>
                    </div>
                  )}
                  {(userInfo as Record<string, unknown>).country && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Ülke</dt>
                      <dd>{(userInfo as Record<string, unknown>).country as string}</dd>
                    </div>
                  )}
                  {userInfo.bio && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Bio</dt>
                      <dd>{userInfo.bio}</dd>
                    </div>
                  )}
                  {(userInfo as Record<string, unknown>).website && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Web sitesi</dt>
                      <dd>
                        {(() => {
                          const url = (userInfo as Record<string, unknown>).website as string;
                          const href =
                            url.startsWith("http") || url.startsWith("//")
                              ? url
                              : `https://${url.replace(/^https?:\/\//, "")}`;
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {url}
                            </a>
                          );
                        })()}
                      </dd>
                    </div>
                  )}
                </>
              )}
              <div>
                <dt className="font-medium text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs">{user.id}</dd>
              </div>
            </dl>
            {socialLinks.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Sosyal / Medya</p>
                <ul className="flex flex-wrap gap-2">
                  {socialLinks.map(({ key, label }) => {
                    const url = (userInfo as Record<string, unknown>)?.[key];
                    const href = typeof url === "string" && (url.startsWith("http") || url.startsWith("//")) ? url : (url ? `https://${String(url).replace(/^https?:\/\//, "")}` : "");
                    return (
                      <li key={key}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Kullanıcı bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
