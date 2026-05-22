import { createFileRoute } from "@tanstack/react-router";
import { PasskeysGrid } from "@/components/passkeys/PasskeysGrid";
export const Route = createFileRoute("/_app/passkeys")({
  head: () => ({ meta: [{ title: "Passkeys — NovaSafe" }] }),
  component: () => <PasskeysGrid />,
});
