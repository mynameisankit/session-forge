import { useSearchParams } from "react-router";
import { EmailField } from "@/components/auth/auth-fields";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { BackLink } from "@/components/auth/auth-links";
import { Notice } from "@/components/auth/notice";

export function ResetSentPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  return (
    <>
      <AuthHeading title="Check your inbox" icon="mail">
        If an account exists for <strong className="font-medium text-foreground">{email || "your email address"}</strong>, you’ll receive a password reset link.
      </AuthHeading>
      <div className="mb-5"><Notice>Follow the reset link to choose a new password. For the SQLite example, the link is printed in the backend terminal.</Notice></div>
      <AuthForm label="Send link again">
        {email ? <input type="hidden" name="email" value={email} /> : <EmailField email="" />}
      </AuthForm>
      <BackLink to="/forgot">Try another email</BackLink>
    </>
  );
}
