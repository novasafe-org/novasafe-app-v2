import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NovaSafe — Premium Encrypted Vault" },
      {
        name: "description",
        content: "A luxury encrypted digital vault for passwords, passkeys, codes and documents.",
      },
      { property: "og:title", content: "NovaSafe — Premium Encrypted Vault" },
      {
        property: "og:description",
        content: "End-to-end encrypted vault for everything you keep safe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  ),
  component: () => (
    <>
      <Outlet />
      <Toaster position="bottom-right" toastOptions={{ className: "!rounded-xl" }} />
    </>
  ),
  notFoundComponent: () => (
    <div className="grid place-items-center min-h-screen text-center">
      <div>
        <div className="text-6xl font-bold">404</div>
        <div className="text-ink-muted">Not found</div>
      </div>
    </div>
  ),
});
