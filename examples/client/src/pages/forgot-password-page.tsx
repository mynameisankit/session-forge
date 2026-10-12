import { authApi } from "@/auth-api";
import { EmailField } from "@/components/auth/auth-fields";
import { AuthForm, formValue } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { BackLink } from "@/components/auth/auth-links";

export function ForgotPasswordPage({
  email,
  onRequested,
}: {
  email: string;
  onRequested: (email: string) => void;
}) {
  async function requestReset(data: FormData) {
    const address = formValue(data, "email");
    await authApi.requestPasswordReset(address);
    return address;
  }

  return (
    <>
      <AuthHeading title="Forgot your password?" icon="mail">
        It happens. Enter your email and we’ll send you a link to reset it.
      </AuthHeading>
      <AuthForm
        label="Send reset link"
        onSubmit={requestReset}
        onSuccess={onRequested}
      >
        <EmailField email={email} />
      </AuthForm>
      <BackLink />
    </>
  );
}
