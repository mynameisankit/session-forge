import { authApi } from "@/auth-api";
import { PasswordField } from "@/components/auth/auth-fields";
import { AuthForm, formValue } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { BackLink } from "@/components/auth/auth-links";
import { useNavigate, useSearchParams } from "react-router";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  return (
    <>
      <AuthHeading title="A fresh start">
        Choose a new password that you haven’t used before.
      </AuthHeading>
      <AuthForm
        label="Reset password"
        onSubmit={(data) =>
          authApi.resetPassword({
            token,
            password: formValue(data, "password"),
          })
        }
        onSuccess={() => navigate("/reset-done")}
      >
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
