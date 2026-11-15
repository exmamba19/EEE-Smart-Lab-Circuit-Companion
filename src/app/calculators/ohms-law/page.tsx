import type { Metadata } from "next";
import OhmsLawCalculator from "@/components/calculators/OhmsLawCalculator";
import PageHeader from "@/components/ui/PageHeader";
import { toolById } from "@/data/tools";

const tool = toolById("ohms-law")!;

export const metadata: Metadata = { title: tool.title, description: tool.description };

export default function Page() {
  return (
    <>
      <PageHeader icon={tool.icon} title={tool.title} description={tool.description} accent={tool.accent} />
      <OhmsLawCalculator />
    </>
  );
}
