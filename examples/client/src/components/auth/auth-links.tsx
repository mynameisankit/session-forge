import { Link } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Screen } from "@/lib/routes";

export function BackLink({
  to = "/login",
  children = "Back to sign in",
}: {
  to?: Screen;
  children?: ReactNode;
}) {
  return (
    <div className="mt-5 text-center">
      <Button asChild variant="link" size="sm">
        <Link to={to}>
          <ArrowLeft aria-hidden="true" />
          {children}
        </Link>
      </Button>
    </div>
  );
}

export function ContinueLink({
  to = "/login",
  children,
}: {
  to?: Screen;
  children: ReactNode;
}) {
  return (
    <Button asChild className="h-11 w-full">
      <Link to={to}>
        {children}
        <ArrowRight className="ml-auto" aria-hidden="true" />
      </Link>
    </Button>
  );
}

export function FormFooter({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}
