import { Link } from "react-router";
import { authApi, type User } from "@/auth-api";
import {
  EmailField,
  PasswordField,
  TextField,
} from "@/components/auth/auth-fields";
import { AuthForm, formValue } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { FormFooter } from "@/components/auth/auth-links";
import { Button } from "@/components/ui/button";

export function RegisterPage({
  email,
  onAuthenticated,
}: {
  email: string;
  onAuthenticated: (user: User) => void;
}) {
  return (
    <>
      <AuthHeading title="Make yourself at home">
        One account. A little more peace of mind.
      </AuthHeading>
      <AuthForm
        label="Create account"
        onSubmit={(data) =>
          authApi.signUp({
            name: formValue(data, "name"),
            email: formValue(data, "email"),
            password: formValue(data, "password"),
          })
        }
        onSuccess={onAuthenticated}
      >
        <TextField
          name="name"
          label="Full name"
          autoComplete="name"
          placeholder="Alex Morgan"
          required
          maxLength={100}
        />
        <EmailField email={email} />
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
