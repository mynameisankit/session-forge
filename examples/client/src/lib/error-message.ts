import axios from "axios";

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: unknown }>(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
