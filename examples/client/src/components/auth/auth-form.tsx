import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Notice } from "./notice";

type AuthFormProps<T> = {
  children?: ReactNode;
  label: string;
  onSubmit: (data: FormData) => Promise<T>;
  onSuccess?: (result: T) => void;
  successMessage?: string;
};

export function AuthForm<T>({
  children,
  label,
  onSubmit,
  onSuccess,
  successMessage,
}: AuthFormProps<T>) {
  const { pending, error, run } = useAsyncAction();
  const [success, setSuccess] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSuccess("");

    void run(
      async () => {
        if (
          data.has("confirmPassword") &&
          data.get("password") !== data.get("confirmPassword")
        ) {
          throw new Error("Your passwords don’t match. Please try again.");
        }
        return onSubmit(data);
      },
      (result) => {
        if (successMessage) setSuccess(successMessage);
        onSuccess?.(result);
      },
    );
  }

  return (
    <form onSubmit={submit} aria-busy={pending}>
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        {children}
        {error && <Notice error>{error}</Notice>}
        {success && <Notice live>{success}</Notice>}
        <Button type="submit" disabled={pending} className="h-11 w-full">
          {pending ? (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : null}
          {pending ? "Please wait…" : label}
          {!pending && <ArrowRight className="ml-auto" aria-hidden="true" />}
        </Button>
      </fieldset>
    </form>
  );
}

export function formValue(data: FormData, key: string) {
  return String(data.get(key) || "");
}
