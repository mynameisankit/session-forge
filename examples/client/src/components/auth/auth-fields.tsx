import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextFieldProps = ComponentProps<typeof Input> & {
  name: string;
  label: string;
};

export function TextField({ name, label, ...props }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} className="h-11 bg-card" {...props} />
    </div>
  );
}

export function EmailField({ email }: { email: string }) {
  return (
    <TextField
      name="email"
      label="Email address"
      type="email"
      autoComplete="email"
      defaultValue={email}
      placeholder="you@example.com"
      required
    />
  );
}

type PasswordFieldProps = {
  name?: string;
  label?: string;
  autoComplete?: string;
  minLength?: number;
};

export function PasswordField({
  name = "password",
  label = "Password",
  autoComplete = "new-password",
  minLength = 8,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          placeholder={
            autoComplete === "current-password"
              ? "Enter your password"
              : "At least 8 characters"
          }
          required
          className="h-11 bg-card pr-12"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1.5 right-1.5 text-muted-foreground"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          <Icon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
