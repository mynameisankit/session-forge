import { Monitor } from "lucide-react";
import type { Session } from "@/auth-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SessionListProps = {
  sessions: Session[];
  loading: boolean;
  pending: boolean;
  onRevoke: (id: string) => void;
};

export function SessionList({
  sessions,
  loading,
  pending,
  onRevoke,
}: SessionListProps) {
  return (
    <section aria-label="Active sessions" aria-busy={loading || pending}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Active sessions</h2>
        <span className="text-xs text-muted-foreground">
          {loading ? "…" : sessions.length} devices
        </span>
      </div>
      {loading ? (
        <p className="py-5 text-sm text-muted-foreground">Loading sessions…</p>
      ) : (
        <ul className="divide-y">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center gap-3 py-5">
              <Monitor
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium wrap-anywhere">
                  {session.device}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground wrap-anywhere">
                  {session.detail}
                </p>
              </div>
              {session.current ? (
                <Badge variant="secondary">Current</Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onRevoke(session.id)}
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
