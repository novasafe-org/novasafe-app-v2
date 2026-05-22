import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/components/vault/VaultPage";
export const Route = createFileRoute("/_app/notes")({
  head: () => ({ meta: [{ title: "Secure Notes — NovaSafe" }] }),
  component: () => <VaultPage filter={(i) => !i.archived && i.type === "note"} />,
});
