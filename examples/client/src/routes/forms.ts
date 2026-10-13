import { errorMessage } from "../lib/error-message.ts";

export interface ActionFeedback { error?: string; message?: string }

export function actionError(error: unknown): ActionFeedback {
  return { error: errorMessage(error) };
}

export function newPassword(form: FormData): string {
  const password = String(form.get("password") ?? "");
  if (password !== form.get("confirmPassword")) {
    throw new Error("Your passwords don’t match. Please try again.");
  }
  return password;
}

