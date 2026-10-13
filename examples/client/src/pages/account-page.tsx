import { Link, useFetcher, useLoaderData } from "react-router";
import { LogOut } from "lucide-react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Notice } from "@/components/auth/notice";
import { SessionList } from "@/components/auth/session-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { accountAction, accountLoader } from "@/routes/account";

export function AccountPage() {
  const { user, sessions } = useLoaderData<typeof accountLoader>();
  const fetcher = useFetcher<typeof accountAction>();
  const pending = fetcher.state !== "idle";
  return (
    <>
      <AuthHeading title="Welcome in." icon="check">A little overview of your account and where you’re signed in.</AuthHeading>
      <Card className="mb-8 bg-secondary py-4 shadow-none">
        <CardContent className="flex items-center gap-3 px-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">{user.name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium wrap-anywhere">{user.name}</p>
            <p className="mt-1 text-xs text-muted-foreground wrap-anywhere">{user.email}</p>
          </div>
        </CardContent>
      </Card>
      <SessionList sessions={sessions} />
      {!pending && fetcher.data?.error && <Notice error>{fetcher.data.error}</Notice>}
      {!pending && fetcher.data?.message && <Notice live>{fetcher.data.message}</Notice>}
      <div className="my-5 flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="link" className="h-auto p-0 text-xs"><Link to="/change-password">Change password</Link></Button>
        <fetcher.Form method="post">
          <Button name="intent" value="revokeOthers" type="submit" variant="link" className="h-auto p-0 text-xs" disabled={pending || sessions.length < 2}>
            Sign out other devices
          </Button>
        </fetcher.Form>
      </div>
      <fetcher.Form method="post">
        <Button name="intent" value="logout" type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Please wait…" : "Sign out of this account"}<LogOut className="ml-auto" aria-hidden="true" />
        </Button>
      </fetcher.Form>
    </>
  );
}
