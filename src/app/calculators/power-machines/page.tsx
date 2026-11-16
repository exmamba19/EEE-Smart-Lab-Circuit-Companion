import type { Metadata } from "next";
import PowerMachines from "@/components/calculators/PowerMachines";
import PageHeader from "@/components/ui/PageHeader";
import { toolById } from "@/data/tools";

const tool = toolById("power-machines")!;

export const metadata: Metadata = { title: tool.title, description: tool.description };

export default function Page() {
  return (
    <>
      <PageHeader icon={tool.icon} title={tool.title} description={tool.description} accent={tool.accent} />
      <PowerMachines />
    </>
  );
}
