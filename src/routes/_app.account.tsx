import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "@/components/account/AccountLayout";
export const Route = createFileRoute("/_app/account")({ component: () => <AccountLayout /> });
