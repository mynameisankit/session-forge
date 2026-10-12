import { AuthHeading } from "@/components/auth/auth-heading";
import { ContinueLink } from "@/components/auth/auth-links";

export function PasswordUpdatedPage() {
  return (
    <>
      <AuthHeading title="Password updated" icon="check">
        You’re all set. Use your new password the next time you sign in.
      </AuthHeading>
      <ContinueLink>Back to sign in</ContinueLink>
    </>
  );
}
