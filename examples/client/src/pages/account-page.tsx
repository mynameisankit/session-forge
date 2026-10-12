import { clientConfig } from "@/client-config";
import { Link } from "react-router";
import { LogOut } from "lucide-react";
import type { User } from "@/auth-api";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Notice } from "@/components/auth/notice";
import { SessionList } from "@/components/auth/session-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessions } from "@/hooks/use-sessions";

export function AccountPage({
  user,
  onSignedOut,
}: {
  user: User;
  onSignedOut: () => void;
}) {
  const {
    sessions,
    loading,
    pending,
    error,
    notice,
    revoke,
    revokeOthers,
    signOut,
  } = useSessions();

  return (
    <>
      <AuthHeading title="Welcome in." icon="check">
        A little overview of your account and where you’re signed in.
      </AuthHeading>
      <Card className="mb-8 bg-secondary py-4 shadow-none">
        <CardContent className="flex items-center gap-3 px-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium wrap-anywhere">{user.name}</p>
            <p className="mt-1 text-xs text-muted-foreground wrap-anywhere">
              {user.email}
            </p>
          </div>
          {clientConfig.mock && (
            <Badge variant="outline" className="hidden sm:inline-flex">
              Demo account
            </Badge>
          )}
        </CardContent>
      </Card>
      <SessionList
        sessions={sessions}
        loading={loading}
        pending={pending}
        onRevoke={revoke}
      />
      <div className="space-y-4">
        {error && <Notice error>{error}</Notice>}
        {notice && <Notice live>{notice}</Notice>}
      </div>
      <div className="my-5 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="link" className="h-auto p-0 text-xs">
          <Link to="/change-password">Change password</Link>
        </Button>
        <Button
          variant="link"
          className="h-auto p-0 text-xs"
          disabled={pending || loading || sessions.length < 2}
          onClick={revokeOthers}
        >
          Sign out other devices
        </Button>
      </div>
      <Button
        className="h-11 w-full"
        disabled={pending}
        onClick={() => signOut(onSignedOut)}
      >
        {pending ? "Please wait…" : "Sign out of this account"}
        <LogOut className="ml-auto" aria-hidden="true" />
      </Button>
      {clientConfig.mock && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Example sessions are simulated for this preview.
        </p>
      )}
    </>
  );
}
