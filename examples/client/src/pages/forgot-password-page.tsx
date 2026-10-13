import { EmailField } from "@/components/auth/auth-fields";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { BackLink } from "@/components/auth/auth-links";

export function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Forgot your password?" icon="mail">
        It happens. Enter your email and we'll send you a link to reset it.
      </AuthHeading>
      <AuthForm label="Send reset link">
        <EmailField email="" />
      </AuthForm>
      <BackLink />
    </>
  );
}
