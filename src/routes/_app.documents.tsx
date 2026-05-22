import { createFileRoute } from "@tanstack/react-router";
import { DocumentsView } from "@/components/docs/DocumentsView";
export const Route = createFileRoute("/_app/documents")({
  head: () => ({ meta: [{ title: "Documents — NovaSafe" }] }),
  component: () => <DocumentsView />,
});
