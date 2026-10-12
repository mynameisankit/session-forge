import { authApi } from "@/auth-api";
import { PasswordField } from "@/components/auth/auth-fields";
import { AuthForm, formValue } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { BackLink } from "@/components/auth/auth-links";
import { useNavigate } from "react-router";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  return (
    <>
      <AuthHeading title="Change your password">
        Keep your account yours with a strong, unique password.
      </AuthHeading>
      <AuthForm
        label="Update password"
        onSubmit={(data) =>
          authApi.changePassword({
            currentPassword: formValue(data, "currentPassword"),
            password: formValue(data, "password"),
          })
        }
        onSuccess={() => navigate("/account")}
      >
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
