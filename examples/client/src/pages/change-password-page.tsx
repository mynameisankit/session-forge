import { PasswordField } from "@/components/auth/auth-fields";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { BackLink } from "@/components/auth/auth-links";

export function ChangePasswordPage() {
  return (
    <>
      <AuthHeading title="Change your password">
        Keep your account yours with a strong, unique password.
      </AuthHeading>
      <AuthForm label="Update password">
        <PasswordField
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          minLength={1}
        />
        <PasswordField label="New password" />
        <PasswordField name="confirmPassword" label="Confirm new password" />
      </AuthForm>
      <BackLink to="/account">Back to account</BackLink>
    </>
  );
}
