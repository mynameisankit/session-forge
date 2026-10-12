import { AuthHeading } from "@/components/auth/auth-heading";
import { ContinueLink } from "@/components/auth/auth-links";

export function SignedOutPage() {
  return (
    <>
      <AuthHeading title="Sign in to continue">
        Your account and active sessions will appear here once you sign in.
      </AuthHeading>
      <ContinueLink>Go to sign in</ContinueLink>
    </>
  );
}
