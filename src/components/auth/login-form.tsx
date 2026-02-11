"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/better-auth/client";
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

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/admin-panel",
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Giriş başarısız.");
      return;
    }
  }

  return (
    <Card className="w-full border shadow-lg rounded-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold">Giriş</CardTitle>
        <CardDescription>E-posta ve şifrenizle giriş yapın</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <div className="text-right">
            <Link
              href="/admin-panel/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              Şifremi unuttum
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
