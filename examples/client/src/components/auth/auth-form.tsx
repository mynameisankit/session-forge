import { ArrowRight, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { Button } from "@/components/ui/button";
import type { ActionFeedback } from "@/routes/forms";
import { Notice } from "./notice";

export function AuthForm({ children, label }: { children?: ReactNode; label: string }) {
  const feedback = useActionData<ActionFeedback>();
  const navigation = useNavigation();
  const pending = navigation.state !== "idle";
  return (
    <Form method="post" aria-busy={pending}>
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        {children}
        {!pending && feedback?.error && <Notice error>{feedback.error}</Notice>}
        {!pending && feedback?.message && <Notice live>{feedback.message}</Notice>}
        <Button type="submit" disabled={pending} className="h-11 w-full">
          {pending && <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {pending ? "Please wait…" : label}
          {!pending && <ArrowRight className="ml-auto" aria-hidden="true" />}
        </Button>
      </fieldset>
    </Form>
  );
}
