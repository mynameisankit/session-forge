import { Link } from "react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
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

export function DemoResetLink() {
  return (
    <div className="mt-5 rounded-lg border border-dashed p-4 text-center">
      <p className="mb-1 text-xs text-muted-foreground">
        Demo only · No email is sent
      </p>
      <Button asChild variant="link" size="sm">
        <Link to="/reset?token=demo-token">
          Preview the email link
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
