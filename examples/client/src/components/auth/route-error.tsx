import { Link, isRouteErrorResponse, useRevalidator, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/error-message";
import { AuthHeading } from "./auth-heading";
import { Notice } from "./notice";

export function RouteError() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  const message = isRouteErrorResponse(error) ? error.statusText : errorMessage(error);
  return (
    <>
      <AuthHeading title="Could not load this page">Check your connection and try again.</AuthHeading>
      <Notice error>{message}</Notice>
      <div className="mt-5 flex gap-3">
        <Button onClick={() => void revalidator.revalidate()} disabled={revalidator.state !== "idle"}>Try again</Button>
        <Button asChild variant="outline"><Link to="/login">Back to sign in</Link></Button>
      </div>
    </>
  );
}
