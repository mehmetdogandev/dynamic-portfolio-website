"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger />
      <div className="flex-1" />
    </header>
  );
}
