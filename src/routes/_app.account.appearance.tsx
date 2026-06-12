import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/account/appearance")({
  beforeLoad: () => {
    throw redirect({ to: "/account/profile" });
  },
});
