import type { Metadata } from "next";
import { VaultGame } from "@/components/vault/VaultGame";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "VAULT_01 | SGYUN",
  description: "A hidden three-tumbler vault field by SGYUN.",
};

export default async function VaultPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return <VaultGame locale={lang} />;
}
