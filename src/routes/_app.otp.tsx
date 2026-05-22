import { createFileRoute } from "@tanstack/react-router";
import { OtpGrid } from "@/components/otp/OtpGrid";
export const Route = createFileRoute("/_app/otp")({
  head: () => ({ meta: [{ title: "Authenticator — NovaSafe" }] }),
  component: () => <OtpGrid />,
});
