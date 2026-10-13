import { Link } from "react-router";
import {
  EmailField,
  PasswordField,
  TextField,
} from "@/components/auth/auth-fields";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { FormFooter } from "@/components/auth/auth-links";
import { Button } from "@/components/ui/button";

export function RegisterPage() {
  return (
    <>
      <AuthHeading title="Make yourself at home">
        One account. A little more peace of mind.
      </AuthHeading>
      <AuthForm label="Create account">
        <TextField
          name="name"
          label="Full name"
          autoComplete="name"
          placeholder="Alex Morgan"
          required
          maxLength={100}
        />
        <EmailField email="" />
        <PasswordField />
        <PasswordField name="confirmPassword" label="Confirm password" />
      </AuthForm>
      <FormFooter>
        Already have an account?{" "}
        <Button asChild variant="link" className="h-auto p-0">
          <Link to="/login">Sign in</Link>
        </Button>
      </FormFooter>
    </>
  );
}
