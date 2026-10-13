import { Monitor } from "lucide-react";
import { useFetcher } from "react-router";
import type { Session } from "@/types";
import type { accountAction } from "@/routes/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "./notice";

function SessionItem({ session }: { session: Session }) {
  const fetcher = useFetcher<typeof accountAction>();
  const pending = fetcher.state !== "idle";
  return (
    <li className="py-5" aria-busy={pending}>
      <div className="flex items-center gap-3">
        <Monitor className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium wrap-anywhere">{session.device}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground wrap-anywhere">{session.detail}</p>
        </div>
        {session.current ? <Badge variant="secondary">Current</Badge> : (
          <fetcher.Form method="post" action="/account">
            <input type="hidden" name="intent" value="revoke" />
            <input type="hidden" name="id" value={session.id} />
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>
              {pending ? "Signing out…" : "Sign out"}
            </Button>
          </fetcher.Form>
        )}
      </div>
      {!pending && fetcher.data?.error && <Notice error>{fetcher.data.error}</Notice>}
    </li>
  );
}

export function SessionList({ sessions }: { sessions: Session[] }) {
  return (
    <section aria-label="Active sessions">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Active sessions</h2>
        <span className="text-xs text-muted-foreground">{sessions.length} devices</span>
      </div>
      <ul className="divide-y">{sessions.map(session => <SessionItem key={session.id} session={session} />)}</ul>
    </section>
  );
}
