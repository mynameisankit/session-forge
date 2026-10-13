import axios from "axios";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { httpClient } from "../api/http-client.ts";
import type { User } from "../types.ts";

export async function requireUser({ request }: LoaderFunctionArgs): Promise<User> {
  try {
    const { data } = await httpClient.get<User | null>("/auth/me", { signal: request.signal });
    if (!data) throw redirect("/login");
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) throw redirect("/login");
    throw error;
  }
}
