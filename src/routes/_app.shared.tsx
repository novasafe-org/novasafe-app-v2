import { createFileRoute } from "@tanstack/react-router";
import { SharedView } from "@/components/vault/SharedView";
export const Route = createFileRoute("/_app/shared")({
  head: () => ({ meta: [{ title: "Shared — NovaSafe" }] }),
  component: () => <SharedView />,
});
