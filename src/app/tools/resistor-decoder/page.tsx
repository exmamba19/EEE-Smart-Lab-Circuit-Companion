import type { Metadata } from "next";
import ResistorDecoder from "@/components/tools/ResistorDecoder";
import PageHeader from "@/components/ui/PageHeader";
import { toolById } from "@/data/tools";

const tool = toolById("resistor-decoder")!;

export const metadata: Metadata = { title: tool.title, description: tool.description };

export default function Page() {
  return (
    <>
      <PageHeader icon={tool.icon} title={tool.title} description={tool.description} accent={tool.accent} />
      <ResistorDecoder />
    </>
  );
}
