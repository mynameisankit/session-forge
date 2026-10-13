import axios from "axios";
import { redirect, type ActionFunctionArgs } from "react-router";
import { httpClient } from "../api/http-client.ts";
import { actionError, newPassword } from "./forms.ts";

export async function forgotPasswordAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  try {
    await httpClient.post("/auth/forgot-password", { email }, { signal: request.signal });
    return redirect(`/reset-sent?${new URLSearchParams({ email })}`);
  } catch (error) { return actionError(error); }
}

export async function resendResetAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  try {
    await httpClient.post("/auth/forgot-password", { email: form.get("email") }, { signal: request.signal });
    return { message: "If an account exists, a new reset link is on its way." };
  } catch (error) { return actionError(error); }
}

export async function resetPasswordAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  try {
    await httpClient.post("/auth/reset-password", {
      token: form.get("token"), password: newPassword(form),
    }, { signal: request.signal });
    return redirect("/reset-done");
  } catch (error) { return actionError(error); }
}

export async function changePasswordAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  try {
    await httpClient.post("/auth/change-password", {
      currentPassword: form.get("currentPassword"), password: newPassword(form),
    }, { signal: request.signal });
    return redirect("/account");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return redirect("/login");
    return actionError(error);
  }
}
