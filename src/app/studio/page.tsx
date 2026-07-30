import { redirect } from "next/navigation";
import { isStudioAuthenticated } from "@/lib/studio-auth";
import { readPortfolioForStudio } from "@/lib/portfolio-store";
import { StudioEditor } from "./StudioEditor";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  if (!(await isStudioAuthenticated())) redirect("/studio/login");
  const source = await readPortfolioForStudio();
  return <StudioEditor initialSource={source} />;
}
