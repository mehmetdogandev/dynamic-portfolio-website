"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";

type DetailLogosDialogProps = {
  logoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailLogosDialog({ logoId, open, onOpenChange }: DetailLogosDialogProps) {
  const { data: logo, isLoading } = api.logo.getById.useQuery({ id: logoId }, { enabled: open && !!logoId });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logo detayı</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : logo ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Ad</dt>
              <dd>{logo.name}</dd>
            </div>
            {logo.fileId && (
              <div>
                <dt className="font-medium text-muted-foreground">Görsel</dt>
                <dd className="relative h-16 w-24">
                  <Image
                    src={`/api/files/${logo.fileId}/view`}
                    alt={logo.name}
                    fill
                    className="object-contain object-left"
                    unoptimized
                  />
                </dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-muted-foreground">Durum</dt>
              <dd>{logo.status}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Logo bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
