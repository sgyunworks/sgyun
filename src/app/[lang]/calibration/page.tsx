import type { Metadata } from "next";
import { CalibrationToy } from "@/components/calibration/CalibrationToy";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FIELD_00 | SGYUN",
  description: "A vault dial calibration field by SGYUN.",
};

export default async function CalibrationPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  return <CalibrationToy locale={lang} />;
}
