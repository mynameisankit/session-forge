import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { screens, type Screen } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { clientConfig } from "@/client-config";
import { Notice } from "./notice";
import { BrandPanel } from "./brand-panel";

export function AuthLayout({
  loading,
  sessionError,
}: {
  loading: boolean;
  sessionError: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = screens[location.pathname as Screen] || "SessionForge";

  useEffect(() => {
    document.title = `${title} · SessionForge`;
    document.querySelector<HTMLElement>("h1")?.focus();
  }, [location.key, title, loading]);

  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(320px,43%)_1fr]">
      <BrandPanel />
      <main className="flex min-h-[calc(100dvh-80px)] min-w-0 flex-col px-6 py-6 md:min-h-dvh md:px-8 md:py-9 lg:px-11">
        <header className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary/70" />
            {clientConfig.exampleName}
          </span>
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
          >
            {clientConfig.mock ? "UI demo" : "Backend mode"}
          </Badge>
        </header>
        <section
          key={location.key}
          aria-label={title}
          className={cn(
            "mx-auto my-auto w-full max-w-sm py-12 md:py-16",
            location.pathname === "/account" && "max-w-md",
          )}
        >
          {sessionError && (
            <div className="mb-5">
              <Notice error>{sessionError}</Notice>
            </div>
          )}
          {loading ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading your account…
            </p>
          ) : (
            <Outlet />
          )}
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground">
          <span>Built with SessionForge</span>
          {clientConfig.mock && (
            <div className="ml-auto flex items-center gap-2">
              <Label
                htmlFor="screen-preview"
                className="text-[10px] font-normal"
              >
                Explore screens
              </Label>
              <select
                id="screen-preview"
                value={location.pathname}
                className="max-w-36 rounded-md border bg-background p-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  navigate(
                    event.target.value +
                      (event.target.value === "/reset"
                        ? "?token=demo-token"
                        : ""),
                  )
                }
              >
                {Object.entries(screens).map(([key, title]) => (
                  <option key={key} value={key}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}
