import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function Notice({
  children,
  error = false,
  live = false,
}: {
  children: ReactNode;
  error?: boolean;
  live?: boolean;
}) {
  return (
    <Alert
      variant={error ? "destructive" : "default"}
      role={error ? "alert" : live ? "status" : undefined}
      className={cn(
        "bg-secondary",
        error && "border-destructive/20 bg-destructive/5",
      )}
    >
      <AlertDescription
        className={cn("leading-6", !error && "text-secondary-foreground")}
      >
        {children}
      </AlertDescription>
    </Alert>
  );
}
