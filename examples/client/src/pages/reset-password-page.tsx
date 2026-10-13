import { PasswordField } from "@/components/auth/auth-fields";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { BackLink } from "@/components/auth/auth-links";
import { useSearchParams } from "react-router";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  return (
    <>
      <AuthHeading title="A fresh start">
        Choose a new password that you haven't used before.
      </AuthHeading>
      <AuthForm label="Reset password">
        <input type="hidden" name="token" value={token} />
        <PasswordField label="New password" />
        <PasswordField name="confirmPassword" label="Confirm new password" />
        <p className="text-xs leading-6 text-muted-foreground">
          Use at least 8 characters. A longer, unique password is best.
        </p>
      </AuthForm>
      <BackLink to="/forgot">Request a new reset link</BackLink>
    </>
  );
}
