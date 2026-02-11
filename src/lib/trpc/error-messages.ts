/**
 * tRPC/API hatalarını Türkçe kullanıcı mesajına çevirir.
 */
export function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const code =
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data?: { code?: string } }).data?.code === "string"
      ? (error as { data: { code: string } }).data.code
      : undefined;

  if (message.includes('null value in column "bio"') && message.includes("user_info")) {
    return "Biyografi alanı boş bırakılamaz.";
  }
  if (message.includes("violates not-null constraint")) {
    return "Zorunlu bir alan eksik. Lütfen tüm zorunlu alanları doldurun.";
  }
  if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
    return "Bu işlem için yetkiniz yok.";
  }
  if (code === "INTERNAL_SERVER_ERROR" || message.includes("INTERNAL_SERVER_ERROR")) {
    return "Bir hata oluştu. Lütfen tekrar deneyin.";
  }
  if (message.trim()) {
    return message;
  }
  return "Beklenmeyen bir hata oluştu.";
}
