import type { Metadata } from "next";
import ComponentDecoders from "@/components/tools/ComponentDecoders";
import PageHeader from "@/components/ui/PageHeader";
import { toolById } from "@/data/tools";

const tool = toolById("component-decoders")!;

export const metadata: Metadata = { title: tool.title, description: tool.description };

export default function Page() {
  return (
    <>
      <PageHeader icon={tool.icon} title={tool.title} description={tool.description} accent={tool.accent} />
      <ComponentDecoders />
    </>
  );
}
