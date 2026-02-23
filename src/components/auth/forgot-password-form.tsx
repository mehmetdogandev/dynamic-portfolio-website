"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkEmailExists } from "@/lib/actions/auth-actions";

const AUTH_BASE = "/api/auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<"idle" | "success" | "error" | "notFound">("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (message !== "success") return;
    const timer = setTimeout(() => {
      router.push("/admin-panel/login");
    }, 2000);
    return () => clearTimeout(timer);
  }, [message, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("idle");
    setLoading(true);
    try {
      const exists = await checkEmailExists(email);
      if (!exists) {
        setMessage("notFound");
        return;
      }
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}${AUTH_BASE}/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${base}/admin-panel/reset-password`,
        }),
      });
      const data = (await res.json()) as { status?: boolean; message?: string } | undefined;
      if (res.ok && data?.status !== false) {
        setMessage("success");
      } else {
        setMessage("error");
      }
    } catch {
      setMessage("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full border shadow-lg rounded-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Şifremi unuttum</CardTitle>
        <CardDescription>
          E-posta adresinizi giriniz. Şifre sıfırlama bağlantısı gönderilecektir.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {message === "success" && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status">
              Şifre sıfırlama bağlantısı gönderildi. Giriş sayfasına yönlendiriliyorsunuz...
            </p>
          )}
          {message === "notFound" && (
            <p className="text-sm text-destructive" role="alert">
              Bu mail sistemde kayıtlı bir mail değildir. Lütfen üst yöneticinizle iletişime geçin.
            </p>
          )}
          {message === "error" && (
            <p className="text-sm text-destructive" role="alert">
              Bir hata oluştu. Lütfen tekrar deneyin.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-posta adresinizi giriniz</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading || message === "success"}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading || message === "success"}>
            {loading ? "Gönderiliyor..." : "Gönder"}
          </Button>
          <Link
            href="/admin-panel/login"
            className="text-center text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Giriş sayfasına dön
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
