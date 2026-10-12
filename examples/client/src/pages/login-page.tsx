import { Link } from "react-router";
import { authApi, type User } from "@/auth-api";
import { EmailField, PasswordField } from "@/components/auth/auth-fields";
import { AuthForm, formValue } from "@/components/auth/auth-form";
import { AuthHeading } from "@/components/auth/auth-heading";
import { FormFooter } from "@/components/auth/auth-links";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function LoginPage({
  email,
  onAuthenticated,
}: {
  email: string;
  onAuthenticated: (user: User) => void;
}) {
  return (
    <>
      <AuthHeading title="Welcome back">
        A familiar place. A fresh start.
        <br />
        Sign in to your account to continue.
      </AuthHeading>
      <AuthForm
        label="Sign in"
        onSubmit={(data) =>
          authApi.signIn({
            email: formValue(data, "email"),
            password: formValue(data, "password"),
            remember: data.get("remember") === "on",
          })
        }
        onSuccess={onAuthenticated}
      >
        <EmailField email={email} />
        <PasswordField autoComplete="current-password" minLength={1} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" name="remember" />
            <Label
              htmlFor="remember"
              className="text-xs font-normal text-muted-foreground"
            >
              Keep me signed in
            </Label>
          </div>
          <Button asChild variant="link" className="h-auto p-0 text-xs">
            <Link to="/forgot">Forgot password?</Link>
          </Button>
        </div>
      </AuthForm>
      <FormFooter>
        New here?{" "}
        <Button asChild variant="link" className="h-auto p-0">
          <Link to="/register">Create an account</Link>
        </Button>
      </FormFooter>
    </>
  );
}
