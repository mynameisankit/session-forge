import { clientConfig } from "@/client-config";
import { authApi } from "@/auth-api";
import { EmailField } from "@/components/auth/auth-fields";
import { AuthForm, formValue } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { BackLink, DemoResetLink } from "@/components/auth/auth-links";
import { Notice } from "@/components/auth/notice";

export function ResetSentPage({ email }: { email: string }) {
  return (
    <>
      <AuthHeading title="Check your inbox" icon="mail">
        If an account exists for{" "}
        <strong className="font-medium text-foreground">
          {email || "your email address"}
        </strong>
        , you’ll receive a password reset link.
      </AuthHeading>
      <div className="mb-5">
        <Notice>
          Follow the link in your email to choose a new password. Check your
          spam folder if you don’t see it.
        </Notice>
      </div>
      <AuthForm
        label="Send link again"
        successMessage="If an account exists, a new reset link is on its way."
        onSubmit={(data) =>
          authApi.requestPasswordReset(email || formValue(data, "email"))
        }
      >
        {!email && <EmailField email="" />}
      </AuthForm>
      {clientConfig.mock && <DemoResetLink />}
      <BackLink to="/forgot">Try another email</BackLink>
    </>
  );
}
