import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function AdminResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Suspense fallback={<p>Yükleniyor...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
