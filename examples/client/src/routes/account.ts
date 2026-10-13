import axios from "axios";
import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { httpClient } from "../api/http-client.ts";
import type { Session } from "../types.ts";
import { requireUser } from "./authentication.ts";
import { actionError } from "./forms.ts";

export async function accountLoader(args: LoaderFunctionArgs) {
  const user = await requireUser(args);
  try {
    const { data: sessions } = await httpClient.get<Session[]>("/sessions", { signal: args.request.signal });
    return { user, sessions };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) throw redirect("/login");
    throw error;
  }
}

export async function accountAction({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const config = { signal: request.signal };
  try {
    switch (form.get("intent")) {
      case "logout":
        await httpClient.post("/auth/logout", undefined, config);
        return redirect("/login");
      case "revokeOthers":
        await httpClient.delete("/sessions/others", config);
        return { message: "All other devices signed out." };
      case "revoke": {
        const id = form.get("id");
        if (typeof id !== "string" || !id) return { error: "Select a session to sign out." };
        await httpClient.delete(`/sessions/${encodeURIComponent(id)}`, config);
        return { message: "Device signed out." };
      }
      default:
        return { error: "Unknown account action." };
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return redirect("/login");
    return actionError(error);
  }
}
