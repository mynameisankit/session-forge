import { useEffect, type ReactNode } from "react";
import { Outlet, useLocation, useNavigation } from "react-router";
import { Badge } from "@/components/ui/badge";
import { screens, type Screen } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { clientConfig } from "@/client-config";
import { BrandPanel } from "./brand-panel";

export function AuthLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const navigation = useNavigation();
  const title = screens[location.pathname as Screen] || "SessionForge";
  useEffect(() => {
    document.title = `${title} · SessionForge`;
    document.querySelector<HTMLElement>("h1")?.focus();
  }, [location.key, title]);
  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(320px,43%)_1fr]">
      <BrandPanel />
      <main className="flex min-h-[calc(100dvh-80px)] min-w-0 flex-col px-6 py-6 md:min-h-dvh md:px-8 md:py-9 lg:px-11">
        <header className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary/70" />
            {clientConfig.exampleName}
          </span>
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {navigation.state === "loading" ? "Loading…" : "Connected example"}
          </Badge>
        </header>
        <section key={location.key} aria-label={title} aria-busy={navigation.state !== "idle"}
          className={cn("mx-auto my-auto w-full max-w-sm py-12 md:py-16", location.pathname === "/account" && "max-w-md")}>
          {children ?? <Outlet />}
        </section>
        <footer className="text-[10px] text-muted-foreground">Built with SessionForge</footer>
      </main>
    </div>
  );
}
