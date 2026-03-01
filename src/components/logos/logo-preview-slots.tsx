"use client";

type LogoPreviewSlotsProps = {
  previewSrc: string | null;
};

export function LogoPreviewSlots({ previewSrc }: LogoPreviewSlotsProps) {
  if (!previewSrc) return null;

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3 sm:space-y-3 sm:p-4">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">Önizleme — Kullanım alanları</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Header</p>
          <div className="flex h-8 w-24 shrink-0 items-center justify-center rounded border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt="Header önizleme"
              className="max-h-8 max-w-24 object-contain object-left"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Favicon</p>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt="Favicon önizleme"
              className="h-8 w-8 object-contain"
            />
          </div>
        </div>
        <div className="col-span-2 space-y-1.5 sm:col-span-1">
          <p className="text-xs font-medium text-muted-foreground">E-posta</p>
          <div className="flex h-12 w-full min-w-0 items-center justify-start rounded border bg-background px-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt="E-posta önizleme"
              className="max-h-10 max-w-[140px] object-contain object-left"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
