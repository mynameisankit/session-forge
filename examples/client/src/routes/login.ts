import { redirect, type ActionFunctionArgs } from "react-router";
import { httpClient } from "../api/http-client.ts";
import { actionError } from "./forms.ts";

export async function loginAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  try {
    await httpClient.post("/auth/login", {
      email: form.get("email"), password: form.get("password"), remember: form.get("remember") === "on",
    }, { signal: request.signal });
    return redirect("/account");
  } catch (error) { return actionError(error); }
}
