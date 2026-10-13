import { redirect, type ActionFunctionArgs } from "react-router";
import { httpClient } from "../api/http-client.ts";
import { actionError, newPassword } from "./forms.ts";

export async function registerAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  try {
    await httpClient.post("/auth/register", {
      name: form.get("name"), email: form.get("email"), password: newPassword(form),
    }, { signal: request.signal });
    return redirect("/account");
  } catch (error) { return actionError(error); }
}
